/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { Font, ComplexTextClip } from '../../clips';
import { Timestamp } from '../../models';
import { serializable, Serializer } from '../../services';

import type { ScreenSize, SingleColorCaptionPresetConfig } from './preset.types';
import type { CaptionTrack } from './caption';
import type { CaptionPresetStrategy } from './preset.interface';
import type { GeneratorOptions } from '../../models';
import type { hex } from '../../types';

export class WhisperCaptionPreset extends Serializer implements CaptionPresetStrategy {
	private _initialized = false;

	@serializable()
	public generatorOptions: GeneratorOptions;

	@serializable()
	public readonly type = 'WHISPER';

	@serializable(ComplexTextClip)
	public clip: ComplexTextClip | undefined;

	@serializable()
	public color: hex;

	public constructor(config: Partial<SingleColorCaptionPresetConfig> = {}) {
		super();

		this.generatorOptions = config.generatorOptions ?? { length: [20] };
		this.clip = config.clip;
		this.color = config.color ?? '#8c8c8c';
	}

	public async init(composition?: ScreenSize) {
		if (this._initialized || !composition) return;

		if (!this.clip) {
			this.clip = await new ComplexTextClip({
				text: '',
				textAlign: 'center',
				textBaseline: 'middle',
				fillStyle: '#FFFFFF',
				fontSize: 13,
				background: {
					alpha: 0.3,
					padding: {
						x: 50,
						y: 30
					}
				},
				maxWidth: composition.width * 0.8,
				font: Font.fromFamily({ family: 'Montserrat', weight: '300' }),
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
				const splits = sequence.words.map((s) => s.text);
				const clip = this.clip.copy().set({
					text: splits.join(' '),
					stop: sequence.words[i].stop.add(offset),
					start: sequence.words[i].start.add(offset),
					segments:
						splits.length > 1
							? [
								{
									index: 0,
									start: splits.slice(0, i + 1).join(' ').length,
								},
							]
							: undefined,
				});
				await track.appendClip(clip);
			}
		}
	}
}
