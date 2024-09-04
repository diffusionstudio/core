/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { Muxer } from 'mp4-muxer';
import { VideoClip } from '../clips';
import { audioClipFilter, createStreamTarget } from './webcodecs.utils';
import { FPS_DEFAULT, Timestamp } from '../models';
import { getRenderEventDetail } from './utils';
import { EventEmitter } from '../services';
import { clear } from '../utils/pixi';
import * as utils from '../utils';

import type { StreamTarget } from 'mp4-muxer';
import type { Composition } from '../composition';
import type { frame } from '../types';
import type { EncoderEvents, EncoderOptions } from './config.types';


export class WebcodecsEncoder extends EventEmitter<EncoderEvents>() implements Required<EncoderOptions> {
	private exportAborted = false;

	public composition: Composition;
	public resolution: number;
	public sampleRate: number; // 44100
	public numberOfChannels: number; // 2
	public videoBitrate: number // 10e6
	public gpuBatchSize: number; // 5
	public fps: number; // 30
	public debug: boolean;

	/**
	 * Create a new Webcodecs encoder
	 * @param composition The composition to render
	 * @param options Configure the output
	 * @example new WebcodecsEncoder(composition, { resolution: 2 }) // will render at 4K
	 */
	public constructor(composition: Composition, options?: EncoderOptions) {
		super();

		this.composition = composition;
		this.resolution = options?.resolution ?? 1;
		this.sampleRate = options?.sampleRate ?? 44100;
		this.numberOfChannels = options?.numberOfChannels ?? 2;
		this.videoBitrate = options?.videoBitrate ?? 10e6;
		this.gpuBatchSize = options?.gpuBatchSize ?? 5;
		this.fps = options?.fps ?? 30;
		this.debug = options?.debug ?? false;
	}

	/**
	 * render and encode visual frames
	 */
	private async encodeVideo(muxer: Muxer<StreamTarget>, config: VideoEncoderConfig): Promise<void> {
		const { renderer, tracks, duration } = this.composition;
		const totalFrames = <frame>Math.floor(duration.seconds * this.fps);

		if (!renderer) return;
		await this.composition.seek(<frame>0);
		const startTime = new Date().getTime();

		const init: VideoEncoderInit = {
			output: (chunk, meta) => {
				meta && muxer.addVideoChunk(chunk, meta);
			},
			error: console.error,
		};

		const encoder = new VideoEncoder(init);
		encoder.configure(config);
		const now = performance.now();

		for (let frame = 0 as frame; frame <= totalFrames; frame++) {
			this.abortGuard();
			this.trigger('render', getRenderEventDetail(frame, totalFrames, startTime));

			if (encoder.encodeQueueSize > this.gpuBatchSize) {
				await new Promise((resolve) => {
					encoder.ondequeue = () => resolve(null);
				});
			}

			clear(renderer);

			for (let i = tracks.length - 1; i >= 0; i--) {
				await tracks[i].render(renderer, Timestamp.fromFrames(frame, this.fps));
			}

			const videoFrame = new VideoFrame(renderer.canvas, {
				timestamp: Math.floor((frame / this.fps) * 1e6),
				duration: Math.floor(1e6 / this.fps),
			});
			encoder.encode(videoFrame, { keyFrame: frame % (3 * this.fps) == 0 });
			videoFrame.close();
		}

		if (this.debug) {
			const duration = (performance.now() - now) / 1000;
			console.info(`RENDERED AT: ${(totalFrames / duration).toFixed(2)}fps`);
		}

		await encoder.flush();
	}

	/**
	 * write audio to memfs
	 * @param tracks Audio Tracks
	 * @returns name of the file saved to memfs
	 */
	private async encodeAudio(muxer: Muxer<StreamTarget>, config: AudioEncoderConfig): Promise<void> {
		const { numberOfChannels, sampleRate } = this;
		const output = await this.composition.audio(numberOfChannels, sampleRate);

		if (!output) return;

		const encoder = new AudioEncoder({
			output: (chunk, meta) => {
				meta && muxer.addAudioChunk(chunk, meta);
			},
			error: console.error,
		});

		encoder.configure(config);

		const data = new AudioData({
			format: 'f32-planar',
			sampleRate: output.sampleRate,
			numberOfChannels: output.numberOfChannels,
			numberOfFrames: output.length,
			timestamp: 0,
			data: utils.bufferToF32Planar(output),
		});

		encoder.encode(data);
		await encoder.flush();
	}

	/**
	 * Export the specified composition
	 * @throws DOMException if the export has been aborted
	 */
	public async export(target: FileSystemFileHandle | string = 'video.mp4'): Promise<void> {
		if (!this.composition.renderer) return; // should not happen
		const { height, width } = this.composition.settings;
		// First check whether web codecs are supported
		const [video, audio] = await utils.getSupportedEncoderConfigs({
			video: {
				height: Math.round(height * this.resolution),
				width: Math.round(width * this.resolution),
				bitrate: this.videoBitrate,
				fps: this.fps,
			},
			audio: {
				sampleRate: this.sampleRate,
				numberOfChannels: this.numberOfChannels,
				bitrate: 128_000, // 128 kbps
			}
		});

		if (this.debug) {
			console.log('Hardware Preference', video.hardwareAcceleration);
		}

		const now = performance.now();
		const stream = await createStreamTarget(target);
		const audioClips = this.composition.findClips(audioClipFilter);
		await this.composition.pause();
		this.composition.state = 'RENDER';
		this.composition.renderer.resolution = this.resolution;
		this.composition.fps = this.fps;

		try {
			const muxer = new Muxer({
				target: stream.target,
				video: { ...video, codec: 'avc' },
				firstTimestampBehavior: 'offset',
				fastStart: stream.fastStart,
				...(audioClips.length > 0 && {
					audio: {
						...audio,
						codec: audio.codec == 'opus' ? 'opus' : 'aac',
					},
				}),
			});

			await withError(Promise.allSettled([
				this.encodeVideo(muxer, video),
				this.encodeAudio(muxer, audio)
			]));

			if (this.debug) {
				const duration = (performance.now() - now) / 1000;
				console.info(`TOTAL DURATION: ${duration.toFixed(3)}sec`);
			}

			muxer.finalize();
			await stream.close(true);
			this.trigger('done', undefined);
		} catch (e) {
			console.error('export error', e);
			await stream.close(false);
			this.trigger('error', new Error(String(e)));
			throw e;
		} finally {
			this.composition.state = 'IDLE';
			this.composition.renderer.resolution = 1;
			this.composition.fps = FPS_DEFAULT;
			this.composition.seek(0);
		}
	}

	/**
	 * Stop the export process
	 */
	public abort(): void {
		this.trigger('canceled', undefined);
		this.exportAborted = true;
		this.composition.findClips(VideoClip).forEach((clip) => clip.cancelDecoding());
	}

	/**
	 * Raises exception if export has been aborted
	 */
	private abortGuard(): void {
		if (this.exportAborted) {
			throw new DOMException('Aborted export', 'AbortError');
		}
	}
}

async function withError(promise: Promise<[PromiseSettledResult<any>, PromiseSettledResult<any>]>) {
	const results = await promise;

	for (const res of results) {
		if (res.status == 'rejected') {
			throw res.reason;
		}
	}
}
