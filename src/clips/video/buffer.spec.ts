/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FrameBuffer } from './buffer';

describe('FrameBuffer', () => {
  let frameBuffer: FrameBuffer;
  let mockVideoFrame: any;

  beforeEach(() => {
    // Mock VideoFrame
    mockVideoFrame = {
      close: vi.fn(),
    };

    frameBuffer = new FrameBuffer();
  });

  it('should enqueue frames and trigger onenqueue callback', () => {
    const mockOnEnqueue = vi.fn();
    frameBuffer.onenqueue = mockOnEnqueue;

    frameBuffer.enqueue(mockVideoFrame);

    expect(frameBuffer.frames.length).toBe(1);
    expect(frameBuffer.frames[0]).toBe(mockVideoFrame);
    expect(mockOnEnqueue).toHaveBeenCalled();
  });

  it('should dequeue frames in FIFO order', async () => {
    const frame1 = { ...mockVideoFrame };
    const frame2 = { ...mockVideoFrame };
    
    frameBuffer.enqueue(frame1);
    frameBuffer.enqueue(frame2);

    const dequeuedFrame1 = await frameBuffer.dequeue();
    const dequeuedFrame2 = await frameBuffer.dequeue();

    expect(dequeuedFrame1).toBe(frame1);
    expect(dequeuedFrame2).toBe(frame2);
    expect(frameBuffer.frames.length).toBe(0);
  });

  it('should wait for a frame to be enqueued if buffer is empty and state is active', async () => {
    const mockOnEnqueue = vi.fn();
    const mockWaitFor = vi.spyOn(frameBuffer as any, 'waitFor');

    frameBuffer.onenqueue = mockOnEnqueue;
    const dequeuePromise = frameBuffer.dequeue();

    // Simulate enqueuing a frame after some delay
    setTimeout(() => {
      frameBuffer.enqueue(mockVideoFrame);
    }, 100);

    const result = await dequeuePromise;

    expect(result).toBe(mockVideoFrame);
    expect(mockWaitFor).toHaveBeenCalledWith(20000); // 20s timeout
  });

  it('should resolve immediately if buffer is closed and empty', async () => {
    frameBuffer.close();

    const result = await frameBuffer.dequeue();
    expect(result).toBeUndefined();
  });

  it('should call onclose callback when buffer is closed', () => {
    const mockOnClose = vi.fn();
    frameBuffer.onclose = mockOnClose;

    frameBuffer.close();

    expect(frameBuffer['state']).toBe('closed');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should close all frames when terminate is called', () => {
    const frame1 = { ...mockVideoFrame, close: vi.fn() };
    const frame2 = { ...mockVideoFrame, close: vi.fn() };

    frameBuffer.enqueue(frame1);
    frameBuffer.enqueue(frame2);

    frameBuffer.terminate();

    expect(frame1.close).toHaveBeenCalled();
    expect(frame2.close).toHaveBeenCalled();
  });

  it('should reject after timeout if no enqueue or close happens', async () => {
    await expect((frameBuffer as any).waitFor(50)).rejects.toThrow('Promise timed out after 50 ms');
  });
});
