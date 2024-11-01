/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { Source } from './source';

import type { ClipType } from '../clips';
import type { ArgumentTypes } from '../types';
import type { FastSamplerOptions } from './audio.types';
import type { Transcript } from '../models';

export class AudioSource<T extends Object = {}> extends Source<T> {
	public readonly type: ClipType = 'audio';
	private decoding = false;

	public transcript?: Transcript;
	public audioBuffer?: AudioBuffer;

	public async decode(
		numberOfChannels: number = 2,
		sampleRate: number = 48000,
		cache = false,
	): Promise<AudioBuffer> {
		// make sure audio is not decoded multiple times
		if (this.decoding && cache) {
			await new Promise(this.resolve('update'));

			if (this.audioBuffer) {
				return this.audioBuffer;
			}
		}

		this.decoding = true;
		const buffer = await this.arrayBuffer();

		const ctx = new OfflineAudioContext(numberOfChannels, 1, sampleRate);

		const audioBuffer = await ctx.decodeAudioData(buffer);
		this.duration.seconds = audioBuffer.duration;
		if (cache) this.audioBuffer = audioBuffer;

		this.decoding = false;
		this.trigger('update', undefined);

		return audioBuffer;
	}

	/**
	 * @deprecated Use fastsampler instead.
	 */
	public async samples(numberOfSampes = 60, windowSize = 50, min = 0): Promise<number[]> {
		const buffer = this.audioBuffer ?? (await this.decode(1, 3000, true));

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

	/**
	 * Fast sampler that uses a window size to calculate the max value of the samples in the window.
	 * @param options - Sampling options.
	 * @returns An array of the max values of the samples in the window.
	 */
	public async fastsampler({ length = 60, start = 0, stop, logarithmic = false }: FastSamplerOptions): Promise<Float32Array> {
		if (typeof start === 'object') start = start.millis;
		if (typeof stop === 'object') stop = stop.millis;

		const sampleRate = 3000;
		const audioBuffer = this.audioBuffer ?? (await this.decode(1, sampleRate, true));
		const channelData = audioBuffer.getChannelData(0);

		const firstSample = Math.floor(Math.max(start * sampleRate / 1000, 0));
		const lastSample = stop
			? Math.floor(Math.min(stop * sampleRate / 1000, audioBuffer.length))
			: audioBuffer.length;

		const windowSize = Math.floor((lastSample - firstSample) / length);
		const result = new Float32Array(length);

		for (let i = 0; i < length; i++) {
			const start = firstSample + i * windowSize;
			const end = start + windowSize;
			let min = Infinity;
			let max = -Infinity;

			for (let j = start; j < end; j++) {
				const sample = channelData[j];
				if (sample < min) min = sample;
				if (sample > max) max = sample;
			}
			result[i] = logarithmic ? Math.log2(1 + max) : max;
		}
		return result;
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
