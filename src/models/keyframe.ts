/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import * as utils from './keyframe.utils';
import { framesToMillis } from './timestamp.utils';
import { ValidationError } from '../errors';

import type { Serializer } from '../services';
import type { frame } from '../types';
import type { KeyframeOptions } from './keyframe.types';
import type { Timestamp } from './timestamp';


export class Keyframe<T extends number | string> implements Omit<Serializer, 'id'> {
  /**
   * Defines the range of the input values 
   * in milliseconds
   */
  public input: number[];
  /**
   * Defines the range of the output values
   */
  public output: T[];
  /**
   * Defines the required options that 
   * control the behaviour of the keyframe
   */
  public options: Required<KeyframeOptions>;

  /**
   * Constructs a Keyframe object.
   * @param inputRange - The range of input values (e.g., frame numbers).
   * @param outputRange - The range of output values (e.g., opacity, degrees, colors).
   * @param options - Additional options for extrapolation, type, and easing.
   */
  constructor(inputRange: frame[], outputRange: T[], options: KeyframeOptions = {}) {
    if (inputRange.length !== outputRange.length) {
      throw new ValidationError({
        code: 'invalidKeyframes',
        message: 'inputRange and outputRange must have the same length',
      });
    }

    this.input = inputRange.map(frame => framesToMillis(frame));
    this.output = outputRange;
    this.options = {
      extrapolate: 'clamp',
      easing: 'linear',
      type: 'number',
      ...JSON.parse(JSON.stringify(options)),
    };
  }

  /**
   * Normalizes the frame number to a value between 0 and 1 based on the input range.
   * @param frame - The current frame number.
   * @returns The normalized value.
   */
  private normalize(frame: number): { t: number, segment: number } {
    const { input: inputRange } = this;

    if (frame < inputRange[0]) {
      if (this.options.extrapolate === "clamp") {
        return { t: 0, segment: 0 };
      } else {
        return { t: (frame - inputRange[0]) / (inputRange[1] - inputRange[0]), segment: 0 };
      }
    }

    if (frame > inputRange[inputRange.length - 1]) {
      if (this.options.extrapolate === "clamp") {
        return { t: 1, segment: inputRange.length - 2 };
      } else {
        return { t: (frame - inputRange[inputRange.length - 2]) / (inputRange[inputRange.length - 1] - inputRange[inputRange.length - 2]), segment: inputRange.length - 2 };
      }
    }

    for (let i = 0; i < inputRange.length - 1; i++) {
      const inputStart = inputRange[i];
      const inputEnd = inputRange[i + 1];
      if (frame >= inputStart && frame <= inputEnd) {
        const t = (frame - inputStart) / (inputEnd - inputStart);
        return { t, segment: i };
      }
    }

    // If not clamped and frame is outside the input range
    return { t: 0, segment: 0 };
  }

  /**
   * Interpolates the output value based on the normalized frame value.
   * @param t - The normalized frame value (between 0 and 1).
   * @param segment - The current segment index.
   * @returns The interpolated output value.
   */
  private interpolate(t: number, segment: number): T {
    const outputStart = this.output[segment];
    const outputEnd = this.output[segment + 1];
    const easedT = utils.easingFunctions[this.options.easing](t);

    if (typeof outputStart === 'number' && typeof outputEnd === 'number') {
      return utils.lerp(outputStart, outputEnd, easedT) as T;
    }
    if (typeof outputStart === 'string' && typeof outputEnd === 'string') {
      return utils.interpolateColor(outputStart, outputEnd, easedT) as T;
    }
    if (this.output.length == 1) {
      return this.output[0];
    }
    throw new ValidationError({
      code: 'invalidKeyframes',
      message: 'Unsupported output range types',
    });
  }

  /**
   * Evaluates the interpolated value for a given milliseconds number.
   * @param time - The current time in milliseconds or as a timestamp
   * @returns The interpolated output value.
   */
  public value(time: number | Timestamp): T {
    const { t, segment } = this.normalize(typeof time == 'number' ? time : time.millis);
    return this.interpolate(t, segment);
  }

  /**
   * Add a new keyframe to the animation
   * @param frame time of the keyframe
   * @param value value of the keyframe
   */
  public push(input: frame, output: T): this {
    this.input.push(framesToMillis(input));
    this.output.push(output);

    return this;
  }

  public toJSON(): this {
    return this;
  }

  public static fromJSON<T extends number | string>(obj: ReturnType<Keyframe<T>['toJSON']>): Keyframe<T> {
    const keyframe = new Keyframe([], []);
    Object.assign(keyframe, obj);
    return keyframe;
  }
}
