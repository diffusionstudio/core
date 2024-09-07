/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Clip } from './clip';
import { Timestamp } from '../../models';
import { Composition } from '../../composition';
import { Track } from '../../tracks';

describe('The Clip Object', () => {
	const updateFn = vi.fn();
	const detachFn = vi.fn();
	const frameFn = vi.fn();
	const attachFn = vi.fn();

	let clip: Clip;

	beforeEach(() => {
		updateFn.mockClear();
		frameFn.mockClear();
		detachFn.mockClear();
		attachFn.mockClear();

		clip = new Clip();
		clip.on('update', updateFn);
		clip.on('detach', detachFn);
		clip.on('frame', frameFn);
		clip.on('attach', attachFn);
	});

	it('should have an initial state', () => {
		clip.trigger('load', undefined);
		expect(clip.state).toBe('IDLE');
		expect(clip.track).toBeUndefined();
		expect(clip.start.seconds).toBe(0);
		expect(clip.stop.seconds).toBe(16);
		expect(clip.id.length).toBe(36);
	});

	it('should have setters that trigger an update', () => {
		clip.set({ stop: 200, start: 100 });

		expect(clip.start.frames).toBe(100);
		expect(clip.stop.frames).toBe(200);
		expect(updateFn).toBeCalledTimes(1);
		expect(frameFn).toBeCalledTimes(2);
	});

	it('should should set start and stop if the start is larger than the stop', () => {
		clip.set({ stop: 40, start: 60 });

		// 1ms more than start;
		expect(clip.start.millis).toBe(2000);
		expect(clip.stop.millis).toBe(2001);

		// 1ms less than stop
		clip.set({ stop: 35 });
		expect(clip.stop.millis).toBe(1167);
		expect(clip.start.millis).toBe(1166);

		expect(updateFn).toBeCalledTimes(2);
		expect(frameFn).toBeCalledTimes(3);
	});

	it('should connect to a track', async () => {
		clip.set({ stop: 60, start: 30 });

		const composition = new Composition();
		const track = composition.createTrack('base');
		await track.add(clip);

		expect(clip.track?.id).toBe(track.id);
		expect(clip.state).toBe('ATTACHED');
		expect(clip.start.frames).toBe(30);
		expect(clip.stop.frames).toBe(60);
		expect(clip.start.millis).toBe(1e3);
		expect(clip.stop.millis).toBe(2e3);
		expect(track.clips.findIndex((n) => n.id == clip.id)).toBe(0);
		expect(attachFn).toHaveBeenCalledOnce();
		expect(clip.track?.id).toBe(track.id);
	});

	it('should be removable from the track', async () => {
		const clip1 = new Clip({ stop: 900, start: 570 });

		const composition = new Composition();
		const track = composition.createTrack('base');
		expect(track.clips.length).toBe(0);
		await track.add(clip);
		expect(track.clips.length).toBe(1);
		await track.add(clip1);
		expect(track.clips.length).toBe(2);
		expect(track.clips.findIndex((n) => n.id == clip.id)).toBe(0);
		expect(clip.state).toBe('ATTACHED');

		composition.computeFrame();

		// clip is currently getting rendered
		expect(track.view.children.length).toBe(1);

		clip.detach();
		expect(track.clips.findIndex((n) => n.id == clip.id)).toBe(-1);
		expect(track.clips.findIndex((n) => n.id == clip1.id)).toBe(0);
		expect(clip.state).toBe('READY');
		expect(track.view.children.length).toBe(0);
	});

	it('should not remove error state on detach', async () => {
		const composition = new Composition();
		const track = composition.createTrack('base');

		await track.add(clip);
		expect(track.clips.length).toBe(1);
		clip.state = 'ERROR';
		expect(clip.state).toBe('ERROR');

		clip.detach();
		expect(track.clips.length).toBe(0);
		expect(clip.state).toBe('ERROR');
	});

	it('should be offset by a given frame', async () => {
		clip.set({ stop: 120, start: 100, name: 'foo' });

		const composition = new Composition();
		const track = composition.createTrack('base');
		await track.add(clip);
		await track.add(new Clip({ stop: 80, start: 60 }));

		expect(track.clips.length).toBe(2);
		expect(track.clips[1].name).toBe('foo');

		clip.offsetBy(-80);

		expect(track.clips.length).toBe(2);
		expect(track.clips[0].name).toBe('foo');
		expect(track.clips[0].start.frames).toBe(20);
		expect(track.clips[0].stop.frames).toBe(40);

		clip.offsetBy(30);

		expect(track.clips.length).toBe(2);
		expect(track.clips[0].name).toBe('foo');
		expect(track.clips[0].start.frames).toBe(50);
		expect(track.clips[0].stop.frames).toBe(60);
		// start of the second clip -1ms, otherwise clips would overlap
		expect(track.clips[0].stop.millis).toBe(1999);
	});

	it('should create a copy of the object', () => {
		clip.state = 'ATTACHED';
		clip.set({
			name: 'Hello World',
			start: 20,
			stop: 80,
			disabled: true,
		});

		const copy = clip.copy();

		expect(copy.name).toBe('Hello World');
		expect(copy.start.frames).toBe(20);
		expect(copy.stop.frames).toBe(80);
		expect(copy.disabled).toBe(true);
		expect(copy.state).not.toBe(clip.state);
		expect(copy.id).not.toBe(clip.id);
		expect(copy.track).not.toBeDefined();
	});
});

