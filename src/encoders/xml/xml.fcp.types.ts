/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { Source } from "../../sources/source";

class MediaRep {
  kind: string;
  src: string;

  constructor(kind: string, src: string) {
    this.kind = kind;
    this.src = src;
  }
}

class Asset {
  id: string;
  start: number;
  duration: number;
  hasVideo: boolean;
  hasAudio: boolean;
  format: string;
  audioSources: string;
  audioChannels: number;
  audioRate: number;
  mediaReps: MediaRep[];

  constructor(
    id: string,
    start: number,
    duration: number,
    hasVideo: boolean,
    hasAudio: boolean,
    format: string,
    audioSources: string,
    audioChannels: number,
    audioRate: number,
    mediaReps: MediaRep[]
  ) {
    this.id = id;
    this.start = start;
    this.duration = duration;
    this.hasVideo = hasVideo;
    this.hasAudio = hasAudio;
    this.format = format;
    this.audioSources = audioSources;
    this.audioChannels = audioChannels;
    this.audioRate = audioRate;
    this.mediaReps = mediaReps;
  }

//   fromSource(source: Source) {
//     return new Asset(source.id, 0, source.duration, source.hasVideo, source.hasAudio, source.format, source.audioSources, source.audioChannels, source.audioRate, source.mediaReps);
//   }
}
