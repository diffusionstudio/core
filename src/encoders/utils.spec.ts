/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, expect, it, vi } from 'vitest';

import { audioClipFilter, createRenderEventDetail, createStreamTarget, toOpusSampleRate, withError } from './utils';
import { ArrayBufferTarget, FileSystemWritableFileStreamTarget } from 'mp4-muxer';
import { Clip, MediaClip } from '../clips';


describe('createStreamTarget', () => {
  it('should create a downloadable stream target', async () => {
    const res = await createStreamTarget('test.mp4');

    expect(res.target).toBeInstanceOf(ArrayBufferTarget);
    expect(res.fastStart).toBe('in-memory');

    const a = document.createElement('a');

    const clickSpy = vi.spyOn(a, 'click');
    const createSpy = vi.spyOn(document, 'createElement').mockReturnValue(a);

    await res.close(true);

    expect(clickSpy).toBeCalledTimes(1);
    expect(createSpy).toBeCalledTimes(1);
    expect(a.download).toBe('test.mp4');
  });

  it('should upload the file if the target is an http address', async () => {
    const res = await createStreamTarget('https://s3.com/test.mp4');

    expect(res.target).toBeInstanceOf(ArrayBufferTarget);
    expect(res.fastStart).toBe('in-memory');

    const fetchSpy = vi.spyOn(global, 'fetch');

    await res.close(true);

    expect(fetchSpy).toBeCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toBe('https://s3.com/test.mp4');
    expect(fetchSpy.mock.calls[0][1]?.method).toBe('PUT');
  });

  it('should throw an error when using http upload and the response is not ok', async () => {
    const res = await createStreamTarget('https://s3.com/test.mp4');

    const fetchSpy = vi.spyOn(global, 'fetch').mockReturnValue({
      ok: false,
    } as any)

    await expect(() => res.close(true)).rejects.toThrowError();

    fetchSpy.mockRestore();
  });

  it('should handle the file system access', async () => {
    const handle = new FileSystemFileHandle();
    const res = await createStreamTarget(handle);

    expect(res.target).toBeInstanceOf(FileSystemWritableFileStreamTarget);
    expect(res.fastStart).toBe(false);

    const closeSpy = vi.spyOn(FileSystemWritableFileStream.prototype, 'close');

    await res.close(true);

    expect(closeSpy).toBeCalledTimes(1);
  });
});

describe('withError', () => {
  it('should reject promise all errors', async () => {
    const promise1 = Promise.resolve(3);
    const promise2 = new Promise((_, reject) =>
      setTimeout(reject, 100, 'foo'),
    );

    const promise = withError(Promise.allSettled([promise1, promise2]));

    await expect(promise).rejects.toThrowError();
  })
});

describe('createRenderEventDetail', () => {
  it('should should calculate the remaining time', async () => {
    const date = new Date();
    date.setSeconds(date.getSeconds() - 10);
    const detail = createRenderEventDetail(50, 100, date.getTime());
    expect(detail.progress).toBe(50);
    expect(detail.total).toBe(100);
    // it took 10 secs for 50% there should be 10 seconds remaining
    expect(detail.remaining.getSeconds()).toBe(10);
  });
});

describe('audioClipFilter', () => {
  it('should filter clips', async () => {
    const clips = [new Clip(), new Clip(), new MediaClip({ disabled: true }), new MediaClip()];

    expect(clips.filter(audioClipFilter).length).toBe(1);
  });
});

describe('toOpusSampleRate', () => {
  it('should find the closes available opus sample rate', async () => {
    expect(toOpusSampleRate(0)).toBe(8000);
    expect(toOpusSampleRate(10000)).toBe(8000);
    expect(toOpusSampleRate(10001)).toBe(12000);
    expect(toOpusSampleRate(50000)).toBe(48000);
  });
});
