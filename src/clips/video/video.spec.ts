/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { BlurFilter } from 'pixi.js';
import { Source, VideoSource } from '../../sources';
import { VideoClip } from './video';
import { Composition } from '../../composition';
import { Keyframe, Timestamp } from '../../models';

import type { MockInstance } from 'vitest';


const file = new File([], 'video.mp4', { type: 'video/mp4' });

describe('The Video Clip', () => {
	const updateFn = vi.fn();
	const errorFn = vi.fn();
	const attachFn = vi.fn();

	let playFn: MockInstance<() => Promise<void>>;
	let pauseFn: MockInstance<() => Promise<void>>;
	let seekFn: MockInstance<(time: Timestamp) => Promise<void>>;

	const createObjectUrlSpy = vi.spyOn(Source.prototype as any, 'createObjectURL');

	let clip: VideoClip;

	beforeEach(async () => {
		updateFn.mockClear();
		errorFn.mockClear();
		attachFn.mockClear();
		createObjectUrlSpy.mockClear();

		clip = new VideoClip(file);
		clip.on('update', updateFn);
		clip.on('error', errorFn);
		clip.on('attach', attachFn);

		mockVideoValid(clip);
		mockDurationValid(clip);
		mockDimensions(clip);
		playFn = mockPlayValid(clip);
		pauseFn = mockPauseValid(clip);
		seekFn = mockSeek(clip);
	});

	it('should initialize', async () => {
		const clip = new VideoClip(file);

		expect(clip.state).toBe('IDLE');
		expect(clip.source.file).toBeInstanceOf(File);
		expect(clip.duration.seconds).not.toBe(30);
		expect(clip.element.src).toBeFalsy();

		const evtSpy = mockVideoValid(clip);
		const timeSpy = mockDurationValid(clip);
		mockDimensions(clip);

		await clip.init();

		expect(clip.duration.seconds).toBe(30);
		expect(clip.range[0].seconds).toBe(0);
		expect(clip.range[1].seconds).toBe(30);

		expect(evtSpy).toHaveBeenCalledOnce();
		expect(timeSpy).toHaveBeenCalledOnce();

		expect(clip.type).toBe('video');
		expect(clip.state).toBe('READY');
		expect(clip.source.name).toBe('video.mp4');
		expect(clip.element.src).toBe(
			'blob:chrome://new-tab-page/3dc0f2b7-7773-4cd4-a397-2e43b1bba7cd',
		);
	});

	it("should throw an error if the media can't be loaded", async () => {
		const clip = new VideoClip(file);

		mockDimensions(clip);
		mockDurationValid(clip);
		const evtSpy = mockVideoInvalid(clip);

		await expect(() => clip.init()).rejects.toThrowError();

		expect(clip.duration.seconds).not.toBe(20);
		expect(evtSpy).toHaveBeenCalledOnce();

		expect(clip.state).toBe('ERROR');
	});

	it('should connect to a track', async () => {
		clip
			.set({ offset: 10, height: '100%' })
			.subclip(10, 80);

		const composition = new Composition();
		const track = composition.createTrack('video');
		composition.frame = 30;
		attachFn.mockClear();

		await track.add(clip);

		expect(seekFn).toHaveBeenCalledTimes(1);
		expect(seekFn.mock.calls[0][0].seconds).toBe(1);

		expect(clip.state).toBe('ATTACHED');
		expect(clip.offset.frames).toBe(10);
		expect(clip.duration.seconds).toBe(30);
		expect(clip.height).toBe('100%');
		expect(clip.range[0].frames).toBe(10);
		expect(clip.range[1].frames).toBe(80);

		expect(clip.start.frames).toBe(20);
		expect(clip.stop.frames).toBe(90);

		expect(track.clips.findIndex((n) => n.id == clip.id)).toBe(0);
		expect(attachFn).toBeCalledTimes(1);
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
		clip.subclip(20, 60);

		const composition = new Composition();
		await composition.add(clip);

		expect(clip.state).toBe('ATTACHED');
		expect(clip.duration.seconds).toBe(30);
		expect(clip.range[0].frames).toBe(20);
		expect(clip.range[1].frames).toBe(60);
	});

	it("should implement the visualize decorator", async () => {
		clip.set({ x: 300 });

		// still 0 because clip won't be rendered
		expect(clip.view.x).toBe(0);

		const updateSpy = vi.spyOn(clip, 'update');

		const composition = new Composition();
		await composition.add(clip);

		expect(updateSpy).toHaveBeenCalled();
		expect(clip.view.x).toBe(300);
	});

	it('should add the filters on enter', async () => {
		clip.filters = new BlurFilter();

		expect(clip.view.filters).toBeUndefined();

		const enterSpy = vi.spyOn(clip, 'enter');

		const composition = new Composition();
		await composition.add(clip);

		expect((clip.view.filters as any)[0]).toBeInstanceOf(BlurFilter);
		expect(enterSpy).toHaveBeenCalledTimes(1);
	});

	it('should remove the filters on exit', async () => {
		clip.filters = new BlurFilter();

		const exitSpy = vi.spyOn(clip, 'exit');

		const composition = new Composition();
		await composition.add(clip);

		expect((clip.view.filters as any)[0]).toBeInstanceOf(BlurFilter);

		composition.frame = clip.stop.frames + 1;
		composition.computeFrame();

		expect(exitSpy).toHaveBeenCalledTimes(1);
		expect(clip.view.filters).toBeNull();
	});

	it('should apply the canvas texture during rendering', async () => {
		const composition = new Composition();
		await composition.add(clip);

		expect(clip.sprite.texture.uid).toBe(clip.textrues.html5.uid);

		composition.state = 'RENDER';
		composition.computeFrame();

		expect(clip.sprite.texture.uid).toBe(clip.textrues.canvas.uid);

		composition.state = 'IDLE';
		composition.computeFrame();

		expect(clip.sprite.texture.uid).toBe(clip.textrues.html5.uid);
	});
});

