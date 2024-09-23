/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OpusEncoder } from './opus';
import { CanvasEncoder } from './canvas';

const buffer = {
  sampleRate: 8000,
  duration: 1,
  numberOfChannels: 1,
  length: 8000,
  getChannelData: vi.fn(() => new Float32Array(8000)),
} as unknown as AudioBuffer

describe('The CanvasEncoder', () => {
  const canvas = document.createElement('canvas');
  canvas.height = 640;
  canvas.width = 480;

  let encoder: CanvasEncoder;

  const configureSpy = vi.spyOn(VideoEncoder.prototype, 'configure').mockImplementation(vi.fn());
  const encodeSpy = vi.spyOn(VideoEncoder.prototype, 'encode').mockImplementation(vi.fn());

  beforeEach(() => {
    encoder = new CanvasEncoder(canvas, {
      fps: 60,
      gpuBatchSize: 4,
      numberOfChannels: 1,
      sampleRate: 2000,
      videoBitrate: 1e6,
    });

    expect(encoder.fps).toBe(60);
    expect(encoder.height).toBe(640);
    expect(encoder.width).toBe(480);
    expect(encoder.sampleRate).toBe(8000);
    expect(encoder.videoBitrate).toBe(1e6);

    configureSpy.mockClear();
    encodeSpy.mockClear();
  });

  it('should encode video', async () => {
    expect(encoder.frame).toBe(0);
    expect(configureSpy).toBeCalledTimes(0);

    await encoder.encodeVideo();

    expect(encoder.frame).toBe(1);
    expect(configureSpy).toBeCalledTimes(1);
    expect(encodeSpy).toBeCalledTimes(1);
    expect(encodeSpy.mock.calls[0][1]?.keyFrame).toBe(true);

    await encoder.encodeVideo();

    expect(encoder.frame).toBe(2);
    expect(configureSpy).toBeCalledTimes(1);
    expect(encodeSpy).toBeCalledTimes(2);
    expect(encodeSpy.mock.calls[1][1]?.keyFrame).toBe(false);
  });

  it('should encode audio', async () => {
    encoder = new CanvasEncoder(canvas, {
      numberOfChannels: 1,
      sampleRate: 2000,
      audio: true,
    });

    expect(encoder.sampleRate).toBe(8000)

    const configureSpy = vi.spyOn(OpusEncoder.prototype, 'configure').mockImplementation(vi.fn());
    const encodeSpy = vi.spyOn(OpusEncoder.prototype, 'encode').mockImplementation(vi.fn());

    await encoder.encodeAudio(buffer);

    expect(configureSpy).toBeCalledTimes(1);
    expect(encodeSpy).toBeCalledTimes(1);

    expect(configureSpy.mock.calls[0][0]).toStrictEqual({ numberOfChannels: 1, sampleRate: 8000 });
    expect(encodeSpy.mock.calls[0][0].data.length).toBe(8000);
    expect(encodeSpy.mock.calls[0][0].numberOfFrames).toBe(8000);
  });

  it("should not encode audio when it's not enabled", async () => {
    await expect(encoder.encodeAudio(buffer)).rejects.toThrowError();
  });

  it('should create a blob', async () => {
    await encoder.encodeVideo();

    const blob = await encoder.blob();

    expect(blob).toBeInstanceOf(Blob);
  });

  it('should not create a blob if the buffer is not defined', async () => {
    await expect(() => encoder.blob()).rejects.toThrowError();
  });
});
