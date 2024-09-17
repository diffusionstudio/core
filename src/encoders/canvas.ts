/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { ArrayBufferTarget, Muxer } from 'mp4-muxer';
import { bufferToI16Interleaved, getVideoEncoderConfigs, resampleBuffer } from '../utils';
import { OpusEncoder } from './opus';
import { toOpusSampleRate } from './utils';
import { EncoderError } from '../errors';

import type { frame } from '../types';
import type { EncoderInit } from './interfaces';

/**
 * Generic encoder that allows you to encode
 * a canvas frame by frame
 */
export class CanvasEncoder implements Required<EncoderInit> {
	private canvas: HTMLCanvasElement | OffscreenCanvas;
	private muxer?: Muxer<ArrayBufferTarget>;
	private videoEncoder?: VideoEncoder;

	public frame: frame = 0;
	public sampleRate: number;
	public numberOfChannels: number;
	public videoBitrate: number;
	public gpuBatchSize: number;
	public fps: number;

	public height: number;
	public width: number;
	public audio: boolean;

	/**
	 * Create a new Webcodecs encoder
	 * @param canvas - The canvas to encode
	 * @param init - Configure the output
	 * @example
	 * ```
	 * const encoder = new CanvasEncoder(canvas, { fps: 60 });
	 * ```
	 */
	public constructor(canvas: HTMLCanvasElement | OffscreenCanvas, init?: EncoderInit) {
		this.canvas = canvas;
		this.width = canvas.width;
		this.height = canvas.height;
		this.fps = init?.fps ?? 30;
		this.sampleRate = toOpusSampleRate(init?.sampleRate ?? 48000);
		this.numberOfChannels = init?.numberOfChannels ?? 2;
		this.videoBitrate = init?.videoBitrate ?? 10e6;
		this.gpuBatchSize = init?.gpuBatchSize ?? 5;
		this.audio = init?.audio ?? false;
	}

	/**
	 * Initiate the encoders and muxers
	 * @returns {Promise<void>} - A promise that resolves when initialization is complete
	 */
	private async init() {
		// First check whether web codecs are supported
		const configs = await getVideoEncoderConfigs({
			height: Math.round(this.height),
			width: Math.round(this.width),
			bitrate: this.videoBitrate,
			fps: this.fps,
		});

		this.muxer = new Muxer({
			target: new ArrayBufferTarget(),
			video: { ...configs[0], codec: 'avc' },
			firstTimestampBehavior: 'offset',
			fastStart: 'in-memory',
			audio: this.audio ? {
				numberOfChannels: this.numberOfChannels,
				sampleRate: this.sampleRate,
				codec: 'opus',
			} : undefined,
		});

		const init: VideoEncoderInit = {
			output: (chunk, meta) => {
				meta && this.muxer!.addVideoChunk(chunk, meta);
			},
			error: console.error,
		};

		this.videoEncoder = new VideoEncoder(init);
		this.videoEncoder.configure(configs[0]);
	}

	/**
	 * Encode the next video frame, the current time will be incremented thereafter
	 * @param canvas - Optionally provide a canvas to encode
	 * @returns {Promise<void>} - A promise that resolves when the frame has been encoded
	 */
	public async encodeVideo(canvas?: HTMLCanvasElement | OffscreenCanvas): Promise<void> {
		if (!this.videoEncoder) await this.init();

		if (this.videoEncoder!.encodeQueueSize > this.gpuBatchSize) {
			await new Promise((resolve) => {
				this.videoEncoder!.ondequeue = () => resolve(null);
			});
		}

		const videoFrame = new VideoFrame(canvas ?? this.canvas, {
			timestamp: Math.floor((this.frame / this.fps) * 1e6),
			duration: Math.floor(1e6 / this.fps),
		});
		this.videoEncoder?.encode(videoFrame, { keyFrame: this.frame % (3 * this.fps) == 0 });
		videoFrame.close();
		this.frame++;
	}


	/**
	 * Encode an audio buffer using the encoder configuration added in the constructor
	 * @param buffer - The audio buffer to encode
	 * @returns {Promise<void>} - A promise that resolves when the audio has been added to the encoder queue
	 */
	public async encodeAudio(buffer: AudioBuffer): Promise<void> {
		if (!this.audio) {
			throw new EncoderError({
				code: 'initializationError',
				message: 'Encoder must be initialized using {audio: true} to use this method'
			});
		}

		if (!this.muxer) await this.init();

		const data = resampleBuffer(buffer, this.sampleRate, this.numberOfChannels);

		const encoder = new OpusEncoder({
			output: (chunk, meta) => {
				this.muxer?.addAudioChunkRaw(
					chunk.data,
					chunk.type,
					chunk.timestamp,
					chunk.duration,
					meta
				);
			},
			error: console.error,
		});

		await encoder.configure({
			numberOfChannels: this.numberOfChannels,
			sampleRate: this.sampleRate,
		});

		encoder.encode({
			data: bufferToI16Interleaved(data),
			numberOfFrames: data.length,
		});
	}

	/**
	 * Finalizes the rendering process and creates a blob
	 * @returns {Promise<Blob>} - The rendered video as a Blob
	 */
	public async blob(): Promise<Blob> {
		// encode empty buffer
		await this.videoEncoder?.flush();

		this.muxer?.finalize();

		const buffer = this.muxer?.target.buffer;

		if (!buffer) {
			throw new EncoderError({
				code: 'unexpectedRenderError',
				message: 'Muxer could not be finalized because the target buffer is not defined'
			})
		}

		return new Blob([buffer], { type: 'video/mp4' });
	}

	/**
	 * @deprecated use `blob` instead
	 */
	public async export(): Promise<Blob> {
		return this.blob();
	}
}
