/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { ValidationError } from "../errors";
import { EasingFunction, Keyframe, Timestamp } from "../models";

export type AnimationFunction<V extends number | string, T> =
  (value: V, delay?: number, easing?: EasingFunction) => T;

export interface AnimationBuilder {
  to(value: number, relframe: number): this;
}

export class AnimationBuilder {
  private target: any;
  public animation: Keyframe<string | number> | undefined;

  constructor(target: any) {
    this.target = target;
  }

  init(property: string | symbol, value: number | string, delay: number = 0, easing?: EasingFunction) {
    if (!(property in this.target)) {
      throw new Error(`Property [${String(property)}] cannot be assigned`);
    }

    const input = [delay];
    const ouptut = [value];

    // animate from current value to next value
    if (typeof (this.target[property]) == typeof (value) && delay != 0) {
      input.unshift(0);
      ouptut.unshift(this.target[property]);
    }

    this.target[property] = this.animation = new Keyframe(input, ouptut, { easing });

  }
}

export function createAnimationBuilder<T extends AnimationBuilder>(builder: T) {
  const proxy = new Proxy(builder, {
    get(obj: T, prop) {
      if (prop == 'to') {
        return (value: number, relframe: number) => {
          if (!obj.animation) {
            throw new ValidationError({
              code: 'undefinedKeyframe',
              message: "Cannot use 'to() before selecting a property"
            });
          }

          const timestamp = new Timestamp(obj.animation.input.at(-1));
          const absframe = timestamp.frames + relframe;

          // ATTENTION: The arguments are inversed here
          obj.animation.push(absframe, value);

          return proxy;
        }
      }

      return (value: number, delay?: number, easing?: EasingFunction) => {
        obj.init(prop, value, delay, easing);

        return proxy;
      };
    },
  });

  return proxy;
}
