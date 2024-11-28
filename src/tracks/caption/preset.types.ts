/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import type { GeneratorOptions } from '../../models';
import type { hex, Position } from '../../types';

export type CaptionPresetType =
	| 'CLASSIC'
	| 'SPOTLIGHT'
	| 'CASCADE'
	| 'GUINEA'
	| 'SOLAR'
	| 'WHISPER'
	| 'VERDANT'
	| string;

export type DefaultCaptionPresetConfig = {
	generatorOptions: GeneratorOptions;
	position: Position;
};

export type SingleColorCaptionPresetConfig = {
	color: hex;
} & DefaultCaptionPresetConfig;

export type MultiColorCaptionPresetConfig = {
	colors: hex[] | undefined;
} & DefaultCaptionPresetConfig;
