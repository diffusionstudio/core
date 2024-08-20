# Canvas Encoder

The `CanvasEncoder` is a powerful tool for creating video recordings directly from a canvas element in the browser, ideal for capturing canvas-based games or animations without the need for our `Composition` object.

## Installation

To use the `CanvasEncoder`, import it into your project:

```typescript
import { CanvasEncoder } from '@diffusionstudio/core';
```

## Basic Usage

Start by creating a canvas element and setting its dimensions to match your desired video resolution:

```typescript
// Make sure to assign video dimensions
const canvas = new OffscreenCanvas(1920, 1080);

const encoder = new CanvasEncoder(canvas);
```

### Configuration Options

The `CanvasEncoder` constructor accepts an optional second argument to configure the output settings. The default configurations are:

```typescript
{
    sampleRate: 44100,        // Audio sample rate in Hz
    numberOfChannels: 2,      // Number of audio channels
    videoBitrate: 10e6,       // Video bitrate in bits per second
    fps: 30,                  // Frames per second for the video
}
```

## Video Encoding

After setting up the encoder, you can encode individual frames from the canvas to create your video. The following example creates a 3-second video by encoding 90 frames:

```typescript
const ctx = canvas.getContext("2d")!;

for (let i = 0; i < 90; i++) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // background
    ctx.fillStyle = "blue";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // text
    ctx.fillStyle = "white";
    ctx.font = "50px serif"; // animated Hello World
    ctx.fillText("Hello world", 10 + i * 20, 10 + i * 12);

    // Encode the current canvas state
    await encoder.encodeVideo();
}
```

## Audio Encoding (Optional)

To add audio to your video, you can use the Web Audio API. The `CanvasEncoder` supports encoding audio buffers along with the video:

```typescript
const response = await fetch('https://diffusion-studio-public.s3.eu-central-1.amazonaws.com/audio/sfx/tada.mp3');
const arrayBuffer = await response.arrayBuffer();
const context = new OfflineAudioContext(2, 1, 48e3);

// Decode the audio data to get an AudioBuffer
const audioBuffer = await context.decodeAudioData(arrayBuffer);

// Encode the audio buffer
await encoder.encodeAudio(audioBuffer);
```

The audio will be automatically resampled to match the output configuration, so you don't need to worry about sample rate differences.

> Note: By adding the audio, the resulting video duration will be 6 seconds, as that's the duration of the sound effect. In production you want to keep the video and audio durations synced.

## Exporting the Video

Once you've encoded all the video frames and audio data, finalize the encoding process and export the result as an MP4 file:

```typescript
const blob = await encoder.export();
```

The `export` method returns a `Blob` containing the video with a `video/mp4` MIME type. You can then save or process this blob as needed.
