/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

export class FrameBuffer {
	public frames: Array<VideoFrame> = [];
	public state: 'active' | 'closed' = 'active';

	public onenqueue?: () => void;
	public onclose?: () => void;

	public enqueue(data: VideoFrame) {
		this.frames.unshift(data);
		this.onenqueue?.();
	}

	public async dequeue() {
		if (this.frames.length == 0 && this.state == 'active') {
			await this.waitFor(20e3);
		}

		if (this.frames.length == 0 && this.state == 'closed') {
			return;
		}

		return this.frames.pop();
	}

	public close() {
		this.state = 'closed';
		this.onclose?.();
	}

	public terminate() {
		for (const frame of this.frames) {
			frame.close();
		}
	}

	private async waitFor(timeout: number) {
		await new Promise<void>((resolve, reject) => {
			const timer = setTimeout(() => {
				reject(`Promise timed out after ${timeout} ms`);
			}, timeout);

			this.onenqueue = () => {
				clearTimeout(timer);
				resolve();
			};

			this.onclose = () => {
				clearTimeout(timer);
				resolve();
			};
		});
	}
}
