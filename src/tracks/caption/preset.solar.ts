/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { GlowFilter } from 'pixi-filters';
import { Keyframe, Timestamp } from '../../models';
import { Serializer, serializable } from '../../services';
import { Font, TextClip } from '../../clips';

import type { ScreenSize, CaptionPresetType, DefaultCaptionPresetConfig } from './preset.types';
import type { CaptionTrack } from './caption';
import type { GeneratorOptions } from '../../models';
import type { CaptionPresetStrategy } from './preset.interface';

export class SolarCaptionPreset extends Serializer implements CaptionPresetStrategy {
	private _initialized = false;

	@serializable()
	public generatorOptions: GeneratorOptions;

	@serializable()
	public readonly type: CaptionPresetType = 'SOLAR';

	@serializable(TextClip)
	public clip: TextClip | undefined;

	public constructor(config: Partial<DefaultCaptionPresetConfig> = {}) {
		super();

		this.generatorOptions = config.generatorOptions ?? { duration: [0.2] };
		this.clip = config.clip;
	}

	public async init(composition?: ScreenSize) {
		if (this._initialized || !composition) return;

		if (!this.clip) {
			this.clip = await new TextClip({
				textAlign: 'center',
				textBaseline: 'middle',
				fontSize: 19,
				fillStyle: '#fffe41',
				font: Font.fromFamily({ family: 'Urbanist', weight: '800' }),
				maxWidth: composition.width * 0.85,
				textCase: 'upper',
				shadow: {
					color: '#ab7a00',
					blur: 0,
					distance: 2.1,
					angle: Math.PI / 2.5,
					alpha: 1,
				},
				position: 'center',
			});
		}

		await this.clip.font.load();
		this._initialized = false;
	}

	public async applyTo(track: CaptionTrack): Promise<void> {
		await this.init(track.composition);

		if (!this.clip || !track.clip?.transcript) {
			throw new Error('Preset needs to be initialized first');
		}

		const offset = track.clip?.offset ?? new Timestamp();
		const filters = new GlowFilter({
			color: '#fffe41',
			alpha: 0.25,
			distance: 90,
			quality: 0.05,
		});

		// add captions
		for (const sequence of track.clip.transcript.iter(this.generatorOptions)) {
			const clip = this.clip.copy().set({
				text: sequence.words.map((word) => word.text).join(' '),
				stop: sequence.stop.add(offset),
				start: sequence.start.add(offset),
				scale: new Keyframe([0, 8], [0.96, 1], { easing: 'easeOut' }),
				alpha: new Keyframe([0, 4], [0, 1], { easing: 'easeOut' }),
				filters,
			});

			await track.appendClip(clip);
		}
	}
}
