/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Composition } from '../../composition';
import { MediaClip } from '../../clips';
import { Timestamp } from '../../models';
import { MediaTrack } from './media';
import { AudioSource } from '../../sources';

class MockMediaClip extends MediaClip {
	constructor(range: [Timestamp, Timestamp], silences: { start: Timestamp, stop: Timestamp }[], element: HTMLMediaElement) {
		super();
		this.duration.millis = range[1].millis - range[0].millis;
		this.range = range;
		this.source = {
			silences: async () => silences,
		} as any as AudioSource;
		this.element = element;
	}
}

describe('The Media Track Object', () => {
	let comp: Composition;
	let track: MediaTrack<MediaClip>;
	const updateMock = vi.fn();

	beforeEach(() => {
		// frame and seconds are the same
		comp = new Composition();
		track = comp.shiftTrack(new MediaTrack<MediaClip>());
		track.on('update', updateMock);
	});

	it('ignores no silences', async () => {
		const clip = new MockMediaClip([new Timestamp(10000), new Timestamp(20000)], [], new Audio());
		clip.duration.frames = 30;
		await track.add(clip);
		await track.removeSilences();
		expect(track.clips.length).toBe(1);
	});

	it('ignores not applicable silences', async () => {
		const clip = new MockMediaClip([new Timestamp(10000), new Timestamp(20000)], [
			{
				start: new Timestamp(0),
				stop: new Timestamp(500),
			},
			{
				start: new Timestamp(30000),
				stop: new Timestamp(30500),
			},
		], new Audio());
		await track.add(clip);
		expect(clip.source).toBeDefined();
		await track.removeSilences();
		expect(track.clips.length).toBe(1);
		expect(track.clips.at(0)).toBe(clip);
		expect(track.clips.at(0)?.state).toBe('ATTACHED');
	});

	it('removes silences', async () => {
		const clip = new MockMediaClip([new Timestamp(10000), new Timestamp(20000)], [
			{
				start: new Timestamp(0),
				stop: new Timestamp(10050),
			},
			{
				start: new Timestamp(11000),
				stop: new Timestamp(15000),
			},
			{
				start: new Timestamp(19000),
				stop: new Timestamp(30500),
			},
		], new Audio());
		await track.add(clip);
		expect(clip.source).toBeDefined();
		await track.removeSilences();
		expect(track.clips.length).toBe(2);
		expect(track.clips.at(0)?.range[0].millis).toBe(10050);
		expect(track.clips.at(0)?.range[1].millis).toBe(11000);
		expect(track.clips.at(1)?.range[0].millis).toBe(15000);
		expect(track.clips.at(1)?.range[1].millis).toBe(19000);
		expect(track.clips.at(0)?.state).toBe('ATTACHED');
		expect(track.clips.at(1)?.state).toBe('ATTACHED');
	});

	it('removes silences twice', async () => {
		const clip = new MockMediaClip([new Timestamp(10000), new Timestamp(20000)], [
			{
				start: new Timestamp(0),
				stop: new Timestamp(500),
			},
			{
				start: new Timestamp(11000),
				stop: new Timestamp(15000),
			},
			{
				start: new Timestamp(19000),
				stop: new Timestamp(30500),
			},
		], new Audio());
		await track.add(clip);
		expect(clip.source).toBeDefined();
		await track.removeSilences();
		await track.removeSilences();
		expect(track.clips.length).toBe(2);
		expect(track.clips.at(0)?.id).not.toBe(clip.id);
		expect(track.clips.at(0)?.range[0].millis).toBe(10000);
		expect(track.clips.at(0)?.range[1].millis).toBe(11000);
		expect(track.clips.at(1)?.range[0].millis).toBe(15000);
		expect(track.clips.at(1)?.range[1].millis).toBe(19000);
		expect(track.clips.at(0)?.state).toBe('ATTACHED');
		expect(track.clips.at(1)?.state).toBe('ATTACHED');
	});

	it('should propagate a seek call', async () => {
		const clip = new MediaClip();
		clip.element = new Audio();
		clip.duration.seconds = 60;
		clip.state = 'READY';
		await track.add(clip);
		expect(track.clips.length).toBe(1);
		const seekSpy = vi.spyOn(clip, 'seek').mockImplementation(async (_) => {});
		track.seek(Timestamp.fromFrames(5));
		expect(seekSpy).toBeCalledTimes(1);
	});

	it('should be be able to add a media clip with offset', async () => {
		const clip = new MediaClip();
		clip.duration.frames = 30;

		expect(clip.duration.frames).toBe(30);
		expect(clip.start.frames).toBe(0);
		expect(clip.offset.frames).toBe(0);
		expect(clip.stop.frames).toBe(30);

		clip.state = 'READY';
		await track.add(clip.offsetBy(60));

		expect(track.clips.at(0)?.start.frames).toBe(60);
		expect(track.clips.at(0)?.stop.frames).toBe(90);
		expect(track.clips.at(0)?.offset.frames).toBe(60);
		expect(track.clips.at(0)?.duration.frames).toBe(30);
	});
});
