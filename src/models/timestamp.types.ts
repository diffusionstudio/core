/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import type { float, frame } from '../types';

export type TimestampProps = {
	/**
	 * Defines the global frame rate
	 */
	fps: float;
	/**
	 * Defines the duration or time
	 */
	frames: frame;
};
