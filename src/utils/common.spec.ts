/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, expect, it, vi } from 'vitest';
import { assert, capitalize, debounce, groupBy, isClass, randInt, sleep, splitAt, toHex, uid } from '.';

describe('The common utils', () => {
	it.each([
		[1, 'FF'],
		[0.95, 'F2'],
		[0.9, 'E5'],
		[0.85, 'D8'],
		[0.8, 'CC'],
		[0.75, 'BF'],
		[0.7, 'B2'],
		[0.65, 'A5'],
		[0.6, '99'],
		[0.55, '8C'],
		[0.5, '7F'],
		[0.45, '72'],
		[0.4, '66'],
		[0.35, '59'],
		[0.3, '4C'],
		[0.25, '3F'],
		[0.2, '33'],
		[0.15, '26'],
		[0.1, '19'],
		[0.05, '0C'],
		[0, '00'],
	])('should be able to calculate hex', (num, hex) => {
		expect(toHex(num)).toBe(hex);
	});

	it('should be able to group objects', () => {
		const data = [
			{ someKey: 'a', groupKey: 2 },
			{ someKey: 'b', groupKey: 3 },
			{ someKey: 'c', groupKey: 2 },
			{ someKey: 'd', groupKey: 1 },
		];

		const grouped = groupBy(data, 'groupKey');

		expect(Object.keys(grouped).includes('2')).toBe(true);
		expect(Object.keys(grouped).includes('3')).toBe(true);
		expect(Object.keys(grouped).includes('1')).toBe(true);
		expect(Object.keys(grouped).includes('4')).toBe(false);

		expect(grouped['2'].length).toBe(2);
		expect(grouped['3'].length).toBe(1);
		expect(grouped['1'].length).toBe(1);
	});

	it('should be able to split strings and arrays', () => {
		expect(splitAt<string[]>('Hello World', 5).length).toBe(2);
		expect(splitAt<string[]>('Hello World', 5)[0]).toBe('Hello');
		expect(splitAt<string[]>('Hello World', 5)[1]).toBe(' World');
		expect(splitAt<string[]>('Hello World', -2)[0]).toBe('Hello Wor');
		expect(splitAt<string[]>('Hello World', -2)[1]).toBe('ld');
		expect(splitAt<string[]>('Hello World', 11)[0]).toBe('Hello World');
		expect(splitAt<string[]>('Hello World', 11).length).toBe(1);

		expect(splitAt<number[]>([1, 2, 3, 4, 5, 6], 3).length).toBe(2);
		expect(splitAt<number[]>([1, 2, 3, 4, 5, 6], 3)[0].toString()).toBe('1,2,3');
		expect(splitAt<number[]>([1, 2, 3, 4, 5, 6], 3)[1].toString()).toBe('4,5,6');
	});

	it('should strings to be captitalized', () => {
		const mySting = 'hello, world!';

		expect(capitalize(mySting)).toBe('Hello, world!');
		expect(mySting).toBe('hello, world!');
	});

	it('should be able to generate a random integer', () => {
		for (let i = 0; i < 50; i++) {
			expect(randInt(100, undefined)).toBeGreaterThanOrEqual(100);
			expect(randInt(1, 5)).toBeGreaterThanOrEqual(1);
			expect(randInt(1, 5)).toBeLessThanOrEqual(5);
		}
	});

	it('should assert a condition (assert)', () => {
		expect(() => assert(1)).not.toThrowError();
		expect(() => assert(0)).toThrowError();
	});

	it('should debounce a method (debunce)', async () => {
		const fn = vi.fn();

		const debouncedFn = debounce(() => fn(performance.now()), 10);

		debouncedFn();
		debouncedFn();

		await sleep(20);

		expect(fn).toBeCalledTimes(1);

		debouncedFn();
		await sleep(11);
		debouncedFn();

		await sleep(20);

		expect(fn).toBeCalledTimes(3);

		expect(fn.mock.calls[0][0]).toBeTypeOf('number');
	});

	it('should be able to detect classes (isClass)', () => {
		expect(isClass(5)).toBe(false);
		expect(isClass(() => false)).toBe(false);
		expect(isClass('')).toBe(false);
		expect(isClass(new class { }())).toBe(false);
		expect(isClass(class { })).toBe(true);
	});

	it('should be able to capitalize strings (capitalize)', () => {
		expect(capitalize('hello World')).toBe('Hello World');
	});

	it('should be able to generate short uids (uid)', () => {
		expect(uid()).toBeTypeOf('string');
		expect(uid()?.length).toBe(8);
		expect(uid()).not.toBe(uid());
	});

	it('should not sleep if the number is less than 0 (sleep)', async () => {
		const now = performance.now();

		await sleep(-10);

		expect(performance.now() -now).toBeLessThan(1);
	});
});
