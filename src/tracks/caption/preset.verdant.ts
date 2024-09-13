/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { Timestamp } from '../../models';
import { Serializer, serializable } from '../../services';
import { ComplexTextClip, Font } from '../../clips';
import { ValidationError } from '../../errors';

import type { SingleColorCaptionPresetConfig, CaptionPresetType } from './preset.types';
import type { CaptionPresetStrategy } from './preset.interface';
import type { GeneratorOptions } from '../../models';
import type { CaptionTrack } from './caption';
import type { hex } from '../../types';

export class VerdantCaptionPreset extends Serializer implements CaptionPresetStrategy {
	@serializable()
	readonly type: CaptionPresetType = 'VERDANT';

	@serializable()
	public generatorOptions: GeneratorOptions;

	@serializable()
	public color: hex;

	public constructor(config: Partial<SingleColorCaptionPresetConfig> = {}) {
		super();

		this.generatorOptions = config.generatorOptions ?? { duration: [1] };
		this.color = config.color ?? '#69E34C';
	}

	public async applyTo(track: CaptionTrack): Promise<void> {
		if (!track.clip?.transcript || !track.composition?.width) {
			throw new ValidationError({
				code: 'referenceError',
				message: 'Captions need to be applied with a defined transcript and composition',
			});
		}

		const offset = track.clip?.offset ?? new Timestamp();
		const font = await Font.fromFamily({ family: 'Montserrat', weight: '800' }).load();

		// add captions
		for (const sequence of track.clip.transcript.iter(this.generatorOptions)) {
			for (let i = 0; i < sequence.words.length; i++) {
				const tokens = sequence.words.map((s) => s.text);

				await track.add(
					new ComplexTextClip({
						text: tokens.join(' '),
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
						maxWidth: track.composition.width * 0.5,
						leading: 1.1,
						font,
						textCase: 'upper',
						styles: [{
							fillStyle: this.color,
							fontSize: 19,
						}],
						position: 'center',
						stop: sequence.words[i].stop.add(offset),
						start: sequence.words[i].start.add(offset),
						segments: [{
							index: 0,
							start: tokens.slice(0, i).join(' ').length,
							stop: tokens.slice(0, i + 1).join(' ').length,
						}],
					})
				);
			}
		}
	}
}
