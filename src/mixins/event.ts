/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import type { Constructor } from '../types';
import type { BaseEvents, EmittedEvent } from './event.types';

export function EventEmitterMixin<Events = {}, T extends Constructor = Constructor>(Base: T) {
	return class EventEmitter extends Base {
		_handlers: {
			[T in keyof BaseEvents<Events>]?: {
				[x: string]: (event: EmittedEvent<BaseEvents<Events>[T], any>) => void;
			};
		} = {};

		public on<T extends keyof BaseEvents<Events>>(
			eventType: T,
			callback: (event: EmittedEvent<BaseEvents<Events>[T], this>) => void,
		): string {
			if (typeof callback != 'function') {
				throw new Error('The callback of an event listener needs to be a function.');
			}

			const id = crypto.randomUUID();

			if (!this._handlers[eventType]) {
				this._handlers[eventType] = { [id]: callback };
			} else {
				// @ts-ignore
				this._handlers[eventType][id] = callback;
			}

			return id;
		}

		public off(id?: string, ...ids: string[]) {
			if (!id) return;

			for (const obj of Object.values(this._handlers)) {
				if (id in obj) {
					delete obj[id];
				}
			}

			for (const id of ids) {
				this.off(id);
			}
		}

		public trigger<T extends keyof BaseEvents<Events>>(eventType: T, detail: BaseEvents<Events>[T]) {
			const event = new CustomEvent<BaseEvents<Events>[T]>(eventType as string, {
				detail,
			});
			Object.defineProperty(event, 'currentTarget', { writable: false, value: this });

			for (const handler in this._handlers[eventType] ?? {}) {
				this._handlers[eventType]?.[handler](event);
			}
			for (const handler in this._handlers['*'] ?? {}) {
				this._handlers['*']?.[handler](event);
			}
		}

		public bubble(target: EventEmitter) {
			return this.on('*', (event: EmittedEvent<any, any>) => {
				target.trigger(event.type as any, event.detail);
			});
		}

		public resolve(eventType: keyof BaseEvents<Events>) {
			return (resolve: (value: unknown) => void, reject: (reason?: any) => void) => {
				this.on('error', reject);
				this.on(eventType, resolve);
			};
		}
	}
}
