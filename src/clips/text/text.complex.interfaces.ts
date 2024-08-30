/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import type { TextClipProps } from './text.interfaces';
import type { Background, StyleOption, TextSegment } from './text.types';

export interface ComplexTextClipProps extends TextClipProps {
  segments?: TextSegment[];
  background?: Background;
  styles?: StyleOption[];
}
