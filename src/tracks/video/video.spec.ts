/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, expect, it } from 'vitest';
import { VideoTrack } from './video';

describe('The Video Track Object', () => {
	it('should have a certain intitial state', () => {
		const track = new VideoTrack();
		expect(track.type).toBe('video');
	});
});
