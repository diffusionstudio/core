/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComplexTextClip } from './text.complex';
import { Font } from './font';

// Blend of different test files
describe('Copying the ComplexTextClip', () => {
	let clip: ComplexTextClip;
	const fontAddFn = vi.fn();

	Object.assign(document, { fonts: { add: fontAddFn } });

	beforeEach(() => {
		clip = new ComplexTextClip('Hello World');
	});

	it('should transfer base properties', () => {
		const font = new Font({
			family: 'Bangers',
			style: 'normal',
			source: 'local(banger.ttf)'
		});
		font.loaded = true;

		clip.styles = [{
			fillStyle: '#FF00FF',
			font: font,
			fontSize: 12,
			stroke: {
				join: 'bevel',
				width: 20,
			},
		}];

		clip.background = {
			alpha: 0.2,
			fill: '#00FF00'
		};

		clip.maxWidth = 534;
		clip.textAlign = 'right';
		clip.textBaseline = 'bottom';

		const copy = clip.copy();

		expect(copy).toBeInstanceOf(ComplexTextClip)
		expect(copy.id).not.toBe(clip.id);
		expect(copy.name).toBe('Hello World');
		expect(copy.anchor.x).toBe(1);
		expect(copy.anchor.y).toBe(1);
		expect(copy.background?.alpha).toBe(0.2);
		expect(copy.background?.fill).toBe('#00FF00');
		expect(copy.maxWidth).toBe(534);
		expect(copy.textAlign).toBe('right');
		expect(copy.textBaseline).toBe('bottom');
		expect(copy.styles?.length).toBe(1);
		expect(copy.styles?.[0].fillStyle).toBe('#FF00FF');
		expect(copy.styles?.[0].font).toBeInstanceOf(Font);
		expect(copy.styles?.[0].font?.name).toBe('Bangers normal');
		expect(copy.styles?.[0].fontSize).toBe(12);
		expect(copy.styles?.[0].stroke?.join).toBe('bevel');
		expect(copy.styles?.[0].stroke?.width).toBe(20);
	});
});
