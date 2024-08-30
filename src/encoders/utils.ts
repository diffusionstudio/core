/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import type { frame } from '../types';

export function getRenderEventDetail(progress: frame, total: frame, startTime: number) {
	const duration = new Date().getTime() - startTime;
	const time = (duration / gte1(progress)) * (total - progress);
	const remaining = new Date(time);

	return { remaining, progress, total };
}

function gte1(num: number): number {
	if (num < 1) return 1;
	return num;
}
