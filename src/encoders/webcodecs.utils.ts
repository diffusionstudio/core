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

import type { Clip } from '../clips';

export function audioClipFilter(clip: Clip) {
	return clip instanceof MediaClip && !clip.disabled && !clip.track?.disabled;
}

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
			i18n: 'fileUpdloadFailed',
			message: `Error uploading buffer: ${response.status} ${response.statusText}`
		});
	}
}
