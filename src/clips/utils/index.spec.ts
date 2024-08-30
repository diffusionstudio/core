/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, expect, it } from 'vitest';
import { SUPPORTED_MIME_TYPES } from '../../fixtures';
import { parseMimeType } from '.';

describe('The Clip utils', () => {
	it('should be able to validate mime types', () => {
		for (const mimeType of Object.keys(SUPPORTED_MIME_TYPES.MIXED)) {
			expect(parseMimeType(mimeType)).toBe(mimeType);
		}

		const invalidTypes = ['video/x-msvideo', 'image/bmp', 'text/css'];
		for (const mimeType of invalidTypes) {
			expect(() => parseMimeType(mimeType)).toThrow();
		}
	});
});
