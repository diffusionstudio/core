/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';
import { Clip } from '../../clips';
import { Track } from './track';
import { Timestamp } from '../../models';

describe('The Track Object', () => {
	let track: Track<Clip>;
	let updateSpy: MockInstance<(time: Timestamp) => void | Promise<void>>;

	beforeEach(() => {
		// frame and seconds are the same
		track = new Track();
		updateSpy = vi.spyOn(track, 'update');
	});

	it('should render should not have any effects when the track is empty', () => {
		track.pointer = 4;

		track.update(new Timestamp());

		expect(updateSpy).toHaveBeenCalledTimes(1);
		expect(track.pointer).toBe(4);
	});

	it('should render setup {[   ]    [    ]    [    ]     }', () => {
		track.pointer = 0;

		track.clips = [
			new Clip().set({ start: 0, stop: 10 }),
			new Clip().set({ start: 20, stop: 30 }),
			new Clip().set({ start: 50, stop: 60 }),
		];

		const spys = track.clips.map((clip) => vi.spyOn(clip, 'update'));

		track.update(new Timestamp());

		expect(updateSpy).toHaveBeenCalledTimes(1);
		expect(track.pointer).toBe(0);

		expect(spys[0]).toHaveBeenCalledTimes(1);
		expect(spys[1]).toHaveBeenCalledTimes(0);
		expect(spys[2]).toHaveBeenCalledTimes(0);

		track.update(Timestamp.fromFrames(15));

		// one more due to recursion after clip seek
		expect(updateSpy).toHaveBeenCalledTimes(2);
		expect(track.pointer).toBe(1);

		expect(spys[0]).toHaveBeenCalledTimes(1);
		expect(spys[1]).toHaveBeenCalledTimes(0);
		expect(spys[2]).toHaveBeenCalledTimes(0);

		track.update(Timestamp.fromFrames(25));

		expect(updateSpy).toHaveBeenCalledTimes(3);
		expect(track.pointer).toBe(1);

		expect(spys[0]).toHaveBeenCalledTimes(1);
		expect(spys[1]).toHaveBeenCalledTimes(1);
		expect(spys[2]).toHaveBeenCalledTimes(0);

		// jump to 3rd clip
		track.update(Timestamp.fromFrames(50));

		expect(updateSpy).toHaveBeenCalledTimes(4);
		expect(track.pointer).toBe(2);

		expect(spys[0]).toHaveBeenCalledTimes(1);
		expect(spys[1]).toHaveBeenCalledTimes(1);
		expect(spys[2]).toHaveBeenCalledTimes(1);

		// render after all clips
		track.update(Timestamp.fromFrames(70));

		expect(updateSpy).toHaveBeenCalledTimes(5);
		expect(track.pointer).toBe(2);

		expect(spys[0]).toHaveBeenCalledTimes(1);
		expect(spys[1]).toHaveBeenCalledTimes(1);
		expect(spys[2]).toHaveBeenCalledTimes(1);
	});

	it('should render setup {    [   ][   ]}', () => {
		track.pointer = 0;

		track.clips = [
			new Clip().set({ start: 10, stop: 20 }),
			new Clip().set({ start: 21, stop: 30 }),
		];

		const spys = track.clips.map((clip) => vi.spyOn(clip, 'update'));

		track.update(Timestamp.fromFrames(5));

		expect(updateSpy).toHaveBeenCalledTimes(1);
		expect(track.pointer).toBe(0);

		expect(spys[0]).toHaveBeenCalledTimes(0);
		expect(spys[1]).toHaveBeenCalledTimes(0);

		track.update(Timestamp.fromFrames(21));

		expect(updateSpy).toHaveBeenCalledTimes(2);
		expect(track.pointer).toBe(1);

		expect(spys[0]).toHaveBeenCalledTimes(0);
		expect(spys[1]).toHaveBeenCalledTimes(1);

		track.update(Timestamp.fromFrames(10));

		expect(updateSpy).toHaveBeenCalledTimes(3);
		expect(track.pointer).toBe(0);

		expect(spys[0]).toHaveBeenCalledTimes(1);
		expect(spys[1]).toHaveBeenCalledTimes(1);
	});
});
