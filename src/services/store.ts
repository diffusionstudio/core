/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { StorageItem } from './storage-item';
import type { Deserializer } from './store.types';

export class Store {
	public readonly storageEngine: Storage;
	public readonly namespace?: string;

	public constructor(namespace?: string, storageEngine = localStorage) {
		this.storageEngine = storageEngine;
		this.namespace = namespace;
	}

	public define<T>(key: string, defaultValue: T, deserializer?: Deserializer<T>): StorageItem<T> {
		const storedValue = this.get<T>(key);

		if (storedValue === null) {
			this.set(key, defaultValue);
			return new StorageItem<T>(this, key, defaultValue);
		}
		if (deserializer && storedValue != undefined) {
			return new StorageItem<T>(this, key, deserializer(storedValue));
		}

		return new StorageItem<T>(this, key, storedValue);
	}

	public set<T>(key: string, value: T): void {
		this.storageEngine.setItem(
			this.getStorageId(key),
			JSON.stringify({
				value: value,
			}),
		);
	}

	public get<T>(key: string): T | null {
		const item = this.storageEngine.getItem(this.getStorageId(key));

		if (item) {
			return JSON.parse(item).value as T;
		}

		return null;
	}

	public remove(key: string): void {
		this.storageEngine.removeItem(this.getStorageId(key));
	}

	private getStorageId(key: string): string {
		if (this.namespace) {
			return `${this.namespace}.${key}`;
		}
		return key;
	}
}
