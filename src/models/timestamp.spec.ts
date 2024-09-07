/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, expect, it } from 'vitest';
import { Timestamp } from '../models';

describe('New Timestamp model', () => {
	it('result in valid states after construction', () => {
		const ts0 = new Timestamp();

		expect(ts0.frames).toBe(0);
		expect(ts0.seconds).toBe(0);
		expect(ts0.millis).toBe(0);

		const ts1 = Timestamp.fromFrames(60);

		expect(ts1.frames).toBe(60);
		expect(ts1.seconds).toBe(2);
		expect(ts1.millis).toBe(2e3);

		const ts2 = new Timestamp(89.4);

		expect(ts2.frames).toBe(3);
		expect(ts2.seconds).toBe(0.089);
		expect(ts2.millis).toBe(89);

		const ts3 = new Timestamp(121.5);

		expect(ts3.frames).toBe(4);
		expect(ts3.seconds).toBe(0.122);
		expect(ts3.millis).toBe(122);

		const ts4 = Timestamp.fromSeconds(1.234953);

		expect(ts4.frames).toBe(37);
		expect(ts4.seconds).toBe(1.235);
		expect(ts4.millis).toBe(1235);

		const ts5 = Timestamp.fromFrames(60, 10);

		expect(ts5.frames).toBe(180);
		expect(ts5.seconds).toBe(6);
		expect(ts5.millis).toBe(6e3);
	});

	it('should round the value when setting millis', () => {
		const ts = new Timestamp();

		ts.millis = 20.332;

		expect(ts.millis).toBe(20);

		ts.millis = 20.632;

		expect(ts.millis).toBe(21);
	});

	it('should round the value when setting frames', () => {
		const ts = new Timestamp();

		ts.frames = 20.332;

		expect(ts.frames).toBe(20);

		ts.frames = 20.632;

		expect(ts.frames).toBe(21);
	});

	it('should round the value when setting seconds', () => {
		const ts = new Timestamp();

		ts.seconds = 20.3324;

		expect(ts.seconds).toBe(20.332);

		ts.seconds = 20.3325;

		expect(ts.seconds).toBe(20.333);
	});

	it('should add frames and round the result', () => {
		const ts = Timestamp.fromFrames(20);

		ts.addFrames(20);

		expect(ts.frames).toBe(40);

		ts.addFrames(21.4);

		expect(ts.frames).toBe(61);

		ts.addFrames(-20);

		expect(ts.frames).toBe(41);
	});

	it('should add milliseconds and round the result', () => {
		const ts = new Timestamp(30.4);

		expect(ts.millis).toBe(30);

		ts.addMillis(24.5);

		expect(ts.millis).toBe(55);
	});

	it('should be able to add a timestamp', () => {
		const ts0 = Timestamp.fromFrames(30);
		const ts1 = Timestamp.fromFrames(50);

		const ts0ts1 = ts0.add(ts1);

		expect(ts0ts1.frames).toBe(80);

		const ts2 = new Timestamp(30);
		const ts3 = new Timestamp(50);

		const ts2ts3 = ts2.add(ts3);

		expect(ts2ts3.millis).toBe(80);

		// test negative numbers
		const ts4 = new Timestamp(-20);
		const ts5 = new Timestamp(30);

		const ts4ts5 = ts4.add(ts5);

		expect(ts4ts5.millis).toBe(10);
	});

	it('should be able to subtract a timestamp', () => {
		const ts0 = Timestamp.fromFrames(20);
		const ts1 = Timestamp.fromFrames(15)

		const ts0ts1 = ts0.subtract(ts1);

		expect(ts0ts1.frames).toBe(5);

		const ts2 = new Timestamp(20);
		const ts3 = new Timestamp(15);

		const ts2ts3 = ts2.subtract(ts3);

		expect(ts2ts3.millis).toBe(5);

		// test negative numbers
		const ts4 = new Timestamp(-20);
		const ts5 = new Timestamp(30);

		const ts4ts5 = ts4.subtract(ts5);

		// -20 - 30
		expect(ts4ts5.millis).toBe(-50);
	});

	it('should create a new instance when copying timestamps', () => {
		const ts = new Timestamp(20);
		const tsCopy = ts.copy();

		expect(ts.millis).toBe(20);
		expect(tsCopy.millis).toBe(20);

		tsCopy.millis = 40;

		expect(ts.millis).toBe(20);
		expect(tsCopy.millis).toBe(40);
	});

	it('should be json serializable and deserializable', () => {
		const ts = new Timestamp(120);
		const tsCopy = Timestamp.fromJSON(JSON.parse(JSON.stringify(ts)));

		expect(tsCopy).toBeInstanceOf(Timestamp);
		expect(tsCopy.millis).toBe(120);
	})
});
