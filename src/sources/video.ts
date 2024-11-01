/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { AudioSource } from './';
import { parseMimeType } from '../clips';
import { IOError, ValidationError } from '../errors';

import type { ClipType } from '../clips';

export class VideoSource<T extends Object = {}> extends AudioSource<T> {
	public readonly type: ClipType = 'video';
	private downloadInProgress = true;

	protected async loadUrl(url: string | URL | Request, init?: RequestInit | undefined) {
		const res = await fetch(url, init);

		if (!res?.ok) throw new IOError({
			code: 'unexpectedIOError',
			message: 'An unexpected error occurred while fetching the file',
		});

		this.name = url.toString().split('/').at(-1) ?? '';
		this.external = true;
		this.externalURL = url;
		this.objectURL = String(url);
		this.mimeType = parseMimeType(res.headers.get('Content-type'));

		this.getBlob(res);
	}

	public async getFile(): Promise<File> {
		if (!this.file && this.downloadInProgress) {
			await new Promise(this.resolve('load'));
		}

		if (!this.file) {
			throw new ValidationError({
				code: 'fileNotAccessible',
				message: "The desired file cannot be accessed",
			});
		}

		return this.file;
	}

	public async thumbnail(): Promise<HTMLVideoElement> {
		const video = document.createElement('video');
		video.className = 'object-cover w-full aspect-video h-auto';
		video.controls = false;

		video.addEventListener('loadedmetadata', () => {
			this.duration.seconds = video.duration;
			this.trigger('update', undefined);
		});

		video.addEventListener('mousemove', (evt: MouseEvent) => {
			const clip = evt.currentTarget as HTMLVideoElement | null;
			const rect = clip?.getBoundingClientRect();
			const x = evt.clientX - (rect?.left ?? 0);
			const duration = clip?.duration;

			if (duration && rect && rect.width > 0) {
				clip.currentTime = Math.round(duration * (x / rect.width));
			}
		});

		video.src = await this.createObjectURL();
		return video;
	}

	private async getBlob(response: Response) {
		try {
			this.downloadInProgress = true;
			const blob = await response.blob();

			this.file = new File([blob], this.name, { type: blob.type });
			this.trigger('load', undefined);
		} catch (e) {
			this.state == 'ERROR';
			this.trigger('error', new Error(String(e)));
		} finally {
			this.downloadInProgress = false;
		}
	}
}
