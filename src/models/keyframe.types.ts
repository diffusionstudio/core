/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import type { easingFunctions } from "./keyframe.utils";

export type EasingFunctions = typeof easingFunctions;
export type EasingFunction = keyof EasingFunctions;

/**
 * Options for configuring a Keyframe instance.
 */
export type KeyframeOptions = {
  /**
   * Defines the extrapolation behavior outside the input range.
   * - "clamp": Clamps the value to the nearest endpoint within the range.
   * - "extend": Allows values to extend beyond the range.
   * @default "clamp"
   */
  extrapolate?: "clamp" | "extend";

  /**
   * Specifies the type of output values.
   * - "number": Output values are numbers.
   * - "color": Output values are colors in hex format.
   * @default "number"
   */
  type?: "number" | "color";

  /**
   * An optional easing function to apply to the interpolation.
   * Easing functions can modify the interpolation to be non-linear.
   * @default "linear"
   */
  easing?: EasingFunction;
}
