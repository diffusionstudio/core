/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import type { Filter } from 'pixi.js';
import type { Keyframe } from '../../models';
import type { float, int, Anchor, Position, Scale, Translate2D, NumberCallback, Percent } from '../../types';

export interface VisualMixinProps {
  filters?: Filter | Filter[];
  rotation?: number | Keyframe<number> | NumberCallback;
  alpha?: number | Keyframe<number> | NumberCallback;
  translate?: Translate2D;
  position?: Position | 'center';
  scale?: Scale | float | Keyframe<number> | NumberCallback;
  x?: int | Keyframe<int> | Percent | NumberCallback;
  y?: int | Keyframe<int> | Percent | NumberCallback;
  translateX?: int | Keyframe<int> | NumberCallback;
  translateY?: int | Keyframe<int> | NumberCallback;
  height?: Keyframe<int> | Percent | int | NumberCallback;
  width?: Keyframe<int> | Percent | int | NumberCallback;
  anchor?: Anchor | float;
}
