/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Composition } from '../../composition';
import { Font, MediaClip } from '../../clips';
import { CaptionTrack } from './caption';
import { Transcript, Word, WordGroup } from '../../models';

describe('The Caption Track Object', () => {
	vi.spyOn(Font.prototype, 'load').mockImplementation(async () => new Font());

	let composition: Composition;
	let track: CaptionTrack;
	let media: MediaClip;

	beforeEach(() => {
		composition = new Composition();
		track = composition.createTrack('caption');
		media = new MediaClip().set({
			transcript: new Transcript([
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
					new Word('Ipsum', 26e3, 27e3),
					new Word('has', 28e3, 29e3),
					new Word('been', 30e3, 31e3),
					new Word('the', 32e3, 33e3),
					new Word("industry's", 34e3, 35e3),
				]),
			]),
		});
		track.from(media);
		expect(track.clip?.transcript).toBeDefined();
		expect(track.clip?.id).toBe(media.id);
	});

	it('should have a certain intitial state', () => {
		expect(track.type).toBe('caption');
	});

	it('should generate captions', async () => {
		expect(track.clips.length).toBe(0);
		await track.generate();
		expect(track.clips.length).not.toBe(0);
	});

	it('should update the offset when the media keyframes change', async () => {
		await track.generate();
		expect(track.clips.at(0)?.start.seconds).toBe(0);

		media.offsetBy(10);
		expect(track.clips.at(0)?.start.frames).toBe(10);

		media.offsetBy(-5);
		expect(track.clips.at(0)?.start.frames).toBe(5);
	});
});
