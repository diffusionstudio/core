/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Composition } from '../composition';
import { Encoder } from './encoder';
import { Clip } from '../clips';


describe('The Encoder', () => {
  let composition: Composition;
  let encoder: Encoder;

  const configureSpy = vi.spyOn(VideoEncoder.prototype, 'configure').mockImplementation(vi.fn());
  const encodeSpy = vi.spyOn(VideoEncoder.prototype, 'encode').mockImplementation(vi.fn());

  beforeEach(() => {
    composition = new Composition();

    encoder = new Encoder(composition, {
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

    expect(encoder.audio).toBe(false);
    expect(encoder.debug).toBe(false);
    expect(encoder.fps).toBe(60);
  });

  it('should render the compostion', async () => {
    await composition.add(new Clip({ stop: 10 }));

    const pauseSpy = vi.spyOn(composition, 'pause').mockImplementation(async () => undefined);
    const seekSpy = vi.spyOn(composition, 'seek').mockImplementation(async () => undefined);

    await encoder.render();

    expect(pauseSpy).toBeCalledTimes(1);
    expect(seekSpy).toBeCalledTimes(1);
  });

  it('should not render when the composition renderer is not defined', async () => {
    delete composition.renderer;

    await expect(() => encoder.render()).rejects.toThrowError();
  });

  it('should debug the render process', async () => {
    encoder.debug = true;

    await composition.add(new Clip({ stop: 10 }));

    const logSpy = vi.spyOn(console, 'info');

    await encoder.render();

    expect(logSpy).toBeCalledTimes(3);
  });
});
