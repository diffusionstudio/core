/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, expect, it, vi } from 'vitest';
import { DefaultInsertStrategy, StackInsertStrategy } from './track.strategies';
import { Clip } from '../../clips';
import { Timestamp } from '../../models';
import { Composition } from '../../composition';
import { Track } from './track';

describe('The Track Strategy Object (default mode)', () => {
	const strategy = new DefaultInsertStrategy();

	it('should be able to insert clips to any position', () => {
		// insert at beginning
		let track = createDefaultTrack();
		strategy.add(new Clip({ start: 0, stop: 9 }), track);

		expect(track.clips[0].start.frames).toBe(0);
		expect(track.clips[0].stop.frames).toBe(9);

		expect(track.clips[1].start.frames).toBe(10);
		expect(track.clips[1].stop.frames).toBe(20);

		expect(track.clips[2].start.frames).toBe(80);
		expect(track.clips[2].stop.frames).toBe(100);

		expect(track.clips[3].start.frames).toBe(101);
		expect(track.clips[3].stop.frames).toBe(110);

		// insert between
		track = createDefaultTrack();
		strategy.add(new Clip({ start: 30, stop: 50 }), track);

		expect(track.clips[0].start.frames).toBe(10);
		expect(track.clips[0].stop.frames).toBe(20);

		expect(track.clips[1].start.frames).toBe(30);
		expect(track.clips[1].stop.frames).toBe(50);

		expect(track.clips[2].start.frames).toBe(80);
		expect(track.clips[2].stop.frames).toBe(100);

		// insert end
		track = createDefaultTrack();
		strategy.add(new Clip({ start: 111, stop: 112 }), track);

		expect(track.clips[2].start.frames).toBe(101);
		expect(track.clips[2].stop.frames).toBe(110);

		expect(track.clips[3].start.frames).toBe(111);
		expect(track.clips[3].stop.frames).toBe(112);
	});

	it('should be able to align overlapping clips', () => {
		// overlap start
		let track = createDefaultTrack();
		strategy.add(new Clip({ start: 15, stop: 30 }), track);

		expect(track.clips[0].start.frames).toBe(10);
		expect(track.clips[0].stop.frames).toBe(20);
		expect(track.clips[0].stop.millis).toBe(667);

		expect(track.clips[1].start.millis).toBe(668);
		expect(track.clips[1].start.frames).toBe(20);
		expect(track.clips[1].stop.frames).toBe(30);

		// overlap end
		track = createDefaultTrack();
		strategy.add(new Clip({ start: 60, stop: 90 }), track);

		expect(track.clips[1].start.frames).toBe(60);
		expect(track.clips[1].stop.frames).toBe(80);
		// round(80 / 30FPS * 1e3) - 1
		expect(track.clips[1].stop.millis).toBe(2666);

		expect(track.clips[2].start.frames).toBe(80);
		expect(track.clips[2].stop.frames).toBe(100);
	});

	it('should add overlapping clip to a new track', async () => {
		const composition = new Composition();
		const track = composition.createTrack('base');
		await track.add(new Clip({ start: 0, stop: 20 }));

		expect(composition.tracks.length).toBe(1);
		expect(composition.tracks[0].clips.length).toBe(1);
		expect(composition.tracks[0].clips[0].start.frames).toBe(0);
		expect(composition.tracks[0].clips[0].stop.frames).toBe(20);

		await track.add(new Clip({ start: 5, stop: 10 }));
		expect(composition.tracks.length).toBe(2);

		expect(composition.tracks[0].clips.length).toBe(1);
		expect(composition.tracks[0].clips[0].start.frames).toBe(5);
		expect(composition.tracks[0].clips[0].stop.frames).toBe(10);

		expect(composition.tracks[1].clips.length).toBe(1);
		expect(composition.tracks[1].clips[0].start.frames).toBe(0);
		expect(composition.tracks[1].clips[0].stop.frames).toBe(20);

		await track.add(new Clip({ start: 11, stop: 20 }));
		expect(composition.tracks.length).toBe(2);

		expect(composition.tracks[0].clips.length).toBe(2);
		expect(composition.tracks[0].clips[0].start.frames).toBe(5);
		expect(composition.tracks[0].clips[0].stop.frames).toBe(10);

		expect(composition.tracks[0].clips[1].start.frames).toBe(11);
		expect(composition.tracks[0].clips[1].stop.frames).toBe(20);

		expect(composition.tracks[1].clips.length).toBe(1);
		expect(composition.tracks[1].clips[0].start.frames).toBe(0);
		expect(composition.tracks[1].clips[0].stop.frames).toBe(20);

		await track.add(new Clip({ start: 12, stop: 18 }));
		expect(composition.tracks.length).toBe(3);

		expect(composition.tracks[0].clips.length).toBe(1);
		expect(composition.tracks[0].clips[0].start.frames).toBe(12);
		expect(composition.tracks[0].clips[0].stop.frames).toBe(18);

		expect(composition.tracks[1].clips.length).toBe(2);
		expect(composition.tracks[1].clips[0].start.frames).toBe(5);
		expect(composition.tracks[1].clips[0].stop.frames).toBe(10);

		expect(composition.tracks[1].clips[1].start.frames).toBe(11);
		expect(composition.tracks[1].clips[1].stop.frames).toBe(20);

		expect(composition.tracks[2].clips.length).toBe(1);
		expect(composition.tracks[2].clips[0].start.frames).toBe(0);
		expect(composition.tracks[2].clips[0].stop.frames).toBe(20);
	});

	it('should be able to update clips (reorder)', () => {
		const track = createDefaultTrack();

		const clip = track.clips[1].set({
			start: 2,
			stop: 8,
			name: 'foo',
		});

		strategy.update(clip, track);

		expect(track.clips[0].start.frames).toBe(2);
		expect(track.clips[0].stop.frames).toBe(8);
		expect(track.clips[0].name).toBe('foo');

		expect(track.clips[1].start.frames).toBe(10);
		expect(track.clips[1].stop.frames).toBe(20);
	});

	it('should be able to update and align clips (reorder)', () => {
		const track = createDefaultTrack();

		const clip = track.clips[1].set({
			start: 105,
			stop: 120,
			name: 'foo',
		});

		strategy.update(clip, track);

		expect(track.clips[1].start.frames).toBe(101);
		expect(track.clips[1].stop.frames).toBe(110);
		expect(track.clips[1].stop.millis).toBe(3667);

		expect(track.clips[2].start.millis).toBe(3668);
		expect(track.clips[2].start.frames).toBe(110);
		expect(track.clips[2].stop.frames).toBe(120);
		expect(track.clips[2].name).toBe('foo');
	});

	it('should be able to move all clips', () => {
		const track = createDefaultTrack();
		const spyFn = vi.fn();

		// simulate keyframe callbacks
		for (const clip of track.clips) {
			clip.on('frame', () => {
				strategy.update(clip, track);
				spyFn();
			});
		}

		strategy.offset(Timestamp.fromFrames(4), track);

		expect(spyFn).toHaveBeenCalledTimes(3);

		expect(track.clips[0].start.frames).toBe(14);
		expect(track.clips[0].stop.frames).toBe(24);

		expect(track.clips[1].start.frames).toBe(84);
		expect(track.clips[1].stop.frames).toBe(104);

		expect(track.clips[2].start.frames).toBe(105);
		expect(track.clips[2].stop.frames).toBe(114);
	});
});

