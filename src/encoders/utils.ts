/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { FileSystemWritableFileStreamTarget, ArrayBufferTarget, StreamTarget } from 'mp4-muxer';
import { MediaClip } from '../clips';
import { IOError } from '../errors';
import { downloadObject } from '../utils/browser';

import type { frame } from '../types';
import type { Clip } from '../clips';
import { SUPPORTED_RATES } from './opus/opus.fixtures';

type Stream = {
	target: StreamTarget;
	fastStart: false | 'in-memory';
	close(success: boolean): Promise<void>;
};

export async function createStreamTarget(handle: FileSystemFileHandle | string): Promise<Stream> {
	if (typeof handle == 'string') {
		const target = new ArrayBufferTarget();
		return {
			target,
			fastStart: 'in-memory',
			async close(success: boolean) {
				if (!success) return;

				if (handle.match(/^https:\/\//i)) {
					await uploadObject(target.buffer, handle);
				} else {
					await downloadObject(new Blob([target.buffer], { type: 'video/mp4' }), handle);
				}
			},
		};
	}

	const fileStream = await handle.createWritable();

	return {
		target: new FileSystemWritableFileStreamTarget(fileStream),
		fastStart: false,
		async close(_: boolean) {
			await fileStream.close();
		},
	};
}

/**
 * Helper for uploading a buffer to a given url
 */
async function uploadObject(buffer: ArrayBuffer, url: string) {
	const response = await fetch(url, {
		method: 'PUT',
		headers: {
			'Content-Type': 'video/mp4',
		},
		body: buffer
	});

	if (!response.ok) {
		throw new IOError({
			code: 'fileUpdloadFailed',
			message: `Error uploading buffer: ${response.status} ${response.statusText}`
		});
	}
}

/**
 * Helper for checking the promise.settled results
 */
export async function withError(promise: Promise<[PromiseSettledResult<any>, PromiseSettledResult<any>]>) {
	const results = await promise;

	for (const res of results) {
		if (res.status == 'rejected') {
			throw res.reason;
		}
	}
}

/**
 * Helper for creating the render event detail
 */
export function createRenderEventDetail(progress: frame, total: frame, startTime: number) {
	const duration = new Date().getTime() - startTime;
	const time = (duration / gte1(progress)) * (total - progress);
	const remaining = new Date(time);

	return { remaining, progress, total };
}

/**
 * Helper for making sure a number is greater than 1
 */
function gte1(num: number): number {
	if (num < 1) return 1;
	return num;
}

/**
 * A filter that mathes audio clips
 */
export function audioClipFilter(clip: Clip) {
	return clip instanceof MediaClip && !clip.disabled && !clip.track?.disabled;
}

/**
 * Parses the input rate by retrieving the
 * closes rate that is supported by the
 * opus encoder
 */
export function toOpusSampleRate(sampleRate: number) {
  const supported = SUPPORTED_RATES;

  let closest = 48000;

  for (const rate of supported) {
    if (Math.abs(sampleRate - rate) < Math.abs(sampleRate - closest)) {
      closest = rate;
    }
  }

  return closest;
}
