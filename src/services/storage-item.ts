/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { EventEmitterMixin } from '../mixins';
import { Serializer } from '../services';

import type { Store } from '.';

type Events = {
	update: any;
}

export class StorageItem<T> extends EventEmitterMixin<Events, typeof Serializer>(Serializer) {
	private _key: string;
	private _value: T | undefined;
	private _store: Store;

	public loaded = false;

	public constructor(store: Store, key: string, value: T | Promise<T>) {
		super();

		this._store = store;
		this._key = key;
		this.initValue(value);
	}

	public get key(): string {
		return this._key;
	}

	public get value(): T {
		return this._value!;
	}

	public set value(newValue: T) {
		this._value = newValue;
		this._store.set(this._key, newValue);
		this.trigger('update', undefined);
	}

	private async initValue(value: T | Promise<T>) {
		if (value instanceof Promise) {
			this._value = await value;
		} else {
			this._value = value;
		}
		this.loaded = true;
		this.trigger('update', undefined);
	}
}
