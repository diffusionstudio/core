/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TextClip } from './text';
import { BlurFilter, WebGPURenderer } from 'pixi.js';
import { Keyframe } from '../../models';
import { Font } from './font';

describe('The Text Clip', () => {
	it('should have a certain initial state', () => {
		const clip = new TextClip('Hello World');

		expect(clip.text).toBe('Hello World');
		expect(clip.fontFamily).toBe('Arial');
		expect(clip.textAlign).toBe('left');
		expect(clip.fillStyle).toBe('#FFFFFF');
		expect(clip.textBaseline).toBe('alphabetic');
		expect(clip.stroke).toBe(undefined);
		expect(clip.textCase).toBeUndefined();
		expect(clip.shadow).toBe(undefined);
		expect(clip.maxWidth).toBeUndefined();
		expect(clip.anchor.x).toBe(0);
		expect(clip.anchor.y).toBe(0);

		clip.anchor = { x: 0.2, y: 0.3 };
		expect(clip.anchor.x).toBe(0.2);
		expect(clip.anchor.y).toBe(0.3);
	});
});

// copied from src/clips/clip/clip.decorator.spec.ts
describe('The render decorator', () => {
	it('should not render the compostition if the clip is disabled', () => {
		const clip = new TextClip();
		const renderer = new WebGPURenderer();
		const renderSpy = vi.spyOn(renderer, 'render').mockImplementation(() => { });
		const unrenderSpy = vi.spyOn(clip, 'unrender');

		clip.render(renderer, 0);

		expect(renderSpy).toHaveBeenCalledOnce();
		expect(unrenderSpy).not.toHaveBeenCalled();

		clip.set({ disabled: true });
		clip.render(renderer, 0);

		expect(renderSpy).toHaveBeenCalledOnce();
		expect(unrenderSpy).toHaveBeenCalledOnce()
	});
});

// copied from src/clips/mixins/visual.deserializers.spec.ts
describe('The visualize decorator', () => {
	it('should add a filter on render and remove it on unrender', () => {
		const renderer = new WebGPURenderer();
		const clip = new TextClip('Hello World');

		const filterSpy = vi.spyOn(clip.container, 'filters', 'set');
		const renderSpy = vi.spyOn(renderer, 'render');

		clip.render(renderer, 0);

		expect(filterSpy).not.toHaveBeenCalled();
		expect(renderSpy).toHaveBeenCalledTimes(1);

		clip.set({ filters: new BlurFilter() });

		clip.render(renderer, 0);

		expect(filterSpy).toHaveBeenCalledOnce();
		expect(renderSpy).toHaveBeenCalledTimes(2);

		vi.spyOn(clip.container, 'filters', 'get').mockReturnValue([new BlurFilter()]);

		// render again, it should only assign once
		clip.render(renderer, 0);

		expect(filterSpy).toHaveBeenCalledOnce();
		expect(renderSpy).toHaveBeenCalledTimes(3);

		clip.unrender();

		expect(filterSpy).toHaveBeenCalledTimes(2);
		expect(filterSpy.mock.calls[1][0]).toBe(null);
		expect(renderSpy).toHaveBeenCalledTimes(3);
	});
});

// Blend of different test files
describe('Copying the TextClip', () => {
	let clip: TextClip;
	const fontAddFn = vi.fn();

	Object.assign(document, { fonts: { add: fontAddFn } });

	beforeEach(() => {
		clip = new TextClip('Hello World');
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

		expect(copy).toBeInstanceOf(TextClip);
		expect(copy.id).not.toBe(clip.id);
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

	it('should transfer font properties', async () => {
		const font = new Font({
			family: 'Bangers',
			style: 'normal',
			source: 'local(banger.ttf)'
		});
		font.loaded = true;

		clip.text = 'Foo bar';
		clip.font = font;
		clip.maxWidth = 345;
		clip.textAlign = 'right';
		clip.padding = 70;
		clip.textBaseline = 'bottom';
		clip.fillStyle = '#FF0000';
		clip.stroke = {
			alpha: 0.4,
			join: 'bevel',
			width: 7,
		};
		clip.textCase = 'upper';
		clip.shadow = {
			alpha: 0.6,
			distance: 2,
		};
		clip.fontSize = 29;
		clip.leading = 32;

		const copy = clip.copy();

		expect(copy.text).toBe('Foo bar');
		expect(copy.font).toBeInstanceOf(Font);
		expect(copy.font.name).toBe(clip.font.name);
		expect(copy.fontFamily).toBe('Bangers normal');
		expect(copy.maxWidth).toBe(345);
		expect(copy.textAlign).toBe('right');
		expect(copy.padding).toBe(70);
		expect(copy.textBaseline).toBe('bottom');
		expect(copy.fillStyle).toBe('#FF0000');
		// will be set by textAlign
		expect(copy.anchor.x).toBe(1);
		// will be set by textBaseline
		expect(copy.anchor.y).toBe(1);
		expect(copy.stroke?.alpha).toBe(0.4);
		expect(copy.stroke?.join).toBe('bevel');
		expect(copy.stroke?.width).toBe(7);
		expect(copy.textCase).toBe('upper');
		expect(copy.shadow?.alpha).toBe(0.6);
		expect(copy.shadow?.distance).toBe(2);
		expect(copy.fontSize).toBe(29);
		expect(copy.leading).toBe(32);
	});
});
