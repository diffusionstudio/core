/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Composition } from '../composition';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import { WebcodecsVideoEncoder } from './webcodecs.video';
import { Clip } from '../clips';

const config = {
  codec: 'avc',
  width: 1280,
  height: 720
} as const;

describe('WebcodecsVideoEncoder', () => {
  let composition: Composition;
  let encoder: WebcodecsVideoEncoder;

  const configureSpy = vi.spyOn(VideoEncoder.prototype, 'configure').mockImplementation(vi.fn());
  const encodeSpy = vi.spyOn(VideoEncoder.prototype, 'encode').mockImplementation(vi.fn());

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: config,
    fastStart: 'in-memory'
  });

  const muxSpy = vi.spyOn(muxer, 'addVideoChunk');

  beforeEach(() => {
    composition = new Composition();

    encoder = new WebcodecsVideoEncoder(composition, {
      audio: false,
      debug: false,
      fps: 60,
      gpuBatchSize: 4,
      numberOfChannels: 1,
      resolution: 0.5,
      sampleRate: 8000,
      videoBitrate: 1e6,
    });

    configureSpy.mockClear();
    encodeSpy.mockClear();
    muxSpy.mockClear();

    expect(encoder.audio).toBe(false);
    expect(encoder.debug).toBe(false);
    expect(encoder.fps).toBe(60);
    expect(encoder.gpuBatchSize).toBe(4);
    expect(encoder.numberOfChannels).toBe(1);
    expect(encoder.resolution).toBe(0.5);
    expect(encoder.sampleRate).toBe(8000);
    expect(encoder.videoBitrate).toBe(1e6);
  })

  it('should encode the frames of the composition using the provided configuration', async () => {
    const seekSpy = vi.spyOn(composition, 'seek').mockImplementation(vi.fn());

    await composition.add(new Clip({ stop: 10 }));

    await encoder.encodeVideo(muxer, config);

    expect(seekSpy).toBeCalledTimes(1);
    expect(encodeSpy).toBeCalledTimes(20);
  });

  it('should throw a encoder error if the renderer is not defined', async () => {
    delete composition.renderer;

    await expect(() => encoder.encodeVideo(muxer, config)).rejects.toThrowError();
  });

  it('should throw a dom exception if the rendering has been aborted', async () => {
    await composition.add(new Clip({ stop: 10 }));

    const controller = new AbortController();

    controller.abort();

    await expect(() => encoder.encodeVideo(muxer, config, controller.signal)).rejects.toThrow(DOMException);
    expect(encodeSpy).toBeCalledTimes(0);
  });

  it('should debug the encoding process', async () => {
    const consoleSpy = vi.spyOn(console, 'info');
    await composition.add(new Clip({ stop: 10 }));

    await encoder.encodeVideo(muxer, config);

    expect(consoleSpy).toBeCalledTimes(0);

    encoder.debug = true;

    await encoder.encodeVideo(muxer, config);

    expect(consoleSpy).toBeCalledTimes(1);
  });
});
