/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { framesToMillis, secondsToFrames } from './timestamp.utils';

import type { Serializer } from '../services';
import type { frame } from '../types';

/**
 * Defines a time indication object that uses
 * milliseconds rounded to the nearest integer
 * and 30fps internally. By default the time is 0
 */
export class Timestamp implements Omit<Serializer, 'id'> {
	/**
	 * Time state in **milliseconds**
	 */
	private time: number;

	/**
	 * Create a new timestamp from **milliseconds**
	 */
	public constructor(milliseconds: number = 0) {
		this.time = Math.round(milliseconds);
	}

	/**
	 * Base unit of the timestamp
	 */
	public get millis(): number {
		return this.time;
	}

	public set millis(value: number) {
		this.time = Math.round(value);
	}

	/**
	 * Defines the time in frames at the
	 * current frame rate
	 */
	public get frames(): frame {
		return secondsToFrames(this.millis / 1000);
	}

	public set frames(value: frame) {
		this.millis = framesToMillis(value)
	}

	/**
	 * Convert the timestamp to seconds
	 */
	public get seconds(): number {
		return this.millis / 1000;
	}

	public set seconds(value: number) {
		this.millis = value * 1000;
	}

	/**
	 * Equivalent to millis += x
	 */
	public addMillis(value: number): this {
		this.millis = this.millis + value;

		return this;
	}

	/**
	 * Equivalent to frames += x
	 */
	public addFrames(value: frame): this {
		const millis = framesToMillis(value);

		this.millis = this.millis + millis;

		return this;
	}

	/**
	 * add two timestamps the timestamp being added will adapt
	 * its fps to the current fps
	 * @returns A new Timestamp instance with the added frames
	 */
	public add(time: Timestamp): Timestamp {
		return new Timestamp(time.millis + this.millis);
	}

	/**
	 * subtract two timestamps timestamp being subtracted
	 * will adapt its fps to the current fps
	 * @returns A new Timestamp instance with the added frames
	 */
	public subtract(time: Timestamp): Timestamp {
		return new Timestamp(this.millis - time.millis);
	}


	/**
	 * Create a new timestamp from seconds
	 */
	public static fromSeconds(value: number): Timestamp {
		const timestamp = new Timestamp();
		timestamp.millis = value * 1000;

		return timestamp;
	}

	/**
	 * Create a new timestamp from frames
	 */
	public static fromFrames(value: frame, fps?: number): Timestamp {
		const timestamp = new Timestamp();
		timestamp.millis = framesToMillis(value, fps);

		return timestamp;
	}

	/**
	 * get a copy of the object
	 */
	public copy(): Timestamp {
		return new Timestamp(this.millis);
	}

	public toJSON(): number {
		return this.millis;
	}

	public static fromJSON(value: number): Timestamp {
		return new Timestamp(value);
	}
}
