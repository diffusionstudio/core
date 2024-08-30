/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { ArrayBufferTarget, Muxer } from 'mp4-muxer';
import { ExportError } from '../errors';
import * as utils from '../utils';

import type { frame } from '../types';
import type { EncoderOptions } from './config.types';

type CanvasEncoderOptions = Omit<EncoderOptions, 'resolution' | 'debug'>;

/**
 * Generic encoder that allows you to encode
 * a canvas frame by frame
 */
export class CanvasEncoder implements Required<CanvasEncoderOptions> {
	private canvas: HTMLCanvasElement | OffscreenCanvas;
	private muxer?: Muxer<ArrayBufferTarget>;
	private videoEncoder?: VideoEncoder;
	private audioEncoder?: AudioEncoder;
	private onready?: () => void;

	public frame: frame = 0;
	public sampleRate: number; // 44100
	public numberOfChannels: number; // 2
	public videoBitrate: number // 10e6
	public gpuBatchSize: number; // 5
	public fps: number; // 30

	public height: number;
	public width: number;

	private encodedAudio = false;

	/**
	 * Create a new Webcodecs encoder
	 * @param canvas - The canvas to encode
	 * @param options - Configure the output
	 * @example
	 * ```typescript
	 * const encoder = new CanvasEncoder(canvas, { fps: 60 });
	 * ```
	 */
	public constructor(canvas: HTMLCanvasElement | OffscreenCanvas, options?: CanvasEncoderOptions) {
		this.canvas = canvas;
		this.width = canvas.width;
		this.height = canvas.height;
		this.fps = options?.fps ?? 30;
		this.sampleRate = options?.sampleRate ?? 44100;
		this.numberOfChannels = options?.numberOfChannels ?? 2;
		this.videoBitrate = options?.videoBitrate ?? 10e6;
		this.gpuBatchSize = options?.gpuBatchSize ?? 5;

		this.init();
	}

	/**
	 * Initiate the encoders and muxers
	 * @returns {Promise<void>} - A promise that resolves when initialization is complete
	 */
	private async init() {
		// First check whether web codecs are supported
		const [video, audio] = await utils.getSupportedEncoderConfigs({
			video: {
				height: Math.round(this.height),
				width: Math.round(this.width),
				bitrate: this.videoBitrate,
				fps: this.fps,
			},
			audio: {
				sampleRate: this.sampleRate,
				numberOfChannels: this.numberOfChannels,
				bitrate: 128_000, // 128 kbps
			}
		});

		this.muxer = new Muxer({
			target: new ArrayBufferTarget(),
			video: { ...video, codec: 'avc' },
			firstTimestampBehavior: 'offset',
			fastStart: 'in-memory',
			audio: {
				...audio,
				codec: audio.codec == 'opus' ? 'opus' : 'aac',
			},
		});

		const init: VideoEncoderInit = {
			output: (chunk, meta) => {
				meta && this.muxer!.addVideoChunk(chunk, meta);
			},
			error: console.error,
		};

		this.videoEncoder = new VideoEncoder(init);
		this.videoEncoder.configure(video);

		this.audioEncoder = new AudioEncoder({
			output: (chunk, meta) => {
				meta && this.muxer?.addAudioChunk(chunk, meta);
			},
			error: console.error,
		});

		this.audioEncoder.configure(audio);

		this.onready?.()
	}

	/**
	 * Encode the next video frame, the current time will be incremented thereafter
	 * @param canvas - Optionally provide a canvas to encode
	 * @returns {Promise<void>} - A promise that resolves when the frame has been encoded
	 */
	public async encodeVideo(canvas?: HTMLCanvasElement | OffscreenCanvas): Promise<void> {
		if (!this.videoEncoder) await this.ready();

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
		if (!this.audioEncoder) await this.ready();

		if (buffer.sampleRate != this.sampleRate || buffer.numberOfChannels != this.numberOfChannels) {
			buffer = utils.resampleBuffer(buffer, this.sampleRate, this.numberOfChannels);
		}

		this.audioEncoder?.encode(
			new AudioData({
				format: 'f32-planar',
				sampleRate: buffer.sampleRate,
				numberOfChannels: buffer.numberOfChannels,
				numberOfFrames: buffer.length,
				timestamp: 0,
				data: utils.bufferToF32Planar(buffer),
			})
		);

		this.encodedAudio = true;
	}

	/**
	 * Finalizes the rendering process and exports the result as an MP4
	 * @returns {Promise<Blob>} - The rendered video as a Blob
	 */
	public async export(): Promise<Blob> {
		// encode empty buffer
		if (!this.encodedAudio) {
			const args = [this.numberOfChannels, 1, this.sampleRate] as const;
			const context = new OfflineAudioContext(...args);
			await this.encodeAudio(context.createBuffer(...args));
		}

		await this.videoEncoder?.flush();
		await this.audioEncoder?.flush();

		this.muxer?.finalize();

		const buffer = this.muxer?.target.buffer;

		if (!buffer) {
			throw new ExportError({
				i18n: 'unexpectedEncoderError',
				message: 'Muxer could not be finalized because the target buffer is not defined'
			})
		}

		return new Blob([buffer], { type: 'video/mp4' });
	}

	/**
	 * Wait until the encoder is ready
	 * @returns {Promise<void>} - A promise that resolves when the encoder is ready
	 */
	private async ready() {
		await new Promise<void>((resolve) => {
			this.onready = () => resolve();
		})
	}
}
