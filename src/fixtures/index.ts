/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

export const SUPPORTED_MIME_TYPES = {
	IMAGE: {
		'image/jpeg': 'jpg',
		'image/png': 'png',
		'image/webp': 'webp',
		'image/svg+xml': 'svg',
	},
	VIDEO: {
		'video/mp4': 'mp4',
		'video/webm': 'webm',
		'video/quicktime': 'mov',
		// 'video/x-msvideo': 'avi',
		// 'video/x-matroska': 'mkv',
	},
	AUDIO: {
		'audio/mp3': 'mp3',
		'audio/mpeg': 'mp3',
		'audio/aac': 'aac',
		'audio/wav': 'wav',
		'audio/x-wav': 'wav',
	},
	DOCUMENT: {
		'text/html': 'html',
	},

	get MIXED() {
		return {
			...this.IMAGE,
			...this.VIDEO,
			...this.AUDIO,
			...this.DOCUMENT,
		};
	},
};
