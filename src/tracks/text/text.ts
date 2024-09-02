/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import type { TextClip } from '../../clips';
import { Track } from '../track';

export class TextTrack extends Track<TextClip> {
	public readonly type = 'text';
}
