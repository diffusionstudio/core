/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { SUPPORTED_MIME_TYPES } from '../../fixtures';
import * as errors from '../../errors';

import type { MimeType } from '../../types';

/**
 * Make sure a mimetype is valid
 * @param mimeType The mimetype to check
 * @returns A valid mimetype
 */
export function parseMimeType(mimeType?: string | null): MimeType {
	if (!Object.keys(SUPPORTED_MIME_TYPES.MIXED).includes(mimeType ?? '')) {
		throw new errors.ValidationError({
			message: `${mimeType} is not an accepted mime type`,
			code: 'invalid_mimetype',
		});
	}
	return mimeType as MimeType;
}
