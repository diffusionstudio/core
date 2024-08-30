/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import type { hex } from '../../types';
import type { ClipProps } from '../clip';
import type { VisualMixinProps } from '../mixins';
import type { Font } from './font';
import type { Stroke, TextAlign, TextBaseline, TextCase, TextShadow } from './text.types';

export interface TextClipProps extends ClipProps, Omit<VisualMixinProps, 'anchor'> {
  text?: string;
  font?: Font;
  maxWidth?: number;
  textAlign?: TextAlign;
  padding?: number;
  textBaseline?: TextBaseline;
  fillStyle?: hex;
  stroke?: Partial<Stroke>;
  textCase?: TextCase;
  shadow?: Partial<TextShadow>;
  fontSize?: number;
  leading?: number;
}
