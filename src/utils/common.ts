/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

/**
 * Convert an alpha value to hex
 * @param alpha A value between 0 and 1
 * @returns Alpha as 2 digit hex
 * @example FF
 */
export function toHex(alpha: number): string {
	return Math.floor(alpha * 255)
		.toString(16)
		.padStart(2, '0')
		.toUpperCase();
}

/**
 * Group an array of objects by the specified key
 */
export function groupBy<T extends {}, K extends keyof T>(arr: T[], key: K) {
	return arr.reduce(
		(accumulator, val) => {
			const groupedKey = val[key];
			if (!accumulator[groupedKey]) {
				accumulator[groupedKey] = [];
			}
			accumulator[groupedKey].push(val);
			return accumulator;
		}, // @ts-ignore
		{} as Record<T[K], T[]>,
	);
}

/**
 * Split an array at the specified position
 */
export function splitAt<T>(list: any[] | string, index: number): T {
	return [list.slice(0, index), list.slice(index)].filter((i) => i.length > 0) as T;
}

/**
 * Generate a random value between two numbers
 */
export function randInt(min: number, max: number | undefined): number {
	if (!max) return min;
	// min and max included
	return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * setTimeout async/await replacement
 */
export async function sleep(ms: number): Promise<void> {
	if (ms <= 0) return;
	await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * clip assert replacement for the browser
 * @example assert(true == false)
 */
export function assert(condition: any) {
	if (!condition) {
		throw 'Assertion failed!';
	}
}

/**
 * Limit the number of times a function can be called
 * per interval, timeout is in milliseconds
 */
export function debounce(func: Function, timeout = 300) {
	let timer: any;
	return (...args: any[]) => {
		clearTimeout(timer);
		timer = setTimeout(() => {
			func.apply(func, args);
		}, timeout);
	};
}

/**
 * Move an element inside the provided array
 */
export function arraymove(arr: any[], fromIndex: number, toIndex: number) {
	if (toIndex < 0) toIndex = 0;
	const element = arr[fromIndex];
	arr.splice(fromIndex, 1);
	arr.splice(toIndex, 0, element);
}

/**
 * Short unique id (not as secure as uuid 4 though)
 */
export function uid() {
	return crypto.randomUUID().split('-').at(0);
}

/**
 * Check whether a given value is a class
 */
export function isClass(value: any) {
	if (typeof value !== 'function') {
		return false; // Not a function
	}

	// Check if it's a class
	const isClass = /^class\s/.test(Function.prototype.toString.call(value));
	return isClass;
}

export function capitalize(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}
