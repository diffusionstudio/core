/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { BlurFilter, WebGPURenderer } from 'pixi.js';
import { Source, VideoSource } from '../../sources';
import { VideoClip } from './video';
import { Composition } from '../../composition';
import { Keyframe, Timestamp } from '../../models';

import type { MockInstance } from 'vitest';
import type { frame } from '../../types';


const file = new File([], 'video.mp4', { type: 'video/mp4' });

describe('The Video Clip', () => {
	const updateFn = vi.fn();
	const errorFn = vi.fn();
	const attachFn = vi.fn();

	let playFn: MockInstance<() => Promise<void>>;
	let pauseFn: MockInstance<() => Promise<void>>;

	const createObjectUrlSpy = vi.spyOn(Source.prototype as any, 'createObjectURL');

	let clip: VideoClip;

	beforeEach(async () => {
		updateFn.mockClear();
		errorFn.mockClear();
		attachFn.mockClear();
		createObjectUrlSpy.mockClear();

		clip = await new VideoClip().load(file);
		clip.on('update', updateFn);
		clip.on('error', errorFn);
		clip.on('attach', attachFn);

		vi.spyOn(clip.element, 'duration', 'get').mockReturnValue(30);
		vi.spyOn(clip.element, 'videoHeight', 'get').mockReturnValue(540);
		vi.spyOn(clip.element, 'videoWidth', 'get').mockReturnValue(680);

		playFn = vi.spyOn(clip.element, 'play').mockImplementation(async () => {
			clip.element.dispatchEvent(new Event('play'));
		});
		pauseFn = vi.spyOn(clip.element, 'pause').mockImplementation(async () => {
			clip.element.dispatchEvent(new Event('pause'));
		});
	});

	it('should have an initial state', async () => {
		expect(clip.element).toBeInstanceOf(HTMLVideoElement);
		expect(clip.type).toBe('video');
		expect(clip.state).toBe('LOADING');
		expect(clip.source.name).toBe('video.mp4');
		expect(clip.element.src).toBe(
			'blob:chrome://new-tab-page/3dc0f2b7-7773-4cd4-a397-2e43b1bba7cd',
		);
		expect(createObjectUrlSpy).toBeCalledTimes(1);
	});

	it('should update its state when canplay event gets triggered', () => {
		expect(clip.duration.seconds).toBe(0);

		const loadFn = vi.fn();
		clip.on('load', loadFn);
		clip.element.dispatchEvent(new Event('canplay'));
		expect(clip.duration.seconds).toBe(30);
		expect(clip.range[0].seconds).toBe(0);
		expect(clip.range[1].seconds).toBe(30);
		expect(clip.state).toBe('READY');
		expect(loadFn).toBeCalledTimes(1);
	});

	it('should go to idle state if the media gets emptied', () => {
		clip.element.dispatchEvent(new Event('canplay'));

		clip.playing = true;
		expect(clip.duration.seconds).toBe(30);

		clip.element.dispatchEvent(new Event('emptied'));
		expect(clip.playing).toBe(false);
		expect(clip.state).toBe('IDLE');
		expect(clip.track).toBeUndefined();
	});

	it("should throw an error if the media can't be loaded", () => {
		clip.element.dispatchEvent(new Event('canplay'));
		clip.element.dispatchEvent(new Event('error'));
		expect(clip.state).toBe('ERROR');
		expect(clip.track).toBeUndefined();
		expect(errorFn).toBeCalledTimes(1);
	});

	it('should be adaptable to a track', async () => {
		Object.assign(clip, { remove: () => null });
		clip.element.dispatchEvent(new Event('canplay'));

		// use common multiples of 30 and 15
		clip.duration.frames = <frame>60;
		clip.set({ offset: <frame>900, height: '100%' });

		const composition = new Composition();
		const track = composition.createTrack('video');

		attachFn.mockClear();

		const seekSpy = vi.spyOn(clip, 'seek').mockImplementation(async () => { });
		await track.add(clip);

		expect(seekSpy).toHaveBeenCalledTimes(1);

		expect(clip.state).toBe('ATTACHED');
		expect(clip.offset.frames).toBe(900);
		expect(clip.duration.frames).toBe(60);
		expect(clip.height).toBe('100%');
		expect(clip.range[0].frames).toBe(0);
		expect(clip.range[1].frames).toBe(60);

		expect(clip.start.frames).toBe(900);
		expect(clip.start.seconds).toBe(30);

		expect(clip.stop.frames).toBe(960);
		expect(clip.stop.seconds).toBe(32);

		expect(track.clips.findIndex((n) => n.id == clip.id)).toBe(0);
		expect(attachFn).toBeCalledTimes(1);
	});

	it('should play and pause the audio with the render method', async () => {
		vi.spyOn(clip.element, 'duration', 'get').mockReturnValue(5);

		const composition = new Composition();
		const renderer = new WebGPURenderer();
		Object.assign(clip, { track: { composition } });

		clip.element.dispatchEvent(new Event('canplay'));
		expect(clip.duration.seconds).toBe(5);

		expect(clip.playing).toBe(false);
		composition.state = 'PLAY';

		clip.render(renderer, new Timestamp());

		expect(clip.playing).toBe(true);
		expect(playFn).toBeCalledTimes(1);

		composition.state = 'IDLE';
		clip.render(renderer, new Timestamp());
		expect(clip.playing).toBe(false);
		expect(pauseFn).toBeCalledTimes(1);

		pauseFn.mockClear();

		clip.playing = true;
		clip.unrender();
		expect(clip.playing).toBe(false);
		expect(pauseFn).toBeCalledTimes(1);
	});

	it('slice should be persistant after adding clip', async () => {
		vi.spyOn(clip, 'seek').mockImplementation(async () => { });

		clip.subclip(<frame>20, <frame>60);

		const composition = new Composition();
		const promise = composition.add(clip);
		clip.element.dispatchEvent(new Event('canplay'));
		await promise;

		expect(clip.state).toBe('ATTACHED');
		expect(clip.duration.seconds).toBe(30);
		expect(clip.range[0].frames).toBe(20);
		expect(clip.range[1].frames).toBe(60);
	});
});

