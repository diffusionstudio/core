/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComplexTextClip, MediaClip, TextClip } from '../../clips';
import { Composition } from '../../composition';
import { CaptionTrack } from './caption';
import { Transcript, Word, WordGroup } from '../../models';
import { ClassicCaptionPreset } from './preset.classic';
import { SpotlightCaptionPreset } from './preset.spotlight';
import { CascadeCaptionPreset } from './preset.cascade';
import { GuineaCaptionPreset } from './preset.guinea';
import { CaptionPresetDeserializer } from './preset.deserializer';
import { VerdantCaptionPreset } from './preset.verdant';

import type { hex } from '../../types';

describe('(0) The Caption Presets', () => {
	const mockFn = vi.fn();
	Object.assign(document, { fonts: { add: mockFn } });

	let composition: Composition;
	let track: CaptionTrack;

	beforeEach(() => {
		composition = new Composition();
		track = composition.createTrack('caption').from(
			new MediaClip().set({
				offset: 10 * 30,
				transcript: new Transcript([
					new WordGroup([
						new Word('Lorem', 0, 1e3),
						new Word('Ipsum', 2e3, 3e3),
						new Word('is', 4e3, 5e3),
						new Word('simply', 6e3, 7e3),
						new Word('dummy', 8e3, 9e3),
						new Word('text', 10e3, 11e3),
						new Word('of', 12e3, 13e3),
						new Word('the', 14e3, 15e3),
						new Word('printing', 16e3, 17e3),
						new Word('and', 18e3, 19e3),
						new Word('typesetting', 20e3, 21e3),
						new Word('industry', 22e3, 23e3),
					]),
					new WordGroup([
						new Word('Lorem', 24e3, 25e3),
						new Word('Ipsum', 26e3, 27e3),
						new Word('has', 28e3, 29e3),
						new Word('been', 30e3, 31e3),
						new Word('the', 32e3, 33e3),
						new Word("industry's", 34e3, 35e3),
					]),
				]),
			})
		)
	});

	it('should generate default captions', async () => {
		const strategy = new ClassicCaptionPreset({
			generatorOptions: { count: [1] },
		});
		await strategy.applyTo(track);
		expect(strategy.type).toBe('CLASSIC');
		expect(track.clips.length).toBe(18);
		expect(track.clips.at(0)?.start.seconds).toBe(10);
		expect(track.clips.length).toBeGreaterThan(0);
		for (const clip of track.clips) {
			expect(clip.font?.name).toBe('Figtree 700');
		}
	});

	it('should generate captions with a highlighted word', async () => {
		const strategy = new SpotlightCaptionPreset({
			color: '#333333',
			generatorOptions: { count: [3] },
		});

		await strategy.applyTo(track);
		expect(strategy.type).toBe('SPOTLIGHT');

		expect(track.clips.length).toBe(18);
		expect(track.clips.at(0)?.start.seconds).toBe(10);

		for (const clip of track.clips as ComplexTextClip[]) {
			expect(clip.text.length).toBeGreaterThan(0);

			if (clip.text.split(' ').length == 0) {
				expect(clip.segments).toBeUndefined();
			} else {
				expect(clip.segments.length).toBe(1);
				expect(clip.segments[0].start).not.toBeGreaterThan(clip.segments[0].stop ?? 0);
			}
		}
	});

	it('should generate captions with a highlighted green word', async () => {
		const strategy = new VerdantCaptionPreset({
			color: '#333333',
			generatorOptions: { count: [3] },
		});

		await strategy.applyTo(track);
		expect(strategy.type).toBe('VERDANT');

		expect(track.clips.length).toBe(18);
		expect(track.clips.at(0)?.start.seconds).toBe(10);

		for (const clip of track.clips as ComplexTextClip[]) {
			expect(clip.text.length).toBeGreaterThan(0);
			expect(clip.segments.length).toBe(1);
			expect(clip.segments[0].start).not.toBeGreaterThan(clip.segments[0].stop ?? 0);
		}
	});

	it('should generate captions with hidden words', async () => {
		const strategy = new CascadeCaptionPreset({
			generatorOptions: { count: [6] },
		});
		await strategy.applyTo(track);
		expect(strategy.type).toBe('CASCADE');

		expect(track.clips.length).toBe(18);
		expect(track.clips.at(0)?.start.seconds).toBe(10);
		expect(track.clips.at(0)?.textBaseline).toBe('top');

		let lastLength = 0;
		for (const clip of track.clips as TextClip[]) {
			const length = clip.text?.split(' ').length ?? 0;

			if (length != lastLength + 1 && length != 1) {
				// this should never be reached, the expect case
				// could also be true == false (it's expected to fail)
				expect(length).toBe(lastLength);
			}

			lastLength = length;
		}
	});

	it('should generate harmozi styled captions', async () => {
		const colors = ['#1BD724', '#FFEE0C', '#FF2E17'] as [hex, hex, hex];
		const strategy = new GuineaCaptionPreset({
			colors,
		});
		await strategy.applyTo(track);
		expect(strategy.type).toBe('GUINEA');

		expect(track.clips.at(0)?.start.seconds).toBe(10);
		expect(track.clips.at(0)?.textBaseline).toBe('middle');

		for (const clip of track.clips as ComplexTextClip[]) {
			expect(clip.text).toMatch(/\n/);
			expect(clip.segments.length).toBe(1);
			expect(clip.segments[0].start).not.toBeGreaterThan(clip.segments[0].stop ?? 0);
			expect(clip.styles?.length).toBe(3);
		}
	});

	it('should be able to be loaded from json, base strategy', async () => {
		// Base strategy
		const strategy = new ClassicCaptionPreset({
			generatorOptions: { count: [3] },
		});

		await strategy.applyTo(track);

		const loadedStrategy = CaptionPresetDeserializer.fromJSON(JSON.parse(JSON.stringify(strategy)));
		expect(loadedStrategy).toBeInstanceOf(ClassicCaptionPreset);
		expect((loadedStrategy as any).generatorOptions.count?.toString()).toBe('3');
	});

	it('should be able to be loaded from json, base strategy, harmozi strategy', async () => {
		const colors = ['#000000', '#111111', '#222222'] as [hex, hex, hex];
		const strategy = new GuineaCaptionPreset({ colors });

		await strategy.applyTo(track);

		const loadedStrategy = CaptionPresetDeserializer.fromJSON(JSON.parse(JSON.stringify(strategy)));
		expect(loadedStrategy).toBeInstanceOf(GuineaCaptionPreset);

		expect((loadedStrategy as any).colors.toString()).toBe('#000000,#111111,#222222');
	});

	it('should be able to be loaded from json, base strategy, highlight strategy', async () => {
		const color = '#ABCDEF';
		const strategy = new SpotlightCaptionPreset({ color });
		await strategy.applyTo(track);

		const loadedStrategy = CaptionPresetDeserializer.fromJSON(JSON.parse(JSON.stringify(strategy)));
		expect(loadedStrategy).toBeInstanceOf(SpotlightCaptionPreset);
		expect((loadedStrategy as any).color).toBe('#ABCDEF');
	});

	it('should be able to be loaded from json, hide strategy', async () => {
		// Base strategy
		const strategy = new CascadeCaptionPreset({
			generatorOptions: { count: [9] },
		});

		await strategy.applyTo(track);

		const loadedStrategy = CaptionPresetDeserializer.fromJSON(JSON.parse(JSON.stringify(strategy)));
		expect(loadedStrategy).toBeInstanceOf(CascadeCaptionPreset);
		expect((loadedStrategy as any).generatorOptions.count?.toString()).toBe('9');
	});
});
