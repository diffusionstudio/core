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

	it('should not load from a http address when the response in not ok', async () => {
		const resetFetch = setFetchMockReturnValue({ ok: false });

		await expect(() => new VideoSource().from('https://external.url')).rejects.toThrowError();

		resetFetch();
	});

	it('should throw an error if the file is not available after it has been downloaded', async () => {
		const source = new VideoSource();

		const promise = source.getFile();

		source.trigger('load', undefined);

		await expect(() => promise).rejects.toThrowError();
	});

	it('should retrun a video as thumbnail', async () => {
		const video = document.createElement('video');

		const createSpy = vi.spyOn(document, 'createElement').mockImplementationOnce(() => video);

		const file = new File([], 'file.mp4', { type: 'video/mp4' });
		const source = new VideoSource();

		await source.from(file);

		const thumbnail = await source.thumbnail();

		expect(createSpy).toBeCalledTimes(1);
		expect(thumbnail).toBeInstanceOf(HTMLVideoElement);
		expect(video.src).toBe('blob:chrome://new-tab-page/3dc0f2b7-7773-4cd4-a397-2e43b1bba7cd');

		vi.spyOn(video, 'duration', 'get').mockReturnValue(10);

		video.dispatchEvent(new Event('loadedmetadata'));

		expect(source.duration.seconds).toBe(10);

		video.height = 1080;
		video.width = 1920;

		const seekSpy = vi.spyOn(video, 'currentTime', 'set');
		const rectSpy = vi.spyOn(video, 'getBoundingClientRect').mockReturnValue({
			width: 200
		} as any);

		video.dispatchEvent(new Event('mousemove'));

		expect(seekSpy).toBeCalledTimes(1);
		expect(rectSpy).toBeCalledTimes(1);

		rectSpy.mockRestore();
	});

	it('should accept custom metadata', async () => {
		const metadata = { a: 1, b: 2 };
		const source = new VideoSource<typeof metadata>();
		source.metadata = metadata;
		expect(source.metadata).toEqual(metadata);
	});
});
