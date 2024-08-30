/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { Timestamp } from '../../models';
import { Serializer, serializable } from '../../services';
import { ComplexTextClip, Font } from '../../clips';

import type { SingleColorCaptionPresetConfig, CaptionPresetType, ScreenSize } from './preset.types';
import type { CaptionPresetStrategy } from './preset.interface';
import type { GeneratorOptions } from '../../models';
import type { CaptionTrack } from './caption';
import type { hex } from '../../types';

export class VerdantCaptionPreset extends Serializer implements CaptionPresetStrategy {
	private _initialized = false;

	@serializable()
	public generatorOptions: GeneratorOptions;

	@serializable()
	readonly type: CaptionPresetType = 'VERDANT';

	@serializable()
	public color: hex;

	@serializable(ComplexTextClip)
	public clip: ComplexTextClip | undefined;

	public constructor(config: Partial<SingleColorCaptionPresetConfig> = {}) {
		super();

		this.generatorOptions = config.generatorOptions ?? { duration: [1] };
		this.clip = config.clip;
		this.color = config.color ?? '#69E34C';
	}

	public async init(composition?: ScreenSize) {
		if (this._initialized || !composition) return;

		if (!this.clip) {
			this.clip = await new ComplexTextClip({
				textAlign: 'center',
				textBaseline: 'middle',
				fontSize: 15,
				fillStyle: '#FFFFFF',
				shadow: {
					color: '#000000',
					blur: 4,
					alpha: 0.7,
					angle: Math.PI / 4,
					distance: 2,
				},
				stroke: {
					width: 3,
					color: '#000000',
				},
				maxWidth: composition.width * 0.5,
				leading: 1.1,
				font: Font.fromFamily({ family: 'Montserrat', weight: '800' }),
				textCase: 'upper',
				styles: [{
					fillStyle: this.color,
					fontSize: 19,
				}],
				position: 'center',
			});
		}

		await this.clip.font.load();
		this._initialized = true;
	}

	public async applyTo(track: CaptionTrack): Promise<void> {
		await this.init(track.composition);

		if (!this.clip || !track.clip?.transcript) {
			throw new Error('Preset needs to be initialized first');
		}

		const offset = track.clip?.offset ?? new Timestamp();

		// add captions
		for (const sequence of track.clip.transcript.iter(this.generatorOptions)) {
			for (let i = 0; i < sequence.words.length; i++) {
				const tokens = sequence.words.map((s) => s.text);
				const clip = this.clip.copy().set({
					text: tokens.join(' '),
					stop: sequence.words[i].stop.add(offset),
					start: sequence.words[i].start.add(offset),
					segments: [{
						index: 0,
						start: tokens.slice(0, i).join(' ').length,
						stop: tokens.slice(0, i + 1).join(' ').length,
					}],
				});
				await track.appendClip(clip);
			}
		}
	}
}
