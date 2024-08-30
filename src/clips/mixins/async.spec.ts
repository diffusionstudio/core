/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, expect, it } from 'vitest';
import { AsyncMixin } from './async';
import { Clip } from '../clip';
import { Source } from '../../sources';

describe('The Async Clip Mixin', () => {
	it('should have defined default values', () => {
		class TestCls extends AsyncMixin(Clip) {}
		const clip = new TestCls();
		expect(clip.source).toBeInstanceOf(Source);
	});
});