// Blend of different test files
describe('Copying the VidoClip', () => {
	let clip: VideoClip;

	beforeEach(async () => {
		clip = new VideoClip(file);

		mockVideoValid(clip);
		mockDurationValid(clip);
		mockDimensions(clip);
		mockPlayValid(clip);
		mockPauseValid(clip);
		mockSeek(clip);

		await clip.init();
	});

	it('should transfer media properties', async () => {
		clip.state = 'READY';
		clip.duration.frames = 100;
		clip.muted = true;
		clip.volume = 0.2;

		const copy = clip.copy();

		expect(copy).toBeInstanceOf(VideoClip);
		expect(copy.id).not.toBe(clip.id);
		expect(copy.state).not.toBe(clip.state);
		expect(copy.duration).toBeInstanceOf(Timestamp);
		expect(copy.duration.frames).toBe(100);
		expect(copy.volume).toBe(0.2);
		expect(copy.muted).toBe(true);
		expect(copy.source).toBeInstanceOf(VideoSource);
		expect(copy.source.id).toBe(clip.source.id);
	});

	it('should transfer visual properties', async () => {
		clip.filters = new BlurFilter();
		clip.rotation = new Keyframe([0, 9], [20, 80]);
		clip.alpha = 0.4;
		clip.position = {
			x: 12,
			y: 18,
		}
		clip.translate = {
			x: new Keyframe([0, 9], [10, 70]),
			y: new Keyframe([0, 9], [0, 60]),
		}
		clip.scale = 2;
		clip.anchor = { x: 0.3, y: 0.9 }

		const copy = clip.copy();

		expect(copy).toBeInstanceOf(VideoClip);
		expect(copy.id).not.toBe(clip.id);
		expect(copy.source).toBeInstanceOf(VideoSource);
		expect(copy.source.id).toBe(clip.source.id);
		expect(copy.filters).toBeInstanceOf(BlurFilter);
		expect(copy.rotation).toBeInstanceOf(Keyframe);
		expect((copy.rotation as any).output[0]).toBe(20);
		expect(copy.alpha).toBe(0.4);
		expect((copy.position as any).x).toBe(12);
		expect((copy.position as any).y).toBe(18);
		expect(copy.translate.x).toBeInstanceOf(Keyframe);
		expect(copy.translate.y).toBeInstanceOf(Keyframe);
		expect(copy.scale.x).toBe(2);
		expect(copy.scale.y).toBe(2);
		expect(clip.anchor.x).toBe(0.3);
		expect(clip.anchor.y).toBe(0.9);
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


function mockVideoValid(clip: VideoClip) {
	return vi.spyOn(clip.element, 'oncanplay', 'set')
		.mockImplementation(function (this: HTMLMediaElement, fn) {
			fn?.call(this, new Event('canplay'));
		});
}

function mockDurationValid(clip: VideoClip) {
	return vi.spyOn(clip.element, 'duration', 'get').mockReturnValue(30);
}

function mockVideoInvalid(clip: VideoClip) {
	return vi.spyOn(clip.element, 'onerror', 'set')
		.mockImplementation(function (this: HTMLMediaElement, fn) {
			fn?.call(this, new Event('error'));
		});
}

function mockPlayValid(clip: VideoClip) {
	return vi.spyOn(clip.element, 'play').mockImplementation(async () => {
		clip.element.dispatchEvent(new Event('play'));
	});
}

function mockPauseValid(clip: VideoClip) {
	return vi.spyOn(clip.element, 'pause').mockImplementation(async () => {
		clip.element.dispatchEvent(new Event('pause'));
	});
}

function mockDimensions(clip: VideoClip, width = 540, height = 680) {
	vi.spyOn(clip.element, 'videoHeight', 'get').mockReturnValue(width);
	vi.spyOn(clip.element, 'videoWidth', 'get').mockReturnValue(height);
}

function mockSeek(clip: VideoClip) {
	return vi.spyOn(clip, 'seek').mockImplementation(async () => { });
}
