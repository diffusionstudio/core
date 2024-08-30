/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { Font } from './font';

describe('The Font Object', () => {
	const mockFn = vi.fn();

	Object.assign(document, { fonts: { add: mockFn } });

	afterEach(() => {
		mockFn.mockClear();
	});

	it('should be cloneable', () => {
		const font1 = new Font({
			family: 'Arial',
			source: 'local(arial.ttf)',
			style: 'normal',
		});
		const font2 = font1.copy();

		font2.family = 'Manrope';

		expect(font1.family).not.toBe(font2.family);
		expect(font2.name).toBe('Manrope normal');
	});

	it('should be able to load local fonts', async () => {
		const font = await new Font({
			family: 'Komika Axis',
			source: 'local(komika-axis.ttf)',
			style: 'normal',
		}).load();

		expect(font.family).toBe('Komika Axis');
		expect(font.style).toBe('normal');
		expect(font.name).toBe('Komika Axis normal');
		expect(font.source).toBe('local(komika-axis.ttf)');

		expect(mockFn).toBeCalledTimes(1);
	});

	it('should be able to load local fonts when copied', async () => {
		const font = await new Font({
			family: 'Komika Axis',
			source: 'local(komika-axis.ttf)',
			style: 'normal',
		}).load();

		expect(mockFn).toBeCalledTimes(1);

		const font2 = font.copy();
		await font2.load();

		expect(font2.family).toBe('Komika Axis');
		expect(font2.style).toBe('normal');
		expect(font2.name).toBe('Komika Axis normal');
		expect(font2.source).toBe('local(komika-axis.ttf)');

		expect(mockFn).toBeCalledTimes(1);
	});

	it('should be able to load web fonts', async () => {
		const font = await Font.fromFamily({ family: 'The Bold Font', weight: '500' }).load();

		expect(font.family).toBe('The Bold Font');
		expect(font.name).toBe('The Bold Font 500');
		expect(font.weight).toBe('500');
		expect(font.source?.startsWith('url(')).toBe(true);

		expect(mockFn).toBeCalledTimes(1);
	});

	it('should be able to load remote fonts when copied', async () => {
		const font = await Font.fromFamily({ family: 'The Bold Font', weight: '500' }).load();

		expect(mockFn).toBeCalledTimes(1);

		const font2 = font.copy();
		await font2.load();

		expect(font2.family).toBe('The Bold Font');
		expect(font2.name).toBe('The Bold Font 500');
		expect(font2.weight).toBe('500');
		expect(font2.source?.startsWith('url(')).toBe(true);

		expect(mockFn).toBeCalledTimes(1);
	});

	it('be able to retrieve web and local fonts', async () => {
		const fonts = await Font.localFonts();

		// length is defined in the vite test setup
		expect(fonts.length).toBe(4);

		expect(fonts.at(0)?.family).toBe('Al Bayan');
		expect(fonts.at(0)?.variants.length).toBe(2);
		expect(fonts.at(0)?.variants.at(0)?.family).toBe('Al Bayan');
		expect(fonts.at(0)?.variants.at(0)?.style).toBe('Plain');
		expect(fonts.at(0)?.variants.at(0)?.source).toContain('AlBayan');

		expect(fonts.length).toBe(4);
		expect(fonts.at(2)?.family).toBe('Al Tarikh');
		expect(fonts.at(2)?.variants.length).toBe(1);
		expect(fonts.at(2)?.variants.at(0)?.family).toBe('Al Tarikh');
		expect(fonts.at(2)?.variants.at(0)?.style).toBe('Regular');
		expect(fonts.at(2)?.variants.at(0)?.source).toContain('AlTarikh');
	});

	it('be able to retrieve web and local fonts', async () => {
		const fonts = Font.webFonts();

		// length could change with more fonts being added
		expect(fonts.length).toBeGreaterThan(5);

		expect(fonts.at(0)?.family).toBe('The Bold Font');
		expect(fonts.at(0)?.variants.length).toBe(1);
		expect(fonts.at(0)?.variants.at(0)?.family).toBe('The Bold Font');
		expect(fonts.at(0)?.variants.at(0)?.weight).toBe('500');
		expect(fonts.at(0)?.variants.at(0)?.source).toContain('url');

		expect(fonts.at(2)?.family).toBe('Geologica');
		expect(fonts.at(2)?.variants.length).toBe(9);
		expect(fonts.at(2)?.variants.at(0)?.family).toBe('Geologica');
		expect(fonts.at(2)?.variants.at(0)?.weight).toBe('100');
		expect(fonts.at(2)?.variants.at(0)?.source).toContain('url');
	});
});
