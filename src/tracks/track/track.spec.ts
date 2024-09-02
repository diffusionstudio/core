/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WebGPURenderer } from 'pixi.js';
import { Composition } from '../../composition';
import { Clip } from '../../clips';
import { Track } from './track';
import type { frame } from '../../types';
import { framesToMillis } from '../../models';

const renderer = new WebGPURenderer();

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

	it('should have a functional insertClip method', async () => {
		await track.add(new Clip().set({ stop: <frame>5, start: <frame>0 }));
		expect(track.clips.length).toBe(1);
		expect(track.start.frames).toBe(0);
		expect(track.stop.frames).toBe(5);

		await track.add(new Clip().set({ stop: <frame>12, start: <frame>9 }));
		expect(track.clips.length).toBe(2);
		expect(track.start.frames).toBe(0);
		expect(track.stop.frames).toBe(12);
		expect(track.clips.at(0)?.stop.frames).toBe(5);

		await track.add(new Clip().set({ stop: <frame>8, start: <frame>6 }));
		expect(track.clips.length).toBe(3);

		expect(track.start.frames).toBe(0);
		expect(track.stop.frames).toBe(12);
		expect(track.clips.at(0)?.stop.frames).toBe(5);
		expect(track.clips.at(1)?.stop.frames).toBe(8);
		expect(track.clips.at(2)?.stop.frames).toBe(12);
	});

	it('should snap the clip when it overlaps with the end of another clip', async () => {
		const clip0 = new Clip().set({ stop: <frame>20, start: <frame>0 });
		const clip1 = new Clip().set({ stop: <frame>30, start: <frame>11 });
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
		const clip0 = new Clip().set({ stop: <frame>30, start: <frame>10 });
		const clip1 = new Clip().set({ stop: <frame>19, start: <frame>0 });
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
		const clip0 = new Clip().set({ stop: <frame>30, start: <frame>17 });
		const clip1 = new Clip().set({ stop: <frame>13, start: <frame>0 });
		const clip2 = new Clip().set({ stop: <frame>20, start: <frame>10 });

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
		await track.add(new Clip().set({ stop: <frame>9, start: <frame>0 }));
		await track.add(new Clip().set({ stop: <frame>45, start: <frame>30 }));

		expect(track.clips.at(0)?.start.frames).toBe(0);
		expect(track.clips.at(0)?.stop.frames).toBe(9);
		expect(track.clips.at(0)?.stop.millis).toBe(300);

		expect(track.clips.at(1)?.start.millis).toBe(301);
		expect(track.clips.at(1)?.start.frames).toBe(9);
		expect(track.clips.at(1)?.stop.frames).toBe(24);
		expect(track.clips.at(1)?.stop.millis).toBe(801);

		await track.add(new Clip().set({ stop: <frame>50, start: <frame>40 }));
		expect(track.clips.at(2)?.start.millis).toBe(802);
		expect(track.clips.at(2)?.start.frames).toBe(24);
		expect(track.clips.at(2)?.stop.frames).toBe(34);
	});

	it('should render the clips correctly', async () => {
		const clip0 = new Clip().set({ stop: <frame>9, start: <frame>3 });
		const renderSpy0 = vi.spyOn(clip0, 'render');

		const clip1 = new Clip().set({ stop: <frame>14, start: <frame>10 });
		const renderSpy1 = vi.spyOn(clip1, 'render');

		const clip2 = new Clip().set({ stop: <frame>26, start: <frame>20 });
		const renderSpy2 = vi.spyOn(clip2, 'render');

		await track.add(clip0);
		await track.add(clip1);
		await track.add(clip2);

		track.render(renderer, framesToMillis(<frame>0));

		expect(track.pointer).toBe(0);
		expect(renderSpy0).not.toHaveBeenCalled();
		expect(renderSpy1).not.toHaveBeenCalled();
		expect(renderSpy2).not.toHaveBeenCalled();

		track.render(renderer, framesToMillis(<frame>3));
		expect(track.pointer).toBe(0);
		expect(renderSpy0).toHaveBeenCalledTimes(1);
		expect(renderSpy1).not.toHaveBeenCalled();
		expect(renderSpy2).not.toHaveBeenCalled();
		renderSpy0.mockClear();

		track.render(renderer, framesToMillis(<frame>10));
		expect(track.pointer).toBe(1);
		expect(renderSpy0).not.toHaveBeenCalled();
		expect(renderSpy1).toHaveBeenCalledTimes(1);
		expect(renderSpy2).not.toHaveBeenCalled();
		renderSpy1.mockClear();

		expect(track.pointer).toBe(1);
		track.render(renderer, framesToMillis(<frame>18));
		expect(track.pointer).toBe(2);
		expect(renderSpy0).not.toHaveBeenCalled();
		expect(renderSpy1).not.toHaveBeenCalled();
		expect(renderSpy2).not.toHaveBeenCalled();

		track.render(renderer, framesToMillis(<frame>18));
		expect(track.pointer).toBe(2);
		expect(renderSpy0).not.toHaveBeenCalled();
		expect(renderSpy1).not.toHaveBeenCalled();
		expect(renderSpy2).not.toHaveBeenCalled();

		track.render(renderer, framesToMillis(<frame>28));
		expect(track.pointer).toBe(2);
		expect(renderSpy0).not.toHaveBeenCalled();
		expect(renderSpy1).not.toHaveBeenCalled();
		expect(renderSpy2).not.toHaveBeenCalled();
	});

	it('should be able to detach clips', () => {
		const comp1 = new Composition();
		const track1 = comp1.createTrack('base');
		const detachFn = vi.fn();
		track1.on('detach', detachFn);
		track1.detach();
		expect(comp1.tracks.findIndex((l) => l.id == track1.id)).toBe(-1);
		expect(detachFn).toBeCalledTimes(1);
	});

	it('should realign the clips when stacked', async () => {
		track.stacked();

		const clip0 = new Clip().set({ stop: <frame>9, start: <frame>0 });
		const clip1 = new Clip().set({ stop: <frame>45, start: <frame>30 });

		await track.add(clip0);
		await track.add(clip1);
		await track.add(new Clip().set({ stop: <frame>50, start: <frame>40 }));

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
		const clip = new Clip().set({ stop: <frame>30 });

		await track.add(clip.offsetBy(<frame>60));

		expect(track.clips.at(0)?.start.frames).toBe(60);
		expect(track.clips.at(0)?.stop.frames).toBe(90);
	});

	it('should be be able to add a base clip with offset', async () => {
		const clip = new Clip().set({ stop: <frame>30 });

		await track.add(clip.offsetBy(<frame>60));

		expect(track.clips.at(0)?.start.frames).toBe(60);
		expect(track.clips.at(0)?.stop.frames).toBe(90);
	});
});
