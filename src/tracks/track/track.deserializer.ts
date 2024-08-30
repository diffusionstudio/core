/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import type { Clip } from '../../clips';
import { Track, VideoTrack, AudioTrack, HtmlTrack, TextTrack, ImageTrack, CaptionTrack } from '..';

import type { TrackType } from '..';

export class TrackDeserializer {
	public static fromType(data: { type: TrackType }): Track<Clip> {
		switch (data.type) {
			case 'VIDEO':
				return new VideoTrack();
			case 'AUDIO':
				return new AudioTrack();
			case 'HTML':
				return new HtmlTrack();
			case 'IMAGE':
				return new ImageTrack();
			case 'TEXT':
				return new TextTrack();
			case 'CAPTION':
				return new CaptionTrack();
			default:
				return new Track();
		}
	}
}
