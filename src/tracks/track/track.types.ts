/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import type { ClipType } from '../../clips';
import type { insertModes } from './track.fixtures';

export type TrackType = ClipType | 'CAPTION';
export type TrackInsertMethod = 'STACK' | 'TIMED';
/**
 * Defines where the track should be inserted
 */
export type TrackPosition = 'top' | 'bottom' | number;

export type InsertMode = (typeof insertModes)[number];
