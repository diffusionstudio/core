/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { Muxer } from 'mp4-muxer';
import { WebcodecsAudioEncoder } from './webcodecs.audio';
import { WebassemblyAudioEncoder } from './webassembly.audio';
import { WebcodecsVideoEncoder } from './webcodecs.video';
import { audioClipFilter, createStreamTarget, withError } from './utils';
import { getSupportedEncoderConfigs } from '../utils';
import { FPS_DEFAULT } from '../models';
import { EncoderError } from '../errors';

import type { Composition } from '../composition';
import type { VideoEncoderInit } from './interfaces';
import type { WebAudioEncoder } from './interfaces';

export class Encoder extends WebcodecsVideoEncoder {
	private audioEncoder?: WebAudioEncoder;

	/**
	 * Create a new audio and video encoder and multiplex the result 
	 * using a mp4 container
	 * @param composition The composition to render
	 * @param options Configure the output
	 * @example 
	 * ```
	 * new Encoder(composition, { resolution: 2 }).render() // will render at 4K
	 * ```
	 */
	public constructor(composition: Composition, init?: VideoEncoderInit) {
		super(composition, init);
	}

	/**
	 * Export the specified composition
	 * @throws DOMException if the export has been aborted
	 */
	public async render(target: FileSystemFileHandle | string = 'video.mp4', signal?: AbortSignal): Promise<void> {
		if (!this.composition.renderer) {
			throw new EncoderError({
				code: 'rendererNotInitialized',
				message: 'Cannot encode composition before the renderer has been initialized'
			});
		};

		const [videoConfig, audioConfig] = await this.getConfigs();

		if (this.debug) {
			console.info('Hardware Preference', videoConfig.hardwareAcceleration);
		}

		const now = performance.now();
		const stream = await createStreamTarget(target);
		const audio = this.composition.findClips(audioClipFilter) && this.audio;

		if (!audio) this.audioEncoder = undefined;

		await this.composition.pause();
		this.composition.state = 'RENDER';
		this.composition.renderer.resolution = this.resolution;
		this.composition.fps = this.fps;

		try {
			const muxer = new Muxer({
				target: stream.target,
				video: { ...videoConfig, codec: 'avc' },
				firstTimestampBehavior: 'offset',
				fastStart: stream.fastStart,
				audio: audio ? {
					...audioConfig,
					codec: audioConfig.codec == 'opus' ? 'opus' : 'aac',
				} : undefined,
			});

			await withError(Promise.allSettled([
				this.encodeVideo(muxer, videoConfig, signal),
				this.audioEncoder?.encode(muxer, audioConfig)
			]));

			if (this.debug) {
				const duration = (performance.now() - now) / 1000;
				console.info(`TOTAL DURATION: ${duration.toFixed(3)}sec`);
			}

			muxer.finalize();
			await stream.close(true);
		} catch (e) {
			console.error('export error', e);
			await stream.close(false);
			throw e;
		} finally {
			this.composition.state = 'IDLE';
			this.composition.renderer.resolution = 1;
			this.composition.fps = FPS_DEFAULT;
		}
	}

	/**
	 * Check which configurations are supported and select the best
	 * @returns A supported audio and video configuration
	 */
	private async getConfigs() {
		const { height, width } = this.composition.settings;
		const { numberOfChannels, sampleRate, videoBitrate, fps, resolution } = this

		let [video, audio] = await getSupportedEncoderConfigs({
			video: {
				height: Math.round(height * resolution),
				width: Math.round(width * resolution),
				bitrate: videoBitrate,
				fps,
			},
			audio: {
				sampleRate,
				numberOfChannels,
				bitrate: 128_000,
			}
		});

		// use webassembly as fallback
		if (!audio) {
			this.audioEncoder = new WebassemblyAudioEncoder(this.composition);
			audio = { codec: 'opus', numberOfChannels, sampleRate }
		} else {
			this.audioEncoder = new WebcodecsAudioEncoder(this.composition);
		}

		return [video, audio] as const;
	}

	/**
	 * @deprecated please replace with `render`
	 */
	public async export(target: FileSystemFileHandle | string = 'video.mp4'): Promise<void> {
		return await this.render(target);
	}
}

/**
 * @deprecated Please use the `Encoder` object instead
 */
export class WebcodecsEncoder extends Encoder { }
