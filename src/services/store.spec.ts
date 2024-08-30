/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, expect, it, afterEach } from 'vitest';
import { StorageItem, Store } from '.';
import { sleep } from '../utils';

describe('The Store Object', () => {
	const store = new Store();

	it('should be able to set an item', () => {
		expect(localStorage.getItem('a')).toBe(null);
		store.set('a', 5);
		expect(JSON.parse(localStorage.getItem('a') ?? '{}').value).toBe(5);

		expect(localStorage.getItem('b')).toBe(null);
		store.set('b', 'Hello World');
		expect(JSON.parse(localStorage.getItem('b') ?? '{}').value).toBe('Hello World');

		expect(localStorage.getItem('c')).toBe(null);
		store.set('c', true);
		expect(JSON.parse(localStorage.getItem('c') ?? '{}').value).toBe(true);

		expect(localStorage.getItem('d')).toBe(null);
		store.set('d', { hello: 'world' });
		expect('hello' in JSON.parse(localStorage.getItem('d') ?? '{}').value).toBe(true);
		expect(JSON.parse(localStorage.getItem('d') ?? '{}').value.hello).toBe('world');
	});

	it('should be able to get an item', () => {
		store.set('a', { hello: 'world' });
		expect('hello' in store.get<any>('a')).toBe(true);
		expect(store.get<any>('a').hello).toBe('world');

		store.set('b', 5);
		expect(store.get<any>('b')).toBe(5);

		store.set('c', 'Hello World');
		expect(store.get<any>('c')).toBe('Hello World');

		store.set('d', true);
		expect(store.get('d')).toBe(true);
	});

	it('should be able to define a storage item', () => {
		expect(localStorage.getItem('MY_KEY')).toBe(null);
		const item0 = store.define('MY_KEY', 10);
		expect(JSON.parse(localStorage.getItem('MY_KEY') ?? '{}').value).toBe(10);
		expect(item0 instanceof StorageItem).toBe(true);
		expect(item0.key).toBe('MY_KEY');
		expect(item0.value).toBe(10);

		// defining storage again should not change value
		const item1 = store.define('MY_KEY', 2);
		expect(JSON.parse(localStorage.getItem('MY_KEY') ?? '{}').value).toBe(10);
		expect(item1.key).toBe('MY_KEY');
		expect(item1.value).toBe(10);
	});

	it('should be able to get and set items with a namespace', () => {
		const _store = new Store('namespace.test');

		const value = 5;

		expect(localStorage.getItem('namespace.test.MY_KEY')).toBe(null);
		_store.set('MY_KEY', value);
		expect(localStorage.getItem('namespace.test.MY_KEY')).not.toBe(null);
		expect(_store.get('MY_KEY')).toBe(5);
	});

	it('should be able to store and retrieve a class with custom json serializer and deserializer', async () => {
		class SomeClass {
			public otherVal?: number;

			public toJSON() {
				return { val: 3 };
			}

			public static async fromDb(data: any): Promise<SomeClass> {
				await sleep(10);
				const cls = new SomeClass();
				cls.otherVal = data.val;
				return cls;
			}
		}

		const item0 = store.define('SOME_KEY', new SomeClass(), SomeClass.fromDb);
		// SOME_KEY hasn't been stored yet so the value should just be new MyClass()
		expect(item0.value?.otherVal).toBe(undefined);
		expect(item0.loaded).toBe(true);
		expect(item0.value instanceof SomeClass).toBe(true);

		// lets retrieve the object from the store
		const item1 = store.define('SOME_KEY', new SomeClass(), SomeClass.fromDb);
		// store should have called toJSON and used fromJSON for deserialization
		// it is async so it should take some time to deserialize the object
		expect(item1.value).toBe(undefined);
		expect(item1.loaded).toBe(false);
		await new Promise(item1.resolve('update'));
		expect(item1.value?.otherVal).toBe(3);
		expect(item1.loaded).toBe(true);
	});

	it('should be able to define a SerializableClass with an undefined initial value', async () => {
		class MyClass {
			public counter?: number;

			constructor(counter?: number) {
				this.counter = counter;
			}

			public toJSON() {
				return this;
			}

			public static async fromDb(data: any): Promise<MyClass> {
				await sleep(10);
				return Object.assign(new MyClass(), data);
			}
		}

		const item0 = store.define('SOME_OTHER_KEY', undefined, MyClass.fromDb);
		expect(item0.value).toBe(undefined);
		expect(item0.loaded).toBe(true);

		item0.value = new MyClass(17);
		expect(item0.value?.counter).toBe(17);

		const item1 = store.define('SOME_OTHER_KEY', undefined, MyClass.fromDb);
		expect(item1.value).toBe(undefined);
		expect(item1.loaded).toBe(false);
		await new Promise(item1.resolve('update'));
		expect(item1.value instanceof MyClass).toBe(true);
		expect(item1.value?.counter).toBe(17);
		expect(item1.loaded).toBe(true);
	});

	afterEach(() => {
		localStorage.clear();
	});
});
