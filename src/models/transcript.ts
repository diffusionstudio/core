/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { randInt } from '../utils';
import { formatTime, secondsToTime } from './transcript.utils';
import { WordGroup } from './transcript.group';
import { Language } from './transcript.types';
import { Word } from './transcript.word';
import { IOError } from '../errors';

import type { GeneratorOptions } from './transcript.types';
import type { Captions } from '../types';
import type { Serializer } from '../services';

export class Transcript implements Serializer {
	public id = crypto.randomUUID();
	public language: Language = Language.en;
	public groups: WordGroup[] = [];

	public get text(): string {
		return this.groups.map(({ text }) => text).join(' ');
	}

	public get words(): Word[] {
		return this.groups.flatMap(({ words }) => words);
	}

	public constructor(groups: WordGroup[] = [], language = Language.en) {
		this.groups = groups;
		this.language = language;
	}

	/**
	 * Iterate over all words in groups
	 */
	public *iter({ count, duration, length }: GeneratorOptions): Generator<WordGroup, void, unknown> {
		for (const group of this.groups) {
			let sequence: WordGroup | undefined;
			for (const [idx, word] of group.words.entries()) {
				if (sequence) {
					if (count && sequence.words.length >= randInt(...count)) {
						yield sequence;
						sequence = undefined;
					} else if (duration && sequence?.duration.seconds >= randInt(...duration)) {
						yield sequence;
						sequence = undefined;
					} else if (length && sequence.text.length >= randInt(...length)) {
						yield sequence;
						sequence = undefined;
					}
				}

				if (!sequence) {
					sequence = new WordGroup([word]);
				} else {
					sequence.words.push(word);
				}

				if (idx == group.words.length - 1) {
					yield sequence;
				}
			}
		}
	}

	/**
	 * This method will optimize the transcipt for display
	 */
	public optimize(): this {
		const words = this.groups.flatMap((group) => group.words);

		for (let i = 0; i < words.length - 1; i++) {
			const currWord = words[i];
			const nextWord = words[i + 1];

			if (nextWord.start.millis - currWord.stop.millis < 0) {
				// plus one frame in seconds
				nextWord.start.millis = currWord.stop.millis + 1;
			} else {
				currWord.stop.millis = nextWord.start.millis - 1;
			}
		}

		return this;
	}

	/**
	 * Convert the transcript into a SRT compatible
	 * string and downloadable blob
	 */
	public toSRT(options: GeneratorOptions = {}): { text: string; blob: Blob } {
		let idx: number = 1;
		let srt: string = '';

		for (const sequence of this.iter(options)) {
			const start = secondsToTime(sequence.start.seconds);
			const stop = secondsToTime(sequence.stop.seconds);

			srt +=
				`${idx}\n` + formatTime(start) + ' --> ' + formatTime(stop) + '\n' + `${sequence.text}\n\n`;

			idx += 1;
		}

		return {
			text: srt,
			blob: new Blob([srt], { type: 'text/plain;charset=utf8' }),
		};
	}

	public toJSON(): Captions {
		return this.groups.map((seg) =>
			seg.words.map((word) => ({
				token: word.text,
				start: word.start.millis,
				stop: word.stop.millis,
			})),
		);
	}

	/**
	 * Create a new Transcript containing the
	 * first `{count}` words
	 * @param count Defines the number of words required
	 * @param startAtZero Defines if the first word should start at 0 milliseconds
	 * @returns A new Transcript instance
	 */
	public slice(count: number, startAtZero = true): Transcript {
		let offset = 0;
		const words: Word[] = [];

		for (const group of this.groups) {
			for (const word of group.words) {
				if (words.length == 0 && startAtZero) {
					offset = word.start.millis;
				}

				words.push(new Word(word.text, word.start.millis - offset, word.stop.millis - offset));

				if (words.length == count) {
					return new Transcript([new WordGroup(words)]);
				}
			}
		}
		return new Transcript([new WordGroup(words)]);
	}

	public static fromJSON(data: Captions): Transcript {
		const transcipt = new Transcript();

		for (const sentence of data) {
			const group = new WordGroup();

			for (const word of sentence) {
				group.words.push(new Word(word.token, word.start, word.stop));
			}

			transcipt.groups.push(group);
		}
		return transcipt;
	}

	/**
	 * Fetch captions from an external resource and parse them. JSON needs
	 * to be of the form `{ token: string; start: number; stop: number; }[][]`
	 * @param url Location of the captions
	 * @param init Additional fetch parameters such as method or headers
	 * @returns A Transcript with processed captions
	 */
	public static async from(url: string | URL | Request, init?: RequestInit | undefined): Promise<Transcript> {
		const res = await fetch(url, init);

		if (!res.ok) {
			throw new IOError({
				code: 'unexpectedIOError',
				message: 'An unexpected error occurred while fetching the file',
			})
		}

		return Transcript.fromJSON(await res.json());
	}
}
