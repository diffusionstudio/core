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
import { VisualMixin, visualize } from '../mixins';
import { textureSwap } from './video.decorator';
import { FPS_DEFAULT } from '../../models';
import { toggle } from '../clip';

import type { Renderer } from 'pixi.js';
import type { Track } from '../../tracks';
import type { frame } from '../../types';
import type { InitMessageData } from './worker.types';
import type { VideoClipProps } from './video.interfaces';

export class VideoClip extends VisualMixin(MediaClip<VideoClipProps>) {
	public readonly source = new VideoSource();
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

		(this.textrues.html5.source as any).playsInline = true;
		(this.textrues.html5.source as any).autoPlay = false;
		(this.textrues.html5.source as any).loop = false;
		this.sprite.texture = this.textrues.html5;
		this.container.addChild(this.sprite);

		this.element.addEventListener('canplay', () => {
			if (['READY', 'ATTACHED'].includes(this.state)) return;

			this.duration.seconds = this.element.duration;
			this.state = 'READY';

			this.trigger('load', undefined);
		});

		this.element.addEventListener('emptied', () => {
			this.playing = false;
			this.state = 'IDLE';
			if (this.track) this.detach();
		});

		this.element.addEventListener('error', () => {
			console.log(this.element.error);
			this.state = 'ERROR';
			if (this.track) this.detach();
			this.trigger('error', new Error('An error occurred while processing the input medium.'));
		});

		this.element.addEventListener('play', () => {
			this.playing = true;
		});

		this.element.addEventListener('pause', () => {
			this.playing = false;
		});

		this.load(source);
		Object.assign(this, props);
	}

	public async connect(track: Track<VideoClip>): Promise<void> {
		if (['LOADING', 'IDLE'].includes(this.state)) {
			await new Promise(this.resolve('load'));
		};

		// without seeking the first frame a black frame will be rendered
		const frame = track.composition?.frame ?? 0;
		await this.seek(<frame>frame);

		this.track = track;
		this.state = 'ATTACHED';

		this.trigger('attach', undefined);
	}

	public unrender(): void {
		if (this.playing) {
			this.element.pause();
		};
		if (this.filters && this.container.filters) {
			// @ts-ignore
			this.container.filters = null;
		}
		if (this.sprite.texture.source.uid != this.textrues.html5.source.uid) {
			this.sprite.texture = this.textrues.html5;
		}
	}

	@toggle
	@textureSwap
	@visualize
	public render(renderer: Renderer, _: number): void | Promise<void> {
		if (this.track?.composition?.playing && !this.playing) {
			this.element.play();
		} else if (!this.track?.composition?.playing && this.playing) {
			this.element.pause();
		} else if (this.track?.composition?.rendering) {
			return this.renderPromise(renderer);
		}

		renderer.render({ container: this.container, clear: false });
	}

	public copy(): VideoClip {
		const clip = VideoClip.fromJSON(JSON.parse(JSON.stringify(this)));
		clip.filters = this.filters;
		clip.load(this.source);

		return clip;
	}

	private async renderPromise(renderer: Renderer) {
		await this.nextFrame();

		renderer.render({ container: this.container, clear: false });
	}

	public async seek(frame: frame): Promise<void> {
		if (this.track?.composition?.rendering) {
			const buffer = this.decodeVideo();
			return new Promise<void>((resolve) => {
				buffer.onenqueue = () => resolve();
			});
		}

		return super.seek(frame);
	}

	private decodeVideo() {
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
			file: this.source.file!,
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
