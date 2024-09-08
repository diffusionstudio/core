/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, expect, it } from 'vitest';
import { Deserializer2D, Deserializer1D } from './visual.deserializers';
import { Keyframe, Timestamp } from '../../models';
import type { Position } from '../../types';

describe('Deserializer1D', () => {
	it('should deserialize numbers and strings', () => {
		expect(Deserializer1D.fromJSON(5)).toBe(5);
		expect(Deserializer1D.fromJSON('50%')).toBe('50%');
	});

	it('should desialize Keyframes', () => {
		const keyframe = new Keyframe([30, 60], [30, 80], { extrapolate: 'extend' });
		const data = JSON.parse(JSON.stringify(keyframe));

		const rot = Deserializer1D.fromJSON(data);

		expect(rot).toBeInstanceOf(Keyframe);

		expect(rot.input[0]).toBe(1000);
		expect(rot.input[1]).toBe(2000);

		expect(rot.output[0]).toBe(30);
		expect(rot.output[1]).toBe(80);

		expect(rot.options.extrapolate).toBe('extend');
		expect(rot.options.type).toBe('number');
	});

	it('should not desialize functions', () => {
		const animation = (reltime: Timestamp) => reltime.frames;

		const data = JSON.parse(JSON.stringify({ animation }));
		const val = Deserializer1D.fromJSON(data.animation);

		expect(val).toBeUndefined();
	});
});

describe('Deserializer2D', () => {
	it('should deserialize strings and numbers', () => {
		const pos0: Position = {
			x: '100%',
			y: '200%',
		};
		expect(Deserializer2D.fromJSON(pos0).x).toBe('100%');
		expect(Deserializer2D.fromJSON(pos0).y).toBe('200%');

		const pos1: Position = {
			x: 5,
			y: 6,
		};

		expect(Deserializer2D.fromJSON(pos1).x).toBe(5);
		expect(Deserializer2D.fromJSON(pos1).y).toBe(6);
	});

	it('should desialize nested Keyframes', () => {
		const keyframes = {
			x: new Keyframe([30, 60], [30, 80], { extrapolate: 'extend' }),
			y: new Keyframe([90, 120], ['#000000', '#FFFFFF'], { type: 'color' })
		};
		const data = JSON.parse(JSON.stringify(keyframes));

		const pos = Deserializer2D.fromJSON(data) as any as typeof keyframes;

		expect(pos.x).toBeInstanceOf(Keyframe);

		expect(pos.x.input[0]).toBe(1000);
		expect(pos.x.input[1]).toBe(2000);

		expect(pos.x.output[0]).toBe(30);
		expect(pos.x.output[1]).toBe(80);

		expect(pos.x.options.extrapolate).toBe('extend');
		expect(pos.x.options.type).toBe('number');

		expect(pos.y).toBeInstanceOf(Keyframe);

		expect(pos.y.input[0]).toBe(3000);
		expect(pos.y.input[1]).toBe(4000);

		expect(pos.y.output[0]).toBe('#000000');
		expect(pos.y.output[1]).toBe('#FFFFFF');

		expect(pos.y.options.extrapolate).toBe('clamp');
		expect(pos.y.options.type).toBe('color');
	});

	it('should not desialize functions', () => {
		const animations = {
			x: (reltime: Timestamp) => reltime.frames,
			y: (reltime: Timestamp) => reltime.frames,
		};

		const data = JSON.parse(JSON.stringify(animations));
		const vals = Deserializer1D.fromJSON(data);

		expect(vals.x).toBeUndefined();
		expect(vals.y).toBeUndefined();
	});
});
