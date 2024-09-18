/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { downloadObject, showFileDialog } from './browser';

describe('The browser utils', () => {
	const a = document.createElement('a');
	const input = document.createElement('input');

	const clickSpy = vi.spyOn(a, 'click');
	const removeSpy = vi.spyOn(a, 'remove');
	const createSpy = vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
		expect(tag).toBeTypeOf('string');

		if (tag == 'a') {
			return a;
		} else {
			return input;
		}
	});

	beforeEach(() => {
		clickSpy.mockClear();
		removeSpy.mockClear();
		createSpy.mockClear();
	})

	it('should download an object from an url (downloadObject)', async () => {
		downloadObject('https://myurl.com/example.mp4');
		expect(a.download).toBe('untitled');
		expect(a.href).toBe('https://myurl.com/example.mp4');

		expect(createSpy).toBeCalledTimes(1);
		expect(clickSpy).toBeCalledTimes(1);
		expect(removeSpy).toBeCalledTimes(1);
	});

	it('should download an a blob with custom name (downloadObject)', async () => {
		downloadObject(new Blob(), 'temp.mp4');
		expect(a.download).toBe('temp.mp4');
		expect(a.href).toBe('blob:chrome://new-tab-page/3dc0f2b7-7773-4cd4-a397-2e43b1bba7cd');

		expect(createSpy).toBeCalledTimes(1);
		expect(clickSpy).toBeCalledTimes(1);
		expect(removeSpy).toBeCalledTimes(1);
	});

	it('should download base 64 encoded image data (downloadObject)', async () => {
		const img = "data:image/svg+xml;base64,";
		downloadObject(img, 'temp.mp4');
		expect(a.download).toBe('temp.svg');
		expect(a.href).toBe('blob:chrome://new-tab-page/3dc0f2b7-7773-4cd4-a397-2e43b1bba7cd');

		expect(createSpy).toBeCalledTimes(1);
		expect(clickSpy).toBeCalledTimes(1);
		expect(removeSpy).toBeCalledTimes(1);
	});

	it('should show a save dialog (showFileDialog)', async () => {
		const clickSpy = vi.spyOn(input, 'click');

		const promise = showFileDialog('video/mp4', false);
		input.dispatchEvent(new Event('change'));
		await promise;

		expect(input.type).toBe('file');
		expect(input.accept).toBe('video/mp4');
		expect(input.multiple).toBe(false);

		expect(createSpy).toBeCalledTimes(1);
		expect(clickSpy).toBeCalledTimes(1);
	});
});