describe('The Track Strategy Object (stack mode)', () => {
	const strategy = new StackInsertStrategy();

	it('should be able to insert clips to the end', () => {
		// insert at beginning
		let track = new Track();
		strategy.add(new Clip({ start: 20, stop: 30 }), track);
		expect(track.clips.length).toBe(1);
		expect(track.clips[0].start.frames).toBe(0);
		expect(track.clips[0].stop.frames).toBe(10);

		track = createStackedTrack();
		strategy.add(new Clip({ start: 0, stop: 9 }), track);

		expect(track.clips[2].start.frames).toBe(21);
		expect(track.clips[2].stop.frames).toBe(30);
		expect(track.clips[2].stop.millis).toBe(1000);

		expect(track.clips[3].start.millis).toBe(1001);
		expect(track.clips[3].start.frames).toBe(30);
		expect(track.clips[3].stop.frames).toBe(39);
	});

	it('should be able to update clips (realign)', () => {
		const track = createDefaultTrack();
		strategy.update(new Clip(), track);
		expect(track.clips.length).toBe(3);

		expect(track.clips[0].start.frames).toBe(0);
		expect(track.clips[0].stop.frames).toBe(10);
		expect(track.clips[0].stop.millis).toBe(334);

		expect(track.clips[1].start.millis).toBe(335);
		expect(track.clips[1].start.frames).toBe(10);
		expect(track.clips[1].stop.frames).toBe(30);
		expect(track.clips[1].stop.millis).toBe(1001);

		expect(track.clips[2].start.millis).toBe(1002);
		expect(track.clips[2].start.frames).toBe(30);
		expect(track.clips[2].stop.frames).toBe(39);
	});

	it('should insert clips a specified index', () => {
		const track = createDefaultTrack();
		track.stacked();

		expect(track.clips[0].stop.frames).toBe(10);
		expect(track.clips[1].stop.frames).toBe(30);
		expect(track.clips[2].stop.frames).toBe(39);

		strategy.add(new Clip({ start: 20, stop: 25 }), track, 1);

		expect(track.clips[0].stop.frames).toBe(10);
		expect(track.clips[1].start.frames).toBe(10);
		expect(track.clips[1].stop.frames).toBe(15);
		expect(track.clips[2].start.frames).toBe(15);
		expect(track.clips[2].stop.frames).toBe(35);
	});
});

function createDefaultTrack(): Track<Clip> {
	const track = new Track();
	track.clips = [
		new Clip({ start: 10, stop: 20 }),
		new Clip({ start: 80, stop: 100 }),
		new Clip({ start: 101, stop: 110 }),
	];
	return track;
}

function createStackedTrack(): Track<Clip> {
	const track = new Track();
	track.clips = [
		new Clip({ start: 0, stop: 10 }),
		new Clip({ start: 11, stop: 20 }),
		new Clip({ start: 21, stop: 30 }),
	];
	return track;
}
