/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { Composition } from '../../composition';
import { AudioClip } from './audio';

import type { MockInstance } from 'vitest';
import type { frame } from '../../types';
import { Timestamp } from '../../models';
import { AudioSource } from '../../sources';

const file = new File([], 'audio.mp3', { type: 'audio/mp3' });

describe('The Audio Clip', () => {
	const updateFn = vi.fn();
	const errorFn = vi.fn();
	const loadFn = vi.fn();

	let playFn: MockInstance<() => Promise<void>>;
	let pauseFn: MockInstance<() => Promise<void>>;
	let clip: AudioClip;

	beforeEach(async () => {
		clip = await new AudioClip().load(file);
		clip.on('update', updateFn);
		clip.on('error', errorFn);
		clip.on('load', loadFn);

		playFn = vi.spyOn(clip.element, 'play').mockImplementation(async () => {
			clip.element.dispatchEvent(new Event('play'));
		});
		pauseFn = vi.spyOn(clip.element, 'pause').mockImplementation(async () => {
			clip.element.dispatchEvent(new Event('pause'));
		});
	});

	it('should have an initial state', async () => {
		clip.element.dispatchEvent(new Event('canplay'));
		expect(clip.element).toBeDefined();
		expect(loadFn).toBeCalledTimes(1);
		expect(clip.type).toBe('AUDIO');
		expect(clip.state).toBe('READY');
		expect(clip.source.name).toBe('audio.mp3');
		expect(clip.element.src).toBe(
			'blob:chrome://new-tab-page/3dc0f2b7-7773-4cd4-a397-2e43b1bba7cd',
		);
	});

	it('should update its state when canplay is called', () => {
		vi.spyOn(clip.element, 'duration', 'get').mockReturnValue(30);
		expect(clip.element.duration).toBe(30);
		expect(clip.duration.seconds).toBe(0);
		clip.element.dispatchEvent(new Event('canplay'));
		expect(clip.duration.seconds).toBe(30);
		expect(clip.range[0].seconds).toBe(0);
		expect(clip.range[1].seconds).toBe(30);
		expect(clip.state).toBe('READY');
		expect(loadFn).toBeCalledTimes(1);
	});

	it('should go to idle state if the media gets emptied', () => {
		vi.spyOn(clip.element, 'duration', 'get').mockReturnValue(30);
		clip.element.dispatchEvent(new Event('canplay'));

		clip.playing = true;
		clip.element.dispatchEvent(new Event('emptied'));
		expect(clip.playing).toBe(false);
		expect(clip.state).toBe('IDLE');
		expect(clip.track).toBeUndefined();
	});

	it("should throw an error if the media can't be loaded", () => {
		vi.spyOn(clip.element, 'duration', 'get').mockReturnValue(30);
		clip.element.dispatchEvent(new Event('canplay'));
		clip.element.dispatchEvent(new Event('error'));
		expect(clip.state).toBe('ERROR');
		expect(clip.track).toBeUndefined();
		expect(errorFn).toBeCalledTimes(1);
	});

	it('should play and pause the audio with the render method', () => {
		vi.spyOn(clip.element, 'duration', 'get').mockReturnValue(5);

		const composition = new Composition();
		Object.assign(clip, { track: { composition } });

		clip.element.dispatchEvent(new Event('canplay'));
		expect(clip.duration.seconds).toBe(5);

		expect(clip.playing).toBe(false);
		composition.state = 'PLAY';
		clip.render();

		expect(clip.playing).toBe(true);
		expect(playFn).toBeCalledTimes(1);

		composition.state = 'IDLE';
		clip.render();
		expect(clip.playing).toBe(false);
		expect(pauseFn).toBeCalledTimes(1);

		pauseFn.mockClear();

		clip.playing = true;
		clip.unrender();

		expect(clip.playing).toBe(false);
		expect(pauseFn).toBeCalledTimes(1);
	});

	it('slice should be persistant after adding clip', async () => {
		vi.spyOn(clip.element, 'duration', 'get').mockReturnValue(30);
		vi.spyOn(clip, 'seek').mockImplementation(async () => { });

		clip.subclip(<frame>20, <frame>60);

		const composition = new Composition();
		const promise = composition.appendClip(clip);
		clip.element.dispatchEvent(new Event('canplay'));
		await promise;

		expect(clip.state).toBe('ATTACHED');
		expect(clip.duration.seconds).toBe(30);
		expect(clip.range[0].frames).toBe(20);
		expect(clip.range[1].frames).toBe(60);
	});

	afterEach(() => {
		updateFn.mockClear();
		errorFn.mockClear();
		loadFn.mockClear();
		playFn.mockClear();
		pauseFn.mockClear();
	});
});

// blend of different test files
describe('Copying the AudioClip', () => {
	let clip: AudioClip;

	beforeEach(async () => {
		clip = await new AudioClip().load(file);
	});

	it('should transfer audio properties', async () => {
		clip.state = 'READY';
		clip.duration.frames = 100;
		clip.muted = true;
		clip.volume = 0.2;

		const copy = clip.copy();

		expect(copy.id).not.toBe(clip.id);
		expect(copy.state).not.toBe(clip.state);
		expect(copy.duration).toBeInstanceOf(Timestamp);
		expect(copy.duration.frames).toBe(100);
		expect(copy.volume).toBe(0.2);
		expect(copy.muted).toBe(true);
		expect(copy.source).toBeInstanceOf(AudioSource);
		expect(copy.source.id).toBe(clip.source.id);
	});

	it('should transfer base properties', () => {
		clip.state = 'ATTACHED';
		clip.set({
			name: 'Hello World',
			disabled: true,
		});

		const copy = clip.copy();

		expect(copy.name).toBe('Hello World');
		expect(copy.disabled).toBe(true);
		expect(copy.state).not.toBe(clip.state);
		expect(copy.id).not.toBe(clip.id);
		expect(copy.track).not.toBeDefined();
	});
})

// copied from src/clips/clip/clip.decorator.spec.ts
describe('The render decorator', () => {
	it('should not render the compostition if the clip is disabled', () => {
		const clip = new AudioClip();

		const unrenderSpy = vi.spyOn(clip, 'unrender');

		clip.render();

		expect(unrenderSpy).not.toHaveBeenCalled();

		clip.set({ disabled: true });
		clip.render();

		expect(unrenderSpy).toHaveBeenCalledOnce()
	});
});
