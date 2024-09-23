/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { Source } from './source';

import type { ClipType } from '../clips';
import type { ArgumentTypes } from '../types';

export class AudioSource extends Source {
	public readonly type: ClipType = 'audio';
	public audioBuffer?: AudioBuffer;

	public async decode(
		numberOfChannels: number = 2,
		sampleRate: number = 48000,
	): Promise<AudioBuffer> {
		const buffer = await this.arrayBuffer();

		const ctx = new OfflineAudioContext(numberOfChannels, 1, sampleRate);

		this.audioBuffer = await ctx.decodeAudioData(buffer);
		this.duration.seconds = this.audioBuffer.duration;

		this.trigger('update', undefined);

		return this.audioBuffer;
	}

	public async samples(numberOfSampes = 60, windowSize = 50, min = 0): Promise<number[]> {
		const buffer = this.audioBuffer ?? (await this.decode(1, 16e3));

		const window = Math.round(buffer.sampleRate / windowSize);
		const length = buffer.sampleRate * buffer.duration - window;
		const inc = Math.ceil(length / numberOfSampes);
		const data = buffer.getChannelData(0);

		const res: number[] = [];
		for (let i = 0; i < length; i += inc) {
			let count = 0;
			for (let j = i; j < i + window; j++) {
				count += Math.abs(data[i]);
			}
			res.push(Math.log1p((count / window) * 100));
		}

		return res.map((v) => Math.round((v / Math.max(...res)) * (100 - min)) + min);
	}

	public async thumbnail(...args: ArgumentTypes<this['samples']>): Promise<HTMLElement> {
		const samples = await this.samples(...args);

		const div = document.createElement('div');
		div.className = 'flex flex-row absolute space-between inset-0 audio-samples';
		for (const sample of samples) {
			const bar = document.createElement('div');
			bar.className = 'audio-sample-item';
			bar.style.height = `${sample}%`;
			div.appendChild(bar);
		}
		return div;
	}
}
