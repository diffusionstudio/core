/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, expect, it, vi, beforeEach, afterAll } from 'vitest';
import { Keyframe, Timestamp, Transcript } from '../../models';
import { captions } from '../../test/captions';
import { Composition } from '../../composition';
import { CaptionTrack, MediaTrack } from '../../tracks';
import { MediaClipProps } from './media.interfaces';
import { Font, TextClip } from '../text';
import { ValidationError } from '../../errors';
import { VisualMixin, VisualMixinProps } from '../mixins';
import { MediaClip } from './media';
import { MixinType } from '../../types';

describe('The Media Clip', () => {
	const mockFn = vi.fn();
	const attachFn = vi.fn();
	const frameFn = vi.fn();
	const loadFn = vi.fn();

	let clip: MediaClip;

	beforeEach(() => {
		attachFn.mockClear();
		mockFn.mockClear();
		frameFn.mockClear();
		loadFn.mockClear();

		clip = new MediaClip();
		clip.on('update', mockFn);
		clip.on('attach', attachFn);
		clip.on('frame', frameFn);
		clip.on('load', loadFn);
	});

	it('should have an initial state', () => {
		clip.trigger('load', undefined);
		expect(clip.element).toBeUndefined();
		expect(loadFn).toBeCalledTimes(1);
		expect(clip.start.seconds).toBe(0);
		expect(clip.stop.seconds).toBe(0);
		expect(clip.range[0].seconds).toBe(0);
		expect(clip.range[1].seconds).toBe(0);
		expect(clip.playing).toBe(false);
	});

	it('should be able to cut a clip with subclip', () => {
		clip.duration.frames = 600;
		expect(clip.duration.frames).toBe(600);
		expect(clip.range[0].frames).toBe(0);
		// range 1 is using the duration timestamp by reference
		expect(clip.range[1].frames).toBe(600);
		clip.subclip(30, 360);
		expect(frameFn).toBeCalledTimes(1);
		expect(clip.range[0].frames).toBe(30);
		expect(clip.range[1].frames).toBe(360);
	});

	it('should lead to correct frames in combination with the offset', () => {
		clip.duration.frames = 300;
		clip.set({ offset: 150 });
		expect(frameFn).toBeCalledTimes(1);
		clip.subclip(30, 100);
		expect(frameFn).toBeCalledTimes(2);
		expect(clip.range[0].frames).toBe(30);
		expect(clip.range[1].frames).toBe(100);
		expect(clip.start.frames).toBe(150 + 30);
		expect(clip.stop.frames).toBe(150 + 100);
	});

	it('should not be possible to clip outside the duration boundaries', () => {
		clip.duration.frames = 20;
		clip.subclip(-5, 25);
		expect(clip.range[0].frames).toBe(0);
		expect(clip.range[1].frames).toBe(20);
	});

	it('should not be possible to reverse the upper and lower bound', () => {
		expect(() => clip.subclip(10, 5)).toThrowError();
	});

	it('should be possible to set either the upper or the lower bound', () => {
		clip.duration.frames = 20;
		clip.subclip(undefined, 15);
		expect(clip.range[1].frames).toBe(15);
		clip.subclip(5);
		expect(clip.range[0].frames).toBe(5);
	});

	it('should be adapt the lower slice when setting start', () => {
		clip.duration.frames = 20;
		clip.subclip(5, 15);
		clip.set({ offset: 5 });
		expect(clip.duration.frames).toBe(20);
		expect(clip.start.frames).toBe(10);
		expect(clip.stop.frames).toBe(20);
		// case in valid range
		clip.set({ start: 15 });
		expect(clip.start.frames).toBe(15);
		expect(clip.offset.frames).toBe(5);
		expect(clip.range[0].frames).toBe(10);
		expect(clip.range[1].frames).toBe(15);
		// lower than min range
		clip.set({ start: 4 });
		expect(clip.start.frames).toBe(5);
		expect(clip.offset.frames).toBe(5);
		expect(clip.range[0].frames).toBe(0);
		expect(clip.range[1].frames).toBe(15);
		// larger than max range
		clip.set({ start: 21 });
		expect(clip.start.frames).toBe(20);
		expect(clip.offset.frames).toBe(5);
		expect(clip.range[0].frames).toBe(15);
		expect(clip.range[0].millis).toBe(499);
		expect(clip.range[1].frames).toBe(15);
		expect(clip.range[1].millis).toBe(500);
	});

	it('should be adapt the upper slice when setting stop', () => {
		clip.duration.frames = 20;
		clip.subclip(5, 15);
		clip.set({ offset: 5 });
		expect(clip.duration.frames).toBe(20);
		expect(clip.start.frames).toBe(10);
		expect(clip.stop.frames).toBe(20);
		// case in valid range
		clip.set({ stop: 15 });
		expect(clip.start.frames).toBe(10);
		expect(clip.offset.frames).toBe(5);
		expect(clip.range[0].frames).toBe(5);
		expect(clip.range[1].frames).toBe(10);
		// lower than min range
		clip.set({ stop: 10 });
		expect(clip.start.frames).toBe(10);
		expect(clip.offset.frames).toBe(5);
		expect(clip.range[0].frames).toBe(5);
		expect(clip.range[0].millis).toBe(167);
		expect(clip.range[1].frames).toBe(5);
		expect(clip.range[1].millis).toBe(168);
		// larger than max range
		clip.set({ stop: 26 });
		expect(clip.start.frames).toBe(10);
		expect(clip.offset.frames).toBe(5);
		expect(clip.range[0].frames).toBe(5);
		expect(clip.range[1].frames).toBe(20);
	});

	it('should be adaptable to a track', async () => {
		// use common multiples of 30 and 15
		clip.duration.frames = 60;
		clip.set({ offset: 30 }).subclip(5, 50);

		// 30 fps is the default
		const composition = new Composition();
		const track = composition.shiftTrack(MediaTrack);

		clip.state = 'READY';
		await track.add(clip);
		expect(clip.state).toBe('ATTACHED');
		expect(clip.offset.frames).toBe(30);
		expect(clip.duration.frames).toBe(60);
		expect(clip.range[0].frames).toBe(5);
		expect(clip.range[1].frames).toBe(50);

		expect(clip.start.frames).toBe(35);
		expect(clip.start.millis).toBe(1167);

		expect(clip.stop.frames).toBe(80);
		expect(clip.stop.millis).toBe(2667);

		expect(track.clips.findIndex((n) => n.id == clip.id)).toBe(0);
		expect(attachFn).toBeCalledTimes(1);
	});

	it('should be mutable', () => {
		clip.element = document.createElement('video');
		expect(clip.element.muted).toBe(false);
		expect(clip.muted).toBe(false);
		clip.set({ muted: true });
		expect(clip.element.muted).toBe(true);
		expect(clip.muted).toBe(true);
	});

	it('should change the volume', () => {
		clip.element = document.createElement('video');
		expect(clip.element.volume).toBe(1);
		expect(clip.volume).toBe(1);
		clip.set({ volume: 0.5 });
		expect(clip.element.volume).toBe(0.5);
		expect(clip.volume).toBe(0.5);
	});

	it('should be seekable', async () => {
		clip.element = document.createElement('video');
		clip.duration.seconds = 20;
		clip.subclip(150, 450);
		// in range
		clip.seek(Timestamp.fromFrames(300));
		expect(clip.element.currentTime).toBe(10);
		// below range
		clip.seek(new Timestamp());
		expect(clip.element.currentTime).toBe(5);
		// above range
		clip.seek(Timestamp.fromFrames(20));
		expect(clip.element.currentTime).toBe(5);
	});

	it('should be seekable with offset', async () => {
		clip.element = document.createElement('video');
		clip.duration.seconds = 20;
		clip.subclip(5 * 30, 15 * 30);
		clip.set({ offset: 10 * 30 });
		expect(clip.start.seconds).toBe(15);
		expect(clip.stop.seconds).toBe(25);
		// in range
		clip.seek(Timestamp.fromFrames(20 * 30));
		expect(clip.element.currentTime).toBe(10);
		// 1s below range
		clip.seek(Timestamp.fromFrames(14 * 30));
		expect(clip.element.currentTime).toBe(5);
		// 1s above range
		clip.seek(Timestamp.fromFrames(26));
		expect(clip.element.currentTime).toBe(5);
	});

	it('should offset by a given number', async () => {
		clip.duration.frames = 20;
		clip.set({ offset: 100, name: 'foo' });
		clip.state = 'READY';

		const clip2 = new MediaClip({ offset: 60 });
		clip2.duration.frames = 30;
		clip2.state = 'READY';

		const composition = new Composition();
		const track = composition.shiftTrack(MediaTrack);
		await track.add(clip);
		await track.add(clip2);

		expect(track.clips.length).toBe(2);
		expect(track.clips[1].name).toBe('foo');

		clip.offsetBy(-80);

		expect(track.clips.length).toBe(2);
		expect(track.clips[0].name).toBe('foo');
		expect(track.clips[0].start.frames).toBe(20);
		expect(track.clips[0].stop.frames).toBe(40);

		clip.offsetBy(30);

		expect(track.clips.length).toBe(2);
		expect(track.clips[0].name).toBe('foo');
		expect(track.clips[0].start.frames).toBe(50);
		expect(track.clips[0].stop.frames).toBe(60);
		// clip2 start - 1ms, would overlap otherwise
		expect(track.clips[0].stop.millis).toBe(1999);
	});

	it('should create a copy of the object', async () => {
		clip.state = 'READY';
		clip.duration.frames = 100;
		clip.offset.frames = 40;
		clip.subclip(10, 80);
		clip.playing = true;
		clip.transcript = Transcript.fromJSON(captions);

		const copy = clip.copy();

		expect(copy.id).not.toBe(clip.id);
		expect(copy.state).not.toBe(clip.state);
		expect(copy.duration).toBeInstanceOf(Timestamp);
		expect(copy.duration.frames).toBe(100);
		expect(copy.offset).toBeInstanceOf(Timestamp);
		expect(copy.offset.frames).toBe(40);
		expect(copy.playing).not.toBe(true);
		expect(copy.transcript).toBeInstanceOf(Transcript);
		expect(copy.transcript?.text.length).toBeGreaterThan(0);
		expect(copy.range[0]).toBeInstanceOf(Timestamp);
		expect(copy.range[0].frames).toBe(10);
		expect(copy.range[1]).toBeInstanceOf(Timestamp);
		expect(copy.range[1].frames).toBe(80);
		expect(copy.transcript?.id).toBe(clip.transcript.id);
	});

	it('should generate a caption track using a transcript', async () => {
		vi.spyOn(Font.prototype, 'load').mockImplementation(async () => new Font());
		clip.transcript = Transcript.fromJSON(captions);
		clip.state = 'READY';

		const composition = new Composition();
		await composition.add(clip);

		const track = await clip.addCaptions();

		expect(composition.tracks.length).toBe(2);

		expect(composition.tracks[0]).toBeInstanceOf(CaptionTrack);
		expect(track).toBeInstanceOf(CaptionTrack);
		expect(track.clips.length).toBe(36);
		expect(track.clips[0]).toBeInstanceOf(TextClip);
		expect((track.clips[0] as TextClip).text).toBe('Is the');
	});

	it('should throw an error when trying to generate captions without a composition', async () => {
		vi.spyOn(Font.prototype, 'load').mockImplementation(async () => new Font());
		clip.transcript = Transcript.fromJSON(captions);
		clip.state = 'READY';

		await expect(() => clip.addCaptions()).rejects.toThrowError(ValidationError)
	});
});

