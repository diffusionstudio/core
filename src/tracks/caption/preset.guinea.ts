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

import type { MultiColorCaptionPresetConfig, CaptionPresetType, ScreenSize } from './preset.types';
import type { CaptionPresetStrategy } from './preset.interface';
import type { WordGroup, Word } from '../../models';
import type { CaptionTrack } from './caption';
import type { hex } from '../../types';

export class GuineaCaptionPreset extends Serializer implements CaptionPresetStrategy {
	private _initialized = false;

	@serializable()
	readonly type: CaptionPresetType = 'GUINEA';

	@serializable()
	public colors: hex[];

	@serializable(ComplexTextClip)
	public clip: ComplexTextClip | undefined;

	public constructor(config: Partial<MultiColorCaptionPresetConfig> = {}) {
		super();

		this.clip = config.clip;
		this.colors = config.colors ?? ['#1BD724', '#FFEE0C', '#FF2E17'];
	}

	public async init(composition?: ScreenSize) {
		if (this._initialized || !composition) return;

		if (!this.clip) {
			this.clip = await new ComplexTextClip({
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
				maxWidth: composition.width * 0.8,
				leading: 1.3,
				font: Font.fromFamily({ family: 'The Bold Font', weight: '500' }),
				textCase: 'upper',
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
				position: 'center',
			});
		}

		await this.clip.font.load();
		this._initialized = true;
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

	public async applyTo(track: CaptionTrack): Promise<void> {
		await this.init(track.composition);

		if (!this.clip || !track.clip?.transcript) {
			throw new Error('Preset needs to be initialized first');
		}

		const offset = track.clip?.offset ?? new Timestamp();

		// add captions
		for (const sequence of track.clip.transcript.iter({ length: [18] })) {
			const { segments, words } = this.splitSequence(sequence);

			for (let i = 0; i < sequence.words.length; i++) {
				const start = words[i]?.at(0)?.start;
				const stop = words[i]?.at(-1)?.stop;

				if (!start || !stop) continue;

				const clip = this.clip.copy().set({
					text: segments.join('\n '),
					stop: stop.add(offset),
					start: start.add(offset),
					segments: [
						{
							index: randInt(0, 2),
							start: segments.slice(0, i).join(' ').length,
							// i * 2 -> simple method to compensate for '\n '
							stop: segments.slice(0, i + 1).join(' ').length + i * 2,
						},
					],
				});

				await track.appendClip(clip);
			}
		}
	}
}
