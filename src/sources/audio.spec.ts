/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, it, vi, beforeEach, expect } from 'vitest';
import { AudioSource } from './audio'; // Import the AudioSource class

// Mocking the OfflineAudioContext class
class MockOfflineAudioContext {
	constructor(public numberOfChannels: number, public length: number, public sampleRate: number) { }

	decodeAudioData(_: ArrayBuffer): Promise<AudioBuffer> {
		const audioBuffer = {
			duration: 5, // Mock duration
			sampleRate: this.sampleRate,
			length: 5000,
			getChannelData: () => new Float32Array(5000).fill(0.5), // Return a dummy Float32Array
		} as any as AudioBuffer;
		return Promise.resolve(audioBuffer);
	}
}

vi.stubGlobal('OfflineAudioContext', MockOfflineAudioContext); // Stub the global OfflineAudioContext

describe('AudioSource', () => {
	let audioSource: AudioSource;

	beforeEach(() => {
		audioSource = new AudioSource();
		audioSource.file = new File([], 'audio.mp3', { type: 'audio/mp3' });
	});

	it('should decode an audio buffer correctly', async () => {
		const buffer = await audioSource.decode(2, 44100, true);
		expect(buffer.duration).toBe(5); // Mock duration
		expect(buffer.sampleRate).toBe(44100);
		expect(audioSource.audioBuffer).toBe(buffer);
		expect(audioSource.duration.seconds).toBe(5); // Ensure duration is set

		audioSource.audioBuffer = undefined;
		await audioSource.decode(2, 44100, false);
		expect(audioSource.audioBuffer).toBe(undefined);
	});

	it('should (fast) sample an audio buffer correctly', async () => {
		const samples = await audioSource.fastsampler({ length: 20 });
		expect(samples.length).toBe(20);

		for (const sample of samples) {
			expect(sample).toBe(0.5);
		}
	});

	it('should (fast) sample an audio buffer correctly with start', async () => {
		const samples = await audioSource.fastsampler({
			length: 20,
			start: 10,
		});
		expect(samples.length).toBe(20);

		for (const sample of samples) {
			expect(sample).toBe(0.5);
		}
	});

	it('should (fast) sample an audio buffer correctly with stop', async () => {
		const samples = await audioSource.fastsampler({
			length: 20,
			stop: 1000,
			start: 20,
		});
		expect(samples.length).toBe(20);

		for (const sample of samples) {
			expect(sample).toBe(0.5);
		}
	});

	it('should (fast) sample an audio buffer correctly with logarithmic scale', async () => {
		const samples = await audioSource.fastsampler({ logarithmic: true });
		expect(samples.length).toBe(60);

		for (const sample of samples) {
			expect(sample).toBeGreaterThanOrEqual(0.5);
			expect(sample).toBeLessThanOrEqual(1);
		}
	});

	it('should accept custom metadata', async () => {
		const metadata = { a: 1, b: 2 };
		const source = new AudioSource<typeof metadata>();
		source.metadata = metadata;
		expect(source.metadata).toEqual(metadata);
	});

	it('should create a thumbnail with correct DOM elements', async () => {
		const thumbnail = await audioSource.thumbnail(60, 50, 0);

		// Check if the thumbnail is a div
		expect(thumbnail.tagName).toBe('DIV');
		expect(thumbnail.className).toContain('audio-samples');

		// Check if it has the right number of children
		expect(thumbnail.children.length).toBe(60);

		// Check if each child has the correct class
		for (const child of thumbnail.children) {
			expect(child.className).toContain('audio-sample-item');
		}
	});
});
