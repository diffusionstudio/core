/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { AnimationBuilder as Builder, AnimationFunction } from '../../models/animation-builder';

export interface AnimationBuilder extends Builder {
  height: AnimationFunction<number, this>;
  width: AnimationFunction<number, this>;
  x: AnimationFunction<number, this>;
  y: AnimationFunction<number, this>;
  translateX: AnimationFunction<number, this>;
  translateY: AnimationFunction<number, this>;
  rotation: AnimationFunction<number, this>;
  alpha: AnimationFunction<number, this>;
  scale: AnimationFunction<number, this>;
}

export class AnimationBuilder extends Builder { }