describe('Split tests - the Media Clip object', () => {
	vi.spyOn(MediaClip.prototype, 'resolve').mockImplementation(function resolve(_: any) {
		return (resolve: (value: unknown) => void) => {
			resolve(undefined)
		};
	})

	it('should split the clip into two at a specified time', async () => {
		const clip = new MediaClip({
			name: 'foo',
			offset: new Timestamp(1000),
		});
		clip.state = 'READY';
		clip.duration.millis = 4000;

		const track = new MediaTrack();
		await track.add(clip);

		// add a second one after
		const clip1 = new MediaClip({
			offset: new Timestamp(5001)
		});
		clip1.state = 'READY';
		clip1.duration.millis = 999;

		await track.add(clip1);

		// add a third one before
		const clip2 = new MediaClip({
			offset: new Timestamp(100),
		});
		clip2.state = 'READY';
		clip2.duration.millis = 889;

		await track.add(clip2);

		expect(track.start.millis).toBe(100);
		expect(track.stop.millis).toBe(6000);
		expect(track.clips.length).toBe(3);

		await clip.split(new Timestamp(3500));

		expect(track.start.millis).toBe(100);
		expect(track.stop.millis).toBe(6000);
		expect(track.clips.length).toBe(4);

		expect(track.clips[1].name).toBe('foo');
		expect(track.clips[1].start.millis).toBe(1000);
		expect(track.clips[1].stop.millis).toBe(3500);
		expect(track.clips[1].range[0].millis).toBe(0);
		expect(track.clips[1].range[1].millis).toBe(2500);

		expect(track.clips[2].range[0].millis).toBe(2501);
		expect(track.clips[2].range[1].millis).toBe(4000);
		expect(track.clips[2].name).toBe('foo');
		expect(track.clips[2].start.millis).toBe(3501);
		expect(track.clips[2].stop.millis).toBe(5000);
	});

	it('should split the clip into two at the current time', async () => {
		const clip = new MediaClip({
			offset: new Timestamp(1000),
			name: 'foo',
		});
		const comp = new Composition();
		const track = comp.shiftTrack(MediaTrack);
		clip.state = 'READY';
		clip.duration.millis = 4000;

		await track.add(clip);

		comp.frame = new Timestamp(2700).frames;

		await clip.split();

		expect(track.start.millis).toBe(1000);
		expect(track.stop.millis).toBe(5000);
		expect(track.clips.length).toBe(2);

		expect(track.clips[0].name).toBe('foo');
		expect(track.clips[0].start.millis).toBe(1000);
		expect(track.clips[0].stop.millis).toBe(2700);

		expect(track.clips[1].name).toBe('foo');
		expect(track.clips[1].start.millis).toBe(2701);
		expect(track.clips[1].stop.millis).toBe(5000);
	});

	it('should not split the clip when an invalid time is provided', async () => {
		const clip = new MediaClip({
			offset: new Timestamp(1000),
			name: 'foo',
		});

		clip.state = 'READY';
		clip.duration.millis = 4000;

		await new MediaTrack().add(clip);

		await expect(() => clip.split(new Timestamp(1000))).rejects.toThrowError();
		await expect(() => clip.split(new Timestamp(5000))).rejects.toThrowError();
		// not connected to the composition
		await expect(() => clip.split()).rejects.toThrowError();
	});

	it('should split the clip in place when the track is set to stacked', async () => {
		const clip1 = new MediaClip({
			offset: new Timestamp(1000),
			name: 'foo',
		});

		const clip2 = new MediaClip({
			offset: new Timestamp(500),
			name: 'bar',
		});

		clip1.duration.millis = 3000;
		clip2.duration.millis = 2000;

		const track = new MediaTrack().stacked();

		await track.add(clip1);
		await track.add(clip2);

		expect(track.clips.length).toBe(2);

		expect(track.clips[0].name).toBe('foo');
		expect(track.clips[0].start.millis).toBe(0);
		expect(track.clips[0].stop.millis).toBe(3000);

		expect(track.clips[1].name).toBe('bar');
		expect(track.clips[1].start.millis).toBe(3001);
		expect(track.clips[1].stop.millis).toBe(5001);

		await clip1.split(new Timestamp(2000));

		expect(track.clips.length).toBe(3);
		expect(track.clips[0].start.millis).toBe(0);
		expect(track.clips[0].stop.millis).toBe(2000);

		expect(track.clips[1].start.millis).toBe(2001);
		expect(track.clips[1].stop.millis).toBe(3000);

		expect(track.clips[2].start.millis).toBe(3001);
		expect(track.clips[2].stop.millis).toBe(5001);
	});

	it('should not split the clip when no track is provided', async () => {
		const clip = new MediaClip({
			offset: new Timestamp(1000),
			name: 'foo',
		});
		clip.duration.millis = 4000;

		await expect(() => clip.split(new Timestamp(3000))).rejects.toThrowError();
	});

	it('should split the clip into two at a specified time and convert keyframes', async () => {
		interface ViusalMediaClipProps extends MediaClipProps, VisualMixinProps { }

		class ViusalMediaClip extends VisualMixin(MediaClip<ViusalMediaClipProps>) {
			public constructor(props: ViusalMediaClipProps = {}) {
				super();

				Object.assign(this, props);
			}

			public copy(): ViusalMediaClip {
				return ViusalMediaClip.fromJSON(JSON.parse(JSON.stringify(this)));
			}
		}

		const clip = new ViusalMediaClip({
			offset: new Timestamp(1000),
			rotation: new Keyframe([0, new Timestamp(4000).frames], [180, 360]),
			position: {
				x: 5,
				y: new Keyframe([0, new Timestamp(4000).frames], [20, 40]),
			}
		});

		clip.duration.millis = 4000;

		const track = new MediaTrack();

		await track.add(clip);

		await clip.split(new Timestamp(3000));

		expect(clip.rotation).toBeInstanceOf(Keyframe);
		expect(clip.position.x).toBe(5);

		const copy = track.clips[1] as MixinType<typeof VisualMixin> & MediaClip

		expect(Math.round(copy.rotation as any)).toBe(270);
		expect(copy.position.x).toBe(5);
		expect(Math.round(copy.position.y as any)).toBe(30);
	});

	afterAll(() => {
		vi.clearAllMocks();
	})
});
