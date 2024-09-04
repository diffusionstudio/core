/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import type { Renderer } from "pixi.js";
import type { Clip } from "./clip";
import type { Timestamp } from "../../models";

/**
 * Decorator that only renders the frame if
 * the clip is not disabled
 */
export function toggle<T extends Clip> // @ts-ignore
  (target: T, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (this: T, ...args: [Renderer, Timestamp]) {
    if (this.disabled) {
      this.unrender();
      return;
    }

    return originalMethod.apply(this, args);
  };

  return descriptor;
}
