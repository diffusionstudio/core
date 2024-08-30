/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { Font, ComplexTextClip } from '../../clips';
import { serializable, Serializer } from '../../services';
import { Timestamp } from '../../models';

import type { ScreenSize, SingleColorCaptionPresetConfig } from './preset.types';
import type { CaptionPresetStrategy } from './preset.interface';
import type { GeneratorOptions } from '../../models';
import type { CaptionTrack } from './caption';
import type { hex } from '../../types';

export class SpotlightCaptionPreset extends Serializer implements CaptionPresetStrategy {
	private _initialized = false;

	@serializable()
	public generatorOptions: GeneratorOptions;

	@serializable()
	public readonly type = 'SPOTLIGHT';

	@serializable(ComplexTextClip)
	public clip: ComplexTextClip | undefined;

	@serializable()
	public color: hex;

	public constructor(config: Partial<SingleColorCaptionPresetConfig> = {}) {
		super();

		this.generatorOptions = config.generatorOptions ?? { duration: [0.2] };
		this.clip = config.clip;
		this.color = config.color ?? '#00FF4C';
	}

	public async init(composition?: ScreenSize) {
		if (this._initialized || !composition) return;

		if (!this.clip) {
			this.clip = await new ComplexTextClip({
				text: '',
				textAlign: 'center',
				textBaseline: 'middle',
				fillStyle: '#FFFFFF',
				fontSize: 22,
				maxWidth: composition.width * 0.8,
				font: Font.fromFamily({ family: 'The Bold Font', weight: '500' }),
				stroke: {
					width: 5,
					color: '#000000',
				},
				shadow: {
					color: '#000000',
					blur: 12,
					alpha: 0.7,
					angle: Math.PI / 4,
					distance: 2,
				},
				position: 'center',
				styles: [{
					fillStyle: this.color,
				}],
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
					segments:
						sequence.words.length > 1
							? [
								{
									index: 0,
									start: tokens.slice(0, i).join(' ').length,
									stop: tokens.slice(0, i + 1).join(' ').length,
								},
							]
							: undefined,
				});
				await track.appendClip(clip);
			}
		}
	}
}
