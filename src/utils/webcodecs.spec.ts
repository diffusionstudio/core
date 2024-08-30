/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, expect, it } from 'vitest';
import { getVideoEncoderConfigs } from './webcodecs';

describe('The Webcodecs utils', () => {
	it('should be able to find render profiles', async () => {
		const profiles = await getVideoEncoderConfigs({
			fps: 30,
			height: 1080,
			width: 1920,
			bitrate: 10e6,
		});
		expect(profiles.length).toBeGreaterThan(0);
		expect(profiles.at(0)?.hardwareAcceleration).toBe('prefer-hardware');
		expect(profiles.at(-1)?.hardwareAcceleration).toBe('prefer-software');
	});
});
