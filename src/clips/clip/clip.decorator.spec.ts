/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, expect, it, vi } from 'vitest';
import { Clip } from './clip';
import { WebGPURenderer } from 'pixi.js';
import { Timestamp } from '../../models';

describe('The render decorator', () => {
	it('should not render the compostition if the clip is disabled', () => {
		const clip = new Clip();
		const renderer = new WebGPURenderer();
		const renderSpy = vi.spyOn(renderer, 'render').mockImplementation(() => { });
		const unrenderSpy = vi.spyOn(clip, 'unrender');

		clip.render(renderer, new Timestamp());

		expect(renderSpy).toHaveBeenCalledOnce();
		expect(unrenderSpy).not.toHaveBeenCalled();

		clip.set({ disabled: true });
		clip.render(renderer, new Timestamp());

		expect(renderSpy).toHaveBeenCalledOnce();
		expect(unrenderSpy).toHaveBeenCalledOnce()
	});
});
