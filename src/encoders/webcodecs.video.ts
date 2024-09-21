/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { Muxer } from 'mp4-muxer';
import { VideoClip } from '../clips';
import { Timestamp } from '../models';
import { createRenderEventDetail } from './utils';
import { EventEmitter } from '../services';
import { EncoderError } from '../errors';

import type { StreamTarget } from 'mp4-muxer';
import type { Composition } from '../composition';
import type { frame } from '../types';
import type { EncoderEvents } from './types';
import type { VideoEncoderInit } from './interfaces';

export class WebcodecsVideoEncoder extends EventEmitter<EncoderEvents>() implements Required<VideoEncoderInit> {
	public composition: Composition;
	public resolution: number;
	public sampleRate: number;
	public numberOfChannels: number;
	public videoBitrate: number;
	public gpuBatchSize: number;
	public fps: number;
	public debug: boolean;
	public audio: boolean;

	public constructor(composition: Composition, init?: VideoEncoderInit) {
		super();

		this.composition = composition;
		this.resolution = init?.resolution ?? 1;
		this.sampleRate = init?.sampleRate ?? 48000;
		this.numberOfChannels = init?.numberOfChannels ?? 2;
		this.videoBitrate = init?.videoBitrate ?? 10e6;
		this.gpuBatchSize = init?.gpuBatchSize ?? 5;
		this.fps = init?.fps ?? 30;
		this.debug = init?.debug ?? false;
		this.audio = init?.audio ?? true
	}

	/**
	 * render and encode visual frames
	 */
	public async encodeVideo(muxer: Muxer<StreamTarget>, config: VideoEncoderConfig, signal?: AbortSignal) {
		const { renderer, tracks, duration } = this.composition;
		const totalFrames = Math.floor(duration.seconds * this.fps);

		if (!renderer) {
			throw new EncoderError({
				code: 'rendererNotInitialized',
				message: 'Cannot encode composition before the renderer has been initialized'
			});
		};

		await this.composition.seek(0);
		const startTime = new Date().getTime();

		const encoder = new VideoEncoder({
			output(chunk, meta) {
				meta && muxer.addVideoChunk(chunk, meta);
			},
			error: console.error,
		});

		encoder.configure(config);
		const now = performance.now();

		for (let frame = 0 as frame; frame <= totalFrames; frame++) {
			if (signal && signal.aborted) {
				this.composition.findClips(VideoClip).forEach((clip) => clip.cancelDecoding());
				throw new DOMException('User aborted rendering')
			}

			if (encoder.encodeQueueSize > this.gpuBatchSize) {
				await new Promise((resolve) => {
					encoder.ondequeue = () => resolve(null);
				});
			}

			for (let i = 0; i < tracks.length; i++) {
				await tracks[i].update(Timestamp.fromFrames(frame, this.fps));
			}

			renderer.render(this.composition.stage);
			this.trigger('render', createRenderEventDetail(frame, totalFrames, startTime));

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
}
