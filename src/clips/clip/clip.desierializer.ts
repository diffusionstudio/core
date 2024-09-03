/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { AudioClip, Clip, HtmlClip, ComplexTextClip, ImageClip, TextClip, VideoClip } from '..';
import { AudioSource, HtmlSource, ImageSource, VideoSource } from '../../sources';

import type { ClipType } from '..';
import type { Source } from '../../sources';

export class ClipDeserializer {
	public static fromType(data: { type: ClipType }): Clip {
		switch (data.type) {
			case 'video':
				return new VideoClip();
			case 'audio':
				return new AudioClip();
			case 'html':
				return new HtmlClip();
			case 'image':
				return new ImageClip();
			case 'text':
				return new TextClip();
			case 'complex_text':
				return new ComplexTextClip();
			default:
				return new Clip();
		}
	}

	public static fromSource(data: Source) {
		if (data.type == 'audio' && data instanceof AudioSource) {
			return new AudioClip(data);
		}
		if (data.type == 'video' && data instanceof VideoSource) {
			return new VideoClip(data);
		}
		if (data.type == 'image' && data instanceof ImageSource) {
			return new ImageClip(data);
		}
		if (data.type == 'html' && data instanceof HtmlSource) {
			return new HtmlClip(data);
		}
	}
}
