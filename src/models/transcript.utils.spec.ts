/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, expect, it } from 'vitest';
import { formatTime, secondsToTime } from './transcript.utils';

describe('The transcript utils', () => {
	it('should be able convert seconds into time', () => {
		const time = secondsToTime(90);
		expect(time.seconds).toBe(30);
		expect(time.minutes).toBe(1);
		expect(time.hours).toBe(0);
		expect(time.milliseconds).toBe(0);
	});

	it('should be able to format the time', () => {
		const time = secondsToTime(90);
		expect(formatTime(time)).toBe('00:01:30,000');
	});
});
