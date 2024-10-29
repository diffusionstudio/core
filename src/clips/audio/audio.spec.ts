/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { captions } from '../../test/captions';
import { Composition } from '../../composition';
import { AudioClip } from './audio';
import { Timestamp, Transcript } from '../../models';
import { AudioSource } from '../../sources';

import type { MockInstance } from 'vitest';

const file = new File([], 'audio.mp3', { type: 'audio/mp3' });

describe('The Audio Clip', () => {
	const updateFn = vi.fn();
	const errorFn = vi.fn();
	const loadFn = vi.fn();

	let playFn: MockInstance<() => Promise<void>>;
	let pauseFn: MockInstance<() => Promise<void>>;
	let clip: AudioClip;

	beforeEach(async () => {
		clip = new AudioClip(file);
		clip.on('update', updateFn);
		clip.on('error', errorFn);
		clip.on('load', loadFn);

		playFn = mockPlayValid(clip);
		pauseFn = mockPauseValid(clip);

		mockAudioValid(clip);
		mockDurationValid(clip);

		await clip.init();
	});

	it('should initialize', async () => {
		const clip = new AudioClip(file);

		expect(clip.state).toBe('IDLE');
		expect(clip.duration.seconds).not.toBe(20);
		expect(clip.source.file).toBeInstanceOf(File);
		expect(clip.element.src).toBeFalsy();

		const evtSpy = mockAudioValid(clip);
		const timeSpy = mockDurationValid(clip);

		await clip.init();

		expect(clip.duration.seconds).toBe(20);
		expect(clip.range[0].seconds).toBe(0);
		expect(clip.range[1].seconds).toBe(20);

		expect(evtSpy).toHaveBeenCalledOnce();
		expect(timeSpy).toHaveBeenCalledOnce();

		expect(clip.type).toBe('audio');
		expect(clip.state).toBe('READY');
		expect(clip.source.name).toBe('audio.mp3');
		expect(clip.element.src).toBe(
			'blob:chrome://new-tab-page/3dc0f2b7-7773-4cd4-a397-2e43b1bba7cd',
		);
	});

	it("should throw an error if the media can't be loaded", async () => {
		const clip = new AudioClip(file);

		mockDurationValid(clip);
		const evtSpy = mockAudioInvalid(clip);
		mockDurationValid(clip);

		await expect(() => clip.init()).rejects.toThrowError();

		expect(clip.duration.seconds).not.toBe(20);
		expect(evtSpy).toHaveBeenCalledOnce();

		expect(clip.state).toBe('ERROR');
	});

	it('should play and pause the audio with the render method', async () => {
		const composition = new Composition();
		await composition.add(clip.offsetBy(30));

		const enterSpy = vi.spyOn(clip, 'enter');
		const updateSpy = vi.spyOn(clip, 'update');
		const exitSpy = vi.spyOn(clip, 'exit');

		expect(clip.playing).toBe(false);

		composition.state = 'PLAY';
		composition.computeFrame();

		expect(playFn).toBeCalledTimes(0);
		expect(clip.playing).toBe(false);
		expect(enterSpy).toHaveBeenCalledTimes(0);
		expect(updateSpy).toHaveBeenCalledTimes(0);
		expect(exitSpy).toHaveBeenCalledTimes(0);

		composition.frame = 30;
		composition.computeFrame();

		expect(playFn).toBeCalledTimes(1);
		expect(clip.playing).toBe(true);
		expect(enterSpy).toHaveBeenCalledTimes(1);
		expect(updateSpy).toHaveBeenCalledTimes(1);
		expect(exitSpy).toHaveBeenCalledTimes(0);

		composition.state = 'IDLE';
		composition.frame = 60;
		composition.computeFrame();

		expect(clip.playing).toBe(false);
		expect(pauseFn).toBeCalledTimes(1);
		expect(enterSpy).toHaveBeenCalledTimes(1);
		expect(updateSpy).toHaveBeenCalledTimes(2);
		expect(exitSpy).toHaveBeenCalledTimes(0);

		composition.state = 'PLAY';
		composition.frame = 90;
		composition.computeFrame();

		expect(playFn).toBeCalledTimes(2);
		expect(clip.playing).toBe(true);
		expect(enterSpy).toHaveBeenCalledTimes(1);
		expect(updateSpy).toHaveBeenCalledTimes(3);
		expect(exitSpy).toHaveBeenCalledTimes(0);

		composition.frame = clip.stop.frames + 1;
		composition.computeFrame();

		expect(pauseFn).toBeCalledTimes(2);
		expect(clip.playing).toBe(false);
		expect(enterSpy).toHaveBeenCalledTimes(1);
		expect(updateSpy).toHaveBeenCalledTimes(3);
		expect(exitSpy).toHaveBeenCalledTimes(1);
	});

	it('slice should be persistant after adding clip', async () => {
		clip.offsetBy(30).subclip(20, 60).set({ muted: true, volume: 0.2 });

		const composition = new Composition();
		await composition.add(clip)

		expect(clip.state).toBe('ATTACHED');
		expect(clip.duration.seconds).toBe(20);
		expect(clip.range[0].frames).toBe(20);
		expect(clip.range[1].frames).toBe(60);
		expect(clip.offset.frames).toBe(30);
		expect(clip.muted).toBe(true);
		expect(clip.volume).toBe(0.2);
	});

	it("should not render the clip if it's disabled", async () => {
		const composition = new Composition();
		await composition.add(clip);

		const exitSpy = vi.spyOn(clip, 'exit');
		const updateSpy = vi.spyOn(clip, 'update');

		composition.state = 'PLAY';
		composition.computeFrame();

		expect(updateSpy).toHaveBeenCalledTimes(1);
		expect(exitSpy).not.toHaveBeenCalled();
		expect(clip.playing).toBe(true);

		clip.set({ disabled: true });

		expect(exitSpy).toHaveBeenCalledTimes(1);
		expect(clip.playing).toBe(false);
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

	beforeEach(() => {
		clip = new AudioClip();
	});

	it('should transfer audio properties', async () => {
		clip.state = 'READY';
		clip.duration.frames = 100;
		clip.muted = true;
		clip.volume = 0.2;
		clip.transcript = Transcript.fromJSON(captions);

		const copy = clip.copy();

		expect(copy.id).not.toBe(clip.id);
		expect(copy.state).not.toBe(clip.state);
		expect(copy.duration).toBeInstanceOf(Timestamp);
		expect(copy.duration.frames).toBe(100);
		expect(copy.volume).toBe(0.2);
		expect(copy.muted).toBe(true);
		expect(copy.source).toBeInstanceOf(AudioSource);
		expect(copy.source.id).toBe(clip.source.id);
		expect(copy.transcript?.id).toBe(clip.transcript.id);
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
});

function mockAudioValid(clip: AudioClip) {
	return vi.spyOn(clip.element, 'oncanplay', 'set')
		.mockImplementation(function (this: HTMLMediaElement, fn) {
			fn?.call(this, new Event('canplay'));
		});
}

function mockDurationValid(clip: AudioClip) {
	return vi.spyOn(clip.element, 'duration', 'get').mockReturnValue(20);
}

function mockAudioInvalid(clip: AudioClip) {
	return vi.spyOn(clip.element, 'onerror', 'set')
		.mockImplementation(function (this: HTMLMediaElement, fn) {
			fn?.call(this, new Event('error'));
		});
}

function mockPlayValid(clip: AudioClip) {
	return vi.spyOn(clip.element, 'play').mockImplementation(async () => {
		clip.element.dispatchEvent(new Event('play'));
	});
}

function mockPauseValid(clip: AudioClip) {
	return vi.spyOn(clip.element, 'pause').mockImplementation(async () => {
		clip.element.dispatchEvent(new Event('pause'));
	});
}
