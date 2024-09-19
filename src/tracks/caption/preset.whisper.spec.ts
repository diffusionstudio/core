/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Composition } from '../../composition';
import { ComplexTextClip, MediaClip } from '../../clips';
import { Transcript, Word, WordGroup } from '../../models';
import { CaptionTrack } from './caption';
import { WhisperCaptionPreset } from './preset.whisper';

describe('The WhisperCaptionPreset', () => {
	const mockFn = vi.fn();
	Object.assign(document, { fonts: { add: mockFn } });

	let composition: Composition;
	let track: CaptionTrack;

	beforeEach(() => {
		composition = new Composition();
		track = composition.createTrack('caption');
	});

	it('should apply complex clips to the track', async () => {
		await track
			.from(new MediaClip({ transcript }))
			.generate(WhisperCaptionPreset);

		expect(track.clips.length).toBe(13);
		expect(track.clips[0]).toBeInstanceOf(ComplexTextClip);
		expect(track.clips[0].start.frames).toBe(0);
		expect(track.clips[0].text).toBe('Lorem Ipsum is simply');
	});

	it('should not apply clips if the transcript or composition is not devined', async () => {
		await expect(() => track
			.from(new MediaClip())
			.generate(WhisperCaptionPreset)).rejects.toThrowError();

		await expect(() => new CaptionTrack()
			.from(new MediaClip({ transcript }))
			.generate(WhisperCaptionPreset)).rejects.toThrowError();
	});
});

const transcript = new Transcript([
	new WordGroup([
		new Word('Lorem', 0, 1e3),
		new Word('Ipsum', 2e3, 3e3),
		new Word('is', 4e3, 5e3),
		new Word('simply', 6e3, 7e3),
		new Word('dummy', 8e3, 9e3),
		new Word('text', 10e3, 11e3),
		new Word('of', 12e3, 13e3),
		new Word('the', 14e3, 15e3),
		new Word('printing', 16e3, 17e3),
		new Word('and', 18e3, 19e3),
		new Word('typesetting', 20e3, 21e3),
		new Word('industry', 22e3, 23e3),
	]),
	new WordGroup([
		new Word('Lorem', 24e3, 25e3),
	]),
]);
