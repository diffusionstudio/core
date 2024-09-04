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

	it('should propagate a seek call', async () => {
		const clip = new MediaClip();
		clip.element = new Audio();
		clip.duration.seconds = 60;
		clip.state = 'READY';
		await track.add(clip);
		expect(track.clips.length).toBe(1);
		const seekSpy = vi.spyOn(clip, 'seek').mockImplementation(async (_) => { });
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
