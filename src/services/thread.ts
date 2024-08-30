/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import type { Constructor } from '../types';

type TreadResponse<R> =
	| {
			result: R;
			error: undefined;
	  }
	| {
			result: undefined;
			error: string;
	  };

type EventListener = (event: MessageEvent<any>['data']) => void;

export class Thread<Result> {
	public worker: Worker;

	public constructor(Worker: Constructor<Worker>) {
		this.worker = new Worker();
		this.worker.onerror = console.error;
	}

	public async run<Arg>(payload?: Arg, listner?: EventListener): Promise<TreadResponse<Result>> {
		this.worker.postMessage({ type: 'init', ...(payload ?? {}) });

		return await new Promise((resolve, reject) => {
			this.worker.addEventListener('message', (event) => {
				listner?.(event.data);

				if (event.data.type == 'result') {
					event.data.type = undefined;
					resolve(event.data);
				}

				if (event.data.type == 'error') {
					reject(event.data.message);
				}
			});
		})
			.then((data) => {
				return { result: data as Result, error: undefined };
			})
			.catch((error: string) => {
				return { result: undefined, error };
			})
			.finally(() => {
				this.worker.terminate();
			});
	}
}

export function withThreadErrorHandler(main: (event: MessageEvent<any>) => Promise<void>) {
	return async (event: MessageEvent<any>) => {
		try {
			await main(event);
		} catch (e: any) {
			self.postMessage({
				type: 'error',
				message: e?.message ?? 'An unkown worker error occured',
			});
		}
	};
}
