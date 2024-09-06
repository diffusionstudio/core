/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Composition } from '../../composition';
import { Clip } from '../../clips';
import { Track } from './track';
import { Timestamp } from '../../models';

describe('The Track Object', () => {
	let comp: Composition;
	let track: Track<Clip>;
	const updateMock = vi.fn();

	beforeEach(() => {
		updateMock.mockClear();
		// frame and seconds are the same
		comp = new Composition();
		track = comp.createTrack('base');
		track.on('update', updateMock);
	});

	it('should have a certain initial state', () => {
		expect(track.id.length).toBe(36);
		expect(track.composition).toBeDefined();
		expect(track.clips.length).toBe(0);
		expect(track.pointer).toBe(0);
		expect(track.strategy.mode).toBe('DEFAULT');

		track.trigger('update', undefined);
		expect(updateMock).toBeCalledTimes(1);
	});

	it('should be able to add clips', async () => {
		await track.add(new Clip().set({ stop: 5, start: 0 }));
		expect(track.clips.length).toBe(1);
		expect(track.start.frames).toBe(0);
		expect(track.stop.frames).toBe(5);

		await track.add(new Clip().set({ stop: 12, start: 9 }));
		expect(track.clips.length).toBe(2);
		expect(track.start.frames).toBe(0);
		expect(track.stop.frames).toBe(12);
		expect(track.clips.at(0)?.stop.frames).toBe(5);

		await track.add(new Clip().set({ stop: 8, start: 6 }));
		expect(track.clips.length).toBe(3);

		expect(track.start.frames).toBe(0);
		expect(track.stop.frames).toBe(12);
		expect(track.clips.at(0)?.stop.frames).toBe(5);
		expect(track.clips.at(1)?.stop.frames).toBe(8);
		expect(track.clips.at(2)?.stop.frames).toBe(12);
	});

	it('should snap the clip when it overlaps with the end of another clip', async () => {
		const clip0 = new Clip().set({ stop: 20, start: 0 });
		const clip1 = new Clip().set({ stop: 30, start: 11 });
		await track.add(clip0);
		await track.add(clip1);

		expect(track.clips.length).toBe(2);

		expect(track.clips.at(0)?.id).toBe(clip0.id);
		expect(track.clips.at(1)?.id).toBe(clip1.id);

		expect(track.clips.at(0)?.start.frames).toBe(0);
		expect(track.clips.at(0)?.stop.frames).toBe(20);
		expect(track.clips.at(0)?.stop.millis).toBe(667);

		expect(track.clips.at(1)?.start.millis).toBe(668);
		expect(track.clips.at(1)?.start.frames).toBe(20);
		expect(track.clips.at(1)?.stop.frames).toBe(30);
	});

	it('should snap the clip when it overlaps with the start of another clip', async () => {
		const clip0 = new Clip().set({ stop: 30, start: 10 });
		const clip1 = new Clip().set({ stop: 19, start: 0 });
		await track.add(clip0);
		await track.add(clip1);

		expect(track.clips.length).toBe(2);

		expect(track.clips.at(0)?.id).toBe(clip1.id);
		expect(track.clips.at(1)?.id).toBe(clip0.id);

		expect(track.clips.at(0)?.start.frames).toBe(0);
		expect(track.clips.at(0)?.stop.frames).toBe(10);
		expect(track.clips.at(0)?.stop.millis).toBe(332);

		expect(track.clips.at(1)?.start.millis).toBe(333);
		expect(track.clips.at(1)?.start.frames).toBe(10);
		expect(track.clips.at(1)?.stop.frames).toBe(30);
	});

	it('should snap the clip when it overlaps with the start and end another clips', async () => {
		const clip0 = new Clip().set({ stop: 30, start: 17 });
		const clip1 = new Clip().set({ stop: 13, start: 0 });
		const clip2 = new Clip().set({ stop: 20, start: 10 });

		await track.add(clip0);
		await track.add(clip1);
		await track.add(clip2);

		expect(track.clips.length).toBe(3);

		expect(track.clips.at(0)?.id).toBe(clip1.id);
		expect(track.clips.at(1)?.id).toBe(clip2.id);
		expect(track.clips.at(2)?.id).toBe(clip0.id);

		expect(track.clips.at(0)?.start.frames).toBe(0);
		expect(track.clips.at(0)?.stop.frames).toBe(13);
		expect(track.clips.at(0)?.stop.millis).toBe(433);

		expect(track.clips.at(1)?.start.millis).toBe(434);
		expect(track.clips.at(1)?.start.frames).toBe(13);
		expect(track.clips.at(1)?.stop.frames).toBe(17);
		expect(track.clips.at(1)?.stop.millis).toBe(566);

		expect(track.clips.at(2)?.start.millis).toBe(567);
		expect(track.clips.at(2)?.start.frames).toBe(17);
		expect(track.clips.at(2)?.stop.frames).toBe(30);
	});

	it('should stack clips if the option is active', async () => {
		track.stacked();
		await track.add(new Clip().set({ stop: 9, start: 0 }));
		await track.add(new Clip().set({ stop: 45, start: 30 }));

		expect(track.clips.at(0)?.start.frames).toBe(0);
		expect(track.clips.at(0)?.stop.frames).toBe(9);
		expect(track.clips.at(0)?.stop.millis).toBe(300);

		expect(track.clips.at(1)?.start.millis).toBe(301);
		expect(track.clips.at(1)?.start.frames).toBe(9);
		expect(track.clips.at(1)?.stop.frames).toBe(24);
		expect(track.clips.at(1)?.stop.millis).toBe(801);

		await track.add(new Clip().set({ stop: 50, start: 40 }));
		expect(track.clips.at(2)?.start.millis).toBe(802);
		expect(track.clips.at(2)?.start.frames).toBe(24);
		expect(track.clips.at(2)?.stop.frames).toBe(34);
	});

	it('should render the clips correctly', async () => {
		const clip0 = new Clip().set({ stop: 9, start: 3 });
		const updateSpy0 = vi.spyOn(clip0, 'update');

		const clip1 = new Clip().set({ stop: 14, start: 10 });
		const updateSpy1 = vi.spyOn(clip1, 'update');

		const clip2 = new Clip().set({ stop: 26, start: 20 });
		const updateSpy2 = vi.spyOn(clip2, 'update');

		await track.add(clip0);
		await track.add(clip1);
		await track.add(clip2);

		track.update(new Timestamp());

		expect(track.pointer).toBe(0);
		expect(updateSpy0).not.toHaveBeenCalled();
		expect(updateSpy1).not.toHaveBeenCalled();
		expect(updateSpy2).not.toHaveBeenCalled();

		track.update(Timestamp.fromFrames(3));
		expect(track.pointer).toBe(0);
		expect(updateSpy0).toHaveBeenCalledTimes(1);
		expect(updateSpy1).not.toHaveBeenCalled();
		expect(updateSpy2).not.toHaveBeenCalled();
		updateSpy0.mockClear();

		track.update(Timestamp.fromFrames(10));
		expect(track.pointer).toBe(1);
		expect(updateSpy0).not.toHaveBeenCalled();
		expect(updateSpy1).toHaveBeenCalledTimes(1);
		expect(updateSpy2).not.toHaveBeenCalled();
		updateSpy1.mockClear();

		expect(track.pointer).toBe(1);
		track.update(Timestamp.fromFrames(18));
		expect(track.pointer).toBe(2);
		expect(updateSpy0).not.toHaveBeenCalled();
		expect(updateSpy1).not.toHaveBeenCalled();
		expect(updateSpy2).not.toHaveBeenCalled();

		track.update(Timestamp.fromFrames(18));
		expect(track.pointer).toBe(2);
		expect(updateSpy0).not.toHaveBeenCalled();
		expect(updateSpy1).not.toHaveBeenCalled();
		expect(updateSpy2).not.toHaveBeenCalled();

		track.update(Timestamp.fromFrames(28));
		expect(track.pointer).toBe(2);
		expect(updateSpy0).not.toHaveBeenCalled();
		expect(updateSpy1).not.toHaveBeenCalled();
		expect(updateSpy2).not.toHaveBeenCalled();
	});

	it('should be able to detach clips', () => {
		const comp1 = new Composition();
		const track1 = comp1.createTrack('base');

		expect(comp1.stage.children.length).toBe(1);

		const detachFn = vi.fn();
		track1.on('detach', detachFn);
		track1.detach();
		expect(comp1.tracks.findIndex((l) => l.id == track1.id)).toBe(-1);
		expect(detachFn).toBeCalledTimes(1);
		expect(comp1.stage.children.length).toBe(0);
	});

	it('should realign the clips when stacked', async () => {
		track.stacked();

		const clip0 = new Clip().set({ stop: 9, start: 0 });
		const clip1 = new Clip().set({ stop: 45, start: 30 });

		await track.add(clip0);
		await track.add(clip1);
		await track.add(new Clip().set({ stop: 50, start: 40 }));

		expect(track.clips.at(0)?.start.frames).toBe(0);
		expect(track.clips.at(0)?.stop.frames).toBe(9);
		expect(track.clips.at(0)?.stop.millis).toBe(300);

		expect(track.clips.at(1)?.start.millis).toBe(301);
		expect(track.clips.at(1)?.start.frames).toBe(9);
		expect(track.clips.at(1)?.stop.frames).toBe(24);
		expect(track.clips.at(1)?.stop.millis).toBe(801);

		expect(track.clips.at(2)?.start.millis).toBe(802);
		expect(track.clips.at(2)?.start.frames).toBe(24);
		expect(track.clips.at(2)?.stop.frames).toBe(34);

		clip1.detach();

		expect(track.clips.at(0)?.start.frames).toBe(0);
		expect(track.clips.at(0)?.stop.frames).toBe(9);
		expect(track.clips.at(0)?.stop.millis).toBe(300);

		expect(track.clips.at(1)?.start.millis).toBe(301);
		expect(track.clips.at(1)?.start.frames).toBe(9);
		expect(track.clips.at(1)?.stop.frames).toBe(19);

		clip0.detach();

		expect(track.clips.at(0)?.start.frames).toBe(0);
		expect(track.clips.at(0)?.stop.frames).toBe(10);
	});

	it('should be be able to add a base clip with offset', async () => {
		const clip = new Clip().set({ stop: 30 });

		await track.add(clip.offsetBy(60));

		expect(track.clips.at(0)?.start.frames).toBe(60);
		expect(track.clips.at(0)?.stop.frames).toBe(90);
	});

	it('should be be able to add a base clip with offset', async () => {
		const clip = new Clip().set({ stop: 30 });

		await track.add(clip.offsetBy(60));

		expect(track.clips.at(0)?.start.frames).toBe(60);
		expect(track.clips.at(0)?.stop.frames).toBe(90);
	});

	it('should intialize and connect clips', async () => {
		const clip = new Clip();

		const connectFn = vi.spyOn(clip, 'connect');
		const initFn = vi.spyOn(clip, 'init');

		await track.add(clip);

		expect(connectFn).toHaveBeenCalledTimes(1);
		expect(connectFn.mock.calls[0][0]).toBeInstanceOf(Track);
		expect(initFn).toHaveBeenCalledTimes(1);
	});

	it('should handle the clip lifecycle', async () => {
		const clip = new Clip({ start: 12, stop: 21 });

		const enterFn = vi.spyOn(clip, 'enter');
		const updateFn = vi.spyOn(clip, 'update');
		const exitFn = vi.spyOn(clip, 'exit');

		await track.add(clip);

		track.update(Timestamp.fromFrames(8));

		expect(track.view.children.length).toBe(0);
		expect(enterFn).toHaveBeenCalledTimes(0);
		expect(updateFn).toHaveBeenCalledTimes(0);
		expect(exitFn).toHaveBeenCalledTimes(0);

		track.update(Timestamp.fromFrames(12));

		expect(track.view.children.length).toBe(1);
		expect(enterFn).toHaveBeenCalledTimes(1);
		expect(updateFn).toHaveBeenCalledTimes(1);
		expect(exitFn).toHaveBeenCalledTimes(0);

		track.update(Timestamp.fromFrames(18));

		expect(enterFn).toHaveBeenCalledTimes(1);
		expect(updateFn).toHaveBeenCalledTimes(2);
		expect(exitFn).toHaveBeenCalledTimes(0);

		track.update(Timestamp.fromFrames(21));

		expect(enterFn).toHaveBeenCalledTimes(1);
		expect(updateFn).toHaveBeenCalledTimes(3);
		expect(exitFn).toHaveBeenCalledTimes(0);

		track.update(Timestamp.fromFrames(22));

		expect(track.view.children.length).toBe(0);
		expect(enterFn).toHaveBeenCalledTimes(1);
		expect(updateFn).toHaveBeenCalledTimes(3);
		expect(exitFn).toHaveBeenCalledTimes(1);
	});

	it('should not update disabled clips', async () => {
		const clip = new Clip({ start: 12, stop: 21, disabled: true });

		const enterFn = vi.spyOn(clip, 'enter');
		const updateFn = vi.spyOn(clip, 'update');
		const exitFn = vi.spyOn(clip, 'exit');

		await track.add(clip);

		track.update(Timestamp.fromFrames(12));

		expect(track.view.children.length).toBe(0);
		expect(enterFn).toHaveBeenCalledTimes(0);
		expect(updateFn).toHaveBeenCalledTimes(0);
		expect(exitFn).toHaveBeenCalledTimes(0);
	});

	it('should remove disabled clip from view', async () => {
		const clip = new Clip({ start: 12, stop: 21 });

		const enterFn = vi.spyOn(clip, 'enter');
		const updateFn = vi.spyOn(clip, 'update');
		const exitFn = vi.spyOn(clip, 'exit');

		await track.add(clip);

		track.update(Timestamp.fromFrames(12));

		expect(track.view.children.length).toBe(1);
		expect(enterFn).toHaveBeenCalledTimes(1);
		expect(updateFn).toHaveBeenCalledTimes(1);
		expect(exitFn).toHaveBeenCalledTimes(0);

		clip.set({ disabled: true });

		track.update(Timestamp.fromFrames(13));

		expect(track.view.children.length).toBe(0);
		expect(enterFn).toHaveBeenCalledTimes(1);
		expect(updateFn).toHaveBeenCalledTimes(1);
		expect(exitFn).toHaveBeenCalledTimes(1);
	});
});
