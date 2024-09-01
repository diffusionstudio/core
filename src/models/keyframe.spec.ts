/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, it, expect } from 'vitest';
import { Keyframe } from './keyframe';
import { framesToMillis } from './timestamp.utils';

import type { frame } from '../types';

const f = (frame: frame) => framesToMillis(frame);

describe('Keyframe', () => {
  it('should interpolate percentage values correctly', () => {
    const keyframe0 = new Keyframe([0, 10], ["0%", "10%"], {type: "percentage"});

    expect(keyframe0.value(f(-3))).toBe('0.00%');
    expect(keyframe0.value(f(0))).toBe('0.00%');
    expect(keyframe0.value(f(3))).toBe('3.00%');
    expect(keyframe0.value(f(6))).toBe('6.01%');
    expect(keyframe0.value(f(9))).toBe('9.01%');
  });

  it('should interpolate number values correctly', () => {
    const keyframe0 = new Keyframe([0, 12], [0, 100]);
    expect(keyframe0.value(f(-3))).toBe(0);
    expect(keyframe0.value(f(0))).toBe(0);
    expect(keyframe0.value(f(3))).toBe(25);
    expect(keyframe0.value(f(6))).toBe(50);
    expect(keyframe0.value(f(9))).toBe(75);
    expect(keyframe0.value(f(12))).toBe(100);
    expect(keyframe0.value(f(15))).toBe(100);

    const keyframe1 = new Keyframe([0, 12, 18], [20, 60, 120]);
    expect(keyframe1.value(f(-3))).toBe(20);
    expect(keyframe1.value(f(0))).toBe(20);
    expect(keyframe1.value(f(6))).toBe(40);
    expect(keyframe1.value(f(12))).toBe(60);
    expect(keyframe1.value(f(15))).toBe(90);
    expect(keyframe1.value(f(18))).toBe(120);
    expect(keyframe1.value(f(21))).toBe(120);
  });

  it('should interpolate color values correctly', () => {
    const keyframe0 = new Keyframe([0, 12], ['#000000', '#FFFFFF']);
    expect(keyframe0.value(f(-6))).toBe('#000000');
    expect(keyframe0.value(f(0))).toBe('#000000');
    expect(keyframe0.value(f(6))).toBe('#808080');
    expect(keyframe0.value(f(12))).toBe('#ffffff');
    expect(keyframe0.value(f(18))).toBe('#ffffff');

    const keyframe1 = new Keyframe([0, 6, 12], ['#000000', '#FFFFFF', '#000000']);
    expect(keyframe1.value(f(-6))).toBe('#000000');
    expect(keyframe1.value(f(0))).toBe('#000000');
    expect(keyframe1.value(f(3))).toBe('#808080');
    expect(keyframe1.value(f(6))).toBe('#ffffff');
    expect(keyframe1.value(f(9))).toBe('#808080');
    expect(keyframe1.value(f(12))).toBe('#000000');
    expect(keyframe1.value(f(18))).toBe('#000000');
  });

  it('should interpolate degree values correctly', () => {
    const keyframe0 = new Keyframe([0, 12], [0, 360 * 2], { type: "degrees" });
    expect(keyframe0.value(f(-3))).toBe(0);
    expect(keyframe0.value(f(0))).toBe(0);
    expect(keyframe0.value(f(3))).toBe(180);
    expect(keyframe0.value(f(6))).toBe(0);
    expect(keyframe0.value(f(9))).toBe(180);
    expect(keyframe0.value(f(12))).toBe(0);
    expect(keyframe0.value(f(15))).toBe(0);

    const keyframe1 = new Keyframe([6, 12, 18], [180, 360, 360 * 2], { type: "degrees" });
    expect(keyframe1.value(f(0))).toBe(180);
    expect(keyframe1.value(f(6))).toBe(180);
    expect(keyframe1.value(f(9))).toBe(270);
    expect(keyframe1.value(f(12))).toBe(0);
    expect(keyframe1.value(f(15))).toBe(180);
    expect(keyframe1.value(f(18))).toBe(0);
    expect(keyframe1.value(f(21))).toBe(0);
  });

  it('should interpolate degree values correctly with extend', () => {
    const keyframe = new Keyframe([0, 12], [0, 360 * 2], { extrapolate: "extend", type: "degrees" });
    expect(keyframe.value(f(-3))).toBe(-180);
    expect(keyframe.value(f(0))).toBe(0);
    expect(keyframe.value(f(3))).toBe(180);
    expect(keyframe.value(f(6))).toBe(0);
    expect(keyframe.value(f(9))).toBe(180);
    expect(keyframe.value(f(12))).toBe(0);
    expect(keyframe.value(f(15))).toBe(180);
  });

  it('should not clamp values when extrapolate is set to "extend"', () => {
    const keyframe = new Keyframe([0, 12], [0, 100], { extrapolate: "extend" });
    expect(keyframe.value(f(-6))).toBe(-50);
    expect(keyframe.value(f(18))).toBe(150);
  });

  it('should throw an error for unsupported output range types', () => {
    const keyframe = new Keyframe([0, 10], [0, '' as any]);
    expect(() => keyframe.value(5)).toThrowError();
  });

  it('should throw an when the input range is of a different length than the output range', () => {
    expect(() => new Keyframe([0, 10, 15], [1])).toThrowError();
  });

  it('should apply easing functions correctly correctly', () => {
    const linear = new Keyframe([0, 6], [0, 100], { easing: 'linear' });
    const easeIn = new Keyframe([0, 6], [0, 100], { easing: 'easeIn' });
    const easeOut = new Keyframe([0, 6], [0, 100], { easing: 'easeOut' });
    const easeInOut = new Keyframe([0, 6], [0, 100], { easing: 'easeInOut' });

    // 6 frames in millis
    const stop = 200;

    // easeIn and easeOut
    for (let i = 1; i < stop - 1; i++) {
      // concave cruve
      expect(easeOut.value(i)).toBeGreaterThan(linear.value(i));
      // convex curve
      expect(easeIn.value(i)).toBeLessThan(linear.value(i));
    }

    // easeInOut
    for (let i = 1; i < (stop / 2) - 1; i++) {
      // first halve curve is convex
      expect(easeInOut.value(i)).toBeLessThan(linear.value(i));

      // second halve it's concave
      const l = stop - i;
      expect(easeInOut.value(l)).toBeGreaterThan(linear.value(l));

      // linear meets easeInOut here
      if (i == stop / 2) {
        expect(easeInOut.value(i)).toBe(linear.value(i));
      }
    }
  });
});
