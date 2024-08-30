/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import type { GeneratorOptions } from '../../models';
import type { ComplexTextClip, TextClip } from '../../clips';
import type { hex } from '../../types';

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
	clip?: TextClip;
	generatorOptions: GeneratorOptions;
};

export type SingleColorCaptionPresetConfig = {
	color: hex;
	clip?: ComplexTextClip;
} & DefaultCaptionPresetConfig;

export type MultiColorCaptionPresetConfig = {
	colors: hex[] | undefined;
	clip?: ComplexTextClip;
} & DefaultCaptionPresetConfig;

export type ScreenSize = {
	width: number;
	height: number;
};
