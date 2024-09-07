/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ImageClip } from './image';
import { BlurFilter } from 'pixi.js';
import { Keyframe } from '../../models';
import { ImageSource } from '../../sources';
import { Composition } from '../../composition';

const file = new File([], 'image.png', { type: 'image/png' });

describe('The Image Clip', () => {
	const updateFn = vi.fn();
	const errorFn = vi.fn();
	const attachFn = vi.fn();
	const loadFn = vi.fn();

	let clip: ImageClip;

	beforeEach(async () => {
		updateFn.mockClear();
		errorFn.mockClear();
		attachFn.mockClear();
		loadFn.mockClear();

		clip = new ImageClip(file);
		clip.on('update', updateFn);
		clip.on('error', errorFn);
		clip.on('attach', attachFn);
		clip.on('load', loadFn);

		mockImageValid(clip);
		await clip.init();
	});

	it('should initialize', async () => {
		const clip = new ImageClip(file, { x: 100 });

		expect(clip.type).toBe('image');
		expect(clip.state).toBe('IDLE');
		expect(clip.source.file).toBeInstanceOf(File);
		expect(clip.element.src).toBeFalsy();
		expect(clip.sprite.texture.label).toBe("EMPTY");

		const evtSpy = mockImageValid(clip);
		await clip.init();

		expect(evtSpy).toHaveBeenCalledTimes(1);
		expect(clip.x).toBe(100);
		expect(clip.state).toBe('READY');
		expect(clip.name).toBe('image.png');
		expect(clip.sprite.texture.label).not.toBe("EMPTY");
		expect(clip.source.name).toBe('image.png');
		expect(clip.source.objectURL).toBe(
			'blob:chrome://new-tab-page/3dc0f2b7-7773-4cd4-a397-2e43b1bba7cd',
		);
	});

	it("should throw an error if the media can't be loaded", async () => {
		const clip = new ImageClip(file);

		const evtSpy = mockImageInvalid(clip);

		await expect(() => clip.init()).rejects.toThrowError();

		expect(evtSpy).toHaveBeenCalledTimes(1);
		expect(clip.state).toBe('ERROR');
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

		clip.set({ disabled: true });

		expect(exitSpy).toHaveBeenCalledTimes(1);
	});

	it("should use the visualize decorator", async () => {
		clip.set({ x: 300 });

		// still 0 because clip won't be rendered
		expect(clip.view.x).toBe(0);

		const updateSpy = vi.spyOn(clip, 'update');

		const composition = new Composition();
		await composition.add(clip);

		expect(updateSpy).toHaveBeenCalled();
		expect(clip.view.x).toBe(300);
	});
});

// Blend of different test files
describe('Copying the ImageClip', () => {
	let clip: ImageClip;

	beforeEach(async () => {
		clip = new ImageClip(file);
		mockImageValid(clip);
		await clip.init();
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

		expect(copy).toBeInstanceOf(ImageClip);
		expect(copy.id).not.toBe(clip.id);
		expect(copy.source).toBeInstanceOf(ImageSource);
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
			start: 20,
			stop: 80,
			disabled: true,
		});

		const copy = clip.copy();

		expect(copy.name).toBe('Hello World');
		expect(copy.start.frames).toBe(20);
		expect(copy.stop.frames).toBe(80);
		expect(copy.disabled).toBe(true);
		expect(copy.state).not.toBe(clip.state);
		expect(copy.id).not.toBe(clip.id);
		expect(copy.track).not.toBeDefined();
	});
});

function mockImageValid(clip: ImageClip) {
	return vi.spyOn(clip.element, 'onload', 'set')
		.mockImplementation(function (this: HTMLMediaElement, fn) {
			fn?.call(this, new Event('load'));
		});
}

function mockImageInvalid(clip: ImageClip) {
	return vi.spyOn(clip.element, 'onerror', 'set')
		.mockImplementation(function (this: HTMLMediaElement, fn) {
			fn?.call(this, new Event('error'));
		});
}
