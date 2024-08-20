# Video Guide

This guide provides a comprehensive overview of using the Diffusion Studio library, from setting up a composition to manipulating videos and exporting the final product.

## Page Index
* [Video Clip](/docs/guide/video.md)
* [Html Clip](/docs/guide/html.md)
* [Image Clip](/docs/guide/image.md)
* [Text Clip](/docs/guide/text.md)
* [Models](/docs/guide/models.md)
* [Canvas Encoder](/docs/guide/canvas.md)

## Setting Up a Composition

To get started, import the `Composition` class from `@diffusionstudio/core` and create a new instance.

```typescript
import { Composition } from '@diffusionstudio/core';

const composition = new Composition();
```

A `Composition` object manages the entire state of a video and is essential for any video project. It can be constructed with various options, with the following default values:

```typescript
{
  backend: 'webgpu', // or 'webgl'
  height: 1080,
  width: 1920,
  background: '#000000'
}
```

If WebGPU is unavailable, the composition will fallback to using WebGL as the rendering backend. The specified height and width define the canvas size but not necessarily the resolution of the rendered video, which can be adjusted later. Note that changing the aspect ratio of the composition after its creation is currently unsupported.

## Visualizing the Composition

First, add a container for the player in your HTML:

```html
<div id="player"></div>
```

Next, attach the composition to this container in your TypeScript code:

```typescript
const player = document.getElementById('player') as HTMLDivElement;
composition.attachPlayer(player);
```

For examples on scaling the player to fit your application, refer to [/examples/main.ts](/examples/main.ts). You can handle resizes using a [ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver), depending on your specific environment and requirements.

## Adding and Manipulating Video

### Loading a Video Source

To add a video, you need a `VideoClip` and a `VideoSource`. You can create a `VideoSource` from a file or an external URL. Here, we will use a URL:

```typescript
import { VideoSource } from '@diffusionstudio/core';

const source = await VideoSource.from('https://diffusion-studio-public.s3.eu-central-1.amazonaws.com/videos/big_buck_bunny_1080p_30fps.mp4');
```

A `VideoSource` is a reusable reference that can be shared across multiple clips, optimizing memory usage.

### Creating a Video Clip

Now, create a `VideoClip` from the `VideoSource`:

```typescript
import { VideoClip } from '@diffusionstudio/core';

const video = new VideoClip(source, { // also accepts new File(...)
  position: 'center', // ensures the clip is centered
  height: '100%', // stretches the clip to the full height
  width: '100%', // stretches the clip to the full width
}); 
```

### Performing Video Manipulations

You can perform various manipulations on the `VideoClip`:

```typescript
video
  .offsetBy(-30) // time offset in frames (relative to current offset)
  .subclip(0, 180); // trims the clip from start to end frames
```

This sets the video's start time to `-30 frames` at `30 FPS`, resulting in a 5-second visible clip (`180 - 30 = 150 frames`). The video is centered and scaled to fill the entire composition. Specifying either height or width maintains the aspect ratio, while setting both does not.

### Adding the Clip to the Composition

Add the clip to the composition:

```typescript
await composition.appendClip(video);
```

Alternatively, if adding multiple clips to the same track, use:

```typescript
import { VideoTrack } from '@diffusionstudio/core';

const track = composition.appendTrack(VideoTrack);
await track.appendClip(video);
```

The `appendClip` method is asynchronous, ensuring the clip is fully loaded before proceeding.

## Using Realtime Playback

The composition provides various realtime playback options:

```typescript
composition.play(); // start playback
composition.pause(); // pause playback
composition.seek(120); // seek to a specific frame
composition.time(); // get human-readable time (e.g., 00:04 / 00:05)
composition.on('currentframe', console.log); // log frame events
```

## Exporting the Composition

To export the composition, use the `WebcodecsEncoder`:

```typescript
import { WebcodecsEncoder } from '@diffusionstudio/core';

const encoder = new WebcodecsEncoder(composition);
```

You can customize the render settings with the second argument of the `WebcodecsEncoder` constructor. For example, to render at 4K resolution and 25 FPS:

```typescript
const encoder = new WebcodecsEncoder(composition, { resolution: 2, fps: 25 });
```

Export the video with the `export` method:

```typescript
encoder.export(); // downloads the video with a default name
encoder.export('myVideo.mp4'); // specifies a filename
encoder.export('https://my-s3.com'); // uploads to a URL
```

For an example using S3 and presigned URLs, see `/examples/puppeteer/index.ts`.

### Using the `showSaveFilePicker` API

The recommended method for client-side export is using `showSaveFilePicker`:

```typescript
const fileHandle = await window.showSaveFilePicker({
  suggestedName: 'untitled_video.mp4',
  types: [
    {
      description: 'Video File',
      accept: { 'video/mp4': ['.mp4'] },
    },
  ],
});

await encoder.export(fileHandle);
```

This writes the MP4 chunks directly to disk, allowing the export of large files without consuming available RAM.

### Browser Compatibility Fallback

If `showSaveFilePicker` is unavailable, use this fallback snippet:

```typescript
if (!('showSaveFilePicker' in window)) {
  Object.assign(window, { showSaveFilePicker: async () => undefined });
}
```

> Note: Diffusion Studio uses AAC for audio encoding by default. Since AAC is unavailable on Linux, Opus is used as a fallback. However, some players (e.g., QuickTime) are incompatible with Opus in MP4. To fix this, use FFmpeg:
>
> ```sh
> ffmpeg -i myVideo.mp4 -c:v copy -c:a aac myVideoAac.mp4
> ```

### Full Example

Here is a complete example putting everything together:

```typescript
import { Composition, VideoSource, VideoClip, WebcodecsEncoder } from '@diffusionstudio/core';

const composition = new Composition();

const player = document.getElementById('player') as HTMLDivElement;
composition.attachPlayer(player);

const source = await VideoSource.from('https://diffusion-studio-public.s3.eu-central-1.amazonaws.com/videos/big_buck_bunny_1080p_30fps.mp4');

const video = new VideoClip(source, {
    position: 'center',
    height: '100%',
    width: '100%',
})
  .offsetBy(-30)
  .subclip(0, 180);

await composition.appendClip(video);

const encoder = new WebcodecsEncoder(composition, { resolution: 2, fps: 25 });
await encoder.export();
```

<br> 

**Next:** [Html Clip](/docs/guide/html.md)
