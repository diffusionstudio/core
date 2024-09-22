/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import * as PIXI from 'pixi.js';
import { describe, expect, it, beforeEach, vi, afterEach, afterAll, MockInstance } from 'vitest';
import { Composition } from './composition';
import { AudioClip, Clip, TextClip } from '../clips';
import { AudioTrack, CaptionTrack, HtmlTrack, ImageTrack, TextTrack, Track, VideoTrack } from '../tracks';
import { Timestamp } from '../models';
import { sleep } from '../utils';
import { AudioBufferMock, OfflineAudioContextMock } from '../../vitest.mocks';
import { AudioSource } from '../sources';

describe('The composition', () => {
	let composition: Composition;
	let computeMock: MockInstance<() => void>;

	const frameMock = vi.fn();
	const playMock = vi.fn();
	const pauseMock = vi.fn();
	const updateMock = vi.fn();
	const requestAnimationFrameMock = vi
		.spyOn(window, 'requestAnimationFrame')
		.mockImplementation((cb) => {
			cb(Number.POSITIVE_INFINITY);
			return Number.POSITIVE_INFINITY;
		});

	beforeEach(async () => {
		composition = new Composition();
		composition.on('play', playMock);
		composition.on('pause', pauseMock);
		composition.on('update', updateMock);
		composition.on('frame', frameMock);
		composition.state = 'IDLE';

		localStorage.clear();
		computeMock = vi.spyOn(composition, 'computeFrame');
	});

	it('should initialize with default settings', () => {
		expect(composition.settings.background).toBe('#000000');
		expect(composition.settings.height).toBe(1080);
		expect(composition.settings.width).toBe(1920);
		expect(composition.duration.frames).toBe(0);
		expect(composition.duration.frames).toBe(0);
		expect(composition.tracks.length).toBe(0);
		expect(composition.frame).toBe(0);
		expect(composition.playing).toBe(false);
	});

	it("should trigger an error when the composition can't be initialized", async () => {
		const errorFn = vi.fn();
		vi.spyOn(PIXI, 'autoDetectRenderer')
			.mockImplementationOnce(() => Promise.reject(new Error('Mocked rejection')));
		const composition = new Composition();
		composition.on('error', errorFn);
		expect(errorFn).toBeCalledTimes(0);
		await sleep(1);
		expect(errorFn).toBeCalledTimes(1);
	})

	it('should return width and height', () => {
		expect(composition.settings.height).toBe(composition.height);
		expect(composition.settings.width).toBe(composition.width);
	});

	it('should get the correct duration', async () => {
		const clip0 = new Clip({ stop: 12 * 30 });
		const track0 = composition.createTrack('base');
		await track0.add(clip0);
		expect(composition.duration.seconds).toBe(12);
		expect(composition.duration.frames).toBe(12 * 30);

		const clip1 = new Clip({ stop: 18 * 30 });
		const track1 = composition.createTrack('base');
		await track1.add(clip1);
		expect(composition.duration.seconds).toBe(18);
		expect(composition.duration.frames).toBe(18 * 30);
	});

	it('should set the duration appropriately', async () => {
		const clip0 = new Clip({ stop: 12 * 30 });
		const track0 = composition.createTrack('base');
		await track0.add(clip0);
		expect(composition.duration.seconds).toBe(12);
		expect(composition.duration.frames).toBe(12 * 30);

		composition.duration = 4;
		expect(composition.duration.frames).toBe(4);

		composition.duration = Timestamp.fromFrames(8 * 30);
		expect(composition.duration.seconds).toBe(8);
		expect(composition.duration.frames).toBe(8 * 30);
	});

	it('should attach a canvas to the dom and be able to remove it', () => {
		const div = document.createElement('div');
		composition.attachPlayer(div);
		expect(div.children.length).toBe(1);
		expect(div.children[0] instanceof HTMLCanvasElement).toBe(true);

		composition.detachPlayer(div);
		expect(div.children.length).toBe(0);
	});

	it('should append new tracks', () => {
		expect(composition.stage.children.length).toBe(0);
		const video = composition.createTrack('video');

		expect(video instanceof VideoTrack).toBe(true);
		expect(composition.stage.children.length).toBe(1);
		expect(composition.tracks.length).toBe(1);

		const image = composition.createTrack('image').layer('bottom');
		expect(image instanceof ImageTrack).toBe(true);
		expect(composition.stage.children.length).toBe(2);
		expect(composition.tracks.length).toBe(2);
		expect(composition.tracks.at(-1) instanceof ImageTrack).toBe(true);

		const text = composition.createTrack('text').layer('top');
		expect(text instanceof TextTrack).toBe(true);
		expect(composition.stage.children.length).toBe(3);
		expect(composition.tracks.length).toBe(3);
		expect(composition.tracks[0] instanceof TextTrack).toBe(true);
		expect(composition.tracks[1] instanceof VideoTrack).toBe(true);

		const audio = composition.createTrack('audio').layer(1);
		expect(audio instanceof AudioTrack).toBe(true);
		expect(composition.stage.children.length).toBe(4);
		expect(composition.tracks.length).toBe(4);
		expect(composition.tracks[1] instanceof AudioTrack).toBe(true);
	});

	it('should remove tracks of type', () => {
		expect(composition.tracks.length).toBe(0);
		composition.createTrack('video');
		composition.createTrack('video');
		composition.createTrack('image');
		composition.createTrack('audio');
		composition.createTrack('video');
		composition.createTrack('video');

		expect(composition.tracks.length).toBe(6);

		composition.removeTracks(VideoTrack);
		expect(composition.tracks.length).toBe(2);
		expect(updateMock).toHaveBeenCalled();

		updateMock.mockReset();

		// this shouldn't do anything
		composition.removeTracks(VideoTrack);
		expect(composition.tracks.length).toBe(2);
		expect(updateMock).not.toHaveBeenCalled();
	});

	it('should be able to retrieve tracks', () => {
		composition.createTrack('video');
		const track = composition.createTrack('video');
		composition.createTrack('image');
		composition.createTrack('audio');
		composition.createTrack('video');
		composition.createTrack('video');

		expect(composition.tracks.length).toBe(6);

		// all video tracks
		const search1 = composition.findTracks(VideoTrack);
		expect(search1.length).toBe(4);

		// one particular track
		const search2 = composition.findTracks((l) => l.id == track.id);
		expect(search2.length).toBe(1);

		const search3 = composition.findTracks((l) => l instanceof ImageTrack);
		expect(search3.length).toBe(1);

		// a track that does not exist
		const search4 = composition.findTracks((l) => l.id == track.id + '_');
		expect(search4.length).toBe(0);
	});

	it('should seek a time by timestamp', async () => {
		const clip = new Clip({ stop: 15 });

		const track = composition.createTrack('base');
		await track.add(clip);

		const seekMock = vi.spyOn(track, 'seek');
		computeMock.mockClear();

		const ts = new Timestamp(400) // 12 frames
		composition.seek(ts);
		expect(composition.frame).toBe(12);
		expect(seekMock).toBeCalledTimes(1);
		expect(seekMock.mock.calls[0][0].millis).toBe(400);
	});

	it('should render clips when user called play', async () => {
		const clip = new Clip({ stop: 15 });

		const track = composition.createTrack('base');
		await track.add(clip);
		expect(composition.duration.frames).toBe(15);
		expect(composition.duration.seconds).toBe(0.5);

		const seekMock = vi.spyOn(track, 'seek');
		computeMock.mockClear();

		const frameCallbacks: number[] = [];
		composition.on('currentframe', (evt) => frameCallbacks.push(evt.detail));

		composition.play();
		expect(composition.playing).toBe(true);
		expect(seekMock).toBeCalledTimes(1);
		seekMock.mockClear();

		await new Promise(composition.resolve('pause'));

		expect(composition.playing).toBe(false);
		expect(frameCallbacks.join()).toBe('0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,0');
		expect(playMock).toBeCalledTimes(1);
		expect(pauseMock).toBeCalledTimes(1);
		expect(seekMock).toBeCalledTimes(1);
		expect(computeMock).toBeCalledTimes(17);
	});

	it('should stop rendering when pause gets called', async () => {
		const clip = new Clip({ stop: 6 * 30 });
		const track = composition.createTrack('base');
		await track.add(clip);

		const frameCallbacks: number[] = [];
		composition.on('currentframe', (evt) => {
			frameCallbacks.push(evt.detail);
			// pause after 10 frames
			if (evt.detail == 10 && composition.playing) {
				composition.pause();
			}
		});

		composition.play();
		expect(composition.playing).toBe(true);

		await new Promise(composition.resolve('pause'));

		expect(composition.playing).toBe(false);
		expect(frameCallbacks.join()).toBe('0,1,2,3,4,5,6,7,8,9,10,10');
	});

	it('should stop rendering at the end of the duration', async () => {
		const clip = new Clip({ stop: 6 * 30 });
		const track = composition.createTrack('base');
		await track.add(clip);
		composition.duration = 15;
		expect(composition.duration.frames).toBe(15);
		expect(composition.duration.seconds).toBe(0.5);

		const frameCallbacks: number[] = [];
		composition.on('currentframe', (evt) => frameCallbacks.push(evt.detail));

		composition.play();
		expect(composition.playing).toBe(true);

		await new Promise(composition.resolve('pause'));

		expect(frameCallbacks.join()).toBe('0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,0');
	});

	it('should be able to screenshot a frame', async () => {
		await composition.add(new Clip({ stop: 6 * 30 }));

		composition.frame = 10;
		expect(composition.screenshot()).toBe('data:image/png;base64,00');
		expect(composition.screenshot('webp')).toBe('data:image/webp;base64,00');
		expect(composition.screenshot('jpeg')).toBe('data:image/jpeg;base64,00');
	});

	it('should not screenshot a frame when the renderer is undefined', async () => {
		await composition.add(new Clip({ stop: 6 * 30 }));

		delete composition.renderer;

		expect(() => composition.screenshot()).toThrowError();
	});

	it('should be able to calculate the correct time', async () => {
		composition.duration = Timestamp.fromFrames(20 * 30);
		composition.frame = 10 * 30;
		expect(composition.time()).toBe('00:10 / 00:20');

		composition.duration = Timestamp.fromFrames(90 * 30);
		composition.frame = 80 * 30;

		expect(composition.time()).toBe('01:20 / 01:30');

		// test milliseconds
		composition.duration = Timestamp.fromFrames(10);
		composition.frame = 1;

		expect(composition.time({ milliseconds: true })).toBe('00:00.033 / 00:00.333');

		// test hours
		composition.duration = Timestamp.fromFrames(2 * 60 * 60 * 30);
		composition.frame = 40 * 60 * 30;

		expect(composition.time({ hours: true })).toBe('00:40:00 / 02:00:00');
	});

	it('should should create tracks of a given type', async () => {
		expect(composition.tracks.length).toBe(0);

		composition.createTrack('base');
		expect(composition.tracks[0]).toBeInstanceOf(Track);

		composition.createTrack('audio');
		expect(composition.tracks[0]).toBeInstanceOf(AudioTrack);

		composition.createTrack('caption');
		expect(composition.tracks[0]).toBeInstanceOf(CaptionTrack);

		composition.createTrack('complex_text');
		expect(composition.tracks[0]).toBeInstanceOf(TextTrack);

		composition.createTrack('text');
		expect(composition.tracks[0]).toBeInstanceOf(TextTrack);

		composition.createTrack('html');
		expect(composition.tracks[0]).toBeInstanceOf(HtmlTrack);

		composition.createTrack('image');
		expect(composition.tracks[0]).toBeInstanceOf(ImageTrack);

		composition.createTrack('video');
		expect(composition.tracks[0]).toBeInstanceOf(VideoTrack);

		expect(composition.tracks.length).toBe(8);
	});

	it('should add a track and clip to the composition using the convenience function', async () => {
		expect(composition.tracks.length).toBe(0);

		await composition.add(new Clip());

		expect(composition.tracks.length).toBe(1);
		expect(composition.tracks[0]).toBeInstanceOf(Track);
		expect(composition.tracks[0].clips[0]).toBeInstanceOf(Clip);

		await composition.add(new TextClip());

		expect(composition.tracks.length).toBe(2);
		expect(composition.tracks[0]).toBeInstanceOf(TextTrack);
		expect(composition.tracks[0].clips[0]).toBeInstanceOf(TextClip);
	});

	it('should be able to remove tracks', () => {
		const track0 = composition.createTrack('video');
		const track1 = composition.createTrack('text');
		const track2 = composition.createTrack('image');

		expect(composition.tracks.length).toBe(3)
		expect(composition.stage.children.length).toBe(3);

		const detachFn = vi.fn();
		composition.on('detach', detachFn);

		let res = composition.removeTrack(track1);

		expect(detachFn).toBeCalledTimes(1);
		expect(res).toBeInstanceOf(TextTrack);

		expect(composition.tracks.length).toBe(2);
		expect(composition.stage.children.length).toBe(2);
		expect(composition.tracks[0]).toBeInstanceOf(ImageTrack);
		expect(composition.tracks[1]).toBeInstanceOf(VideoTrack);
		expect(composition.tracks.findIndex((l) => l.id == track1.id)).toBe(-1);
		expect(composition.stage.children.findIndex(c => c.uid == track0.view.uid)).toBe(0);
		expect(composition.stage.children.findIndex(c => c.uid == track2.view.uid)).toBe(1);

		// try again
		res = composition.removeTrack(track1);

		expect(res).toBeUndefined();
		expect(composition.tracks.length).toBe(2);
		expect(composition.stage.children.length).toBe(2);
	});

	it('should be able to remove clips', async () => {
		const track0 = composition.createTrack('base');
		const track1 = composition.createTrack('base');

		const clip = new Clip({ stop: 10 });

		await track0.add(clip);
		await track0.add(new Clip({ stop: 20, start: 10 }));
		await track1.add(new Clip({ stop: 9 }));
		await track1.add(new Clip({ stop: 12, start: 9 }));

		expect(track0.clips.length).toBe(2);
		expect(track1.clips.length).toBe(2);

		// clip that does not exist
		let res = composition.remove(new Clip());

		expect(res).toBe(undefined);
		expect(track0.clips.length).toBe(2);
		expect(track1.clips.length).toBe(2);

		res = composition.remove(clip);

		expect(res?.id).toBe(clip.id);
		expect(track0.clips.length).toBe(1);
		expect(track1.clips.length).toBe(2);

		res = composition.remove(clip);

		expect(res).toBe(undefined);
		expect(track0.clips.length).toBe(1);
		expect(track1.clips.length).toBe(2);
	});

	it('should redraw the composition when it changes', async () => {
		expect(composition.duration.frames).toBe(0);
		expect(computeMock).toBeCalledTimes(0);

		const track = composition.createTrack('base');

		expect(composition.duration.frames).toBe(0);
		expect(computeMock).toBeCalledTimes(1);

		await track.add(new Clip({ stop: 20 }));

		expect(composition.duration.frames).toBe(20);
		expect(computeMock).toBeCalledTimes(2);

		const clip = await track.add(new Clip({ start: 30, stop: 60 }));

		expect(composition.duration.frames).toBe(60);
		expect(computeMock).toBeCalledTimes(3);

		clip.stop = 80;

		expect(composition.duration.frames).toBe(80);
		expect(computeMock).toBeCalledTimes(4);

		track.remove(clip);

		expect(composition.duration.frames).toBe(20);
		expect(computeMock).toBeCalledTimes(5);
	});

	afterEach(() => {
		frameMock.mockClear();
		playMock.mockClear();
		pauseMock.mockClear();
		updateMock.mockClear();
	});

	afterAll(() => {
		requestAnimationFrameMock.mockClear();
	});
});

