/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { setFetchMockReturnValue } from '../../vitest.mocks';
import { describe, expect, it, vi } from 'vitest';
import { Source } from './source';

describe('The Source Object', () => {
	it('should be createable from a file', async () => {
		const file = new File([], 'file.mp4', { type: 'video/mp4' });
		const source = new Source();
		const loadFn = vi.fn();
		source.on('load', loadFn);

		await source.from(file);

		expect(source.name).toBe('file.mp4');
		expect(source.mimeType).toBe('video/mp4');
		expect(source.external).toBe(false);
		expect(source.file).toBeInstanceOf(File);
		expect(loadFn).toHaveBeenCalledTimes(1);
	});

	it('should not load from an file with invalid mimetype', async () => {
		const file = new File([], '_.m4a', { type: 'video/m4a' });
		await expect(() => new Source().from(file)).rejects.toThrowError();
	});

	it('should be createable from a http address', async () => {
		const resetFetch = setFetchMockReturnValue({
			ok: true,
			blob: async () => new Blob([], { type: 'video/mp4' }),
		});

		const source = new Source();
		const loadFn = vi.fn();
		source.on('load', loadFn);

		await source.from('https://external.url');

		expect(source.name).toBe('external.url');
		expect(source.mimeType).toBe('video/mp4');
		expect(source.external).toBe(true);
		expect(source.file).toBeInstanceOf(File);
		expect(source.externalURL).toBe('https://external.url');
		expect(loadFn).toHaveBeenCalledTimes(1);

		resetFetch();
	});

	it('should not load from a http address with invalid mimetype', async () => {
		const resetFetch = setFetchMockReturnValue({
			ok: true,
			blob: async () => new File([], '_.m4a', { type: 'video/m4a' }),
		});

		await expect(() => new Source().from('https://external.url')).rejects.toThrowError();

		resetFetch();
	});

	it('should get a file after the asset has been fetched', async () => {
		const file = new File([], 'file.mp4', { type: 'video/mp4' });

		const source = new Source();
		await source.from(file);
		
		expect(await source.getFile()).toBeInstanceOf(File);
		expect((await source.getFile()).name).toBe('file.mp4');
	});

	it('should not get the file if no asset has been added yet', async () => {
		const source = new Source();
		await expect(() => source.getFile()).rejects.toThrowError();
	});

	it('should create a object url', async () => {
		const file = new File([], 'file.mp4', { type: 'video/mp4' });

		const source = new Source();
		await source.from(file);
		
		const url = await source.createObjectURL();
		expect(url).toBe('blob:chrome://new-tab-page/3dc0f2b7-7773-4cd4-a397-2e43b1bba7cd');
	});

	it('should be removable', async () => {
		const file = new File([], 'file.mp4', { type: 'video/mp4' });
		const source = await new Source().from(file);

		expect(source.name).toBe('file.mp4');

		await source.createObjectURL();
		
		const revokeObjectURL = vi.fn();
		vi.stubGlobal('URL', { revokeObjectURL });

		source.remove();

		expect(revokeObjectURL).toHaveBeenCalledTimes(1);
		expect(source.file).toBeUndefined();
		expect(source.objectURL).toBeUndefined();
	});
});
