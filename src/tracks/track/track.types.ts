/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import type { Clip } from '../../clips';
import type { insertModes } from './track.fixtures';
import type { Track, VideoTrack, AudioTrack, HtmlTrack, TextTrack, ImageTrack, CaptionTrack } from '..';

export type TrackMap = {
	video: VideoTrack;
	audio: AudioTrack;
	html: HtmlTrack;
	image: ImageTrack;
	text: TextTrack;
	complex_text: TextTrack;
	caption: CaptionTrack;
	base: Track<Clip>;
};

export type TrackType = keyof TrackMap;
export type TrackInsertMethod = 'STACK' | 'TIMED';
/**
 * Defines where the track should be inserted
 */
export type TrackLayer = 'top' | 'bottom' | number;

export type InsertMode = (typeof insertModes)[number];
