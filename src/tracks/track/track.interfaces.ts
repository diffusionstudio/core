/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import type { InsertMode } from './track.types';
import type { Clip } from '../../clips';
import type { Track } from './track';
import type { Timestamp } from '../../models';

export interface InsertStrategy<T extends InsertMode> {
	readonly mode: T;
	add(clip: Clip, track: Track<Clip>, index?: number): void;
	update(clip: Clip, track: Track<Clip>): void;
	offset(time: Timestamp, track: Track<Clip>): void;
}
