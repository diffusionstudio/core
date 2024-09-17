/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { Font, ComplexTextClip } from '../../clips';
import { Timestamp } from '../../models';
import { serializable, Serializer } from '../../services';
import { ValidationError } from '../../errors';

import type { SingleColorCaptionPresetConfig } from './preset.types';
import type { CaptionTrack } from './caption';
import type { CaptionPresetStrategy } from './preset.interface';
import type { GeneratorOptions } from '../../models';
import type { hex } from '../../types';

export class WhisperCaptionPreset extends Serializer implements CaptionPresetStrategy {
	@serializable()
	public generatorOptions: GeneratorOptions;

	@serializable()
	public readonly type = 'WHISPER';

	@serializable()
	public color: hex;

	public constructor(config: Partial<SingleColorCaptionPresetConfig> = {}) {
		super();

		this.generatorOptions = config.generatorOptions ?? { length: [20] };
		this.color = config.color ?? '#8c8c8c';
	}

	public async applyTo(track: CaptionTrack): Promise<void> {
		if (!track.clip?.transcript || !track.composition?.width) {
			throw new ValidationError({
				code: 'referenceError',
				message: 'Captions need to be applied with a defined transcript and composition',
			});
		}

		const offset = track.clip?.offset ?? new Timestamp();
		const font = await Font.fromFamily({ family: 'Montserrat', weight: '300' }).load();

		// add captions
		for (const sequence of track.clip.transcript.iter(this.generatorOptions)) {
			for (let i = 0; i < sequence.words.length; i++) {
				const splits = sequence.words.map((s) => s.text);

				await track.add(
					new ComplexTextClip({
						text: splits.join(' '),
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
						maxWidth: track.composition.width * 0.8,
						font,
						position: 'center',
						styles: [{
							fillStyle: this.color,
						}],
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
					})
				);
			}
		}
	}
}
