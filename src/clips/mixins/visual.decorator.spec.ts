/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Keyframe, Timestamp } from '../../models';
import { VisualMixin } from './visual';
import { Clip } from '../clip';
import { Sprite, Texture } from 'pixi.js';
import { visualize } from './visual.decorator';
import { Composition } from '../../composition';

import type { VisualMixinProps } from './visual.interfaces';
import type { ClipProps } from '../clip';

describe('The visualize decorator', () => {
	interface TestClipProps extends VisualMixinProps, ClipProps { }

	const updateFn = vi.fn();

	beforeEach(() => {
		updateFn.mockClear();
	})

	class TestClip extends VisualMixin(Clip<TestClipProps>) {
		@visualize
		public update(time: Timestamp): void | Promise<void> {
			updateFn(time);
		}
	}

	it("should center the clip when position 'center' is set", async () => {
		const clip = new TestClip();
		clip.view.addChild(new Sprite());
		await new Composition({ width: 1000, height: 2000 })
			.createTrack('base')
			.add(clip);

		const posSpy = vi.spyOn(clip.view.position, 'set');

		clip.position = 'center';
		clip.update(new Timestamp(400));

		expect(clip.view.x).toBe(500);
		expect(clip.view.y).toBe(1000);
		expect(clip.position.x).toBe('50%');
		expect(clip.position.y).toBe('50%');
		expect(clip.anchor.x).toBe(0.5);
		expect(clip.anchor.y).toBe(0.5);
		expect(posSpy).toHaveBeenCalledOnce();
		expect(updateFn).toHaveBeenCalled();
		expect(updateFn.mock.calls.at(-1)![0].millis).toBe(400);
	});

	it('should set the position on render - number', async () => {
		const clip = new TestClip();

		await new Composition({ width: 1000, height: 2000 })
			.createTrack('base')
			.add(clip);

		const posSpy = vi.spyOn(clip.view.position, 'set');

		clip.position = { x: 5, y: 7 };

		posSpy.mockClear()
		clip.update(new Timestamp());

		expect(clip.view.x).toBe(5);
		expect(clip.view.y).toBe(7);
		expect(posSpy).toHaveBeenCalledOnce();
	});

	it('should set the position on render - function', async () => {
		const clip = new TestClip();
		await new Composition({ width: 1000, height: 2000 })
			.createTrack('base')
			.add(clip);

		const posSpy = vi.spyOn(clip.view.position, 'set');

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
		clip.update(new Timestamp(1000));

		expect(clip.view.x).toBe(1000);
		expect(clip.view.y).toBe(2000);
		expect(posSpy).toHaveBeenCalledOnce();
	});

	it('should set the position on render - keyframe', async () => {
		const clip = new TestClip();

		await new Composition({ width: 1000, height: 2000 })
			.createTrack('base')
			.add(clip);

		const posSpy = vi.spyOn(clip.view.position, 'set');

		clip.position = {
			x: new Keyframe([0, 60], [100, 200]),
			y: new Keyframe([0, 60], [0, 100])
		};

		posSpy.mockClear()
		clip.update(new Timestamp(1000));

		expect(clip.view.x).toBe(150);
		expect(clip.view.y).toBe(50);
		expect(posSpy).toHaveBeenCalledOnce();
	});

	it('should set the position on render - keyframe relative', async () => {
		const clip = new TestClip();

		await new Composition({ width: 1000, height: 2000 })
			.createTrack('base')
			.add(clip);

		const posSpy = vi.spyOn(clip.view.position, 'set');

		clip.position = {
			x: new Keyframe([0, 60], [100, 200]),
			y: new Keyframe([0, 60], [0, 100])
		};

		// Make sure the relative time is used
		clip.stop = 100;
		clip.start = 30;

		posSpy.mockClear();
		clip.update(new Timestamp(1000));

		expect(clip.view.x).toBe(100);
		expect(clip.view.y).toBe(0);
		expect(posSpy).toHaveBeenCalledOnce();
	});

	it('should set the position on render - number relative', async () => {
		const clip = new TestClip();

		await new Composition({ width: 1000, height: 2000 })
			.createTrack('base')
			.add(clip);

		const posSpy = vi.spyOn(clip.view.position, 'set');

		clip.position = {
			x: '20%',
			y: '30%',
		}

		// Make sure the relative time is used
		clip.stop = 100;
		clip.start = 30;

		posSpy.mockClear();
		clip.update(new Timestamp(1000));

		expect(clip.view.x).toBe(200);
		expect(clip.view.y).toBe(600);
		expect(posSpy).toHaveBeenCalledOnce();
	});

	it('should set the position on render - function relative', async () => {
		const clip = new TestClip();

		await new Composition({ width: 1000, height: 2000 })
			.createTrack('base')
			.add(clip);

		const posSpy = vi.spyOn(clip.view.position, 'set');


		clip.position = {
			x: (time: Timestamp) => time.millis,
			y: (time: Timestamp) => time.millis * 2,
		};

		// Make sure the relative time is used
		clip.start = 30;

		posSpy.mockClear();
		clip.update(new Timestamp(2000));

		expect(clip.view.x).toBe(1000);
		expect(clip.view.y).toBe(2000);
	});

	it('should add the translate values on render', () => {
		const clip = new TestClip();
		const posSpy = vi.spyOn(clip.view.position, 'set');

		clip.position = { x: 5, y: 7 };
		clip.translate = { x: 3, y: 4 };
		clip.update(new Timestamp());

		expect(clip.view.x).toBe(8);
		expect(clip.view.y).toBe(11);
		expect(posSpy).toHaveBeenCalledOnce();

		clip.position = { x: 20, y: 60 };
		clip.translate = {
			x: new Keyframe([0, 60], [100, 200]),
			y: new Keyframe([0, 60], [0, 100])
		};

		clip.update(new Timestamp(1000));
		expect(clip.view.x).toBe(150 + 20);
		expect(clip.view.y).toBe(50 + 60);
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

		clip.update(new Timestamp(80));
		expect(clip.view.x).toBe(130);
		expect(clip.view.y).toBe(150);
		expect(posSpy).toHaveBeenCalledTimes(3);
	});

	it('should set the height on render', async () => {
		const clip = new TestClip();
		const canvas = document.createElement('canvas');
		canvas.width = 500;
		canvas.height = 400;
		clip.view.addChild(new Sprite(Texture.from(canvas)));

		await new Composition({ width: 1000, height: 2000 })
			.createTrack('base')
			.add(clip);

		const heightSpy = vi.spyOn(clip.view, 'height', 'set');
		const scaleSpy = vi.spyOn(clip.view.scale, 'set');

		clip.update(new Timestamp());

		expect(heightSpy).not.toHaveBeenCalled();
		expect(scaleSpy).not.toHaveBeenCalled();

		clip.height = '100%';

		clip.update(new Timestamp());

		expect(heightSpy).toHaveBeenCalledOnce();
		expect(scaleSpy).toHaveBeenCalledOnce();

		expect(clip.view.height).toBe(2000);
		expect(clip.view.width).toBe(2500);
		expect(clip.view.scale.y).toBe(5);
		expect(clip.view.scale.x).toBe(5);

		clip.height = new Keyframe([0, 12], [0, 200]);

		vi.clearAllMocks();
		clip.update(new Timestamp(200));

		expect(heightSpy).toHaveBeenCalledOnce();
		expect(scaleSpy).toHaveBeenCalledOnce();

		expect(clip.view.height).toBe(100);
		expect(clip.view.width).toBe(125);
		expect(clip.view.scale.y).toBe(0.25);
		expect(clip.view.scale.x).toBe(0.25);

		clip.height = function(this: TestClip, time: Timestamp) {
			expect(this).instanceOf(TestClip);

			return time.millis;
		}

		vi.clearAllMocks();
		clip.update(new Timestamp(200));

		expect(heightSpy).toHaveBeenCalledOnce();
		expect(scaleSpy).toHaveBeenCalledOnce();

		expect(clip.view.height).toBe(200);
		expect(clip.view.width).toBe(250);
		expect(clip.view.scale.y).toBe(0.5);
		expect(clip.view.scale.x).toBe(0.5);

		clip.height = 800;

		vi.clearAllMocks();
		clip.update(new Timestamp(200));

		expect(heightSpy).toHaveBeenCalledOnce();
		expect(scaleSpy).toHaveBeenCalledOnce();

		expect(clip.view.height).toBe(800);
		expect(clip.view.width).toBe(1000);
		expect(clip.view.scale.y).toBe(2);
		expect(clip.view.scale.x).toBe(2);
	});

	it('should set the width on render', async () => {
		const clip = new TestClip();

		const canvas = document.createElement('canvas');
		canvas.width = 500;
		canvas.height = 400;
		clip.view.addChild(new Sprite(Texture.from(canvas)));

		await new Composition({ width: 1000, height: 2000 })
			.createTrack('base')
			.add(clip);

		const widthSpy = vi.spyOn(clip.view, 'width', 'set');
		const scaleSpy = vi.spyOn(clip.view.scale, 'set');

		clip.update(new Timestamp());

		expect(widthSpy).not.toHaveBeenCalled();
		expect(scaleSpy).not.toHaveBeenCalled();

		clip.width = '100%';

		clip.update(new Timestamp());

		expect(widthSpy).toHaveBeenCalledOnce();
		expect(scaleSpy).toHaveBeenCalledOnce();

		expect(clip.view.height).toBe(800);
		expect(clip.view.width).toBe(1000);
		expect(clip.view.scale.y).toBe(2);
		expect(clip.view.scale.x).toBe(2);

		clip.width = function(this: TestClip, time: Timestamp) {
			expect(this).instanceOf(TestClip);

			return time.millis;
		}

		vi.clearAllMocks();
		clip.update(new Timestamp(250));

		expect(widthSpy).toHaveBeenCalledOnce();
		expect(scaleSpy).toHaveBeenCalledOnce();

		expect(clip.view.height).toBe(200);
		expect(clip.view.width).toBe(250);
		expect(clip.view.scale.y).toBe(0.5);
		expect(clip.view.scale.x).toBe(0.5);

		clip.width = new Keyframe([0, 12], [0, 200]);

		vi.clearAllMocks();
		clip.update(new Timestamp(200));

		expect(widthSpy).toHaveBeenCalledOnce();
		expect(scaleSpy).toHaveBeenCalledOnce();

		expect(clip.view.height).toBe(80);
		expect(clip.view.width).toBe(100);
		expect(clip.view.scale.y).toBe(0.2);
		expect(clip.view.scale.x).toBe(0.2);

		clip.width = 1500;

		vi.clearAllMocks();
		clip.update(new Timestamp());

		expect(widthSpy).toHaveBeenCalledOnce();
		expect(scaleSpy).toHaveBeenCalledOnce();

		expect(clip.view.height).toBe(1200);
		expect(clip.view.width).toBe(1500);
		expect(clip.view.scale.y).toBe(3);
		expect(clip.view.scale.x).toBe(3);
	});

	it('should set the width and height on render', async () => {
		const clip = new TestClip();
		const canvas = document.createElement('canvas');
		canvas.width = 500;
		canvas.height = 400;
		clip.view.addChild(new Sprite(Texture.from(canvas)))

		const widthSpy = vi.spyOn(clip.view, 'width', 'set');
		const heightSpy = vi.spyOn(clip.view, 'height', 'set');
		const scaleSpy = vi.spyOn(clip.view.scale, 'set');

		clip.width = 700;
		clip.height = 900;

		clip.update(new Timestamp());

		expect(widthSpy).toHaveBeenCalledOnce();
		expect(heightSpy).toHaveBeenCalledOnce();
		expect(scaleSpy).not.toHaveBeenCalled();

		expect(clip.view.height).toBe(900);
		expect(clip.view.width).toBe(700);
	});

	it('should be able to scale x and y when scale is a number', () => {
		const clip = new TestClip();
		const scaleSpy = vi.spyOn(clip.view.scale, 'set');

		clip.scale = 0.4;
		clip.update(new Timestamp());

		expect(clip.scale.x).toBe(0.4);
		expect(clip.scale.y).toBe(0.4);
		expect(clip.view.scale._x).toBe(0.4);
		expect(clip.view.scale._y).toBe(0.4);
		expect(scaleSpy).toHaveBeenCalledOnce();
	});

	it('should be able to scale x and y when scale is a Keyframe', () => {
		const clip = new TestClip();
		const scaleSpy = vi.spyOn(clip.view.scale, 'set');

		clip.scale = new Keyframe([30, 90], [0, 100]);
		clip.start = 30;
		clip.update(new Timestamp(3000)); // 90 frames

		expect(clip.scale.x).toBeInstanceOf(Keyframe);
		expect(clip.scale.y).toBeInstanceOf(Keyframe);
		expect(clip.view.scale._x).toBe(50);
		expect(clip.view.scale._y).toBe(50);
		expect(scaleSpy).toHaveBeenCalledOnce();
	});

	it('should be able to scale as a Function', () => {
		const clip = new TestClip();
		const scaleSpy = vi.spyOn(clip.view.scale, 'set');

		clip.scale =  function (this: TestClip, time: Timestamp) {
			expect(this).instanceOf(TestClip);

			return time.millis;
		}

		clip.update(new Timestamp(50));

		expect(clip.scale.x).toBeTypeOf('function');
		expect(clip.scale.y).toBeTypeOf('function');
		expect(clip.view.scale._x).toBe(50);
		expect(clip.view.scale._y).toBe(50);
		expect(scaleSpy.mock.calls[0][0]).toBe(50);
	});

	it('should be able to scale x and y as a Function', () => {
		const clip = new TestClip();
		const scaleSpy = vi.spyOn(clip.view.scale, 'set');

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

		clip.update(new Timestamp(50));

		expect(clip.scale.x).toBeTypeOf('function');
		expect(clip.scale.y).toBeTypeOf('function');
		expect(clip.view.scale._x).toBe(50);
		expect(clip.view.scale._y).toBe(50);
		expect(scaleSpy.mock.calls[0][0]).toBe(50);
	});

	it('should set scale x any y independently on render', () => {
		const clip = new TestClip();
		const posSpy = vi.spyOn(clip.view.scale, 'set');

		clip.scale = { x: 0.7, y: 0.4 };
		clip.update(new Timestamp());

		expect(clip.view.scale._x).toBe(0.7);
		expect(clip.view.scale._y).toBe(0.4);
		expect(posSpy).toHaveBeenCalledOnce();

		clip.scale = {
			x: new Keyframe([0, 60], [0.0, 0.2]),
			y: new Keyframe([0, 60], [0.2, 0.6])
		};

		clip.update(new Timestamp(1000));
		expect(clip.view.scale._x).toBe(0.1);
		expect(clip.view.scale._y).toBe(0.4);
		expect(posSpy).toHaveBeenCalledTimes(2);
	});

	it('should multiply the scale set by the height and width', async () => {
		const clip = new TestClip();
		const canvas = document.createElement('canvas');
		canvas.width = 500;
		canvas.height = 400;
		clip.view.addChild(new Sprite(Texture.from(canvas)))

		await new Composition({ width: 1000, height: 2000 })
			.createTrack('base')
			.add(clip);

		const scaleSpy = vi.spyOn(clip.view.scale, 'set');

		clip.width = '100%';
		clip.scale = {
			x: 3,
			y: 1.5
		}

		clip.update(new Timestamp());

		expect(scaleSpy).toHaveBeenCalledTimes(2);

		expect(clip.view.height).toBe(800 * 1.5);
		expect(clip.view.width).toBe(1000 * 3);
		expect(clip.view.scale.y).toBe(2 * 1.5);
		expect(clip.view.scale.x).toBe(2 * 3);
	});

	it('should set the rotation on render', () => {
		const clip = new TestClip();
		const angleSpy = vi.spyOn(clip.view, 'angle', 'set');

		clip.rotation = 93;
		clip.update(new Timestamp());

		expect(clip.view.angle).toBe(93);
		expect(angleSpy).toHaveBeenCalledOnce();

		clip.rotation = new Keyframe([0, 60], [0, 180])

		clip.update(new Timestamp(1000));
		expect(clip.view.angle).toBe(90);
		expect(angleSpy).toHaveBeenCalledTimes(2);

		clip.rotation = function(this: TestClip, time: Timestamp) {
			expect(this).instanceOf(TestClip);

			return time.millis;
		}

		clip.update(new Timestamp(6));
		expect(Math.round(clip.view.angle)).toBe(6);
		expect(angleSpy).toHaveBeenCalledTimes(3);
	});

	it('should set the opacity on render', () => {
		const clip = new TestClip();
		const alphaSpy = vi.spyOn(clip.view, 'alpha', 'set');

		clip.alpha = 0.72;
		clip.update(new Timestamp());

		expect(clip.view.alpha).toBe(0.72);
		expect(alphaSpy).toHaveBeenCalledOnce();

		clip.alpha = new Keyframe([0, 60], [0, 0.6]);

		clip.update(new Timestamp(1000));
		expect(clip.view.alpha).toBe(0.3);
		expect(alphaSpy).toHaveBeenCalledTimes(2);

		clip.alpha = function(this: TestClip, time: Timestamp) {
			expect(this).instanceOf(TestClip);

			return time.millis / 2;
		}

		clip.update(new Timestamp(1));
		expect(clip.view.alpha).toBe(0.5);
		expect(alphaSpy).toHaveBeenCalledTimes(3);
	});
});
