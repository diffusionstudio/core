/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, expect, it, vi, beforeEach, MockInstance, afterEach } from 'vitest';
import { HtmlClip } from './html';
import { BlurFilter } from 'pixi.js';
import { Keyframe } from '../../models';
import { HtmlSource } from '../../sources';
import { Composition } from '../../composition';

const file = new File(['<h1>Hello World</h1>'], 'index.html', {
	type: 'text/html',
});

describe('The Html Clip', () => {
	let iframeSpy: MockInstance<(arg: ((this: GlobalEventHandlers, ev: Event) => any) | null) => void>

	beforeEach(() => {
		iframeSpy = vi.spyOn(HTMLIFrameElement.prototype, 'onload', 'set')
			.mockImplementation(function (this: HTMLMediaElement, fn) {
				fn?.call(this, new Event('load'));
			});
	});

	it('should initialize', async () => {
		const clip = new HtmlClip(file, { x: 100 });

		expect(clip.type).toBe('html');
		expect(clip.state).toBe('IDLE');
		expect(clip.source.file).toBeInstanceOf(File);
		expect(clip.element.src).toBeFalsy();
		expect(clip.sprite.texture.label).toBe("EMPTY");

		mockDocumentValid(clip);
		const evtSpy = mockImageValid(clip);
		await clip.init();

		expect(evtSpy).toHaveBeenCalledTimes(1);
		expect(clip.x).toBe(100);
		expect(clip.state).toBe('READY');
		expect(clip.name).toBe('index.html');
		expect(clip.sprite.texture.label).not.toBe("EMPTY");
		expect(clip.element.src).toBe(
			"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3C/svg%3E",
		);
		expect(clip.canvas.height).toBe(400);
		expect(clip.canvas.width).toBe(200);
	});

	it("should throw an error when the image can't be loaded", async () => {
		const clip = new HtmlClip(file);

		mockDocumentValid(clip);
		const evtSpy = mockImageInvalid(clip);

		await expect(() => clip.init()).rejects.toThrowError();

		expect(evtSpy).toHaveBeenCalledTimes(1);
		expect(clip.state).toBe('ERROR');
	});

	it("should throw an error when the html height or width is zero", async () => {
		const clip = new HtmlClip(file);

		mockDocumentInvalid(clip);
		mockImageValid(clip);

		await expect(() => clip.init()).rejects.toThrowError();
	});

	it("should not render the clip if it's disabled", async () => {
		const clip = new HtmlClip(file, { x: 100 });

		mockDocumentValid(clip);
		mockImageValid(clip);

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

	it("should utilize the visualize decorator", async () => {
		const clip = new HtmlClip(file, { x: 300 });

		mockDocumentValid(clip);
		mockImageValid(clip);

		// still 0 because clip won't be rendered
		expect(clip.view.x).toBe(0);

		const updateSpy = vi.spyOn(clip, 'update');

		const composition = new Composition();
		await composition.add(clip);

		expect(updateSpy).toHaveBeenCalled();
		expect(clip.view.x).toBe(300);
	});

	afterEach(() => {
		iframeSpy.mockClear();
	});
});

// Blend of different test files
describe('Copying the HtmlClip', () => {
	let iframeSpy: MockInstance<(arg: ((this: GlobalEventHandlers, ev: Event) => any) | null) => void>
	let clip: HtmlClip;

	beforeEach(async () => {
		clip = new HtmlClip(file);

		iframeSpy = vi.spyOn(HTMLIFrameElement.prototype, 'onload', 'set')
			.mockImplementation(function (this: HTMLMediaElement, fn) {
				fn?.call(this, new Event('load'));
			});

		mockDocumentValid(clip);
		mockImageValid(clip);
		await clip.init();
	});

	it('should transfer visual properties', () => {
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

		expect(copy).toBeInstanceOf(HtmlClip);
		expect(copy.id).not.toBe(clip.id);
		expect(copy.source).toBeInstanceOf(HtmlSource);
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

	afterEach(() => {
		iframeSpy.mockClear();
	})
});

function mockDocumentValid(clip: HtmlClip) {
	return vi.spyOn(clip.source, 'document', 'get')
		.mockReturnValue({
			body: {
				scrollWidth: 200,
				scrollHeight: 400,
			},
			cloneNode: () => ({
				getElementsByTagName: () => ({
					item: () => undefined
				})
			})
		} as any);
}

function mockDocumentInvalid(clip: HtmlClip) {
	return vi.spyOn(clip.source, 'document', 'get')
		.mockReturnValue({
			body: {
				// considered invalid when 0
				scrollWidth: 0,
				scrollHeight: 0,
			},
			cloneNode: () => ({
				getElementsByTagName: () => ({
					item: () => undefined
				})
			})
		} as any);
}

function mockImageValid(clip: HtmlClip) {
	return vi.spyOn(clip.element, 'onload', 'set')
		.mockImplementation(function (this: HTMLMediaElement, fn) {
			clip.element.dispatchEvent(new Event('load'));
			fn?.call(this, new Event('load'));
		});
}

function mockImageInvalid(clip: HtmlClip) {
	return vi.spyOn(clip.element, 'onerror', 'set')
		.mockImplementation(function (this: HTMLMediaElement, fn) {
			clip.element.dispatchEvent(new Event('error'));
			fn?.call(this, new Event('error'));
		});
}
