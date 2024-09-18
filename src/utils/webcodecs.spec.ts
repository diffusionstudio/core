/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, expect, it } from 'vitest';
import { getAudioEncoderConfigs, getSupportedEncoderConfigs, getVideoEncoderConfigs } from './webcodecs';

describe('The Webcodecs utils', () => {
	it('should be able to find render profiles (getVideoEncoderConfigs)', async () => {
		const profiles = await getVideoEncoderConfigs({
			fps: 30,
			height: 1080,
			width: 1920,
			bitrate: 10e6,
		});
		expect(profiles.length).toBeGreaterThan(0);
		expect(profiles.at(0)?.hardwareAcceleration).toBe('prefer-hardware');
		expect(profiles.at(-1)?.hardwareAcceleration).toBe('prefer-software');
	});

	it('should return empty array if video encoder is not defined (getVideoEncoderConfigs)', async () => {
		const encoder = window.VideoEncoder;
		// @ts-ignore
		delete window.VideoEncoder;

		const profiles = await getVideoEncoderConfigs({
			fps: 30,
			height: 1080,
			width: 1920,
			bitrate: 10e6,
		});
		expect(profiles.length).toBe(0);

		Object.assign(window, { VideoEncoder: encoder });
	});

	it('should be able to find audio encoding configs (getAudioEncoderConfigs)', async () => {
		const profiles = await getAudioEncoderConfigs({
			numberOfChannels: 2,
			sampleRate: 48000,
			bitrate: 128e3,
		});
		expect(profiles.length).toBe(2);

		expect(profiles[0].codec).toBe('mp4a.40.2');
		expect(profiles[0].numberOfChannels).toBe(2);

		expect(profiles[1].codec).toBe('opus');
		expect(profiles[1].numberOfChannels).toBe(2);
	});

	it('should return empty array if audio encoder is not defined (getAudioEncoderConfigs)', async () => {
		const encoder = window.AudioEncoder;
		// @ts-ignore
		delete window.AudioEncoder;

		const profiles = await getAudioEncoderConfigs({
			numberOfChannels: 2,
			sampleRate: 48000,
			bitrate: 128e3,
		});
		expect(profiles.length).toBe(0);

		Object.assign(window, { AudioEncoder: encoder });
	});

	it('should return audio and video encoder configs (getSupportedEncoderConfigs)', async () => {
		const [video, audio] = await getSupportedEncoderConfigs({
			video: {
				fps: 30,
				height: 1080,
				width: 1920,
				bitrate: 10e6,
			},
			audio: {
				numberOfChannels: 2,
				sampleRate: 48000,
				bitrate: 128e3,
			}
		});
	
		expect(video).toBeTruthy();
		expect(video.hardwareAcceleration).toBe('prefer-hardware');
		expect(video.bitrate).toBe(10e6);
		expect(video.framerate).toBe(30);


		expect(audio).toBeTruthy();
		expect(audio?.codec).toBe('mp4a.40.2');
		expect(audio?.numberOfChannels).toBe(2);
	});

	it('should throw and error if video endocer is not definded (getSupportedEncoderConfigs)', async () => {
		const encoder = window.VideoEncoder;
		// @ts-ignore
		delete window.VideoEncoder;
	
		await expect(() => getSupportedEncoderConfigs({
			video: {
				fps: 30,
				height: 1080,
				width: 1920,
				bitrate: 10e6,
			},
			audio: {
				numberOfChannels: 2,
				sampleRate: 48000,
				bitrate: 128e3,
			}
		})).rejects.toThrowError();


		Object.assign(window, { VideoEncoder: encoder });
	});
});
