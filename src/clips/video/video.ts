/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import DecodeWorker from './worker?worker&inline';
import { Sprite, Texture } from 'pixi.js';
import { VideoSource } from '../../sources';
import { FrameBuffer } from './buffer';
import { MediaClip } from '../media';
import { textureSwap } from './video.decorator';
import { VisualMixin, visualize } from '../mixins';
import { FPS_DEFAULT, Timestamp } from '../../models';
import { IOError } from '../../errors';

import type { Track } from '../../tracks';
import type { InitMessageData } from './worker.types';
import type { VideoClipProps } from './video.interfaces';

export class VideoClip extends VisualMixin(MediaClip<VideoClipProps>) {
	public source = new VideoSource();
	public readonly type = 'video';
	public declare track?: Track<VideoClip>;

	private worker?: Worker;
	private buffer?: FrameBuffer;
	private readonly canvas = document.createElement('canvas');
	private readonly context = this.canvas.getContext('2d')!;

	/**
	 * Html5 video element access
	 */
	public readonly element = document.createElement('video');
	/**
	 * Html5 and canvas video textures
	 */
	public readonly textrues = {
		html5: Texture.from(this.element),
		canvas: Texture.from(this.canvas),
	};
	/**
	 * Access to the sprite containing the video
	 */
	public readonly sprite = new Sprite();

	public constructor(source?: File | VideoSource, props: VideoClipProps = {}) {
		super();

		this.element.controls = false;
		this.element.playsInline = true;
		this.element.style.display = 'hidden';
		this.element.crossOrigin = "anonymous";

		(this.textrues.html5.source as any).autoPlay = false;
		(this.textrues.html5.source as any).loop = false;
		this.sprite.texture = this.textrues.html5;
		this.view.addChild(this.sprite);

		if (source instanceof VideoSource) {
			this.source = source;
		}

		if (source instanceof File) {
			this.source.from(source);
		}

		this.element.addEventListener('play', () => {
			this.playing = true;
		});

		this.element.addEventListener('pause', () => {
			this.playing = false;
		});

		Object.assign(this, props);
	}

	public async init(): Promise<void> {
		const objectURL = await this.source.createObjectURL();
		this.element.setAttribute('src', objectURL);

		await new Promise<void>((resolve, reject) => {
			this.element.oncanplay = () => {
				this.duration.seconds = this.element.duration;

				this.state = 'READY';
				resolve();
			}

			this.element.onerror = () => {
				this.state = 'ERROR';

				const error = new IOError({
					code: 'sourceNotProcessable',
					message: 'An error occurred while processing the input medium.',
				});

				reject(this.element.error ?? error);
			}
		});
	}

	public async connect(track: Track<VideoClip>): Promise<void> {
		super.connect(track);

		// without seeking the first frame a black frame will be rendered
		const frame = track.composition?.frame ?? 0;
		await this.seek(Timestamp.fromFrames(frame));
	}

	public enter() {
		super.enter();
		if (this.track?.composition?.rendering && this.buffer?.state != 'active') {
			this.decodeVideo();
		}
	}

	@visualize
	@textureSwap
	public update(_: Timestamp): void | Promise<void> {
		if (this.track?.composition?.playing && !this.playing) {
			this.element.play();
		} else if (!this.track?.composition?.playing && this.playing) {
			this.element.pause();
		} else if (this.track?.composition?.rendering) {
			return this.nextFrame();
		}
	}

	public exit(): void {
		if (this.playing) {
			this.element.pause();
		};
		if (this.filters && this.view.filters) {
			this.view.filters = null as any;
		}
	}

	public copy(): VideoClip {
		const clip = VideoClip.fromJSON(JSON.parse(JSON.stringify(this)));
		clip.filters = this.filters;
		clip.source = this.source;

		return clip;
	}

	private async decodeVideo() {
		this.buffer = new FrameBuffer();
		this.worker = new DecodeWorker();

		this.worker.addEventListener('message', (evt) => {
			if (evt.data.type == 'frame') {
				this.buffer?.enqueue(evt.data.frame);
			} else if (evt.data.type == 'error') {
				this.cancelDecoding();
			} else if (evt.data.type == 'done') {
				this.buffer?.close();
			}
		});

		this.worker.postMessage({
			type: 'init',
			file: await this.source.getFile(),
			range: this.demuxRange,
			fps: this.track?.composition?.fps ?? FPS_DEFAULT,
		} satisfies InitMessageData);

		return this.buffer;
	}

	private async nextFrame(): Promise<void> {
		if (!this.buffer) return;

		const frame = await this.buffer.dequeue();
		if (!frame) return;

		this.canvas.width = frame.displayWidth;
		this.canvas.height = frame.displayHeight;

		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.context.drawImage(frame, 0, 0);
		this.textrues.canvas.source.update();

		frame.close();
	}

	private get demuxRange(): [number, number] {
		const comp = this.track?.composition;

		let start: number;
		if (this.start.millis < 0) {
			start = Math.abs(this.offset.seconds);
		} else {
			start = this.range[0].seconds;
		}

		let stop: number;
		if (comp && this.stop.millis > comp.duration.millis) {
			stop = comp.duration.subtract(this.offset).seconds;
		} else {
			stop = this.range[1].seconds;
		}

		return [start, stop];
	}

	/**
	 * Cancel decoding
	 */
	public cancelDecoding() {
		this.worker?.terminate();
		this.worker = undefined;
		this.buffer?.terminate();
		this.buffer = undefined;
	}
}
