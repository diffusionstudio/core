/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, expect, it, afterEach } from 'vitest';
import { StorageItem, Store } from '.';

describe('The Storage Item Object', () => {
	const store = new Store();

	it('should be able get the key and value from the constructor', () => {
		const item = new StorageItem(store, 'MY_KEY', 5);

		expect(item.key).toBe('MY_KEY');
		expect(item.value).toBe(5);
	});

	it('should update the value when a new value is set', () => {
		const item = new StorageItem(store, 'MY_KEY_1', 3);

		expect(item.value).toBe(3);

		item.value = 8;

		expect(item.value).toBe(8);
		expect(store.get(item.key)).toBe(8);
	});

	afterEach(() => {
		localStorage.clear();
	});
});
