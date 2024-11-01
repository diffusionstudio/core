/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, expect, it, vi } from 'vitest';
import { HtmlSource } from './html';
import { setFetchMockReturnValue } from '../../vitest.mocks';
import { sleep } from '../utils';

describe('The Html Source Object', () => {
	it('should create an object url when the iframe loads', async () => {
		const file = new File([], 'test.html', { type: 'text/html' });
		const source = new HtmlSource();

		const evtMock = mockIframeValid(source);
		mockDocumentValid(source);

		await source.from(file);

		expect(source.name).toBe('test.html');
		expect(source.mimeType).toBe('text/html');
		expect(source.external).toBe(false);
		expect(source.file).toBeInstanceOf(File);
		expect(source).toBeInstanceOf(HtmlSource);

		const url = await source.createObjectURL();
		expect(url).toBe("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3C/svg%3E");
		expect(evtMock).toHaveBeenCalledTimes(1);

		await source.createObjectURL();

		expect(evtMock).toHaveBeenCalledTimes(1);
	});

	it('should not be able to load an invalid source', async () => {
		const file = new File([], 'test.html', { type: 'text/html' });
		const source = new HtmlSource();

		const evtMock = mockIframeInvalid(source);
		mockDocumentValid(source);

		await expect(() => source.from(file)).rejects.toThrowError();
		expect(evtMock).toHaveBeenCalledTimes(1);
	});

	it('should have a valid document getter', async () => {
		const source = new HtmlSource();

		expect(source.document).toBeTruthy();
	});

	it('should create an object url after the fetch has been completed', async () => {
		const resetFetch = setFetchMockReturnValue({
			ok: true,
			blob: async () => {
				await sleep(10);
				return new Blob([], { type: 'text/html' });
			},
		});

		const source = new HtmlSource();

		mockIframeValid(source);

		source.from('https://external.html');

		expect(source.objectURL).toBeUndefined();

		const url = await source.createObjectURL();

		expect(url).toBe("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3C/svg%3E");

		expect(source.objectURL).toBeDefined();

		resetFetch();
	});

	it('should retrun a video as thumbnail', async () => {
		const file = new File([], 'test.html', { type: 'text/html' });
		const source = new HtmlSource();

		mockIframeValid(source);
		mockDocumentValid(source);

		await source.from(file);

		const thumbnail = await source.thumbnail();

		expect(thumbnail).toBeInstanceOf(Image);
	});

	it('should accept custom metadata', async () => {
		const metadata = { a: 1, b: 2 };
		const source = new HtmlSource<typeof metadata>();
		source.metadata = metadata;
		expect(source.metadata).toEqual(metadata);
	});
});

function mockIframeValid(source: HtmlSource) {
	return vi.spyOn(source.iframe, 'onload', 'set')
		.mockImplementation(function (this: HTMLMediaElement, fn) {
			fn?.call(this, new Event('load'));
		});
}

function mockIframeInvalid(source: HtmlSource) {
	return vi.spyOn(source.iframe, 'onerror', 'set')
		.mockImplementation(function (this: HTMLMediaElement, fn) {
			fn?.call(this, new Event('error'));
		});
}

function mockDocumentValid(source: HtmlSource) {
	return vi.spyOn(source, 'document', 'get')
		.mockReturnValue({
			body: {
				scrollWidth: 200,
				scrollHeight: 400,
			},
			cloneNode: () => ({
				getElementsByTagName: () => ({
					item: () => undefined
				})
			})
		} as any);
}