describe('Composition audio', () => {
	vi.stubGlobal('OfflineAudioContext', OfflineAudioContextMock);

	const source = new AudioSource();

	vi.spyOn(source, 'decode').mockImplementation(async (
		numberOfChannels: number = 2,
		sampleRate: number = 48000,
	) => {
		const buffer = new AudioBufferMock({ numberOfChannels, sampleRate, length: 8000 });

		for (let i = 0; i < buffer.channelData.length; i++) {
			for (let j = 0; j < buffer.channelData[i].length; j++) {
				buffer.channelData[i][j] = 1;
			}
		}

		return buffer as any;
	});

	vi.spyOn(source, 'createObjectURL').mockImplementationOnce(async () => '');

	const clip = new AudioClip(source);

	vi.spyOn(clip.element, 'oncanplay', 'set')
		.mockImplementation(function (this: HTMLMediaElement, fn) {
			fn?.call(this, new Event('canplay'));
		});

	vi.spyOn(clip.element, 'duration', 'get').mockReturnValue(1);

	it('should merge audio clips', async () => {
		const composition = new Composition();
		await composition.add(clip.subclip(2, 26));

		expect(composition.duration.frames).toBe(26);
		composition.duration = 30;
		expect(composition.duration.frames).toBe(30);

		const buffer = await composition.audio(1, 8000);
		expect(buffer.length).toBe(8000);
		expect(buffer.numberOfChannels).toBe(1);
		expect(buffer.sampleRate).toBe(8000);
		
		const data = buffer.getChannelData(0);
		// audio clip has been trimmed and contains all ones
		expect(data.at(0)).toBe(0);
		expect(data.at(-1)).toBe(0);
		expect(data.at(4000)).toBe(1);
	});
});
