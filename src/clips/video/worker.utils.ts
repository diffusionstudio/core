/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

/**
 * Validates the coded and replaces it
 * if necessary
 */
export function validateDecoderConfig(config: VideoDecoderConfig) {
	if (config.codec == 'vp09') {
		config.codec = 'vp09.00.10.08';
	}

	return config;
}
