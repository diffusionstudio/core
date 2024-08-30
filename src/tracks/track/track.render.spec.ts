/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';
import { WebGPURenderer } from 'pixi.js';
import { Clip } from '../../clips';
import { Track } from './track';
import { framesToMillis } from '../../models';

import type { frame } from '../../types';

const renderer = new WebGPURenderer();

describe('The Track Object', () => {
	let track: Track<Clip>;
	let renderSpy: MockInstance<(renderer: WebGPURenderer, frame: frame) => void | Promise<void>>;

	beforeEach(() => {
		// frame and seconds are the same
		track = new Track();
		renderSpy = vi.spyOn(track, 'render');
	});

	it('should render should not have any effects when the track is empty', () => {
		track.pointer = 4;

		track.render(renderer, framesToMillis(<frame>0));

		expect(renderSpy).toHaveBeenCalledTimes(1);
		expect(track.pointer).toBe(4);
	});

	it('should render setup {[   ]    [    ]    [    ]     }', () => {
		track.pointer = 0;

		track.clips = [
			new Clip().set({ start: <frame>0, stop: <frame>10 }),
			new Clip().set({ start: <frame>20, stop: <frame>30 }),
			new Clip().set({ start: <frame>50, stop: <frame>60 }),
		];

		const spys = track.clips.map((clip) => vi.spyOn(clip, 'render'));

		track.render(renderer, framesToMillis(<frame>0));

		expect(renderSpy).toHaveBeenCalledTimes(1);
		expect(track.pointer).toBe(0);

		expect(spys[0]).toHaveBeenCalledTimes(1);
		expect(spys[1]).toHaveBeenCalledTimes(0);
		expect(spys[2]).toHaveBeenCalledTimes(0);

		track.render(renderer, framesToMillis(<frame>15));

		// one more due to recursion after clip seek
		expect(renderSpy).toHaveBeenCalledTimes(2);
		expect(track.pointer).toBe(1);

		expect(spys[0]).toHaveBeenCalledTimes(1);
		expect(spys[1]).toHaveBeenCalledTimes(0);
		expect(spys[2]).toHaveBeenCalledTimes(0);

		track.render(renderer, framesToMillis(<frame>25));

		expect(renderSpy).toHaveBeenCalledTimes(3);
		expect(track.pointer).toBe(1);

		expect(spys[0]).toHaveBeenCalledTimes(1);
		expect(spys[1]).toHaveBeenCalledTimes(1);
		expect(spys[2]).toHaveBeenCalledTimes(0);

		// jump to 3rd clip
		track.render(renderer, framesToMillis(<frame>50));

		expect(renderSpy).toHaveBeenCalledTimes(4);
		expect(track.pointer).toBe(2);

		expect(spys[0]).toHaveBeenCalledTimes(1);
		expect(spys[1]).toHaveBeenCalledTimes(1);
		expect(spys[2]).toHaveBeenCalledTimes(1);

		// render after all clips
		track.render(renderer, framesToMillis(<frame>70));

		expect(renderSpy).toHaveBeenCalledTimes(5);
		expect(track.pointer).toBe(2);

		expect(spys[0]).toHaveBeenCalledTimes(1);
		expect(spys[1]).toHaveBeenCalledTimes(1);
		expect(spys[2]).toHaveBeenCalledTimes(1);
	});

	it('should render setup {    [   ][   ]}', () => {
		track.pointer = 0;

		track.clips = [
			new Clip().set({ start: <frame>10, stop: <frame>20 }),
			new Clip().set({ start: <frame>21, stop: <frame>30 }),
		];

		const spys = track.clips.map((clip) => vi.spyOn(clip, 'render'));

		track.render(renderer, framesToMillis(<frame>5));

		expect(renderSpy).toHaveBeenCalledTimes(1);
		expect(track.pointer).toBe(0);

		expect(spys[0]).toHaveBeenCalledTimes(0);
		expect(spys[1]).toHaveBeenCalledTimes(0);

		track.render(renderer, framesToMillis(<frame>21));

		expect(renderSpy).toHaveBeenCalledTimes(2);
		expect(track.pointer).toBe(1);

		expect(spys[0]).toHaveBeenCalledTimes(0);
		expect(spys[1]).toHaveBeenCalledTimes(1);

		track.render(renderer, framesToMillis(<frame>10));

		expect(renderSpy).toHaveBeenCalledTimes(3);
		expect(track.pointer).toBe(0);

		expect(spys[0]).toHaveBeenCalledTimes(1);
		expect(spys[1]).toHaveBeenCalledTimes(1);
	});
});
