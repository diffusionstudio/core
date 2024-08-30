/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import {
	SpotlightCaptionPreset,
	CascadeCaptionPreset,
	GuineaCaptionPreset,
	ClassicCaptionPreset,
	SolarCaptionPreset,
	WhisperCaptionPreset,
} from '.';

import type { CaptionPresetStrategy } from './preset.interface';
import type { CaptionPresetType } from './preset.types';

export class CaptionPresetDeserializer {
	public static fromJSON<K extends { type?: CaptionPresetType }>(data: K extends string ? never : K): CaptionPresetStrategy {
		switch (data.type) {
			case 'SPOTLIGHT':
				return SpotlightCaptionPreset.fromJSON(data);
			case 'CASCADE':
				return CascadeCaptionPreset.fromJSON(data);
			case 'GUINEA':
				return GuineaCaptionPreset.fromJSON(data);
			case 'SOLAR':
				return SolarCaptionPreset.fromJSON(data);
			case 'WHISPER':
				return WhisperCaptionPreset.fromJSON(data);
			default:
				return ClassicCaptionPreset.fromJSON(data);
		}
	}
}
