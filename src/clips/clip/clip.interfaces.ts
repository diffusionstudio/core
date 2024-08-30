/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import type { frame } from '../../types';
import type { Timestamp } from '../../models';

export interface ClipProps {
  disabled?: boolean;
  name?: string;
  start?: frame | Timestamp;
  stop?: frame | Timestamp;
}
