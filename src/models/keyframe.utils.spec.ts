/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, it, expect } from 'vitest';
import { lerp, interpolateColor } from './keyframe.utils';

describe('lerp', () => {
  it('should interpolate between two numbers correctly', () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(lerp(10, 20, 0.25)).toBe(12.5);
    expect(lerp(-10, 10, 0.75)).toBe(5);
  });
});

describe('interpolateColor', () => {
  it('should interpolate between two hex colors correctly', () => {
    expect(interpolateColor('#000000', '#FFFFFF', 0.5)).toBe('#808080');
    expect(interpolateColor('#FF0000', '#00FF00', 0.5)).toBe('#808000');
    expect(interpolateColor('#0000FF', '#FFFF00', 0.25)).toBe('#4040bf');
  });
});
