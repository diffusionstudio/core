/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { serializable, Serializer } from '../../services';
import { Keyframe, Timestamp } from '../../models';
import { Font, TextClip } from '../../clips';
import { ValidationError } from '../../errors';

import type { CaptionPresetType, DefaultCaptionPresetConfig } from './preset.types';
import type { GeneratorOptions } from '../../models';
import type { CaptionTrack } from './caption';
import type { CaptionPresetStrategy } from './preset.interface';

export class ClassicCaptionPreset extends Serializer implements CaptionPresetStrategy {
	@serializable()
	public generatorOptions: GeneratorOptions;

	@serializable()
	public readonly type: CaptionPresetType = 'CLASSIC';


	public constructor(config: Partial<DefaultCaptionPresetConfig> = {}) {
		super();

		this.generatorOptions = config.generatorOptions ?? { duration: [0.2] };
	}

	public async applyTo(track: CaptionTrack): Promise<void> {
		if (!track.clip?.transcript || !track.composition?.width) {
			throw new ValidationError({
				code: 'referenceError',
				message: 'Captions need to be applied with a defined transcript and composition',
			});
		}

		const offset = track.clip?.offset ?? new Timestamp();
		const font = await Font.fromFamily({ family: 'Figtree', weight: '700' }).load();

		// add captions
		for (const sequence of track.clip.transcript.iter(this.generatorOptions)) {
			await track.add(
				new TextClip({
					text: sequence.words.map((word) => word.text).join(' '),
					textAlign: 'center',
					textBaseline: 'middle',
					fontSize: 21,
					fillStyle: '#FFFFFF',
					font,
					stroke: {
						color: '#000000',
						width: 4,
						join: 'round',
					},
					maxWidth: track.composition.width * 0.85,
					shadow: {
						color: '#000000',
						blur: 0,
						distance: 1.1,
						angle: Math.PI * 0.40,
						alpha: 1,
					},
					position: 'center',
					stop: sequence.stop.add(offset),
					start: sequence.start.add(offset),
					scale: new Keyframe([0, 8], [0.96, 1], { easing: 'easeOut' }),
					alpha: new Keyframe([0, 4], [0, 1], { easing: 'easeOut' }),
				})
			);
		}
	}
}
