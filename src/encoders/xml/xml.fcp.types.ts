/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { XMLBuilder } from "xmlbuilder2/lib/interfaces";
import { Source } from "../../sources/source";

export class FcpMediaRep {
  kind: string;
  src: string;

  constructor(kind: string, src: string) {
    this.kind = kind;
    this.src = src;
  }

  toXML(builder: XMLBuilder) {
    builder.ele("mediaRep", {
      kind: this.kind,
      src: this.src,
    });
  }
}

export class FcpAsset {
  id: string;
  start: number;
  duration: number;
  hasVideo: boolean;
  hasAudio: boolean;
  format: string;
  audioSources: number;
  audioChannels: number;
  audioRate: number;
  mediaReps: FcpMediaRep[];
  name: string;

  constructor(
    id: string,
    start: number,
    duration: number,
    hasVideo: boolean,
    hasAudio: boolean,
    format: string,
    audioSources: number,
    audioChannels: number,
    audioRate: number,
    mediaReps: FcpMediaRep[],
    name: string
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
    this.name = name;
  }

  toXML(builder: XMLBuilder) {
    const asset = builder.ele("asset", {
      id: this.id,
      start: this.start,
      duration: this.duration, // TODO add /1s
      hasVideo: this.hasVideo ? "1" : "0",
      hasAudio: this.hasAudio ? "1" : "0",
      format: this.format,
      audioSources: this.audioSources.toString(),
      audioChannels: this.audioChannels.toString(),
      audioRate: this.audioRate.toString(),
      name: this.name,
    });

    this.mediaReps.forEach((mediaRep) => {
      mediaRep.toXML(asset);
    });
  }

  static fromSource(source: Source, formatId: string, id: string) {
    const _type = source.file!.type;
    const mediaRep = new FcpMediaRep(_type, `./${source.file!.name}`);
    return new FcpAsset(
      id,
      0,
      source.duration.seconds,
      _type.startsWith("video"),
      _type.startsWith("audio") || _type.startsWith("video"),
      formatId,
      1,
      1,
      48000,
      [mediaRep],
      source.file!.name
    );
  }
}
