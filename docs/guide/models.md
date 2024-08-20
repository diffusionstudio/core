# Models

## Keyframe

The `Keyframe` object is the core of animations. You can instantiate it like this:

```typescript
import { Keyframe } from '@diffusionstudio/core';

const keyframe = new Keyframe(
  [0, 12],  // input range in frames
  [0, 100], // output range as numbers
);
```

Keyframes are always relative to the start of a `Clip`. In this example, a particular property will be `0` at frame `0` and `100` at frame `12`. What happens after frame `12` is determined by the `extrapolation` behavior of the keyframe. The default is `clamp`, causing the value to stay between `0` and `100` outside the input range. Alternatively, `extend` will extrapolate the values beyond the input range.

Here is an example with all available properties:

```typescript
const keyframe = new Keyframe(
  [0, 12],      // input range in frames
  [0, 2 * 360], // output range in degrees
  {
    easing: 'easeIn',      // default is 'linear'
    extrapolate: 'extend', // default is 'clamp'
    type: 'degrees',       // default is 'number'
  }
);
```

You can apply Keyframes to various properties such as:
* Position x
* Position y
* Translate x
* Translate y
* Rotation
* Opacity

## Timestamp

The `Timestamp` object is used to manage the connection between frames and milliseconds internally. You will usually receive a timestamp when calling getters on time-related properties, such as the `start` and `stop` of a clip.

You can also use the `Timestamp` externally for higher precision if your application requires it, like this:

```typescript
import { Timestamp, ImageClip } from '@diffusionstudio/core';

const timestamp = new Timestamp(1000); // in milliseconds

new ImageClip({ stop: timestamp });

timestamp.frames;  // 30
timestamp.millis;  // 1000
timestamp.seconds; // 1
```

**Next:** [Canvas Encoder](/docs/guide/canvas.md)
