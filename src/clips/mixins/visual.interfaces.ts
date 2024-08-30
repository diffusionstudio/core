/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import type { Filter } from 'pixi.js';
import type { Keyframe } from '../../models';
import type { float, int, Anchor, Position, Scale, Translate2D, Percent } from '../../types';

export interface VisualMixinProps {
  filters?: Filter | Filter[];
  rotation?: number | Keyframe<number>;
  alpha?: number | Keyframe<number>;
  translate?: Translate2D;
  position?: Position | 'center';
  scale?: Scale | float | Keyframe<number>;
  x?: int | Keyframe<int> | Percent;
  y?: int | Keyframe<int> | Percent;
  height?: Keyframe<int> | Percent | int;
  width?: Keyframe<int> | Percent | int;
  anchor?: Anchor | float;
}
