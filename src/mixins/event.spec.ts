/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, expect, it, vi } from 'vitest';
import { EventEmitterMixin } from './event';

class Base {
	ping() {
		return 'pong';
	}
}

class TextClass extends EventEmitterMixin<Events, typeof Base>(Base) {
	public foo = 'foo';

	private _bar = 5;

	public get bar(): number {
		return this._bar;
	}

	public set bar(value: string | number) {
		if (typeof value == 'string') {
			this._bar = Number.parseInt(value);
		} else {
			this._bar = value;
		}
	}
}

describe('The event mixin', () => {
	it('should extend the base class', () => {
		const cls = new TextClass();

		expect(cls.ping()).toBe('pong');
	});

	it('should be able to handle event triggers witout handlers', () => {
		const cls = new TextClass();

		expect(() => cls.trigger('delete', undefined)).not.toThrowError();
	});

	it('should have an combined event handler', () => {
		const cls = new TextClass();
		const deleteFn = vi.fn();
		const anyFn = vi.fn();

		const handler = cls.on('delete', deleteFn);
		cls.on('*', anyFn);

		cls.trigger('update', undefined);

		expect(deleteFn).toHaveBeenCalledTimes(0);
		expect(anyFn).toHaveBeenCalledTimes(1);

		cls.trigger('delete', undefined);

		expect(deleteFn).toHaveBeenCalledTimes(1);
		expect(anyFn).toHaveBeenCalledTimes(2);

		cls.off(handler);

		cls.trigger('delete', undefined);

		expect(deleteFn).toHaveBeenCalledTimes(1);
		expect(anyFn).toHaveBeenCalledTimes(3);
	});

	it('should able to call events on mulitiple handlers', () => {
		const cls = new TextClass();
		const fn0 = vi.fn();
		const fn1 = vi.fn();
		const fn2 = vi.fn();

		cls.on('delete', fn0);
		const handler = cls.on('delete', fn1);
		cls.on('delete', fn2);

		cls.trigger('delete', undefined);

		expect(fn0).toHaveBeenCalledTimes(1);
		expect(fn1).toHaveBeenCalledTimes(1);
		expect(fn2).toHaveBeenCalledTimes(1);

		cls.off(handler);

		cls.trigger('delete', undefined);

		expect(fn0).toHaveBeenCalledTimes(2);
		expect(fn1).toHaveBeenCalledTimes(1);
		expect(fn2).toHaveBeenCalledTimes(2);
	});

	it('should able to to resolve events', async () => {
		const cls = new TextClass();

		const promise0 = new Promise<any>(cls.resolve('update'));
		cls.trigger('update', undefined);

		const res0 = await promise0;
		expect(res0).toBeInstanceOf(CustomEvent);

		// triggering an error should reject promise
		const promise1 = new Promise<any>(cls.resolve('update'));
		cls.trigger('error', new Error());

		await expect(promise1).rejects.toThrowError();
	});

	it('should able to unregister multiple events', async () => {
		const cls = new TextClass();

		const deleteFn = vi.fn();
		const updateFn = vi.fn();
		const errorFn = vi.fn();

		const delteId = cls.on('delete', deleteFn);
		const updateId = cls.on('update', updateFn);
		const errorId = cls.on('error', errorFn);

		cls.trigger('delete', undefined);
		cls.trigger('delete', undefined);

		cls.trigger('error', new Error());
		cls.trigger('update', undefined);

		expect(deleteFn).toHaveBeenCalledTimes(2);
		expect(updateFn).toHaveBeenCalledTimes(1);
		expect(errorFn).toHaveBeenCalledTimes(1);
		expect(errorFn.mock.calls[0][0].detail).toBeInstanceOf(Error);

		cls.off(delteId, updateId, errorId);

		cls.trigger('delete', undefined);
		cls.trigger('error', new Error());
		cls.trigger('update', undefined);

		expect(deleteFn).toHaveBeenCalledTimes(2);
		expect(updateFn).toHaveBeenCalledTimes(1);
		expect(errorFn).toHaveBeenCalledTimes(1);
	});

	it('should bubble events', async () => {
		const cls0 = new TextClass();
		const cls1 = new TextClass();

		cls0.bubble(cls1);

		const frameFn0 = vi.fn();
		const frameFn1 = vi.fn();

		cls0.on('update', frameFn0);
		cls1.on('update', frameFn1);

		cls0.trigger('update', 2);

		expect(frameFn0).toHaveBeenCalledTimes(1);
		expect(frameFn0.mock.calls[0][0].detail).toBe(2);

		expect(frameFn1).toHaveBeenCalledTimes(1);
		expect(frameFn1.mock.calls[0][0].detail).toBe(2);

		cls1.trigger('update', 3);

		expect(frameFn0).toHaveBeenCalledTimes(1);
		expect(frameFn1).toHaveBeenCalledTimes(2);
	});
});

type Events = {
	delete: undefined;
	update: any;
	frame: number | undefined;
	attach: undefined;
	detach: undefined;
	load: undefined;
};
