/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, expect, it, vi } from 'vitest';
import { Keyframe, Timestamp } from '../../models';
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
		public render(renderer: WebGPURenderer, time: Timestamp): void | Promise<void> {
			renderer.render({ container: this.container, clear: false }); time;
		}
	}

	it('should add a filter on render and remove it on unrender', () => {
		const clip = new TestClip();
		const renderer = new WebGPURenderer();

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

	it("should center the clip when position 'center' is set", async () => {
		const clip = new TestClip();
		clip.container.addChild(new Sprite());
		const renderer = new WebGPURenderer();
		await new Composition({ width: 1000, height: 2000 })
			.createTrack('base')
			.add(clip);

		const posSpy = vi.spyOn(clip.container.position, 'set');

		clip.position = 'center';
		clip.render(renderer, new Timestamp());

		expect(clip.container.x).toBe(500);
		expect(clip.container.y).toBe(1000);
		expect(clip.position.x).toBe('50%');
		expect(clip.position.y).toBe('50%');
		expect(clip.anchor.x).toBe(0.5);
		expect(clip.anchor.y).toBe(0.5);
		expect(posSpy).toHaveBeenCalledOnce();
	});

	it('should set the position on render - number', async () => {
		const clip = new TestClip();
		const renderer = new WebGPURenderer();

		await new Composition({ width: 1000, height: 2000 })
			.createTrack('base')
			.add(clip);

		const posSpy = vi.spyOn(clip.container.position, 'set');

		clip.position = { x: 5, y: 7 };

		posSpy.mockClear()
		clip.render(renderer, new Timestamp());

		expect(clip.container.x).toBe(5);
		expect(clip.container.y).toBe(7);
		expect(posSpy).toHaveBeenCalledOnce();
	});

	it('should set the position on render - function', async () => {
		const clip = new TestClip();
		const renderer = new WebGPURenderer();

		await new Composition({ width: 1000, height: 2000 })
			.createTrack('base')
			.add(clip);

		const posSpy = vi.spyOn(clip.container.position, 'set');

		clip.position = {
			x(this: TestClip, time: Timestamp) {
				expect(this).instanceOf(TestClip);

				return time.millis;
			},
			y(this: TestClip, time: Timestamp) {
				expect(this).instanceOf(TestClip);

				return time.millis * 2;
			},
		};

		posSpy.mockClear()
		clip.render(renderer, new Timestamp(1000));

		expect(clip.container.x).toBe(1000);
		expect(clip.container.y).toBe(2000);
		expect(posSpy).toHaveBeenCalledOnce();
	});

	it('should set the position on render - keyframe', async () => {
		const clip = new TestClip();
		const renderer = new WebGPURenderer();

		await new Composition({ width: 1000, height: 2000 })
			.createTrack('base')
			.add(clip);

		const posSpy = vi.spyOn(clip.container.position, 'set');

		clip.position = {
			x: new Keyframe([0, 60], [100, 200]),
			y: new Keyframe([0, 60], [0, 100])
		};

		posSpy.mockClear()
		clip.render(renderer, new Timestamp(1000));

		expect(clip.container.x).toBe(150);
		expect(clip.container.y).toBe(50);
		expect(posSpy).toHaveBeenCalledOnce();
	});

	it('should set the position on render - keyframe relative', async () => {
		const clip = new TestClip();
		const renderer = new WebGPURenderer();

		await new Composition({ width: 1000, height: 2000 })
			.createTrack('base')
			.add(clip);

		const posSpy = vi.spyOn(clip.container.position, 'set');

		clip.position = {
			x: new Keyframe([0, 60], [100, 200]),
			y: new Keyframe([0, 60], [0, 100])
		};

		// Make sure the relative time is used
		clip.stop = 100;
		clip.start = 30;

		posSpy.mockClear();
		clip.render(renderer, new Timestamp(1000));

		expect(clip.container.x).toBe(100);
		expect(clip.container.y).toBe(0);
		expect(posSpy).toHaveBeenCalledOnce();
	});

	it('should set the position on render - number relative', async () => {
		const clip = new TestClip();
		const renderer = new WebGPURenderer();

		await new Composition({ width: 1000, height: 2000 })
			.createTrack('base')
			.add(clip);

		const posSpy = vi.spyOn(clip.container.position, 'set');

		clip.position = {
			x: '20%',
			y: '30%',
		}

		// Make sure the relative time is used
		clip.stop = 100;
		clip.start = 30;

		posSpy.mockClear();
		clip.render(renderer, new Timestamp(1000));

		expect(clip.container.x).toBe(200);
		expect(clip.container.y).toBe(600);
		expect(posSpy).toHaveBeenCalledOnce();
	});

	it('should set the position on render - function relative', async () => {
		const clip = new TestClip();
		const renderer = new WebGPURenderer();

		await new Composition({ width: 1000, height: 2000 })
			.createTrack('base')
			.add(clip);

		const posSpy = vi.spyOn(clip.container.position, 'set');


		clip.position = {
			x: (time: Timestamp) => time.millis,
			y: (time: Timestamp) => time.millis * 2,
		};

		// Make sure the relative time is used
		clip.start = 30;

		posSpy.mockClear();
		clip.render(renderer, new Timestamp(2000));

		expect(clip.container.x).toBe(1000);
		expect(clip.container.y).toBe(2000);
	});

	it('should add the translate values on render', () => {
		const clip = new TestClip();
		const renderer = new WebGPURenderer();

		const posSpy = vi.spyOn(clip.container.position, 'set');

		clip.position = { x: 5, y: 7 };
		clip.translate = { x: 3, y: 4 };
		clip.render(renderer, new Timestamp());

		expect(clip.container.x).toBe(8);
		expect(clip.container.y).toBe(11);
		expect(posSpy).toHaveBeenCalledOnce();

		clip.position = { x: 20, y: 60 };
		clip.translate = {
			x: new Keyframe([0, 60], [100, 200]),
			y: new Keyframe([0, 60], [0, 100])
		};

		clip.render(renderer, new Timestamp(1000));
		expect(clip.container.x).toBe(150 + 20);
		expect(clip.container.y).toBe(50 + 60);
		expect(posSpy).toHaveBeenCalledTimes(2);

		clip.position = { x: 50, y: 70 };
		clip.translate = {
			x(this: TestClip, time: Timestamp) {
				expect(this).instanceOf(TestClip);

				return time.millis;
			},
			y(this: TestClip, time: Timestamp) {
				expect(this).instanceOf(TestClip);

				return time.millis;
			},
		};

		clip.render(renderer, new Timestamp(80));
		expect(clip.container.x).toBe(130);
		expect(clip.container.y).toBe(150);
		expect(posSpy).toHaveBeenCalledTimes(3);
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

		clip.render(renderer, new Timestamp());

		expect(heightSpy).not.toHaveBeenCalled();
		expect(scaleSpy).not.toHaveBeenCalled();

		clip.height = '100%';

		clip.render(renderer, new Timestamp());

		expect(heightSpy).toHaveBeenCalledOnce();
		expect(scaleSpy).toHaveBeenCalledOnce();

		expect(clip.container.height).toBe(2000);
		expect(clip.container.width).toBe(2500);
		expect(clip.container.scale.y).toBe(5);
		expect(clip.container.scale.x).toBe(5);

		clip.height = new Keyframe([0, 12], [0, 200]);

		vi.clearAllMocks();
		clip.render(renderer, new Timestamp(200));

		expect(heightSpy).toHaveBeenCalledOnce();
		expect(scaleSpy).toHaveBeenCalledOnce();

		expect(clip.container.height).toBe(100);
		expect(clip.container.width).toBe(125);
		expect(clip.container.scale.y).toBe(0.25);
		expect(clip.container.scale.x).toBe(0.25);

		clip.height = function(this: TestClip, time: Timestamp) {
			expect(this).instanceOf(TestClip);

			return time.millis;
		}

		vi.clearAllMocks();
		clip.render(renderer, new Timestamp(200));

		expect(heightSpy).toHaveBeenCalledOnce();
		expect(scaleSpy).toHaveBeenCalledOnce();

		expect(clip.container.height).toBe(200);
		expect(clip.container.width).toBe(250);
		expect(clip.container.scale.y).toBe(0.5);
		expect(clip.container.scale.x).toBe(0.5);

		clip.height = 800;

		vi.clearAllMocks();
		clip.render(renderer, new Timestamp(200));

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

		clip.render(renderer, new Timestamp());

		expect(widthSpy).not.toHaveBeenCalled();
		expect(scaleSpy).not.toHaveBeenCalled();

		clip.width = '100%';

		clip.render(renderer, new Timestamp());

		expect(widthSpy).toHaveBeenCalledOnce();
		expect(scaleSpy).toHaveBeenCalledOnce();

		expect(clip.container.height).toBe(800);
		expect(clip.container.width).toBe(1000);
		expect(clip.container.scale.y).toBe(2);
		expect(clip.container.scale.x).toBe(2);

		clip.width = function(this: TestClip, time: Timestamp) {
			expect(this).instanceOf(TestClip);

			return time.millis;
		}

		vi.clearAllMocks();
		clip.render(renderer, new Timestamp(250));

		expect(widthSpy).toHaveBeenCalledOnce();
		expect(scaleSpy).toHaveBeenCalledOnce();

		expect(clip.container.height).toBe(200);
		expect(clip.container.width).toBe(250);
		expect(clip.container.scale.y).toBe(0.5);
		expect(clip.container.scale.x).toBe(0.5);

		clip.width = new Keyframe([0, 12], [0, 200]);

		vi.clearAllMocks();
		clip.render(renderer, new Timestamp(200));

		expect(widthSpy).toHaveBeenCalledOnce();
		expect(scaleSpy).toHaveBeenCalledOnce();

		expect(clip.container.height).toBe(80);
		expect(clip.container.width).toBe(100);
		expect(clip.container.scale.y).toBe(0.2);
		expect(clip.container.scale.x).toBe(0.2);

		clip.width = 1500;

		vi.clearAllMocks();
		clip.render(renderer, new Timestamp());

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

		clip.render(renderer, new Timestamp());

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
		clip.render(renderer, new Timestamp());

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
		clip.render(renderer, new Timestamp(3000)); // 90 frames

		expect(clip.scale.x).toBeInstanceOf(Keyframe);
		expect(clip.scale.y).toBeInstanceOf(Keyframe);
		expect(clip.container.scale._x).toBe(50);
		expect(clip.container.scale._y).toBe(50);
		expect(scaleSpy).toHaveBeenCalledOnce();
	});

	it('should be able to scale as a Function', () => {
		const clip = new TestClip();
		const renderer = new WebGPURenderer();
		const scaleSpy = vi.spyOn(clip.container.scale, 'set');

		clip.scale =  function (this: TestClip, time: Timestamp) {
			expect(this).instanceOf(TestClip);

			return time.millis;
		}

		clip.render(renderer, new Timestamp(50));

		expect(clip.scale.x).toBeTypeOf('function');
		expect(clip.scale.y).toBeTypeOf('function');
		expect(clip.container.scale._x).toBe(50);
		expect(clip.container.scale._y).toBe(50);
		expect(scaleSpy.mock.calls[0][0]).toBe(50);
	});

	it('should be able to scale x and y as a Function', () => {
		const clip = new TestClip();
		const renderer = new WebGPURenderer();
		const scaleSpy = vi.spyOn(clip.container.scale, 'set');

		clip.scale = {
			x(this: TestClip, time: Timestamp) {
				expect(this).instanceOf(TestClip);
	
				return time.millis;
			},
			y(this: TestClip, time: Timestamp) {
				expect(this).instanceOf(TestClip);
	
				return time.millis;
			},
		};

		clip.render(renderer, new Timestamp(50));

		expect(clip.scale.x).toBeTypeOf('function');
		expect(clip.scale.y).toBeTypeOf('function');
		expect(clip.container.scale._x).toBe(50);
		expect(clip.container.scale._y).toBe(50);
		expect(scaleSpy.mock.calls[0][0]).toBe(50);
	});

	it('should set scale x any y independently on render', () => {
		const clip = new TestClip();
		const renderer = new WebGPURenderer();

		const posSpy = vi.spyOn(clip.container.scale, 'set');

		clip.scale = { x: 0.7, y: 0.4 };
		clip.render(renderer, new Timestamp());

		expect(clip.container.scale._x).toBe(0.7);
		expect(clip.container.scale._y).toBe(0.4);
		expect(posSpy).toHaveBeenCalledOnce();

		clip.scale = {
			x: new Keyframe([0, 60], [0.0, 0.2]),
			y: new Keyframe([0, 60], [0.2, 0.6])
		};

		clip.render(renderer, new Timestamp(1000));
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

		clip.render(renderer, new Timestamp());

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
		clip.render(renderer, new Timestamp());

		expect(clip.container.angle).toBe(93);
		expect(angleSpy).toHaveBeenCalledOnce();

		clip.rotation = new Keyframe([0, 60], [0, 180], { type: 'degrees' })

		clip.render(renderer, new Timestamp(1000));
		expect(clip.container.angle).toBe(90);
		expect(angleSpy).toHaveBeenCalledTimes(2);

		clip.rotation = function(this: TestClip, time: Timestamp) {
			expect(this).instanceOf(TestClip);

			return time.millis;
		}

		clip.render(renderer, new Timestamp(6));
		expect(Math.round(clip.container.angle)).toBe(6);
		expect(angleSpy).toHaveBeenCalledTimes(3);
	});

	it('should set the opacity on render', () => {
		const clip = new TestClip();
		const renderer = new WebGPURenderer();

		const alphaSpy = vi.spyOn(clip.container, 'alpha', 'set');

		clip.alpha = 0.72;
		clip.render(renderer, new Timestamp());

		expect(clip.container.alpha).toBe(0.72);
		expect(alphaSpy).toHaveBeenCalledOnce();

		clip.alpha = new Keyframe([0, 60], [0, 0.6]);

		clip.render(renderer, new Timestamp(1000));
		expect(clip.container.alpha).toBe(0.3);
		expect(alphaSpy).toHaveBeenCalledTimes(2);

		clip.alpha = function(this: TestClip, time: Timestamp) {
			expect(this).instanceOf(TestClip);

			return time.millis / 2;
		}

		clip.render(renderer, new Timestamp(1));
		expect(clip.container.alpha).toBe(0.5);
		expect(alphaSpy).toHaveBeenCalledTimes(3);
	});
});
