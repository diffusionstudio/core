/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, expect, it, vi } from 'vitest';
import { documentToSvgImageUrl, fontToBas64Url } from './html.utils';
import { setFetchMockReturnValue } from '../../vitest.mocks';

describe('documentToSvgImageUrl', () => {
	it('should return empty SVG if document is not provided', () => {
		const result = documentToSvgImageUrl();
		expect(result).toBe("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3C/svg%3E");
	});

	it('should return empty SVG if document has no body', () => {
		const mockDocument = document.implementation.createDocument('', '', null);
		const result = documentToSvgImageUrl(mockDocument);
		expect(result).toBe("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3C/svg%3E");
	});

	it('should return valid SVG when document has body and style', () => {
		const mockDocument = document.implementation.createHTMLDocument('Test Document');
		const body = mockDocument.body;
		const style = mockDocument.createElement('style');
		style.textContent = 'body { background: red; }';
		mockDocument.head.appendChild(style);
		body.innerHTML = '<div>Hello World</div>';

		const result = documentToSvgImageUrl(mockDocument);

		// Check if result starts with valid data URI and contains parts of the body and style
		expect(result).toContain('data:image/svg+xml;base64,');
		const decodedSvg = atob(result.split(',')[1]);
		expect(decodedSvg).toContain('Hello World');
		expect(decodedSvg).toContain('body { background: red; }');
	});

	it('should return valid SVG when document has body but no style', () => {
		const mockDocument = document.implementation.createHTMLDocument('Test Document');
		const body = mockDocument.body;
		body.innerHTML = '<div>Hello World</div>';

		const result = documentToSvgImageUrl(mockDocument);

		// Check if result starts with valid data URI and contains parts of the body
		expect(result).toContain('data:image/svg+xml;base64,');
		const decodedSvg = atob(result.split(',')[1]);
		expect(decodedSvg).toContain('Hello World');
		expect(decodedSvg).not.toContain('<style>'); // There should be no style element
	});

	it('should handle documents with nested elements', () => {
		const mockDocument = document.implementation.createHTMLDocument('Test Document');
		const body = mockDocument.body;
		body.innerHTML = '<div><p>Nested</p></div>';

		const result = documentToSvgImageUrl(mockDocument);

		// Check if result starts with valid data URI and contains nested elements
		expect(result).toContain('data:image/svg+xml;base64,');
		const decodedSvg = atob(result.split(',')[1]);
		expect(decodedSvg).toContain('<div><p>Nested</p></div>');
	});
});

describe('fontToBas64Url', () => {
	it('should return base64 font URL with format woff2 by default', async () => {
		// Mock the response from fetch to return a Blob
		const resetFetch = setFetchMockReturnValue({
			ok: true,
			blob: async () => new Blob(['font-data'], { type: 'font/woff2' }),
		});

		// Mock FileReader and its behavior
		vi.stubGlobal('FileReader', class {
			readAsDataURL = vi.fn();
			set onloadend(fn: () => void) {
				fn();
			}
			result = 'data:font/woff2;base64,Zm9udC1kYXRh';
		});

		const result = await fontToBas64Url('https://example.com/font.woff2');

		expect(result).toBe(`url(data:font/woff2;base64,Zm9udC1kYXRh) format('woff2')`);

		resetFetch()
		vi.unstubAllGlobals(); // Cleanup
	});

	it('should return base64 font URL with format ttf', async () => {
		// Mock the response from fetch to return a Blob
		const resetFetch = setFetchMockReturnValue({
			ok: true,
			blob: async () => new Blob(['font-data'], { type: 'font/ttf' }),
		});

		// Mock FileReader and its behavior
		vi.stubGlobal('FileReader', class {
			readAsDataURL = vi.fn();
			set onloadend(fn: () => void) {
				fn();
			}
			result = 'data:font/ttf;base64,Zm9udC1kYXRh';
		});

		const result = await fontToBas64Url('https://example.com/font.ttf');

		expect(result).toBe(`url(data:font/ttf;base64,Zm9udC1kYXRh) format('truetype')`);

		resetFetch()
		vi.unstubAllGlobals(); // Cleanup
	});
});
