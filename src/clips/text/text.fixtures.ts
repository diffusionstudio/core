/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import type { TextAlign, TextBaseline } from './text.types';

export const SCALE_OFFSET = 4;

export const alignToAnchor: Record<TextAlign, number> = {
	center: 0.5,
	justify: 0.5,
	left: 0,
	right: 1,
};

export const baselineToAnchor: Record<TextBaseline, number> = {
	alphabetic: 0,
	top: 0,
	middle: 0.5,
	hanging: 1,
	bottom: 1,
	ideographic: 1,
};
