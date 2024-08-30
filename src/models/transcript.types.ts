/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

export enum Language {
	en = 'en',
	de = 'de',
}

export type GeneratorOptions = {
	/**
	 * Iterates by word count
	 */
	count?: [number, number?];
	/**
	 * Iterates by group duration
	 */
	duration?: [number, number?];
	/**
	 * Iterates by number of characters within the group
	 */
	length?: [number, number?];
};
