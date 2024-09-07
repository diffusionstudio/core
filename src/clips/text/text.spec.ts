/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TextClip } from './text';
import { BlurFilter } from 'pixi.js';
import { Keyframe } from '../../models';
import { Font } from './font';
import { Composition } from '../../composition';

describe('The Text Clip', () => {
	it('should have an initial state', () => {
		const clip = new TextClip('Hello World');

		expect(clip.text).toBe('Hello World');
		expect(clip.fontFamily).toBe('Arial');
		expect(clip.textAlign).toBe('left');
		expect(clip.fillStyle).toBe('#FFFFFF');
		expect(clip.textBaseline).toBe('alphabetic');
		expect(clip.stroke).toBe(undefined);
		expect(clip.textCase).toBeUndefined();
		expect(clip.shadow).toBe(undefined);
		expect(clip.maxWidth).toBeUndefined();
		expect(clip.anchor.x).toBe(0);
		expect(clip.anchor.y).toBe(0);

		clip.anchor = { x: 0.2, y: 0.3 };
		expect(clip.anchor.x).toBe(0.2);
		expect(clip.anchor.y).toBe(0.3);
	});

	it('should be adaptible to a track', async () => {
		const updateFn = vi.fn();
		const attachFn = vi.fn();
		const clip = new TextClip({ text: 'Hello World' });
		clip.on('update', updateFn);
		clip.on('attach', attachFn);

		clip.set({ x: 3, y: 4 });
		expect(updateFn).toBeCalledTimes(1);

		clip.set({ stop: 60, start: 30 });

		const comp = new Composition();
		const track = comp.createTrack('text');
		await track.add(clip);

		expect(clip.height).not.toBe(0);
		expect(clip.width).not.toBe(0);
		expect(updateFn).toBeCalledTimes(2);
		expect(attachFn).toBeCalledTimes(1);

		// copied from clip.spec.ts ? Refactor?
		expect(clip.track?.id).toBe(track.id);
		expect(clip.state).toBe('ATTACHED');
		expect(clip.start.frames).toBe(30);
		expect(clip.stop.frames).toBe(60);
		expect(clip.start.millis).toBe(1000);
		expect(clip.stop.millis).toBe(2000);
		expect(track.clips.findIndex((n) => n.id == clip.id)).toBe(0);
	});

	// test is very similar to the copy test in text.0.spec.ts
	// can be removed?
	it('should be json serializable', async () => {
		const fontAddFn = vi.spyOn(document.fonts, 'add')
			.mockImplementation(vi.fn())

		const font = await new Font({
			family: 'Komika Axis',
			source: 'url(komika-axis.ttf)',
			style: 'normal',
		}).load();

		expect(fontAddFn).toBeCalledTimes(1);

		const clip = new TextClip({
			text: 'Hello World',
			font: font,
			fontSize: 12,
			stop: 20,
			start: 10,
			textBaseline: 'middle',
			textAlign: 'center',
			stroke: {
				color: '#323232',
				width: 4,
				join: 'round',
			},
			position: {
				x: 300,
				y: 400,
			},
			maxWidth: 1080,
			shadow: {
				color: '#000000',
				blur: 10,
				distance: 6,
				alpha: 0.2,
				angle: 45,
			},
		});

		const loadedClip = TextClip.fromJSON(JSON.parse(JSON.stringify(clip)));
		await loadedClip.font.load();

		// serialized properties
		expect(loadedClip.textAlign).toBe('center');
		expect(loadedClip.textBaseline).toBe('middle');
		expect(loadedClip.x).toBe(300);
		expect(loadedClip.y).toBe(400);
		expect(loadedClip.maxWidth).toBe(1080);
		expect(loadedClip.font).toBeInstanceOf(Font);
		expect(loadedClip.font.name).toBe('Komika Axis normal');
		expect(loadedClip.font.family).toBe('Komika Axis');
		expect(loadedClip.font.loaded).toBe(true);
		expect(loadedClip.fontSize).toBe(12);
		expect(loadedClip.stroke?.color).toBe('#323232');
		expect(loadedClip.stroke?.width).toBe(4);
		expect(loadedClip.stroke?.join).toBe('round');
		expect(loadedClip.shadow?.color).toBe('#000000');
		expect(loadedClip.shadow?.blur).toBe(10);
		expect(loadedClip.shadow?.angle).toBe(45);
		expect(loadedClip.shadow?.distance).toBe(6);
		expect(loadedClip.shadow?.alpha).toBe(0.2);
	});
});

// copied from src/clips/mixins/visual.deserializers.spec.ts
describe('The visualize decorator', () => {
	it("should be set", async () => {
		const clip = new TextClip('Hello World');

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
describe('Copying the TextClip', () => {
	let clip: TextClip;
	const fontAddFn = vi.fn();

	Object.assign(document, { fonts: { add: fontAddFn } });

	beforeEach(() => {
		clip = new TextClip('Hello World');
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

		expect(copy).toBeInstanceOf(TextClip);
		expect(copy.id).not.toBe(clip.id);
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

	it('should transfer font properties', async () => {
		const font = new Font({
			family: 'Bangers',
			style: 'normal',
			source: 'local(banger.ttf)'
		});
		font.loaded = true;

		clip.text = 'Foo bar';
		clip.font = font;
		clip.maxWidth = 345;
		clip.textAlign = 'right';
		clip.padding = 70;
		clip.textBaseline = 'bottom';
		clip.fillStyle = '#FF0000';
		clip.stroke = {
			alpha: 0.4,
			join: 'bevel',
			width: 7,
		};
		clip.textCase = 'upper';
		clip.shadow = {
			alpha: 0.6,
			distance: 2,
		};
		clip.fontSize = 29;
		clip.leading = 32;

		const copy = clip.copy();

		expect(copy.text).toBe('Foo bar');
		expect(copy.font).toBeInstanceOf(Font);
		expect(copy.font.name).toBe(clip.font.name);
		expect(copy.fontFamily).toBe('Bangers normal');
		expect(copy.maxWidth).toBe(345);
		expect(copy.textAlign).toBe('right');
		expect(copy.padding).toBe(70);
		expect(copy.textBaseline).toBe('bottom');
		expect(copy.fillStyle).toBe('#FF0000');
		// will be set by textAlign
		expect(copy.anchor.x).toBe(1);
		// will be set by textBaseline
		expect(copy.anchor.y).toBe(1);
		expect(copy.stroke?.alpha).toBe(0.4);
		expect(copy.stroke?.join).toBe('bevel');
		expect(copy.stroke?.width).toBe(7);
		expect(copy.textCase).toBe('upper');
		expect(copy.shadow?.alpha).toBe(0.6);
		expect(copy.shadow?.distance).toBe(2);
		expect(copy.fontSize).toBe(29);
		expect(copy.leading).toBe(32);
	});
});
