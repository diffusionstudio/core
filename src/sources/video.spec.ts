/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { setFetchMockReturnValue } from '../../vitest.mocks';
import { describe, expect, it, vi } from 'vitest';
import { VideoSource } from './video';
import { sleep } from '../utils';

describe('The Video Source Object', () => {
	it('should be createable from a http address', async () => {
		const resetFetch = setFetchMockReturnValue({
			ok: true,
			blob: async () => {
				await sleep(1);
				return new Blob([], { type: 'video/mp4' });
			},
			headers: {
				get(_: string) {
					return 'video/mp4'
				}
			} as any
		});

		const source = new VideoSource();
		const loadFn = vi.fn();
		source.on('load', loadFn);

		await source.from('https://external.url');

		expect(source.name).toBe('external.url');
		expect(source.mimeType).toBe('video/mp4');
		expect(source.external).toBe(true);
		expect(source.file).toBeUndefined();
		expect(source.externalURL).toBe('https://external.url');
		expect(source.objectURL).toBe('https://external.url');
		expect(loadFn).toHaveBeenCalledTimes(1);

		// file is being loaded in the background
		await sleep(1);
		expect(source.file).toBeInstanceOf(File);
		expect(loadFn).toHaveBeenCalledTimes(2);

		resetFetch();
	});

	it('should get a file after the asset has been fetched', async () => {
		const resetFetch = setFetchMockReturnValue({
			ok: true,
			blob: async () => {
				await sleep(1);
				return new Blob([], { type: 'video/mp4' });
			},
			headers: {
				get(_: string) {
					return 'video/mp4'
				}
			} as any
		});

		const source = new VideoSource();
		await source.from('https://external.mp4');

		const file = await source.getFile();

		expect(file).toBeInstanceOf(File);
		expect(file.name).toBe('external.mp4');

		resetFetch();
	});
});
