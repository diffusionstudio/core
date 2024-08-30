/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import type { TextClip } from '../../clips';
import type { ScreenSize, CaptionPresetType } from './preset.types';
import type { CaptionTrack } from './caption';

export interface CaptionPresetStrategy {
	/**
	 * Defines the type of strategy
	 */
	type: CaptionPresetType;
	/**
	 * Defines the base clip that will be used
	 * to create all subsequent ones
	 */
	clip?: TextClip;
	/**
	 * Needs to be called to setup the base clip
	 */
	init?(composition?: ScreenSize): Promise<void>;
	/**
	 * This function applies the settings to the track
	 */
	applyTo(track: CaptionTrack): Promise<void>;
}
