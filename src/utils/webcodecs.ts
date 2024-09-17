/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { EncoderError } from "../errors";

type VideoSettings = {
	height: number;
	width: number;
	fps: number;
	bitrate: number;
}

type AudioSettings = {
	sampleRate: number,
	numberOfChannels: number,
	bitrate: number,
}

/**
 * Function for retrieving supported video encoder
 * configurations
 */
export async function getVideoEncoderConfigs(settings: VideoSettings): Promise<VideoEncoderConfig[]> {
	const { fps, height, width, bitrate } = settings;
	// https://cconcolato.github.io/media-mime-support/#video
	const codecs = [
		'avc1.640034',
		'avc1.4d0034',
		'avc1.640028',
		'avc1.640C32',
		'avc1.64001f',
		'avc1.42001E',
		// TODO: 'hev1.1.6.L93.B0', 'hev1.2.4.L93.B0', 'vp09.00.10.08', 'av01.0.04M.08', 'vp8',
	];
	const accelerations = ['prefer-hardware', 'prefer-software'] as const;

	const configs: VideoEncoderConfig[] = [];
	for (const codec of codecs) {
		for (const acceleration of accelerations) {
			configs.push({
				codec,
				hardwareAcceleration: acceleration,
				width: width,
				height: height,
				bitrate,
				framerate: fps,
			});
		}
	}

	const supported: VideoEncoderConfig[] = [];

	if (!('VideoEncoder' in window)) {
		return supported;
	}

	for (const config of configs) {
		const support = await VideoEncoder.isConfigSupported(config);
		if (support.supported) supported.push(support.config ?? config);
	}

	return supported.sort(sortHardwareAcceleration);
}

/**
 * Function for retrieving supported audio encoder configurations
 */
export async function getAudioEncoderConfigs(settings: AudioSettings): Promise<AudioEncoderConfig[]> {
	const { sampleRate, numberOfChannels, bitrate } = settings;

	const codecs = ['mp4a.40.2', 'opus'];
	const supported: AudioEncoderConfig[] = [];

	if (!('AudioEncoder' in window)) {
		return supported;
	}

	for (const codec of codecs) {
		const support = await AudioEncoder.isConfigSupported({
			codec,
			numberOfChannels,
			bitrate,
			sampleRate,
		});

		if (support.supported) {
			supported.push(support.config);
		}
	}

	return supported;
}

/**
 * Function for retrieving the best supported audio
 * and video profiles
 */
export async function getSupportedEncoderConfigs(settings: {
	audio: AudioSettings,
	video: VideoSettings
}): Promise<[VideoEncoderConfig, AudioEncoderConfig | undefined]> {
	const audio = await getAudioEncoderConfigs(settings.audio);
	const video = await getVideoEncoderConfigs(settings.video);

	if (!video.length) {
		throw new EncoderError({
			message: "Encoder can't be configured with any of the tested codecs",
			code: 'codecsNotSupported',
		});
	}

	return [video[0], audio[0]];
}

/**
 * Config sort function that prioritizes hardware acceleration
 */
export function sortHardwareAcceleration(a: VideoEncoderConfig, b: VideoEncoderConfig): number {
	const aHa = a.hardwareAcceleration ?? '';
	const bHa = b.hardwareAcceleration ?? '';
	if (aHa < bHa) return -1;
	if (aHa > bHa) return 1;
	return 0;
}
