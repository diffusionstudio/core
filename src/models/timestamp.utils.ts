/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { FPS_DEFAULT } from './timestamp.fixtures';
import type { frame } from '../types';
import { ValidationError } from '../errors';

/**
 * Convert seconds into frames
 */
export function secondsToFrames(seconds: number, fps = FPS_DEFAULT): frame {
	if (fps < 1) throw new ValidationError({
		code: 'invalidArgument',
		message: 'FPS must be greater or equal to 1'
	});

	return Math.round(seconds * fps);
}

/**
 * Convert frames into seconds
 */
export function framesToSeconds(frames: frame, fps = FPS_DEFAULT): number {
	if (fps < 1) throw new ValidationError({
		code: 'invalidArgument',
		message: 'FPS must be greater or equal to 1'
	});

	return Math.round((frames / fps) * 1000) / 1000;
}

/**
 * Convert frames to milliseconds
 */
export function framesToMillis(frames: frame, fps = FPS_DEFAULT): number {
	if (fps < 1) throw new ValidationError({
		code: 'invalidArgument',
		message: 'FPS must be greater or equal to 1'
	});

	return Math.round((frames / fps) * 1000);
}
