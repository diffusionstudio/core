/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { Font, ComplexTextClip } from '../../clips';
import { serializable, Serializer } from '../../services';
import { Timestamp } from '../../models';
import { ValidationError } from '../../errors';

import type { SingleColorCaptionPresetConfig } from './preset.types';
import type { CaptionPresetStrategy } from './preset.interface';
import type { GeneratorOptions } from '../../models';
import type { CaptionTrack } from './caption';
import type { hex } from '../../types';

export class SpotlightCaptionPreset extends Serializer implements CaptionPresetStrategy {
	@serializable()
	public generatorOptions: GeneratorOptions;

	@serializable()
	public readonly type = 'SPOTLIGHT';

	@serializable()
	public color: hex;

	public constructor(config: Partial<SingleColorCaptionPresetConfig> = {}) {
		super();

		this.generatorOptions = config.generatorOptions ?? { duration: [0.2] };
		this.color = config.color ?? '#00FF4C';
	}

	public async applyTo(track: CaptionTrack): Promise<void> {
		if (!track.clip?.transcript || !track.composition?.width) {
			throw new ValidationError({
				code: 'referenceError',
				message: 'Captions need to be applied with a defined transcript and composition',
			});
		}

		const offset = track.clip?.offset ?? new Timestamp();
		const font = await Font.fromFamily({ family: 'The Bold Font', weight: '500' }).load();

		// add captions
		for (const sequence of track.clip.transcript.iter(this.generatorOptions)) {
			for (let i = 0; i < sequence.words.length; i++) {
				const tokens = sequence.words.map((s) => s.text);

				await track.add(
					new ComplexTextClip({
						text: tokens.join(' '),
						textAlign: 'center',
						textBaseline: 'middle',
						fillStyle: '#FFFFFF',
						fontSize: 22,
						maxWidth: track.composition.width * 0.8,
						font,
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
						stop: sequence.words[i].stop.add(offset),
						start: sequence.words[i].start.add(offset),
					})
				);
			}
		}
	}
}
