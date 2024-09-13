/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { Timestamp } from '../../models';
import { Serializer, serializable } from '../../services';
import { ComplexTextClip, Font } from '../../clips';
import { randInt, splitAt } from '../../utils';
import { ValidationError } from '../../errors';

import type { MultiColorCaptionPresetConfig, CaptionPresetType } from './preset.types';
import type { CaptionPresetStrategy } from './preset.interface';
import type { WordGroup, Word } from '../../models';
import type { CaptionTrack } from './caption';
import type { hex } from '../../types';

export class GuineaCaptionPreset extends Serializer implements CaptionPresetStrategy {
	@serializable()
	readonly type: CaptionPresetType = 'GUINEA';

	@serializable()
	public colors: hex[];

	public constructor(config: Partial<MultiColorCaptionPresetConfig> = {}) {
		super();

		this.colors = config.colors ?? ['#1BD724', '#FFEE0C', '#FF2E17'];
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
		for (const sequence of track.clip.transcript.iter({ length: [18] })) {
			const { segments, words } = this.splitSequence(sequence);

			for (let i = 0; i < sequence.words.length; i++) {
				const start = words[i]?.at(0)?.start;
				const stop = words[i]?.at(-1)?.stop;

				if (!start || !stop) continue;

				await track.add(
					new ComplexTextClip({
						text: segments.join('\n '),
						textAlign: 'center',
						textBaseline: 'middle',
						fontSize: 20,
						fillStyle: '#FFFFFF',
						shadow: {
							color: '#000000',
							blur: 16,
							alpha: 0.8,
							angle: Math.PI / 4,
							distance: 1,
						},
						stroke: {
							width: 4,
							color: '#000000',
						},
						maxWidth: track.composition.width * 0.8,
						leading: 1.3,
						font,
						textCase: 'upper',
						position: 'center',
						stop: stop.add(offset),
						start: start.add(offset),
						styles: [
							{
								fillStyle: this.colors[0],
								fontSize: 23,
							},
							{
								fillStyle: this.colors[1],
								fontSize: 23,
							},
							{
								fillStyle: this.colors[2],
								fontSize: 23,
							},
						],
						segments: [
							{
								index: randInt(0, 2),
								start: segments.slice(0, i).join(' ').length,
								// i * 2 -> simple method to compensate for '\n '
								stop: segments.slice(0, i + 1).join(' ').length + i * 2,
							},
						],
					})
				);
			}
		}
	}

	protected splitSequence(sequence: WordGroup) {
		const text = sequence.text;
		const midPoint = Math.ceil(text.length / 2);

		let index = text.length;
		for (let i = midPoint, j = midPoint; i > 0 && j < sequence.text.length - 1; i--, j++) {
			if (text[i].match(/ /)) {
				index = i;
				break;
			}
			if (text[j].match(/ /)) {
				index = j;
				break;
			}
		}

		const segments = [...splitAt<string[]>(text, index).map((t) => t.trim())];
		const words = splitAt<Word[][]>(sequence.words, segments[0].split(/ /).length);

		return { segments, words };
	}
}
