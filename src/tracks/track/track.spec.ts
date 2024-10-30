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
		await track.add(new Clip({ stop: 5, start: 0 }));
		expect(track.clips.length).toBe(1);
		expect(track.start.frames).toBe(0);
		expect(track.stop.frames).toBe(5);

		await track.add(new Clip({ stop: 12, start: 9 }));
		expect(track.clips.length).toBe(2);
		expect(track.start.frames).toBe(0);
		expect(track.stop.frames).toBe(12);
		expect(track.clips.at(0)?.stop.frames).toBe(5);

		await track.add(new Clip({ stop: 8, start: 6 }));
		expect(track.clips.length).toBe(3);

		expect(track.start.frames).toBe(0);
		expect(track.stop.frames).toBe(12);
		expect(track.clips.at(0)?.stop.frames).toBe(5);
		expect(track.clips.at(1)?.stop.frames).toBe(8);
		expect(track.clips.at(2)?.stop.frames).toBe(12);
	});

	it('should be able to add clips at an index, if stacked', async () => {
		track.stacked();

		await track.add(new Clip({ stop: 10, start: 0 }));
		await track.add(new Clip({ stop: 10, start: 0 }));
		await track.add(new Clip({ stop: 10, start: 0 }));

		expect(track.clips.length).toBe(3);
		expect(track.start.frames).toBe(0);
		expect(track.stop.frames).toBe(30);

		await track.add(new Clip({ stop: 2, start: 0 }), 1);

		expect(track.clips[0].start.frames).toBe(0);
		expect(track.clips[0].stop.frames).toBe(10);

		expect(track.clips[1].start.frames).toBe(10);
		expect(track.clips[1].stop.frames).toBe(12);

		expect(track.clips[2].start.frames).toBe(12);
		expect(track.clips[2].stop.frames).toBe(22);

		await track.add(new Clip({ stop: 15, start: 10 }), 4);

		expect(track.clips[0].start.frames).toBe(0);
		expect(track.clips[0].stop.frames).toBe(10);
		
		expect(track.clips[4].start.frames).toBe(32);
		expect(track.clips[4].stop.frames).toBe(37);

		await track.clips[0].split(5);

		expect(track.clips[0].start.frames).toBe(0);
		expect(track.clips[0].stop.frames).toBe(5);

		expect(track.clips[1].start.frames).toBe(5);
		expect(track.clips[1].stop.frames).toBe(10);

		await track.add(new Clip({ stop: 17, start: 3, name: 'abc' }), 0);

		expect(track.clips[0].start.frames).toBe(0);
		expect(track.clips[0].stop.frames).toBe(14);
		expect(track.clips[0].name).toBe('abc');

		expect(track.clips[1].start.frames).toBe(14);
		expect(track.clips[1].stop.frames).toBe(19);
	});

	it('should snap the clip when it overlaps with the end of another clip', async () => {
		const clip0 = new Clip({ stop: 20, start: 0 });
		const clip1 = new Clip({ stop: 30, start: 11 });
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
		const clip0 = new Clip({ stop: 30, start: 10 });
		const clip1 = new Clip({ stop: 19, start: 0 });
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
		const clip0 = new Clip({ stop: 30, start: 17 });
		const clip1 = new Clip({ stop: 13, start: 0 });
		const clip2 = new Clip({ stop: 20, start: 10 });

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
		await track.add(new Clip({ stop: 9, start: 0 }));
		await track.add(new Clip({ stop: 45, start: 30 }));

		expect(track.clips.at(0)?.start.frames).toBe(0);
		expect(track.clips.at(0)?.stop.frames).toBe(9);
		expect(track.clips.at(0)?.stop.millis).toBe(300);

		expect(track.clips.at(1)?.start.millis).toBe(301);
		expect(track.clips.at(1)?.start.frames).toBe(9);
		expect(track.clips.at(1)?.stop.frames).toBe(24);
		expect(track.clips.at(1)?.stop.millis).toBe(801);

		await track.add(new Clip({ stop: 50, start: 40 }));
		expect(track.clips.at(2)?.start.millis).toBe(802);
		expect(track.clips.at(2)?.start.frames).toBe(24);
		expect(track.clips.at(2)?.stop.frames).toBe(34);
	});

	it('should render the clips correctly', async () => {
		const clip0 = new Clip({ stop: 9, start: 3 });
		const updateSpy0 = vi.spyOn(clip0, 'update');

		const clip1 = new Clip({ stop: 14, start: 10 });
		const updateSpy1 = vi.spyOn(clip1, 'update');

		const clip2 = new Clip({ stop: 26, start: 20 });
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

	it('should be able to detach itself from the composition', () => {
		const comp1 = new Composition();
		const track1 = comp1.createTrack('base');

		expect(comp1.stage.children.length).toBe(1);

		track1.detach();
		expect(comp1.tracks.findIndex((l) => l.id == track1.id)).toBe(-1);
		expect(comp1.stage.children.length).toBe(0);
	});

	it('should be remove clips from the track', async () => {
		const clip0 = new Clip({ stop: 300 });
		const clip1 = new Clip({ stop: 600, start: 300 });

		const composition = new Composition();
		const track = composition.createTrack('base');

		await track.add(clip0);
		await track.add(clip1);

		expect(track.clips.length).toBe(2);

		composition.computeFrame();

		// clip is currently getting rendered
		expect(track.view.children.length).toBe(1);

		const detachFn = vi.fn();
		track.on('detach', detachFn);

		track.remove(clip0);

		expect(track.clips.length).toBe(1);
		expect(track.clips.findIndex((n) => n.id == clip0.id)).toBe(-1);
		expect(track.clips.findIndex((n) => n.id == clip1.id)).toBe(0);

		expect(clip0.state).toBe('READY');
		expect(clip1.state).toBe('ATTACHED');

		expect(detachFn).toBeCalledTimes(1);
		expect(track.view.children.length).toBe(0);

		// try again
		track.remove(clip0);
		expect(clip0.state).toBe('READY');
		expect(detachFn).toBeCalledTimes(1);
		expect(track.clips.length).toBe(1);
	});

	it('should realign the clips when stacked', async () => {
		track.stacked();

		const clip0 = new Clip({ stop: 9, start: 0 });
		const clip1 = new Clip({ stop: 45, start: 30 });

		await track.add(clip0);
		await track.add(clip1);
		await track.add(new Clip({ stop: 50, start: 40 }));

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

	it('should switch from stack to default', async () => {
		track.stacked();

		await track.add(new Clip({ stop: 12}));
		await track.add(new Clip({ stop: 24}));

		expect(track.clips.length).toBe(2);
		expect(track.stop.frames).toBe(36);

		track.stacked(false);

		// should not be realigned
		await track.add(new Clip({ start: 72, stop: 99 }));

		expect(track.stop.frames).toBe(99);
	});

	it('should apply values to all clips', async () => {
		track.stacked();

		await track.add(new Clip({ stop: 12}));
		await track.add(new Clip({ stop: 24}));
		
		track.apply(clip => clip.set({ name: 'foo' }));

		expect(track.clips[0].name).toBe('foo');
		expect(track.clips[1].name).toBe('foo');
	});

	it('should offset all clips by a given frame numer', async () => {
		await track.add(new Clip({ start: 6, stop: 12}));
		await track.add(new Clip({ start: 15, stop: 24}));
		
		track.offsetBy(6);

		expect(track.clips[0].start.frames).toBe(12);
		expect(track.clips[0].stop.frames).toBe(18);

		expect(track.clips[1].start.frames).toBe(21);
		expect(track.clips[1].stop.frames).toBe(30);
	});

	it('should be be able to add a base clip with offset', async () => {
		const clip = new Clip({ stop: 30 });

		await track.add(clip.offsetBy(60));

		expect(track.clips.at(0)?.start.frames).toBe(60);
		expect(track.clips.at(0)?.stop.frames).toBe(90);
	});

	it('should be be able to add a base clip with offset', async () => {
		const clip = new Clip({ stop: 30 });

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

	it('should remove the visible clip when disabled changes', async () => {
		const clip = await track.add(new Clip());

		const exitSpy = vi.spyOn(clip, 'exit');
		const computeFrameSpy = vi.spyOn(comp, 'computeFrame');
		expect(updateMock).toBeCalledTimes(0);
		expect(computeFrameSpy).toBeCalledTimes(0);
		expect(track.disabled).toBe(false);
		expect(track.view.children.length).toBe(1);

		track.disabled = true;

		expect(updateMock).toBeCalledTimes(1);
		expect(computeFrameSpy).toBeCalledTimes(1);
		expect(exitSpy).toBeCalledTimes(1);
		expect(track.view.children.length).toBe(0);
		expect(track.disabled).toBe(true);

		track.disabled = false;

		expect(updateMock).toBeCalledTimes(2);
		expect(computeFrameSpy).toBeCalledTimes(2);
		expect(track.view.children.length).toBe(1);
		expect(track.disabled).toBe(false);
	});
});

describe("The Track Object's layers method", () => {
	let composition: Composition;
	let track0: Track<Clip>;
	let track1: Track<Clip>;
	let track2: Track<Clip>;
	let track3: Track<Clip>;

	beforeEach(() => {
		composition = new Composition();
		track0 = composition.createTrack('base');
		track1 = composition.createTrack('base');
		track2 = composition.createTrack('base');
		track3 = composition.createTrack('base');

		expect(composition.tracks.length).toBe(4);

		// [tack3, track2, track1, track0]
		// [view0, view1, view2, view3]

		expect(composition.tracks[0].id).toBe(track3.id);
		expect(composition.tracks[1].id).toBe(track2.id);
		expect(composition.tracks[2].id).toBe(track1.id);
		expect(composition.tracks[3].id).toBe(track0.id);

		expect(composition.stage.children[0].uid).toBe(track0.view.uid);
		expect(composition.stage.children[1].uid).toBe(track1.view.uid);
		expect(composition.stage.children[2].uid).toBe(track2.view.uid);
		expect(composition.stage.children[3].uid).toBe(track3.view.uid);
	});

	it("should have a 'top' argument", () => {
		track2.layer('top');

		// [track2, tack3, track1, track0]
		// [view0, view1, view3, view2]

		expect(composition.tracks[0].id).toBe(track2.id);
		expect(composition.tracks[1].id).toBe(track3.id);
		expect(composition.tracks[2].id).toBe(track1.id);
		expect(composition.tracks[3].id).toBe(track0.id);

		expect(composition.stage.children[0].uid).toBe(track0.view.uid);
		expect(composition.stage.children[1].uid).toBe(track1.view.uid);
		expect(composition.stage.children[2].uid).toBe(track3.view.uid);
		expect(composition.stage.children[3].uid).toBe(track2.view.uid);
	});

	it("should have a 'bottom' argument", () => {
		track2.layer('bottom');

		// [tack3, track1, track0, track2]
		// [view2, view0, view1, view3]

		expect(composition.tracks[0].id).toBe(track3.id);
		expect(composition.tracks[1].id).toBe(track1.id);
		expect(composition.tracks[2].id).toBe(track0.id);
		expect(composition.tracks[3].id).toBe(track2.id);

		expect(composition.stage.children[0].uid).toBe(track2.view.uid);
		expect(composition.stage.children[1].uid).toBe(track0.view.uid);
		expect(composition.stage.children[2].uid).toBe(track1.view.uid);
		expect(composition.stage.children[3].uid).toBe(track3.view.uid);
	});

	it("should accept a valid index", () => {
		track3.layer(2);

		// [track2, track1, tack3, track0]
		// [view0, view3, view1, view2]

		expect(composition.tracks[0].id).toBe(track2.id);
		expect(composition.tracks[1].id).toBe(track1.id);
		expect(composition.tracks[2].id).toBe(track3.id);
		expect(composition.tracks[3].id).toBe(track0.id);

		expect(composition.stage.children[0].uid).toBe(track0.view.uid);
		expect(composition.stage.children[1].uid).toBe(track3.view.uid);
		expect(composition.stage.children[2].uid).toBe(track1.view.uid);
		expect(composition.stage.children[3].uid).toBe(track2.view.uid);
	});

	it("should accept invalid indexes", () => {
		track2.layer(-5);

		// [track2, tack3, track1, track0]
		// [view0, view1, view3, view2]

		expect(composition.tracks[0].id).toBe(track2.id);
		expect(composition.tracks[1].id).toBe(track3.id);
		expect(composition.tracks[2].id).toBe(track1.id);
		expect(composition.tracks[3].id).toBe(track0.id);

		expect(composition.stage.children[0].uid).toBe(track0.view.uid);
		expect(composition.stage.children[1].uid).toBe(track1.view.uid);
		expect(composition.stage.children[2].uid).toBe(track3.view.uid);
		expect(composition.stage.children[3].uid).toBe(track2.view.uid);


		track3.layer(6);

		// [track2, track1, track0, tack3]
		// [view3, view0, view1, view2]

		expect(composition.tracks[0].id).toBe(track2.id);
		expect(composition.tracks[1].id).toBe(track1.id);
		expect(composition.tracks[2].id).toBe(track0.id);
		expect(composition.tracks[3].id).toBe(track3.id);

		expect(composition.stage.children[0].uid).toBe(track3.view.uid);
		expect(composition.stage.children[1].uid).toBe(track0.view.uid);
		expect(composition.stage.children[2].uid).toBe(track1.view.uid);
		expect(composition.stage.children[3].uid).toBe(track2.view.uid);
	});

	it("should work properly with 1 and 2 tracks", () => {
		composition.removeTrack(track3);
		composition.removeTrack(track2);
		expect(composition.tracks.length).toBe(2);

		// [track1, track0]
		// [view0, view1]

		expect(composition.tracks[0].id).toBe(track1.id);
		expect(composition.tracks[1].id).toBe(track0.id);

		expect(composition.stage.children[0].uid).toBe(track0.view.uid);
		expect(composition.stage.children[1].uid).toBe(track1.view.uid);

		track0.layer('top');

		// [track0, track1]
		// [view1, view0]

		expect(composition.tracks[0].id).toBe(track0.id);
		expect(composition.tracks[1].id).toBe(track1.id);

		expect(composition.stage.children[0].uid).toBe(track1.view.uid);
		expect(composition.stage.children[1].uid).toBe(track0.view.uid);

		track1.layer(0);

		// [track1, track0]
		// [view0, view1]

		expect(composition.tracks[0].id).toBe(track1.id);
		expect(composition.tracks[1].id).toBe(track0.id);

		expect(composition.stage.children[0].uid).toBe(track0.view.uid);
		expect(composition.stage.children[1].uid).toBe(track1.view.uid);

		composition.removeTrack(track0);

		expect(composition.tracks.length).toBe(1);
		expect(composition.stage.children.length).toBe(1);

		// [track1]
		// [view1]

		expect(composition.tracks[0].id).toBe(track1.id);
		expect(composition.stage.children[0].uid).toBe(track1.view.uid);

		track1.layer('top');

		expect(composition.tracks[0].id).toBe(track1.id);
		expect(composition.stage.children[0].uid).toBe(track1.view.uid);
	});
});
