/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import type { frame, hex, int } from "../types";

export type CompositionSettings = {
	/**
	 * Height of the composition
	 *
	 * @default 1080
	 */
	height: int;
	/**
	 * Width of the composition
	 *
	 * @default 1920
	 */
	width: int;
	/**
	 * Background color of the composition
	 *
	 * @default #000000
	 */
	background: hex;
	/**
	 * Overwrite the backend auto detection.
	 * *While webgpu is faster than webgl
	 * it might not be available in your
	 * browser yet.*
	 */
	backend: 'webgpu' | 'webgl'
};

/**
 * Defines the available image formats
 */
export type ScreenshotImageFormat = 'webp' | 'png' | 'jpeg';

/**
 * Defines the type of events emitted by the
 * composition
 */
export type CompositionEvents = {
	play: frame;
	pause: frame;
	init: undefined;
	currentframe: frame;
	update: any;
	frame: number | undefined;
	attach: undefined;
	detach: undefined;
	load: undefined;
};

export type CompositionState = 'IDLE' | 'RENDER' | 'PLAY';
