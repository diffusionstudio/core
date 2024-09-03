/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { Track, VideoTrack, AudioTrack, HtmlTrack, TextTrack, ImageTrack, CaptionTrack, TrackMap } from '..';

export class TrackDeserializer {
	public static fromType<T extends keyof TrackMap>(data: { type: T }): TrackMap[T] {
		switch (data.type) {
			case 'video':
				return new VideoTrack() as TrackMap[T];
			case 'audio':
				return new AudioTrack() as TrackMap[T];
			case 'html':
				return new HtmlTrack() as TrackMap[T];
			case 'image':
				return new ImageTrack() as TrackMap[T];
			case 'text':
				return new TextTrack() as TrackMap[T];
			case 'complex_text':
				return new TextTrack() as TrackMap[T];
			case 'caption':
				return new CaptionTrack() as TrackMap[T];
			default:
				return new Track() as TrackMap[T];
		}
	}
}
