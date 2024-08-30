/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { Timestamp } from './timestamp';
import type { Word } from './transcript.word';

export class WordGroup {
	public words: Word[] = [];

	public constructor(words?: Word[]) {
		if (!words) return;
		this.words = words;
	}

	public get duration(): Timestamp {
		return this.stop.subtract(this.start);
	}

	public get text(): string {
		return this.words.map(({ text }) => text).join(' ');
	}

	public get start(): Timestamp {
		return this.words.at(0)?.start ?? new Timestamp();
	}

	public get stop(): Timestamp {
		return this.words.at(-1)?.stop ?? new Timestamp();
	}
}
