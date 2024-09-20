/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, expect, it, vi } from 'vitest';
import { Thread, withThreadErrorHandler } from './thread';

// Mocking the Worker class to simulate a Web Worker
class MockWorker {
	onmessage: ((event: MessageEvent<any>) => void) | null = null;
	onerror: ((event: ErrorEvent) => void) | null = null;
	terminated = false;

	postMessage = vi.fn();

	addEventListener(event: string, handler: (event: MessageEvent<any>) => void) {
		if (event === 'message') {
			this.onmessage = handler;
		}
	}

	terminate() {
		this.terminated = true;
	}

	// Simulate receiving a message
	simulateMessage(data: any) {
		if (this.onmessage) {
			this.onmessage({ data } as MessageEvent);
		}
	}

	// Simulate an error
	simulateError(message: string) {
		if (this.onerror) {
			this.onerror(new ErrorEvent('error', { message }));
		}
	}
}

describe('Thread', () => {
	it('should post a message and receive a result', async () => {
		const mockWorkerConstructor = vi.fn(() => new MockWorker());
		const thread = new Thread<typeof MockWorker>(mockWorkerConstructor as any);

		const resultPromise = thread.run<{ input: number }>({ input: 42 });

		// Simulate the worker responding with a result
		const mockWorkerInstance = mockWorkerConstructor.mock.results[0].value;
		mockWorkerInstance.simulateMessage({ type: 'result', result: 84 });

		const response = await resultPromise;

		expect(mockWorkerInstance.postMessage).toHaveBeenCalledWith({ type: 'init', input: 42 });

		// Adjust assertion to handle the structure returned by the `Thread.run()` method
		expect(response).toEqual({ result: { result: 84, type: undefined }, error: undefined });

		expect(mockWorkerInstance.terminated).toBe(true);
	});

	it('should handle worker errors and return error', async () => {
		const mockWorkerConstructor = vi.fn(() => new MockWorker());
		const thread = new Thread<typeof MockWorker>(mockWorkerConstructor as any);

		const resultPromise = thread.run();

		// Simulate the worker responding with an error
		const mockWorkerInstance = mockWorkerConstructor.mock.results[0].value;
		mockWorkerInstance.simulateMessage({ type: 'error', message: 'Something went wrong' });

		const response = await resultPromise;

		expect(response).toEqual({ result: undefined, error: 'Something went wrong' });
		expect(mockWorkerInstance.terminated).toBe(true);
	});

	it('should call the event listener if provided', async () => {
		const mockWorkerConstructor = vi.fn(() => new MockWorker());
		const thread = new Thread<typeof MockWorker>(mockWorkerConstructor as any);

		const eventListener = vi.fn();
		const resultPromise = thread.run(undefined, eventListener);

		// Simulate the worker responding with a result
		const mockWorkerInstance = mockWorkerConstructor.mock.results[0].value;
		mockWorkerInstance.simulateMessage({ type: 'result', result: 84 });

		await resultPromise;

		// Adjust assertion to account for the fact that `type` is set to undefined
		expect(eventListener).toHaveBeenCalledWith({ result: 84, type: undefined });
	});

	it('should terminate the worker even on error', async () => {
		const mockWorkerConstructor = vi.fn(() => new MockWorker());
		const thread = new Thread<typeof MockWorker>(mockWorkerConstructor as any);

		const resultPromise = thread.run();

		// Simulate the worker responding with an error
		const mockWorkerInstance = mockWorkerConstructor.mock.results[0].value;

		// Simulate a message with an error type
		mockWorkerInstance.simulateMessage({ type: 'error', message: 'Worker failed' });

		const response = await resultPromise;

		expect(response).toEqual({ result: undefined, error: 'Worker failed' });
		expect(mockWorkerInstance.terminated).toBe(true);
	});
});

describe('withThreadErrorHandler', () => {
	it('should call the main function and post an error on failure', async () => {
		const mockPostMessage = vi.fn();
		const mainFunction = vi.fn().mockRejectedValue(new Error('Test error'));

		// Mock the global `self` object to intercept postMessage calls
		globalThis.self = { postMessage: mockPostMessage } as any;

		const handler = withThreadErrorHandler(mainFunction);

		const event = { data: 'test-event' } as MessageEvent<any>;
		await handler(event);

		expect(mainFunction).toHaveBeenCalledWith(event);
		expect(mockPostMessage).toHaveBeenCalledWith({
			type: 'error',
			message: 'Test error',
		});
	});

	it('should post a default error message if no error message is provided', async () => {
		const mockPostMessage = vi.fn();
		const mainFunction = vi.fn().mockRejectedValue({});

		// Mock the global `self` object to intercept postMessage calls
		globalThis.self = { postMessage: mockPostMessage } as any;

		const handler = withThreadErrorHandler(mainFunction);

		const event = { data: 'test-event' } as MessageEvent<any>;
		await handler(event);

		expect(mainFunction).toHaveBeenCalledWith(event);
		expect(mockPostMessage).toHaveBeenCalledWith({
			type: 'error',
			message: 'An unkown worker error occured',
		});
	});

	it('should not post an error if the main function succeeds', async () => {
		const mockPostMessage = vi.fn();
		const mainFunction = vi.fn().mockResolvedValue(undefined);

		// Mock the global `self` object to intercept postMessage calls
		globalThis.self = { postMessage: mockPostMessage } as any;

		const handler = withThreadErrorHandler(mainFunction);

		const event = { data: 'test-event' } as MessageEvent<any>;
		await handler(event);

		expect(mainFunction).toHaveBeenCalledWith(event);
		expect(mockPostMessage).not.toHaveBeenCalled();
	});
});
