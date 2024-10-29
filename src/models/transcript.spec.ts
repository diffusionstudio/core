/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, expect, it } from 'vitest';
import { Transcript, Word, WordGroup } from '../models';
import { setFetchMockReturnValue } from '../../vitest.mocks';

describe('Transcript tests', () => {
	it('the word should calculate the duration correctly', () => {
		const word = new Word('Hello', 1e3, 5e3);
		expect(word.duration.seconds).toBe(4);
	});

	it('the word group should have functional getters', () => {
		const group = new WordGroup([new Word('Hello', 1e3, 2e3), new Word('World', 8e3, 12e3)]);

		expect(group.duration.seconds).toBe(11);
		expect(group.text).toBe('Hello World');
		expect(group.start.seconds).toBe(1);
		expect(group.stop.seconds).toBe(12);
	});

	it('the transcript should have functional getters', () => {
		const group1 = new WordGroup([new Word('Lorem', 1e3, 2e3), new Word('Ipsum', 8e3, 12e3)]);

		const group2 = new WordGroup([new Word('is', 8e3, 12e3), new Word('simply', 8e3, 12e3)]);

		const group3 = new WordGroup([new Word('dummy', 8e3, 12e3), new Word('text', 8e3, 12e3)]);

		const transcript = new Transcript([group1, group2, group3]);
		expect(transcript.language).toBe('en');
		expect(transcript.text).toBe('Lorem Ipsum is simply dummy text');
	});

	it('the transcript should have functional iter generator', () => {
		const transcript = new Transcript([
			new WordGroup([
				new Word('Lorem', 0, 1e3),
				new Word('Ipsum', 2e3, 3e3),
				new Word('is', 4e3, 5e3),
				new Word('simply', 6e3, 7e3),
				new Word('dummy', 8e3, 9e3),
				new Word('text', 10e3, 11e3),
				new Word('of', 12e3, 13e3),
				new Word('the', 14e3, 15e3),
				new Word('printing', 16e3, 17e3),
				new Word('and', 18e3, 19e3),
				new Word('typesetting', 20e3, 21e3),
				new Word('industry', 22e3, 23e3),
			]),
			new WordGroup([
				new Word('Lorem', 24e3, 25e3),
				new Word('Ipsum', 26e3, 27e3),
				new Word('has', 28e3, 29e3),
				new Word('been', 30e3, 31e3),
				new Word('the', 32e3, 33e3),
				new Word("industry's", 34e3, 35e3),
				new Word('standard', 36e3, 37e3),
				new Word('dummy', 38e3, 39e3),
			]),
		]);

		for (const group of transcript.iter({ count: [1] })) {
			expect(group.words.length).toBe(1);
		}
		for (const group of transcript.iter({ count: [1, 3] })) {
			expect(group.words.length).toBeGreaterThanOrEqual(1);
			expect(group.words.length).toBeLessThanOrEqual(3);
		}

		for (const group of transcript.iter({ length: [12] })) {
			// remove the last word which can be longer than 12 chars
			if (group.words.length > 1) {
				expect(group.text.length).toBeGreaterThanOrEqual(12);
				group.words.pop();
				expect(group.text.length).toBeLessThanOrEqual(12);
			}
		}
		for (const group of transcript.iter({ length: [6, 18] })) {
			if (group.words.length > 1) {
				expect(group.text.length).toBeGreaterThanOrEqual(6);
				group.words.pop();
				expect(group.text.length).toBeLessThanOrEqual(18);
			}
		}

		for (const group of transcript.iter({ duration: [3] })) {
			if (group.words.length > 1) {
				expect(group.duration.seconds).toBeGreaterThanOrEqual(3);
				group.words.pop();
				expect(group.duration.seconds).toBeLessThanOrEqual(3);
			}
		}
		for (const group of transcript.iter({ duration: [3, 6] })) {
			if (group.words.length > 1) {
				expect(group.duration.seconds).toBeGreaterThanOrEqual(3);
				group.words.pop();
				expect(group.duration.seconds).toBeLessThanOrEqual(6);
			}
		}
	});

	it('should be able to convert a transcript to captions and back to a transcript', () => {
		const transcript = new Transcript([
			new WordGroup([
				new Word('Lorem', 0e3, 1e3),
				new Word('Ipsum', 2e3, 3e3),
				new Word('is', 4e3, 5e3),
				new Word('simply', 6e3, 7e3),
			]),
			new WordGroup([new Word('Lorem', 24e3, 25e3), new Word('Ipsum', 26e3, 27e3)]),
		]);

		const captions = transcript.toJSON();

		expect(captions.length).toBe(2);
		expect(captions[0].length).toBe(4);
		expect(captions[1].length).toBe(2);

		expect(captions[0][2].token).toBe('is');
		expect(captions[0][2].start).toBe(4000);
		expect(captions[0][2].stop).toBe(5000);

		expect(captions[1][1].token).toBe('Ipsum');
		expect(captions[1][1].start).toBe(26000);
		expect(captions[1][1].stop).toBe(27000);

		const newTranscript = Transcript.fromJSON(captions);

		expect(newTranscript.groups.length).toBe(2);
		expect(newTranscript.groups[0].words.length).toBe(4);
		expect(newTranscript.groups[1].words.length).toBe(2);

		expect(newTranscript.groups[0].words[2].text).toBe('is');
		expect(newTranscript.groups[0].words[2].start.seconds).toBe(4);
		expect(newTranscript.groups[0].words[2].stop.seconds).toBe(5);

		expect(newTranscript.groups[1].words[1].text).toBe('Ipsum');
		expect(newTranscript.groups[1].words[1].start.seconds).toBe(26);
		expect(newTranscript.groups[1].words[1].stop.seconds).toBe(27);
	});

	it('should generated a cloned transcript with the max number of words', () => {
		const transcript = new Transcript([
			new WordGroup([
				new Word('Lorem', 500, 1e3),
				new Word('Ipsum', 2e3, 3e3),
				new Word('is', 4e3, 5e3),
				new Word('simply', 6e3, 7e3),
				new Word('dummy', 8e3, 9e3),
				new Word('text', 10e3, 11e3),
				new Word('of', 12e3, 13e3),
				new Word('the', 14e3, 15e3),
				new Word('printing', 16e3, 17e3),
				new Word('and', 18e3, 19e3),
				new Word('typesetting', 20e3, 21e3),
				new Word('industry', 22e3, 23e3),
			]),
			new WordGroup([
				new Word('Lorem', 24e3, 25e3),
				new Word('Ipsum', 26e3, 27e3),
				new Word('has', 28e3, 29e3),
				new Word('been', 30e3, 31e3),
				new Word('the', 32e3, 33e3),
				new Word("industry's", 34e3, 35e3),
				new Word('standard', 36e3, 37e3),
				new Word('dummy', 38e3, 39e3),
			]),
		]);

		const subset = transcript.slice(6);

		expect(subset.id).not.toBe(transcript.id);
		expect(subset.groups.length).toBe(1);
		expect(subset.groups.at(0)?.words.length).toBe(6);

		expect(subset.groups.at(0)?.words.at(0)?.text).toBe('Lorem');
		expect(subset.groups.at(0)?.words.at(-1)?.text).toBe('text');

		expect(subset.groups.at(0)?.words.at(0)?.start.seconds).toBe(0);
		expect(subset.groups.at(0)?.words.at(0)?.stop.seconds).toBe(0.5);

		expect(subset.groups.at(0)?.words.at(-1)?.start.seconds).toBe(9.5);
		expect(subset.groups.at(0)?.words.at(-1)?.stop.seconds).toBe(10.5);
	});

	it('should be able to get all words', () => {
		const transcript = new Transcript([
			new WordGroup([new Word('Lorem', 0, 1e3)]),
			new WordGroup([new Word('Ipsum', 2e3, 3e3)]),
		]);

		expect(transcript.words.length).toBe(2);
		expect(transcript.words[0].text).toBe('Lorem');
		expect(transcript.words[1].text).toBe('Ipsum');
		expect(transcript.words[0]).toBeInstanceOf(Word);
		expect(transcript.words[1]).toBeInstanceOf(Word);
	});

	it('should generated a cloned transcript with the max available number of words', () => {
		const transcript = new Transcript([
			new WordGroup([new Word('Lorem', 4e3, 6e3), new Word('Ipsum', 9e3, 11e3)]),
			new WordGroup([new Word('is', 14e3, 17e3)]),
		]);

		const subset = transcript.slice(6);

		expect(subset.groups.length).toBe(1);
		expect(subset.groups.at(0)?.words.length).toBe(3);

		expect(subset.groups.at(0)?.words.at(0)?.text).toBe('Lorem');
		expect(subset.groups.at(0)?.words.at(1)?.text).toBe('Ipsum');
		expect(subset.groups.at(0)?.words.at(-1)?.text).toBe('is');

		expect(subset.groups.at(0)?.words.at(0)?.start.seconds).toBe(0);
		expect(subset.groups.at(0)?.words.at(0)?.stop.seconds).toBe(2);

		expect(subset.groups.at(0)?.words.at(1)?.start.seconds).toBe(5);
		expect(subset.groups.at(0)?.words.at(1)?.stop.seconds).toBe(7);

		expect(subset.groups.at(0)?.words.at(-1)?.start.seconds).toBe(10);
		expect(subset.groups.at(0)?.words.at(-1)?.stop.seconds).toBe(13);
	});

	it('should optimize the word timestamps', () => {
		const transcript = new Transcript([
			new WordGroup([new Word('Lorem', 0, 12), new Word('Ipsum', 15, 21)]),
			new WordGroup([new Word('is', 18, 27)]),
		]);

		transcript.optimize();

		expect(transcript.groups.length).toBe(2);
		expect(transcript.groups[0].words[0].start.millis).toBe(0);
		expect(transcript.groups[0].words[0].stop.millis).toBe(14);

		expect(transcript.groups[0].words[1].start.millis).toBe(15);
		expect(transcript.groups[0].words[1].stop.millis).toBe(21);

		expect(transcript.groups[1].words[0].start.millis).toBe(22);
		expect(transcript.groups[1].words[0].stop.millis).toBe(27);
	});

	it('should be converatble to an srt', () => {
		const transcript = new Transcript([
			new WordGroup([new Word('Lorem', 0, 1e3), new Word('Ipsum', 2e3, 5e3)]),
			new WordGroup([new Word('is', 7e3, 8e3)]),
		]);

		const { text, blob } = transcript.toSRT({ count: [2] });

		expect(text).toContain(`1
00:00:00,000 --> 00:00:05,000
Lorem Ipsum`
		);

		expect(text).toContain(`2
00:00:07,000 --> 00:00:08,000
is`
		);

		expect(blob.type).toBe('text/plain;charset=utf8');
	});

	it('should be able to instantiate from an url', async () => {
		const resetFetch = setFetchMockReturnValue({
			ok: true,
			json: async () => ([
				[
					{ token: 'Lorem', start: 0, stop: 12 },
					{ token: 'Ipsum', start: 15, stop: 20 },
				],
				[
					{ token: 'is', start: 21, stop: 38 },
				]
			]),
		});

		const transcript = await Transcript.from('http://diffusion.mov/caption.json');


		expect(transcript.groups.length).toBe(2);
		expect(transcript.groups[0].words[0].start.millis).toBe(0);
		expect(transcript.groups[0].words[0].stop.millis).toBe(12);
		expect(transcript.groups[0].words[0].text).toBe('Lorem');

		expect(transcript.groups[0].words[1].start.millis).toBe(15);
		expect(transcript.groups[0].words[1].stop.millis).toBe(20);
		expect(transcript.groups[0].words[1].text).toBe('Ipsum');

		expect(transcript.groups[1].words[0].start.millis).toBe(21);
		expect(transcript.groups[1].words[0].stop.millis).toBe(38);
		expect(transcript.groups[1].words[0].text).toBe('is');

		resetFetch();
	});

	it('should not be able to instantiate when the response is not ok', async () => {
		const resetFetch = setFetchMockReturnValue({ ok: false, });

		await expect(() => Transcript.from('http://diffusion.mov/caption.json')).rejects.toThrowError();

		resetFetch();
	});
});
