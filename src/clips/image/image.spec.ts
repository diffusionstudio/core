/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ImageClip } from './image';
import { sleep } from '../../utils';
import { BlurFilter, WebGPURenderer } from 'pixi.js';
import { Keyframe, Timestamp } from '../../models';
import { ImageSource } from '../../sources';

const file = new File([], 'image.png', { type: 'image/png' });

describe('The Image Clip', () => {
	const loadSpy = vi.spyOn(ImageClip.prototype, 'load');
	const updateFn = vi.fn();
	const errorFn = vi.fn();
	const attachFn = vi.fn();
	const loadFn = vi.fn();

	let clip: ImageClip;

	beforeEach(() => {
		updateFn.mockClear();
		errorFn.mockClear();
		attachFn.mockClear();
		loadFn.mockClear();
		loadSpy.mockClear();

		clip = new ImageClip(file);
		clip.on('update', updateFn);
		clip.on('error', errorFn);
		clip.on('attach', attachFn);
		clip.on('load', loadFn);
	});

	it('should have an initial state', async () => {
		// run all other async methods first
		await sleep(0);
		clip.element.dispatchEvent(new Event('load'));
		expect(clip.element).toBeDefined();
		expect(loadFn).toBeCalledTimes(1);
		expect(clip.type).toBe('image');
		expect(clip.state).toBe('READY');
		expect(clip.source.name).toBe('image.png');
		expect(clip.source.objectURL).toBe(
			'blob:chrome://new-tab-page/3dc0f2b7-7773-4cd4-a397-2e43b1bba7cd',
		);
		expect(loadSpy).toHaveBeenCalled();
	});

	it('should change its state when emptied', () => {
		expect(clip.width).toBe(1);
		expect(clip.height).toBe(1);
		expect(clip.state).not.toBe('IDLE');

		clip.element.dispatchEvent(new Event('emptied'));

		expect(clip.state).toBe('IDLE');
	});

	it('should change its state when an error occured', () => {
		clip.element.dispatchEvent(new Event('canplay'));
		clip.element.dispatchEvent(new Event('error'));
		expect(clip.state).toBe('ERROR');
		expect(clip.track).toBeUndefined();
		expect(errorFn).toHaveBeenCalled();
	});
});

// Blend of different test files
describe('Copying the ImageClip', () => {
	let clip: ImageClip;

	beforeEach(() => {
		clip = new ImageClip(file);
	});

	it('should transfer visual properties', async () => {
		clip.filters = new BlurFilter();
		clip.rotation = new Keyframe([0, 9], [20, 80]);
		clip.alpha = 0.4;
		clip.position = {
			x: 12,
			y: 18,
		}
		clip.translate = {
			x: new Keyframe([0, 9], [10, 70]),
			y: new Keyframe([0, 9], [0, 60]),
		}
		clip.scale = 2;
		clip.anchor = { x: 0.3, y: 0.9 }

		const copy = clip.copy();

		expect(copy).toBeInstanceOf(ImageClip);
		expect(copy.id).not.toBe(clip.id);
		expect(copy.source).toBeInstanceOf(ImageSource);
		expect(copy.source.id).toBe(clip.source.id);
		expect(copy.filters).toBeInstanceOf(BlurFilter);
		expect(copy.rotation).toBeInstanceOf(Keyframe);
		expect((copy.rotation as any).output[0]).toBe(20);
		expect(copy.alpha).toBe(0.4);
		expect((copy.position as any).x).toBe(12);
		expect((copy.position as any).y).toBe(18);
		expect(copy.translate.x).toBeInstanceOf(Keyframe);
		expect(copy.translate.y).toBeInstanceOf(Keyframe);
		expect(copy.scale.x).toBe(2);
		expect(copy.scale.y).toBe(2);
		expect(clip.anchor.x).toBe(0.3);
		expect(clip.anchor.y).toBe(0.9);
	});

	it('should transfer base properties', () => {
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

// copied from src/clips/clip/clip.decorator.spec.ts
describe('The render decorator', () => {
	it('should not render the compostition if the clip is disabled', () => {
		const clip = new ImageClip();
		const renderer = new WebGPURenderer();
		const renderSpy = vi.spyOn(renderer, 'render').mockImplementation(() => { });
		const unrenderSpy = vi.spyOn(clip, 'unrender');

		clip.render(renderer, new Timestamp());

		expect(renderSpy).toHaveBeenCalledOnce();
		expect(unrenderSpy).not.toHaveBeenCalled();

		clip.set({ disabled: true });
		clip.render(renderer, new Timestamp());

		expect(renderSpy).toHaveBeenCalledOnce();
		expect(unrenderSpy).toHaveBeenCalledOnce()
	});
});

// copied from src/clips/mixins/visual.deserializers.spec.ts
describe('The visualize decorator', () => {
	it('should add a filter on render and remove it on unrender', () => {
		const renderer = new WebGPURenderer();
		const clip = new ImageClip();

		const filterSpy = vi.spyOn(clip.container, 'filters', 'set');
		const renderSpy = vi.spyOn(renderer, 'render');

		clip.render(renderer, new Timestamp());

		expect(filterSpy).not.toHaveBeenCalled();
		expect(renderSpy).toHaveBeenCalledTimes(1);

		clip.set({ filters: new BlurFilter() });

		clip.render(renderer, new Timestamp());

		expect(filterSpy).toHaveBeenCalledOnce();
		expect(renderSpy).toHaveBeenCalledTimes(2);

		vi.spyOn(clip.container, 'filters', 'get').mockReturnValue([new BlurFilter()]);

		// render again, it should only assign once
		clip.render(renderer, new Timestamp());

		expect(filterSpy).toHaveBeenCalledOnce();
		expect(renderSpy).toHaveBeenCalledTimes(3);

		clip.unrender();

		expect(filterSpy).toHaveBeenCalledTimes(2);
		expect(filterSpy.mock.calls[1][0]).toBe(null);
		expect(renderSpy).toHaveBeenCalledTimes(3);
	});
});
