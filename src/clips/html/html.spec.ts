/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { HtmlClip } from './html';
import { sleep } from '../../utils';
import { BlurFilter, WebGPURenderer } from 'pixi.js';
import { Keyframe, Timestamp } from '../../models';
import { HtmlSource } from '../../sources';

const file = new File(['<h1>Hello World</h1>'], 'index.html', {
	type: 'text/html',
});

describe('The Html Clip', () => {
	const updateFn = vi.fn();
	const errorFn = vi.fn();
	const loadFn = vi.fn();
	let clip: HtmlClip;

	beforeEach(() => {
		updateFn.mockClear();
		errorFn.mockClear();

		clip = new HtmlClip(file);
		clip.on('update', updateFn);
		clip.on('error', errorFn);
		clip.on('load', loadFn);
		vi.spyOn(clip.source, 'document', 'get').mockReturnValue(undefined);
	});

	it('should have an initial state', async () => {
		await sleep(0);
		clip.element.dispatchEvent(new Event('load'));
		await sleep(0);
		expect(clip.element).toBeDefined();
		expect(loadFn).toBeCalledTimes(1);
		expect(clip.type).toBe('html');
		expect(clip.state).toBe('READY');
		expect(clip.source.name).toBe('index.html');
	});

	it('should add a filter on render and remove it on unrender', () => {
		const renderer = new WebGPURenderer();

		const filterSpy = vi.spyOn(clip.container, 'filters', 'set');

		clip.render(renderer, new Timestamp());

		expect(filterSpy).not.toHaveBeenCalled();

		clip.set({ filters: new BlurFilter() });

		clip.render(renderer, new Timestamp());

		expect(filterSpy).toHaveBeenCalledOnce();

		vi.spyOn(clip.container, 'filters', 'get').mockReturnValue([new BlurFilter()]);
		// render again, it should only assign once
		clip.render(renderer, new Timestamp());

		expect(filterSpy).toHaveBeenCalledOnce();

		clip.unrender();

		expect(filterSpy).toHaveBeenCalledTimes(2);
		expect(filterSpy.mock.calls[1][0]).toBe(null);
	});
});

// Blend of different test files
describe('Copying the HtmlClip', () => {
	let clip: HtmlClip;

	beforeEach(() => {
		clip = new HtmlClip(file);
		vi.spyOn(clip.source, 'document', 'get').mockReturnValue(undefined);
	});

	it('should transfer visual properties', () => {
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
		clip.source.objectURL = 'blob:chrome://3dc0f2b7-7773-4cd4-a397-2e43b1bba7cd'

		const copy = clip.copy();

		expect(copy).toBeInstanceOf(HtmlClip);
		expect(copy.id).not.toBe(clip.id);
		expect(copy.source).toBeInstanceOf(HtmlSource);
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
		const clip = new HtmlClip();
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
		const clip = new HtmlClip();

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
