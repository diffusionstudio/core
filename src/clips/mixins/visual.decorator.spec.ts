/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, expect, it, vi } from 'vitest';
import { Keyframe } from '../../models';
import { VisualMixin } from './visual';
import { Clip, toggle } from '../clip';
import { BlurFilter, Sprite, Texture, WebGPURenderer } from 'pixi.js';
import { visualize } from './visual.decorator';
import { Composition } from '../../composition';

import type { VisualMixinProps } from './visual.interfaces';
import type { ClipProps } from '../clip';

describe('The visualize decorator', () => {
	interface TestClipProps extends VisualMixinProps, ClipProps { }

	class TestClip extends VisualMixin(Clip<TestClipProps>) {
		@toggle
		@visualize
		public render(renderer: WebGPURenderer, time?: number): void | Promise<void> {
			renderer.render({ container: this.container, clear: false }); time;
		}
	}

	it('should add a filter on render and remove it on unrender', () => {
		const clip = new TestClip();
		const renderer = new WebGPURenderer();

		const filterSpy = vi.spyOn(clip.container, 'filters', 'set');
		const renderSpy = vi.spyOn(renderer, 'render');

		clip.render(renderer);

		expect(filterSpy).not.toHaveBeenCalled();
		expect(renderSpy).toHaveBeenCalledTimes(1);

		clip.set({ filters: new BlurFilter() });

		clip.render(renderer);

		expect(filterSpy).toHaveBeenCalledOnce();
		expect(renderSpy).toHaveBeenCalledTimes(2);

		vi.spyOn(clip.container, 'filters', 'get').mockReturnValue([new BlurFilter()]);

		// render again, it should only assign once
		clip.render(renderer);

		expect(filterSpy).toHaveBeenCalledOnce();
		expect(renderSpy).toHaveBeenCalledTimes(3);

		clip.unrender();

		expect(filterSpy).toHaveBeenCalledTimes(2);
		expect(filterSpy.mock.calls[1][0]).toBe(null);
		expect(renderSpy).toHaveBeenCalledTimes(3);
	});

	it('should center the clip when position center is set', async () => {
		const clip = new TestClip();
		clip.container.addChild(new Sprite());
		const renderer = new WebGPURenderer();
		await new Composition({ width: 1000, height: 2000 })
			.createTrack('base')
			.add(clip);

		const posSpy = vi.spyOn(clip.container.position, 'set');

		clip.position = 'center';
		clip.render(renderer);

		expect(clip.container.x).toBe(500);
		expect(clip.container.y).toBe(1000);
		expect(clip.position.x).toBe('50%');
		expect(clip.position.y).toBe('50%');
		expect(clip.anchor.x).toBe(0.5);
		expect(clip.anchor.y).toBe(0.5);
		expect(posSpy).toHaveBeenCalledOnce();
	});

	it('should set the position on render', async () => {
		const clip = new TestClip();
		const renderer = new WebGPURenderer();

		await new Composition({ width: 1000, height: 2000 })
			.createTrack('base')
			.add(clip);

		const posSpy = vi.spyOn(clip.container.position, 'set');

		clip.position = { x: 5, y: 7 };

		posSpy.mockClear()
		clip.render(renderer);

		expect(clip.container.x).toBe(5);
		expect(clip.container.y).toBe(7);
		expect(posSpy).toHaveBeenCalledOnce();

		clip.position = {
			x: new Keyframe([0, 60], [100, 200]),
			y: new Keyframe([0, 60], [0, 100])
		};

		posSpy.mockClear()
		clip.render(renderer, 1000);

		expect(clip.container.x).toBe(150);
		expect(clip.container.y).toBe(50);
		expect(posSpy).toHaveBeenCalledOnce();

		// offset start
		clip.stop = 100;
		clip.start = 30;

		posSpy.mockClear();
		clip.render(renderer, 1000);

		expect(clip.container.x).toBe(100);
		expect(clip.container.y).toBe(0);
		expect(posSpy).toHaveBeenCalledOnce();

		clip.position = {
			x: '20%',
			y: '30%',
		}

		posSpy.mockClear();
		clip.render(renderer, 1000);

		expect(clip.container.x).toBe(200);
		expect(clip.container.y).toBe(600);
		expect(posSpy).toHaveBeenCalledOnce();
	});

	it('should add the translate values on render', () => {
		const clip = new TestClip();
		const renderer = new WebGPURenderer();

		const posSpy = vi.spyOn(clip.container.position, 'set');

		clip.position = { x: 5, y: 7 };
		clip.translate = { x: 3, y: 4 };
		clip.render(renderer);

		expect(clip.container.x).toBe(8);
		expect(clip.container.y).toBe(11);
		expect(posSpy).toHaveBeenCalledOnce();

		clip.position = { x: 20, y: 60 };
		clip.translate = {
			x: new Keyframe([0, 60], [100, 200]),
			y: new Keyframe([0, 60], [0, 100])
		};

		clip.render(renderer, 1000);
		expect(clip.container.x).toBe(150 + 20);
		expect(clip.container.y).toBe(50 + 60);
		expect(posSpy).toHaveBeenCalledTimes(2);
	});

	it('should set the height on render', async () => {
		const clip = new TestClip();
		const renderer = new WebGPURenderer();

		const canvas = document.createElement('canvas');
		canvas.width = 500;
		canvas.height = 400;
		clip.container.addChild(new Sprite(Texture.from(canvas)));

		await new Composition({ width: 1000, height: 2000 })
			.createTrack('base')
			.add(clip);

		const heightSpy = vi.spyOn(clip.container, 'height', 'set');
		const scaleSpy = vi.spyOn(clip.container.scale, 'set');

		clip.render(renderer);

		expect(heightSpy).not.toHaveBeenCalled();
		expect(scaleSpy).not.toHaveBeenCalled();

		clip.height = '100%';

		clip.render(renderer);

		expect(heightSpy).toHaveBeenCalledOnce();
		expect(scaleSpy).toHaveBeenCalledOnce();

		expect(clip.container.height).toBe(2000);
		expect(clip.container.width).toBe(2500);
		expect(clip.container.scale.y).toBe(5);
		expect(clip.container.scale.x).toBe(5);

		clip.height = new Keyframe([0, 12], [0, 200]);

		vi.clearAllMocks();
		clip.render(renderer, 200);

		expect(heightSpy).toHaveBeenCalledOnce();
		expect(scaleSpy).toHaveBeenCalledOnce();

		expect(clip.container.height).toBe(100);
		expect(clip.container.width).toBe(125);
		expect(clip.container.scale.y).toBe(0.25);
		expect(clip.container.scale.x).toBe(0.25);


		clip.height = 800;

		vi.clearAllMocks();
		clip.render(renderer);

		expect(heightSpy).toHaveBeenCalledOnce();
		expect(scaleSpy).toHaveBeenCalledOnce();

		expect(clip.container.height).toBe(800);
		expect(clip.container.width).toBe(1000);
		expect(clip.container.scale.y).toBe(2);
		expect(clip.container.scale.x).toBe(2);
	});

	it('should set the width on render', async () => {
		const clip = new TestClip();
		const renderer = new WebGPURenderer();

		const canvas = document.createElement('canvas');
		canvas.width = 500;
		canvas.height = 400;
		clip.container.addChild(new Sprite(Texture.from(canvas)));

		await new Composition({ width: 1000, height: 2000 })
			.createTrack('base')
			.add(clip);

		const widthSpy = vi.spyOn(clip.container, 'width', 'set');
		const scaleSpy = vi.spyOn(clip.container.scale, 'set');

		clip.render(renderer);

		expect(widthSpy).not.toHaveBeenCalled();
		expect(scaleSpy).not.toHaveBeenCalled();

		clip.width = '100%';

		clip.render(renderer);

		expect(widthSpy).toHaveBeenCalledOnce();
		expect(scaleSpy).toHaveBeenCalledOnce();

		expect(clip.container.height).toBe(800);
		expect(clip.container.width).toBe(1000);
		expect(clip.container.scale.y).toBe(2);
		expect(clip.container.scale.x).toBe(2);

		clip.width = new Keyframe([0, 12], [0, 200]);

		vi.clearAllMocks();
		clip.render(renderer, 200);

		expect(widthSpy).toHaveBeenCalledOnce();
		expect(scaleSpy).toHaveBeenCalledOnce();

		expect(clip.container.height).toBe(80);
		expect(clip.container.width).toBe(100);
		expect(clip.container.scale.y).toBe(0.2);
		expect(clip.container.scale.x).toBe(0.2);

		clip.width = 1500;

		vi.clearAllMocks();
		clip.render(renderer);

		expect(widthSpy).toHaveBeenCalledOnce();
		expect(scaleSpy).toHaveBeenCalledOnce();

		expect(clip.container.height).toBe(1200);
		expect(clip.container.width).toBe(1500);
		expect(clip.container.scale.y).toBe(3);
		expect(clip.container.scale.x).toBe(3);
	});

	it('should set the width and height on render', async () => {
		const clip = new TestClip();
		const renderer = new WebGPURenderer();

		const canvas = document.createElement('canvas');
		canvas.width = 500;
		canvas.height = 400;
		clip.container.addChild(new Sprite(Texture.from(canvas)))

		const widthSpy = vi.spyOn(clip.container, 'width', 'set');
		const heightSpy = vi.spyOn(clip.container, 'height', 'set');
		const scaleSpy = vi.spyOn(clip.container.scale, 'set');

		clip.width = 700;
		clip.height = 900;

		clip.render(renderer);

		expect(widthSpy).toHaveBeenCalledOnce();
		expect(heightSpy).toHaveBeenCalledOnce();
		expect(scaleSpy).not.toHaveBeenCalled();

		expect(clip.container.height).toBe(900);
		expect(clip.container.width).toBe(700);
	});

	it('should be able to scale x and y when scale is a number', () => {
		const clip = new TestClip();
		const renderer = new WebGPURenderer();
		const scaleSpy = vi.spyOn(clip.container.scale, 'set');

		clip.scale = 0.4;
		clip.render(renderer);

		expect(clip.scale.x).toBe(0.4);
		expect(clip.scale.y).toBe(0.4);
		expect(clip.container.scale._x).toBe(0.4);
		expect(clip.container.scale._y).toBe(0.4);
		expect(scaleSpy).toHaveBeenCalledOnce();
	});

	it('should be able to scale x and y when scale is a Keyframe', () => {
		const clip = new TestClip();
		const renderer = new WebGPURenderer();
		const scaleSpy = vi.spyOn(clip.container.scale, 'set');

		clip.scale = new Keyframe([30, 90], [0, 100]);
		clip.start = 30;
		clip.render(renderer, 3000); // 90 frames

		expect(clip.scale.x).toBeInstanceOf(Keyframe);
		expect(clip.scale.y).toBeInstanceOf(Keyframe);
		expect(clip.container.scale._x).toBe(50);
		expect(clip.container.scale._y).toBe(50);
		expect(scaleSpy).toHaveBeenCalledOnce();
	});

	it('should set scale x any y independently on render', () => {
		const clip = new TestClip();
		const renderer = new WebGPURenderer();

		const posSpy = vi.spyOn(clip.container.scale, 'set');

		clip.scale = { x: 0.7, y: 0.4 };
		clip.render(renderer);

		expect(clip.container.scale._x).toBe(0.7);
		expect(clip.container.scale._y).toBe(0.4);
		expect(posSpy).toHaveBeenCalledOnce();

		clip.scale = {
			x: new Keyframe([0, 60], [0.0, 0.2]),
			y: new Keyframe([0, 60], [0.2, 0.6])
		};

		clip.render(renderer, 1000);
		expect(clip.container.scale._x).toBe(0.1);
		expect(clip.container.scale._y).toBe(0.4);
		expect(posSpy).toHaveBeenCalledTimes(2);
	});

	it('should multiply the scale set by the height and width', async () => {
		const clip = new TestClip();
		const renderer = new WebGPURenderer();

		const canvas = document.createElement('canvas');
		canvas.width = 500;
		canvas.height = 400;
		clip.container.addChild(new Sprite(Texture.from(canvas)))

		await new Composition({ width: 1000, height: 2000 })
			.createTrack('base')
			.add(clip);

		const scaleSpy = vi.spyOn(clip.container.scale, 'set');

		clip.width = '100%';
		clip.scale = {
			x: 3,
			y: 1.5
		}

		clip.render(renderer);

		expect(scaleSpy).toHaveBeenCalledTimes(2);

		expect(clip.container.height).toBe(800 * 1.5);
		expect(clip.container.width).toBe(1000 * 3);
		expect(clip.container.scale.y).toBe(2 * 1.5);
		expect(clip.container.scale.x).toBe(2 * 3);
	});

	it('should set the rotation on render', () => {
		const clip = new TestClip();
		const renderer = new WebGPURenderer();

		const angleSpy = vi.spyOn(clip.container, 'angle', 'set');

		clip.rotation = 93;
		clip.render(renderer);

		expect(clip.container.angle).toBe(93);
		expect(angleSpy).toHaveBeenCalledOnce();

		clip.rotation = new Keyframe([0, 60], [0, 180], { type: 'degrees' })

		clip.render(renderer, 1000);
		expect(clip.container.angle).toBe(90);
		expect(angleSpy).toHaveBeenCalledTimes(2);
	});

	it('should set the opacity on render', () => {
		const clip = new TestClip();
		const renderer = new WebGPURenderer();

		const alphaSpy = vi.spyOn(clip.container, 'alpha', 'set');

		clip.alpha = 0.72;
		clip.render(renderer);

		expect(clip.container.alpha).toBe(0.72);
		expect(alphaSpy).toHaveBeenCalledOnce();

		clip.alpha = new Keyframe([0, 60], [0, 0.6]);

		clip.render(renderer, 1000);
		expect(clip.container.alpha).toBe(0.3);
		expect(alphaSpy).toHaveBeenCalledTimes(2);
	});
});
