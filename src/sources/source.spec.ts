/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { setFetchMockReturnValue } from '../../vitest.mocks';
import { describe, expect, it } from 'vitest';
import { Source } from './source';

describe('The Source Object', () => {
	it('should be createable from a file', async () => {
		let file = new File([], 'file.mp4', { type: 'video/mp4' });
		let source = await Source.from(file);

		expect(source.objectURL).toBe(
			'blob:chrome://new-tab-page/3dc0f2b7-7773-4cd4-a397-2e43b1bba7cd',
		);
		expect(source.name).toBe('file.mp4');
		expect(source.mimeType).toBe('video/mp4');
		expect(source.external).toBe(false);

		file = new File([], 'file.mp3', { type: 'audio/mp3' });

		source = await Source.from(file);
		expect(source.objectURL).toBe(
			'blob:chrome://new-tab-page/3dc0f2b7-7773-4cd4-a397-2e43b1bba7cd',
		);
		expect(source.name).toBe('file.mp3');
		expect(source.mimeType).toBe('audio/mp3');
		expect(source.external).toBe(false);
	});

	it('should not be createable with an invalid mimetype', async () => {
		const file = new File([], '_.m4a', { type: 'video/m4a' });
		await expect(() => Source.from(file)).rejects.toThrowError();
	});

	it('should be createable from a http address', async () => {
		const resetFetch = setFetchMockReturnValue({
			ok: true,
			blob: async () => new Blob([], { type: 'video/mp4' }),
		});

		const source = await Source.from('https://external.url');

		expect(source.objectURL).toBe(
			'blob:chrome://new-tab-page/3dc0f2b7-7773-4cd4-a397-2e43b1bba7cd',
		);
		expect(source.name).toBe('external.url');
		expect(source.mimeType).toBe('video/mp4');
		expect(source.external).toBe(true);

		resetFetch();
	});
});
