/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Composition } from '../../composition';
import { MediaClip } from '../../clips';
import { Timestamp } from '../../models';
import { MediaTrack } from './media';
import { AudioSource } from '../../sources';
import { getSilenceArrayBuffer } from './media.utils';


// Mocking the OfflineAudioContext class for silence detection
class MockSilenceAudioContext {
	constructor(public numberOfChannels: number, public length: number, public sampleRate: number) { }

	decodeAudioData(_: ArrayBuffer): Promise<AudioBuffer> {
		const audioBuffer = {
			duration: 5, // Mock duration
			sampleRate: 1000,
			length: 5000,
			getChannelData: () => new Float32Array(5000).fill(0.5), // Return a dummy Float32Array
		} as any as AudioBuffer;
		return Promise.resolve(audioBuffer);
	}

	close() {
		return Promise.resolve();
	}
}

vi.stubGlobal('AudioContext', MockSilenceAudioContext); // Stub the global OfflineAudioContext

describe('Get silence array buffer', () => {
	it('should get silence array buffer', async () => {
		const audioBuffer = {
			duration: 5, // Mock duration
			sampleRate: 44100,
			length: 5 * 44100,
			getChannelData: () => {
				const totalLength = 5 * 44100;
				return Float32Array.from({length: totalLength}, (_, i) => {
					if (i < 2 * 44100) {
						return 1;
					}
					else if (i >= 3 * 44100) {
						return -1;
					}
					return 0;
				});
			},
		} as any as AudioBuffer;
		const silences = getSilenceArrayBuffer(audioBuffer, 44100, 1, -50, 0);
		expect(silences).toEqual([{
			start: 0,
			stop: 2
		},
		{
			start: 3,
			stop: 5
		}]);
	});

	it('no silence in getSilenceArrayBuffer', () => {
		const audioBuffer = {
			duration: 5, // Mock duration
			sampleRate: 44100,
			length: 5 * 44100,
			getChannelData: (i: number) => new Float32Array(5 * 44100).fill(0),
		} as any as AudioBuffer;
		const silences = getSilenceArrayBuffer(audioBuffer, 1024, 1, -50, 0);
		expect(silences).toEqual([]);
	});

	it('only silence in getSilenceArrayBuffer', () => {
		const audioBuffer = {
			duration: 5, // Mock duration
			sampleRate: 44100,
			length: 5 * 44100,
			getChannelData: () => new Float32Array(5 * 44100).fill(1),
		} as any as AudioBuffer;
		const silences = getSilenceArrayBuffer(audioBuffer, 1024, 1, -50, 0);
		expect(silences).toEqual([{
			start: 0,
			stop: 5
		}]);
	});

	it('should throw error if no sample rate', () => {
		const audioBuffer = {
			sampleRate: undefined,
		} as any as AudioBuffer;
		expect(() => getSilenceArrayBuffer(audioBuffer, 1024, 1, -50, 0)).toThrow();
	});
});


describe('Find silences in a track', () => {
	let comp: Composition;
	let track: MediaTrack<MediaClip>;
	let file: File;
	const updateMock = vi.fn();

	beforeEach(() => {
		// frame and seconds are the same
		comp = new Composition();
		file = new File([], "test.mp3");
		track = comp.shiftTrack(new MediaTrack<MediaClip>());
		track.on('update', updateMock);
	});

	it('empty track should have no silences', async () => {
		const emptyTrack = new MediaTrack();
		const silences = await track.detectSilences();
		expect(silences).toEqual([]);
	});

	it('track with clip but no element should have no silences', async () => {
		const clip = new MediaClip();
		clip.source = await AudioSource.from(file);
		await track.add(clip);
		const silences = await track.detectSilences();
		expect(silences).toEqual([]);
	});

	it('track with clip and element should find silences', async () => {
		const clip = new MediaClip();
		clip.source = await AudioSource.from(file);
		clip.element = new Audio();
		clip.duration.seconds = 5;
		const clip2 = new MediaClip();
		clip2.source = await AudioSource.from(file);
		clip2.element = new Audio();
		clip2.duration.seconds = 5;
		clip2.offset.seconds = 5;
		await track.add(clip);
		await track.add(clip2);

		const silences = await track.detectSilences();
		expect(silences).toEqual([{
			start: 0,
			stop: 5
		},
		{
			start: 5.001,
			stop: 10.001000000000001
		}]);
	});
});

describe('The Media Track Object', () => {
	let comp: Composition;
	let track: MediaTrack<MediaClip>;
	const updateMock = vi.fn();

	beforeEach(() => {
		// frame and seconds are the same
		comp = new Composition();
		track = comp.shiftTrack(new MediaTrack<MediaClip>());
		track.on('update', updateMock);
	});

	it('should propagate a seek call', async () => {
		const clip = new MediaClip();
		clip.element = new Audio();
		clip.duration.seconds = 60;
		clip.state = 'READY';
		await track.add(clip);
		expect(track.clips.length).toBe(1);
		const seekSpy = vi.spyOn(clip, 'seek').mockImplementation(async (_) => { });
		track.seek(Timestamp.fromFrames(5));
		expect(seekSpy).toBeCalledTimes(1);
	});

	it('should be be able to add a media clip with offset', async () => {
		const clip = new MediaClip();
		clip.duration.frames = 30;

		expect(clip.duration.frames).toBe(30);
		expect(clip.start.frames).toBe(0);
		expect(clip.offset.frames).toBe(0);
		expect(clip.stop.frames).toBe(30);

		clip.state = 'READY';
		await track.add(clip.offsetBy(60));

		expect(track.clips.at(0)?.start.frames).toBe(60);
		expect(track.clips.at(0)?.stop.frames).toBe(90);
		expect(track.clips.at(0)?.offset.frames).toBe(60);
		expect(track.clips.at(0)?.duration.frames).toBe(30);
	});
});
