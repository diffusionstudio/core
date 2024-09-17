/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { Timestamp } from '../../models';
import { Serializer, serializable } from '../../services';
import { Font, TextClip } from '../../clips';
import { ValidationError } from '../../errors';

import type { GeneratorOptions } from '../../models';
import type { DefaultCaptionPresetConfig } from './preset.types';
import type { CaptionTrack } from './caption';
import type { CaptionPresetStrategy } from './preset.interface';

export class CascadeCaptionPreset extends Serializer implements CaptionPresetStrategy {
	@serializable()
	public generatorOptions: GeneratorOptions;

	@serializable()
	public readonly type = 'CASCADE';

	public constructor(config: Partial<DefaultCaptionPresetConfig> = {}) {
		super();

		this.generatorOptions = config.generatorOptions ?? { duration: [1.4] };
	}

	public async applyTo(track: CaptionTrack): Promise<void> {
		if (!track.clip?.transcript || !track.composition?.width) {
			throw new ValidationError({
				code: 'referenceError',
				message: 'Captions need to be applied with a defined transcript and composition',
			});
		}

		const offset = track.clip?.offset ?? new Timestamp();
		const font = await Font.fromFamily({ family: 'Geologica', weight: '400' }).load();

		// add captions
		for (const sequence of track.clip.transcript.iter(this.generatorOptions)) {
			for (let i = 0; i < sequence.words.length; i++) {
				const getText = () => {
					if (sequence.words.length == 1) return sequence.text;

					const words = sequence.words.map((word) => word.text);
					return words.slice(0, i + 1).join(' ');
				}

				await track.add(
					new TextClip({
						text: getText(),
						textAlign: 'left',
						textBaseline: 'top',
						fillStyle: '#FFFFFF',
						fontSize: 16,
						font,
						maxWidth: track.composition.width * 0.7,
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
							y: '44%',
						},
						stop: sequence.words[i].stop.add(offset),
						start: sequence.words[i].start.add(offset),
					})
				);
			}
		}
	}
}