describe('Split tests - the Clip object', () => {
	it('should split the clip into two at a specified time', async () => {
		const clip = new Clip({
			name: 'foo',
			start: new Timestamp(1000),
			stop: new Timestamp(5000),
		});
		const track = new Track();

		await track.add(clip);

		// add a second one after
		await track.add(new Clip({
			start: new Timestamp(5001),
			stop: new Timestamp(6000)
		}));

		// add a third one befor
		await track.add(new Clip({
			start: new Timestamp(100),
			stop: new Timestamp(999)
		}));

		expect(track.start.millis).toBe(100);
		expect(track.stop.millis).toBe(6000);
		expect(track.clips.length).toBe(3);

		await clip.split(new Timestamp(3500));

		expect(track.start.millis).toBe(100);
		expect(track.stop.millis).toBe(6000);
		expect(track.clips.length).toBe(4);

		expect(track.clips[1].name).toBe('foo');
		expect(track.clips[1].start.millis).toBe(1000);
		expect(track.clips[1].stop.millis).toBe(3500);

		expect(track.clips[2].name).toBe('foo');
		expect(track.clips[2].start.millis).toBe(3501);
		expect(track.clips[2].stop.millis).toBe(5000);
	});

	it('should split the clip into two at the current time', async () => {
		const clip = new Clip({
			name: 'foo',
			start: new Timestamp(1000),
			stop: new Timestamp(5000),
		});
		const comp = new Composition();
		const track = comp.createTrack('base');
		await track.add(clip);

		comp.frame = new Timestamp(2700).frames;

		await clip.split();

		expect(track.start.millis).toBe(1000);
		expect(track.stop.millis).toBe(5000);
		expect(track.clips.length).toBe(2);

		expect(track.clips[0].name).toBe('foo');
		expect(track.clips[0].start.millis).toBe(1000);
		expect(track.clips[0].stop.millis).toBe(2700);

		expect(track.clips[1].name).toBe('foo');
		expect(track.clips[1].start.millis).toBe(2701);
		expect(track.clips[1].stop.millis).toBe(5000);
	});

	it('should not split the clip when an invalid time is provided', async () => {
		const clip = new Clip({
			name: 'foo',
			start: new Timestamp(1000),
			stop: new Timestamp(5000),
		});

		await new Track().add(clip);

		await expect(() => clip.split(new Timestamp(1000))).rejects.toThrowError();
		await expect(() => clip.split(new Timestamp(5000))).rejects.toThrowError();
		// not connected to the composition
		await expect(() => clip.split()).rejects.toThrowError();
	});

	it('should not split the clip when no track is provided', async () => {
		const clip = new Clip({
			name: 'foo',
			start: new Timestamp(1000),
			stop: new Timestamp(5000),
		});

		await expect(() => clip.split(new Timestamp(3000))).rejects.toThrowError();
	});
});
