<br/>
<p align="center">
  <img src="./assets/icon.png" alt="Library Icon" width="164" height="164" />
  <h1 align="center">Diffusion Studio</h1>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Made with-Typescript-blue?color=000000&logo=typescript&logoColor=ffffff" alt="Static Badge">
  <a href="https://vitejs.dev"><img src="https://img.shields.io/badge/Powered%20by-Vite-000000?style=flat&logo=Vite&logoColor=ffffff" alt="powered by vite"></a>
  <a href="https://discord.gg/zPQJrNGuFB"><img src="https://img.shields.io/discord/1115673443141156924?style=flat&logo=discord&logoColor=fff&color=000000" alt="discord"></a>
  <a href="https://x.com/diffusionstudi0"><img src="https://img.shields.io/badge/Follow for-Updates-blue?color=000000&logo=X&logoColor=ffffff" alt="Static Badge"></a>
</p>
<br/>

# Getting Started

Diffusion Studio is a browser-based framework for programmatic video editing. It enables developers to automate complex editing workflows, build AI-powered video editors and create videos at scale.

```sh
npm i @diffusionstudio/core
```

## Documentation

Visit https://docs.diffusion.studio to view the full documentation.

## Basic Usage
Let's take a look at an example:

```typescript
import * as core from '@diffusionstudio/core';

const source = await core.VideoSource // convenience function for fetch -> blob -> file
  .from('https://diffusion-studio-public.s3.eu-central-1.amazonaws.com/videos/big_buck_bunny_1080p_30fps.mp4');

// create a video clip and trim it
const video = new core.VideoClip(source) // compatible with the File API
  .subclip(0, 160); // The base unit is frames at 30 FPS

// create a text clip and add styles
const text = new core.TextClip({ 
  text: 'Bunny - Our Brave Hero', 
  position: 'center', 
  stop: 80, 
  stroke: { color: '#000000' } 
});

const composition = new core.Composition(); // 1920x1080

// this is how to compose your clips
await composition.appendClip(video);  // convenience function for 
await composition.appendClip(text);   // clip -> track -> composition

// export video using webcodecs at 25 FPS
new core.WebcodecsEncoder(composition, { fps: 25 })
  .export(); // use resolution = 2 to render at 4k 
```

This may look familiar to some. That is because the API is heavily inspired by **Moviepy** and Swift UI. It models the structure of popular video editing applications such as Adobe Premiere or CapCut. The current state can be visualized as follows:

![Composition Visulization](./assets/composition.png)

Whereas each track contains zero or more clips of a single type in ascending chronological order. Clips within a track cannot overlap with other clips, similar to Adobe Premiere etc.

A track will be created implicitly with `composition.appendClip(clip)` however you can also create them manually like this:

```typescript
const track = composition.appendTrack(core.TextTrack);
await track.appendClip(text0);
await track.appendClip(text1);
await track.appendClip(text2);
...
```

The composition, the track and the clips are each in a relationship of `1:n`. You can find more [examples here.](./examples), or give them a whirl on: https://examples.diffusion.studio

https://github.com/user-attachments/assets/7a943407-e916-4d9f-b46a-3163dbff44c3

## How does Diffusion Studio compare to Remotion and Motion Canvas?

**Remotion** acts as a React-based video creation tool, enabling you to render the entire DOM tree as well as the full suite of browser visualization features, such as HTML, CSS, Canvas, etc.. This makes Remotion ideal for beginners looking to create videos with code. However, is limited to react and relies heavily on the CPU, which less efficient compared to GPU backed rendering.

In contrast, **Motion Canvas** uses a 2D implementation of Canvas for rendering. It is intended as a standalone editor for creating production-quality animations. In addition, Motion Canvas uses an imperative API. Instead of rendering markup based on timestamps, elements are procedurally added to the timeline. This approach is ideal for creating animations with code (the intended purpose). However, it usually demands static workflows with little variability, making it difficult to build dynamic applications.

**Diffusion Studio** combines the strengths of both Remotion and Motion Canvas by offering a declarative (yet framework-agnostic) API like Remotion, while also being GPU-backed like Motion Canvas. Diffusion Studio is optimized for video processing performance, utilizing the latest and greatest technologies (WebGPU and WebCodecs). Its API is specifically designed for building video editing apps and to automate complex video workflows.

> **Note: Diffusion Studio eliminates the need to pay for rendering server infrastructure, since all processing is performed client-side!**

## Current features
* **Video/Audio** trim and offset
* **Tracks & Layering**
* **Splitting** clips
* **Html & Image** rendering
* **Text** with multiple styles
* Web & Local **Fonts**
* **Filters**
* **Keyframe** animations
  * **Numbers, Degrees and Colors**
  * **Easing** (easeIn, easeOut etc.)
  * **Extrapolation** `'clamp' | 'extend'`
* **Realtime playback**
* **Hardware accelerated** encoding via WebCodecs
* **Dynamic render resolution and framerate**

## Compatability

✅ Supported 
⏰ Not yet supported 
❌ Not planned 
🔬 Not tested

### Desktop

| Browser           |    | Operating System  |    |
| ----------------- | -- | ----------------- | -- |
| Chrome            | ✅ | Windows           | ✅ |
| Edge              | ✅ | Macos             | ✅ |
| Firefox           | ⏰ | Linux             | ✅ |
| Safari            | ⏰ |
| Opera             | 🔬 |
| Brave             | ✅ |
| Vivaldi           | 🔬 |


### Mobile

| Browser           |    | Operating System  |    |
| ----------------- | -- | ----------------- | -- |
| Brave Android     | 🔬 | Android           | 🔬 |
| Chrome Android    | 🔬 | iOS               | ⏰ |
| Firefox Android   | ⏰ |
| Opera Android     | 🔬 |
| Safari iOS        | ⏰ |


|             | Demultiplexing | Multiplexing |
| ----------- | -------------- | -------------|
| Mp4         | ✅             | ✅           |
| Webm        | ✅             | ⏰           |
| Mov         | ✅             | ❌           |
| Mkv         | ⏰             | ❌           |
| Avi         | ⏰             | ❌           |

|             | Decoding | Encoding          |
| ----------- | -------- | ----------------- |
| Avc1        | ✅       | ✅                |
| Hevc        | ✅       | ⏰                |
| VP9         | ✅       | ⏰                |
| VP8         | ✅       | ⏰                |
| AAC         | ✅       | ✅ (except Linux) |
| Opus        | ✅       | ✅                |
| Mp3         | ✅       | ❌                |
| Ogg         | ✅       | ❌                |
| Wav         | ✅       | N/A               |

## Contributing
Contributions to Diffusion Studio are welcome and highly appreciated. Simply fork this respository and run:

```sh
npm install
```

Before checking in a pull request please verify that all unit tests are still green by running:

```sh
npm run test
```

## Background

This project has been started in March 2023 with the mission of creating the *"video processing toolkit for the area of AI"*. During an extensive research period, we quickly decided to fully embrace **WebGPU**, which offers a substantial performance improvement over its predecessor WebGL and technologies alike. The following implementations were evaluated:
* **C++ w/ Python bindings** - inefficient to develop.
* **Rust** - early ecosystem (might come back here).
* **Typescript** - efficient to develop, great performance when gpu based.

They all support WebGPU, however, in the case of Typescript, WebGPU is currently only available in Chromium-based browsers, which is why a WebGL fallback is mandatory.
