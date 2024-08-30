/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, expect, it, beforeEach, vi, afterEach, afterAll } from 'vitest';
import { Composition } from './composition';
import { Clip } from '../clips';
import { AudioTrack, ImageTrack, TextTrack, Track, VideoTrack } from '../tracks';
import { Timestamp } from '../models';

import type { frame } from '../types';

describe('The composition', () => {
	let composition: Composition;
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

	it('should return width and height', () => {
		expect(composition.settings.height).toBe(composition.height);
		expect(composition.settings.width).toBe(composition.width);
	});

	it('should get the correct duration', async () => {
		const clip0 = new Clip().set({ stop: <frame>(12 * 30) });
		const track0 = composition.appendTrack(Track);
		await track0.appendClip(clip0);
		expect(composition.duration.seconds).toBe(12);
		expect(composition.duration.frames).toBe(12 * 30);

		const clip1 = new Clip().set({ stop: <frame>(18 * 30) });
		const track1 = composition.appendTrack(Track);
		await track1.appendClip(clip1);
		expect(composition.duration.seconds).toBe(18);
		expect(composition.duration.frames).toBe(18 * 30);
	});

	it('should set the duration appropriately', async () => {
		const clip0 = new Clip().set({ stop: <frame>(12 * 30) });
		const track0 = composition.appendTrack(Track);
		await track0.appendClip(clip0);
		expect(composition.duration.seconds).toBe(12);
		expect(composition.duration.frames).toBe(12 * 30);

		composition.duration = 4;
		expect(composition.duration.frames).toBe(4);

		composition.duration = Timestamp.fromFrames(<frame>(8 * 30));
		expect(composition.duration.seconds).toBe(8);
		expect(composition.duration.frames).toBe(8 * 30);
	});

	it('should append canvas to div', () => {
		const div = document.createElement('div');
		composition.attachPlayer(div);
		expect(div.children.length).toBe(1);
		expect(div.children[0] instanceof HTMLCanvasElement).toBe(true);
	});

	it('should append new tracks', () => {
		const video = composition.appendTrack(VideoTrack);

		expect(video instanceof VideoTrack).toBe(true);
		expect(composition.tracks.length).toBe(1);

		const image = composition.appendTrack(ImageTrack).position('bottom');
		expect(image instanceof ImageTrack).toBe(true);
		expect(composition.tracks.length).toBe(2);
		expect(composition.tracks.at(-1) instanceof ImageTrack).toBe(true);

		const text = composition.appendTrack(TextTrack).position('top');
		expect(text instanceof TextTrack).toBe(true);
		expect(composition.tracks.length).toBe(3);
		expect(composition.tracks[0] instanceof TextTrack).toBe(true);
		expect(composition.tracks[1] instanceof VideoTrack).toBe(true);

		const audio = composition.appendTrack(AudioTrack).position(1);
		expect(audio instanceof AudioTrack).toBe(true);
		expect(composition.tracks.length).toBe(4);
		expect(composition.tracks[1] instanceof AudioTrack).toBe(true);
	});

	it('should remove tracks of type', () => {
		expect(composition.tracks.length).toBe(0);
		composition.appendTrack(VideoTrack);
		composition.appendTrack(VideoTrack);
		composition.appendTrack(ImageTrack);
		composition.appendTrack(AudioTrack);
		composition.appendTrack(VideoTrack);
		composition.appendTrack(VideoTrack);

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
		composition.appendTrack(VideoTrack);
		const track = composition.appendTrack(VideoTrack);
		composition.appendTrack(ImageTrack);
		composition.appendTrack(AudioTrack);
		composition.appendTrack(VideoTrack);
		composition.appendTrack(VideoTrack);

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

	it('should render clips when user called play', async () => {
		const clip = new Clip().set({ stop: <frame>15 });

		const track = composition.appendTrack(Track);
		await track.appendClip(clip);
		expect(composition.duration.frames).toBe(15);
		expect(composition.duration.seconds).toBe(0.5);

		const seekMock = vi.spyOn(track, 'seek');
		const computeMock = vi.spyOn(composition, 'computeFrame');

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
		const clip = new Clip().set({ stop: <frame>(6 * 30) });
		const track = composition.appendTrack(Track);
		await track.appendClip(clip);

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
		const clip = new Clip().set({ stop: <frame>(6 * 30) });
		const track = composition.appendTrack(Track);
		await track.appendClip(clip);
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
		const clip = new Clip().set({ stop: <frame>(6 * 30) });
		const track = composition.appendTrack(Track);
		await track.appendClip(clip);

		composition.frame = <frame>10;
		expect(composition.screenshot()).toBe('data:image/png;base64,00');
		expect(composition.screenshot('webp')).toBe('data:image/webp;base64,00');
		expect(composition.screenshot('jpeg')).toBe('data:image/jpeg;base64,00');
	});

	it('should be able to calculate the correct time', async () => {
		composition.duration = Timestamp.fromFrames(<frame>(20 * 30));
		composition.frame = <frame>(10 * 30);
		expect(composition.time()).toBe('00:10 / 00:20');

		composition.duration = Timestamp.fromFrames(<frame>(90 * 30));
		composition.frame = <frame>(80 * 30);

		expect(composition.time()).toBe('01:20 / 01:30');

		// test milliseconds
		composition.duration = Timestamp.fromFrames(<frame>10);
		composition.frame = <frame>1;

		expect(composition.time({ milliseconds: true })).toBe('00:00.033 / 00:00.333');

		// test hours
		composition.duration = Timestamp.fromFrames(<frame>(2 * 60 * 60 * 30));
		composition.frame = <frame>(40 * 60 * 30);

		expect(composition.time({ hours: true })).toBe('00:40:00 / 02:00:00');
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