// Blend of different test files
describe('Copying the VidoClip', () => {
	let clip: VideoClip;

	beforeEach(() => {
		clip = new VideoClip(file);
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

// copied from src/clips/clip/clip.decorator.spec.ts
describe('The render decorator', () => {
	it('should not render the compostition if the clip is disabled', () => {
		const clip = new VideoClip();
		const renderer = new WebGPURenderer();
		const renderSpy = vi.spyOn(renderer, 'render').mockImplementation(() => { });
		const unrenderSpy = vi.spyOn(clip, 'unrender');

		clip.render(renderer, new Timestamp());

		expect(renderSpy).toHaveBeenCalledOnce();
		expect(unrenderSpy).not.toHaveBeenCalled();

		clip.set({ disabled: true });
		clip.render(renderer, new Timestamp());

		expect(renderSpy).toHaveBeenCalledOnce();
		expect(unrenderSpy).toHaveBeenCalledOnce()
	});
});

// copied from src/clips/mixins/visual.deserializers.spec.ts
describe('The visualize decorator', () => {
	it('should add a filter on render and remove it on unrender', () => {
		const renderer = new WebGPURenderer();
		const clip = new VideoClip();

		const filterSpy = vi.spyOn(clip.container, 'filters', 'set');
		const renderSpy = vi.spyOn(renderer, 'render');

		clip.render(renderer, new Timestamp());

		expect(filterSpy).not.toHaveBeenCalled();
		expect(renderSpy).toHaveBeenCalledTimes(1);

		clip.set({ filters: new BlurFilter() });

		clip.render(renderer, new Timestamp());

		expect(filterSpy).toHaveBeenCalledOnce();
		expect(renderSpy).toHaveBeenCalledTimes(2);

		vi.spyOn(clip.container, 'filters', 'get').mockReturnValue([new BlurFilter()]);

		// render again, it should only assign once
		clip.render(renderer, new Timestamp());

		expect(filterSpy).toHaveBeenCalledOnce();
		expect(renderSpy).toHaveBeenCalledTimes(3);

		clip.unrender();

		expect(filterSpy).toHaveBeenCalledTimes(2);
		expect(filterSpy.mock.calls[1][0]).toBe(null);
		expect(renderSpy).toHaveBeenCalledTimes(3);
	});
});
