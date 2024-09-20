/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Keyframe } from './keyframe';

import { AnimationBuilder as Builder, createAnimationBuilder } from './animation-builder';
import { EasingFunction } from './keyframe.types';

export interface AnimationBuilder extends Builder {
  height(value: number, delay?: number, easing?: EasingFunction): this;
  width(value: number, delay?: number, easing?: EasingFunction): this;
}

export class AnimationBuilder extends Builder { }

class TestObject {
  height = 5;
  width = new Keyframe([0], [0]);
}


describe('The Animation Builder', () => {
  let testObject: TestObject;
  let animate: AnimationBuilder;


  beforeEach(() => {
    testObject = new TestObject();
    animate = createAnimationBuilder(new AnimationBuilder(testObject));
  });

  it('should create and assign a new Keyframe', () => {
    animate.height(20).to(100, 12).width(30).to(80, 18);

    expect(testObject.height).toBeInstanceOf(Keyframe);
    expect(testObject.width).toBeInstanceOf(Keyframe);

    const height = testObject.height as any as Keyframe<number>;

    expect(height.input.length).toBe(2);
    expect(height.output.length).toBe(2);

    expect(height.input[0]).toBe(0);
    expect(height.input[1]).toBe(12 / 30 * 1000);

    expect(height.output[0]).toBe(20);
    expect(height.output[1]).toBe(100);

    const width = testObject.width as any as Keyframe<number>;

    expect(width.input.length).toBe(2);
    expect(width.output.length).toBe(2);

    expect(width.input[0]).toBe(0);
    expect(width.input[1]).toBe(18 / 30 * 1000);

    expect(width.output[0]).toBe(30);
    expect(width.output[1]).toBe(80);
  });

  it('should be based on relative delays', () => {
    animate.height(20).to(90, 12).to(200, 6).to(280, 3);

    const height = testObject.height as any as Keyframe<number>;

    expect(height.input.length).toBe(4);
    expect(height.output.length).toBe(4);

    expect(height.input[0]).toBe(0);
    expect(height.input[1]).toBe(12 / 30 * 1000);
    expect(height.input[2]).toBe(18 / 30 * 1000);
    expect(height.input[3]).toBe(21 / 30 * 1000);

    expect(height.output[0]).toBe(20);
    expect(height.output[1]).toBe(90);
    expect(height.output[2]).toBe(200);
    expect(height.output[3]).toBe(280);
  });

  it('should set the easing function', () => {
    animate.height(20, 0, 'easeIn').to(100, 12).width(30, 0, 'easeOut').to(80, 18);

    const height = testObject.height as any as Keyframe<number>;
    const width = testObject.width as any as Keyframe<number>;

    expect(height.options.easing).toBe('easeIn');
    expect(width.options.easing).toBe('easeOut');
  });

  it('should animate from the current value', () => {
    animate.height(20, 12);

    const height = testObject.height as any as Keyframe<number>;

    expect(height.input.length).toBe(2);
    expect(height.output.length).toBe(2);

    expect(height.input[0]).toBe(0);
    expect(height.input[1]).toBe(12 / 30 * 1000);

    expect(height.output[0]).toBe(5);
    expect(height.output[1]).toBe(20);
  });

  it("should not animate from the current value if it's a Keyframe", () => {
    animate.width(20, 12);

    const width = testObject.width as any as Keyframe<number>;

    expect(width.input.length).toBe(1);
    expect(width.output.length).toBe(1);

    expect(width.input[0]).toBe(12 / 30 * 1000);
    expect(width.output[0]).toBe(20);
  });

  it("should not create an animation if no property has been called first", () => {
    expect(() => animate.to(20, 12)).toThrowError();
  });
});
