/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { Track } from '../track';
import { ClassicCaptionPreset } from './preset.classic';

import type { MediaClip, TextClip } from '../../clips';
import type { CaptionPresetStrategy } from './preset.interface';

export class CaptionTrack extends Track<TextClip> {
	/**
	 * Defines the media clip that will be
	 * used for creating the captions
	 */
	public clip?: MediaClip;

	public readonly type = 'caption';

	/**
	 * The currently active captioning strategy
	 */
	public preset: CaptionPresetStrategy = new ClassicCaptionPreset();

	/**
	 * Defines the media resource from which the
	 * captions will be created. It must contain
	 * a `Transcript`
	 */
	public from(value: MediaClip | undefined): this {
		this.clip = value;

		this.clip?.on('offsetBy', (evt) => this.offsetBy(evt.detail));

		return this;
	}

	/**
	 * If a transcript has been added to the resource
	 * you can generate captions with this function
	 * @param strategy The caption strategy to use
	 * @default ClassicCaptionPreset
	 */
	public async generate(strategy?: CaptionPresetStrategy | (new () => CaptionPresetStrategy)): Promise<this> {
		let preset = this.preset;

		if (typeof strategy == 'object') {
			preset = strategy;
		} else if (strategy) {
			preset = new strategy();
		}

		this.clips = [];
		this.trigger('update', undefined);
		this.preset = preset;
		await preset.applyTo(this);
		this.trigger('update', undefined);
		return this;
	}
}
