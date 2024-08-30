/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { Timestamp } from './timestamp';

export class Word {
	/**
	 * Defines the text to be displayed
	 */
	public text: string;
	/**
	 * Defines the time stamp at
	 * which the text is spoken
	 */
	public start: Timestamp;
	/**
	 * Defines the time stamp at
	 * which the text was spoken
	 */
	public stop: Timestamp;
	/**
	 * Defines the confidence of
	 * the predicition
	 */
	public confidence?: number;

	/**
	 * Create a new Word object
	 * @param text The string contents of the word
	 * @param start Start in **milliseconds**
	 * @param stop Stop in **milliseconds**
	 * @param confidence Predicition confidence
	 */
	public constructor(text: string, start: number, stop: number, confidence?: number) {
		this.text = text;
		this.start = new Timestamp(start);
		this.stop = new Timestamp(stop);
		this.confidence = confidence;
	}

	/**
	 * Defines the time between start
	 * and stop returned as a timestamp
	 */
	public get duration(): Timestamp {
		return this.stop.subtract(this.start);
	}
}
