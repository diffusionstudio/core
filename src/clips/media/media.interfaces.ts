/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import type { Timestamp, Transcript } from '../../models';
import type { frame } from '../../types';
import type { ClipProps } from '../clip';

export interface MediaClipProps extends ClipProps {
  playing?: boolean;
  transcript?: Transcript;
  offset?: frame | Timestamp;
  volume?: number;
  muted?: boolean;
}
