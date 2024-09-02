/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { AudioSource } from './';
import type { ClipType } from '../clips';

export class VideoSource extends AudioSource {
	public readonly type: ClipType = 'video';

	public async thumbnail(): Promise<HTMLVideoElement> {
		await this.loaded();
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

		video.src = this.objectURL ?? '';
		return video;
	}
}
