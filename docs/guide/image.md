# Image Guide

The `ImageClip` class, like all static clips (excluding Video & Audio), has a fixed start and stop time.

## Basic Usage

```typescript
import { ImageSource, ImageClip } from '@diffusionstudio/core';

const source = await ImageSource.from('https://diffusion-studio-public.s3.eu-central-1.amazonaws.com/images/lenna.png');

const image = new ImageClip(source).set({ start: 20, stop: 120 });

await composition.appendClip(image);
```

You can place an `ImageClip` on the timeline by setting its `start` and `stop` properties. The `subclip` method and `offset` property are not available for this purpose. However, for convenience, the `ImageClip` class provides the `offsetBy` method, allowing you to adjust the start and stop times together.

## Moving the Clip along the Timeline

Using `offsetBy`:

```typescript
image.offsetBy(-20);
```

This adjustment will make the clip start at frame 0 and end at frame 100, equivalent to:

```typescript
image.set({ start: 0, stop: 100 });
```

## Splitting Clips

You can split an `ImageClip` into two clips at a specified frame:

```typescript
const imageNew = image.split(50);
```

This will split the clip at frame 50.

### Notes

1. **Internal Time Representation**: Internally, Diffusion Studio uses milliseconds for timing. Therefore, splitting the initial image clip at frame 50 (assuming 30 FPS) will set the stop time of the initial clip to `round(50/30*1000) = 1667ms` and the start time of the new clip to `1668ms`. This ensures high precision when rendering at different frame rates.

2. **Non-Overlapping Clips**: Since the new image clip (`imageNew`) is part of the same track as the initial clip, you cannot use `imageNew.offsetBy(-50)` to place them visually next to each other. This would violate the rule that clips within the same track cannot overlap. To achieve this, you must first remove the new clip from the track:

```typescript
imageNew.detach();
```

Then add it to a new track:

```typescript
composition.appendClip(imageNew.offsetBy(-50));
```

By following these steps, you can manage and manipulate image clips effectively within your composition.

<br> 

**Next:** [Text Clip](/docs/guide/text.md)
