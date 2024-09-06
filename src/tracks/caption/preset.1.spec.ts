/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, expect, it, vi } from 'vitest';
import { Composition } from '../../composition';
import { AudioClip } from '../../clips';
import { MediaTrack } from '../media';
import { Transcript, Word, WordGroup } from '../../models';

const file = new File([], 'file.mp3', { type: 'audio/mp3' });

describe('(1) The Caption Presets', () => {
	Object.assign(document, { fonts: { add: vi.fn() } });

	it('should adjust its offset when the media stack changes', async () => {
		const composition = new Composition();

		const media1 = new AudioClip(file);
		mockAudioValid(media1);
		mockDurationValid(media1, 20);

		const media2 = new AudioClip(file);
		mockAudioValid(media2);
		mockDurationValid(media2, 12);

		const track0 = composition.shiftTrack(MediaTrack).stacked();

		await track0.add(media1);
		await track0.add(media2);

		expect(media1.offset.seconds).toBe(0);
		expect(media1.range[0].seconds).toBe(0);
		expect(media1.range[1].seconds).toBe(20);
		expect(media1.range[1].frames).toBe(600);
		expect(media1.range[1].millis).toBe(20_000);

		expect(media2.offset.millis).toBe(20_001);
		expect(media2.offset.frames).toBe(600);
		expect(media2.range[0].seconds).toBe(0);
		expect(media2.range[1].seconds).toBe(12);
		expect(media2.range[1].frames).toBe(360);

		expect(track0.clips.length).toBe(2);

		const track1 = composition.createTrack('caption').from(
			media1.set({
				transcript: new Transcript([
					new WordGroup([
						new Word('Lorem', 0, 1e3),
						new Word('Ipsum', 2e3, 3e3),
						new Word('is', 4e3, 5e3),
						new Word('simply', 6e3, 7e3),
						new Word('dummy', 8e3, 9e3),
					]),
				]),
			})
		);

		await track1.generate();

		expect(track1.clips.at(0)?.start.seconds).toBe(0);
		expect(track1.clips.at(0)?.stop.seconds).toBe(1);

		expect(track1.clips.at(1)?.start.seconds).toBe(2);
		expect(track1.clips.at(1)?.stop.seconds).toBe(3);

		expect(track1.clips.at(2)?.start.seconds).toBe(4);
		expect(track1.clips.at(2)?.stop.seconds).toBe(5);

		expect(track1.clips.at(3)?.start.seconds).toBe(6);
		expect(track1.clips.at(3)?.stop.seconds).toBe(7);

		expect(track1.clips.at(4)?.start.seconds).toBe(8);
		expect(track1.clips.at(4)?.stop.seconds).toBe(9);

		media2.transcript = new Transcript([
			new WordGroup([
				new Word('Lorem', 1e3, 2e3),
				new Word('Ipsum', 3e3, 4e3),
				new Word('has', 5e3, 6e3),
				new Word('been', 7e3, 8e3),
				new Word('the', 9e3, 10e3),
			]),
		]);
		const track2 = composition.createTrack('caption').from(media2);

		await track2.generate();

		expect(track2.clips.at(0)?.start.millis).toBe(21_001);
		expect(track2.clips.at(0)?.stop.millis).toBe(22_001);

		expect(track2.clips.at(1)?.start.millis).toBe(23_001);
		expect(track2.clips.at(1)?.stop.millis).toBe(24_001);

		expect(track2.clips.at(2)?.start.millis).toBe(25_001);
		expect(track2.clips.at(2)?.stop.millis).toBe(26_001);

		expect(track2.clips.at(3)?.start.millis).toBe(27_001);
		expect(track2.clips.at(3)?.stop.millis).toBe(28_001);

		expect(track2.clips.at(4)?.start.millis).toBe(29_001);
		expect(track2.clips.at(4)?.stop.millis).toBe(30_001);

		media1.detach();

		// offset should now be 0 and not 20

		expect(track2.clips.at(0)?.start.seconds).toBe(1);
		expect(track2.clips.at(0)?.stop.seconds).toBe(2);

		expect(track2.clips.at(1)?.start.seconds).toBe(3);
		expect(track2.clips.at(1)?.stop.seconds).toBe(4);

		expect(track2.clips.at(2)?.start.seconds).toBe(5);
		expect(track2.clips.at(2)?.stop.seconds).toBe(6);

		expect(track2.clips.at(3)?.start.seconds).toBe(7);
		expect(track2.clips.at(3)?.stop.seconds).toBe(8);

		expect(track2.clips.at(4)?.start.seconds).toBe(9);
		expect(track2.clips.at(4)?.stop.seconds).toBe(10);
	});
});


function mockAudioValid(clip: AudioClip) {
	return vi.spyOn(clip.element, 'oncanplay', 'set')
		.mockImplementation(function (this: HTMLMediaElement, fn) {
			fn?.call(this, new Event('canplay'));
		});
}

function mockDurationValid(clip: AudioClip, duration = 1) {
	return vi.spyOn(clip.element, 'duration', 'get').mockReturnValue(duration);
}
