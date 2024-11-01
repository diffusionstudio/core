/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, expect, it } from 'vitest';
import { ImageSource } from './image';

describe('The Image Source Object', () => {
	it('should retrun a video as thumbnail', async () => {
		const file = new File([], 'file.png', { type: 'image/png' });
		const source = new ImageSource();

		await source.from(file);

		const thumbnail = await source.thumbnail();

		expect(thumbnail).toBeInstanceOf(Image);
	});

	it('should accept custom metadata', async () => {
		const metadata = { a: 1, b: 2 };
		const source = new ImageSource<typeof metadata>();
		source.metadata = metadata;
		expect(source.metadata).toEqual(metadata);
	});
});
