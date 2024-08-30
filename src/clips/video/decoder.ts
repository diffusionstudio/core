/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

export class Decoder {
  /**
   * Defines the VideoDecoder instance
   */
  public readonly video: VideoDecoder;

  /**
   * Defines the current number of posted frames
   */
  private currentFrames: number = 0;

  /**
   * Defines the total number of required frames
   */
  private readonly totalFrames: number; // The total number of required frames

  /**
   * Defines the time up to which the video 
   * has been decoded, in nano seconds
   */
  private currentTime: number;

  /**
   * Defines the requested frame rate
   */
  private readonly fps: number;

  /**
   * Defines the first requested frame timestamp
   * in nanoseconds
   */
  private readonly firstTimestamp: number;

  /**
   * Create a new video decoder and send the decoded frames 
   * from the worker to the main process
   * @param range The start and stop of the window to decode in seconds
   * @param fps The desired framerate
   */
  public constructor(range: [number, number], fps: number) {
    this.currentTime = range[0] * 1e6;
    this.firstTimestamp = range[0] * 1e6;
    this.totalFrames = ((range[1] - range[0]) * fps) + 1;
    this.fps = fps;
    this.video = new VideoDecoder({
      output: this.handleFrameOutput.bind(this),
      error: this.handleError.bind(this),
    });
  }

  /**
   * Method to post the frame and update the current time and count
   */
  private postFrame(frame: VideoFrame) {
    self.postMessage({ type: 'frame', frame });

    // Update the expected time for the next frame
    this.currentTime += Math.floor((1 / this.fps) * 1e6);
    this.currentFrames += 1;
  };

  /**
   * Method to handle the output of the decoder
   */
  private handleFrameOutput(frame: VideoFrame) {
    const timestamp = frame.timestamp;
    const duration = frame.duration ?? 0;
    const endsAt = timestamp + duration;

    if (!this.isFrameInRange(timestamp)) {
      frame.close();
      return;
    }

    while (endsAt > this.currentTime && this.currentFrames <= this.totalFrames) {
      this.postFrame(frame);
    }

    frame.close();
  };

  /**
   * Method to check if the frame is within the specified range
   */
  private isFrameInRange(timestamp: number): boolean {
    return timestamp >= this.firstTimestamp;
  };

  /**
   * Method for handling decoding errors
   */
  private handleError(error: DOMException) {
    console.error('error in worker', error);
    self.postMessage({
      type: 'error',
      message: error.message ?? 'An unknown worker error occurred',
    });
    self.close();
  }
}
