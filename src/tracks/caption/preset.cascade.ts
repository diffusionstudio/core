/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { Timestamp } from '../../models';
import { Serializer, serializable } from '../../services';
import { Font, TextClip } from '../../clips';

import type { GeneratorOptions } from '../../models';
import type { ScreenSize, DefaultCaptionPresetConfig } from './preset.types';
import type { CaptionTrack } from './caption';
import type { CaptionPresetStrategy } from './preset.interface';

export class CascadeCaptionPreset extends Serializer implements CaptionPresetStrategy {
	private _initialized = false;

	@serializable()
	public generatorOptions: GeneratorOptions;

	@serializable()
	public readonly type = 'CASCADE';

	@serializable(TextClip)
	public clip: TextClip | undefined;

	public constructor(config: Partial<DefaultCaptionPresetConfig> = {}) {
		super();

		this.generatorOptions = config.generatorOptions ?? { duration: [1.4] };
		this.clip = config.clip;
	}

	public async init(composition?: ScreenSize) {
		if (this._initialized || !composition) return;

		if (!this.clip) {
			this.clip = await new TextClip({
				textAlign: 'left',
				textBaseline: 'top',
				fillStyle: '#FFFFFF',
				fontSize: 16,
				font: Font.fromFamily({ family: 'Geologica', weight: '400' }),
				maxWidth: composition.width * 0.7,
				stroke: {
					color: '#000000',
					width: 4,
					join: 'round',
				},
				shadow: {
					color: '#000000',
					blur: 8,
					alpha: 0.4,
					angle: Math.PI / 4,
					distance: 2,
				},
				position: {
					x: '12%',
					y: composition.height / 2 - 40,
				},
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
				function getText() {
					if (sequence.words.length == 1) {
						return sequence.text;
					}
					const words = sequence.words.map((word) => word.text);
					return words.slice(0, i + 1).join(' ');
				}

				const clip = this.clip.copy().set({
					text: getText(),
					stop: sequence.words[i].stop.add(offset),
					start: sequence.words[i].start.add(offset),
				});
				await track.appendClip(clip);
			}
		}
	}
}
