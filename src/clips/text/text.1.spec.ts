/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, expect, it, vi, afterEach } from 'vitest';
import { Composition } from '../../composition';
import { TextClip } from './text';
import { Font } from './font';

import type { frame } from '../../types';

describe('The Text Clip', () => {
	const fontAddFn = vi.fn();

	Object.assign(document, { fonts: { add: fontAddFn } });

	afterEach(() => {
		fontAddFn.mockClear();
	});

	it('should be adaptible to a track', async () => {
		const updateFn = vi.fn();
		const attachFn = vi.fn();
		const clip = new TextClip({ text: 'Hello World' });
		clip.on('update', updateFn);
		clip.on('attach', attachFn);

		clip.set({ x: 3, y: 4 });
		expect(updateFn).toBeCalledTimes(1);

		clip.set({ stop: <frame>60, start: <frame>30 });

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
			stop: <frame>20,
			start: <frame>10,
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
