<br/>
<p align="center">
  <img src="./assets/icon.png" alt="Library Icon" width="164" height="164" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Made with-Typescript-blue?color=000000&logo=typescript&logoColor=ffffff" alt="Static Badge">
  <a href="https://vitejs.dev"><img src="https://img.shields.io/badge/Powered%20by-Vite-000000?style=flat" alt="powered by vite"></a>
  <a href="https://discord.gg/h5QGXw8m"><img src="https://img.shields.io/discord/1115673443141156924?style=flat&logo=discord&logoColor=fff&color=000000" alt="discord"></a>
</p>
<br/>

# Diffusion Studio - A browser based video processing framework 🚀

Yes that's right, DS does not require a backend! This is made possible by bleeding edge browser APIs such as WebGPU, WebCodecs and WebAssembly resulting in a blazingly fast render performance 🏎️ (fastest in town).

### Background

This project has been started in March 2023 with the mission of creating the *"video processing toolkit for the area of AI"*. During an extensive research period, we quickly decided to fully embrace **WebGPU**, which offers a substantial performance improvement over its predecessor WebGL and technologies alike. The following implementations were evaluated:
* **C++ w/ Python bindings** - inefficient to develop.
* **Rust** - early ecosystem (might come back here).
* **Typescript** - efficient to develop, great performance when gpu based.

They all support WebGPU, however, in the case of Typescript, WebGPU is currently only available in Chromium-based browsers, which is why a WebGL fallback is mandatory.


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

## Setup

```sh
npm i @diffusionstudio/core
```
Diffusion Studio's render implementation was recently migrated to [Pixi.js](https://pixijs.com/), a **WebGL/WebGPU abstraction library**, to speed up development while providing full support for WebGPU and WebGL. It is listed as a peer dependency and will be installed if the dependency is not already satisfied.

## Getting Started
```typescript
import * as core from '@diffusionstudio/core';

const source = await core.VideoSource // convenience function for fetch -> blob -> file
  .from('https://diffusion-studio-public.s3.eu-central-1.amazonaws.com/videos/big_buck_bunny_1080p_30fps.mp4');

// create a video clip and trim it
const video = new core.VideoClip(source) // compatible with the File API
  .subclip(0, 160); // The base unit is frames at 30 FPS

// create a text clip and add styles
const text = new core.TextClip('Bunny - Our Brave Hero')
  .set({ position: 'center', stop: 80, stroke: { color: '#000000' } })

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

The composition, the track and the clips are each in a relationship of `1:n`. You can find more examples here:

* [Caption Presets](./examples/scripts/captions.ts)
* [Custom Caption Presets](./examples/scripts/custom-captions.ts)
* [Drag and Drop & File API](./examples/scripts/drag-and-drop.ts)
* [Loading Webfonts](./examples/scripts/font.ts)
* [Splitting Clips](./examples/scripts/split-video.ts)
* [Video Trimming](./examples/scripts/video-trimming.ts)
* [SSR with Puppeteer](./examples/puppeteer)

Clone the repository and run `npm install && npm run dev` to conveniently test these examples.

https://github.com/user-attachments/assets/7a943407-e916-4d9f-b46a-3163dbff44c3

## Documentation (WIP)
- [Getting Started](/docs/guide/video.md)
- [Api Reference](/docs/api/index.md)
--- 
<br> 

> Two very impressive video processing libraries were already available when we started this project, which differ from Diffusion Studio as follows

## How does Diffusion Studio compare to Remotion and Motion Canvas?

**Remotion** acts as a React-based video creation tool, enabling you to utilize the entire DOM tree for video creation as well as the full suite of browser visualization features, such as HTML, CSS, Canvas, etc.. This makes Remotion ideal for beginners looking to create videos with code. However, it relies heavily on the CPU, which can be inefficient for rendering.

**Motion Canvas** lives up to its name by utilizing a GPU-backed canvas element, primarily through a Canvas 2D implementation. It aims to be a standalone editor for creating production-quality animations. Moreover, Motion Canvas employs an imperative API. Instead of rendering markup based on timestamps, elements are added procedurally to the timeline. This approach makes it ideal for creating animations with code (it's intended prupose). However, it is suboptimal for dynamic applications or as the backbone of a video editing application.

**Diffusion Studio** combines the strengths of both Remotion and Motion Canvas by offering a declarative (yet framework-agnostic) API like Remotion, while also being GPU-backed like Motion Canvas. Diffusion Studio is optimized for video processing performance, utilizing the latest and greatest technologies (WebGPU, WebCodecs and WASM). Its API is specifically designed for building video editing and video processing applications, with a strong focus on automation software.

One notable advantage of Diffusion Studio being client-side software is that it eliminates the need to pay for rendering server infrastructure. However, widespread support across all browsers may take some time to achieve.

## Compatability

✅ Supported 
⏰ Not yet supported 
❌ Not planned 
🔬 Not tested 

| Browser           |    | Operating System  |    |
| ----------------- | -- | ----------------- | -- |
| Chrome            | ✅ | Windows           | ✅ |
| Edge              | ✅ | Macos             | ✅ |
| Firefox           | ⏰ | Linux             | ✅ |
| Opera             | 🔬 | Android           | 🔬 |
| Safari            | ⏰ | iOS               | ⏰ |
| Chrome Android    | 🔬 |
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

## License

### License for Personal Use

Copyright (c) 2024 Diffusion Studio GmbH

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to use the Software for personal, non-commercial purposes only, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

#### Restrictions

- Redistribution, sublicensing, and republishing of the Software or any derivative works are strictly prohibited.
- The Software is provided "as is", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose, and noninfringement. In no event shall the authors or copyright holders be liable for any claim, damages, or other liability, whether in an action of contract, tort, or otherwise, arising from, out of, or in connection with the Software or the use or other dealings in the Software.

#### Eligibility

You are eligible to use Diffusion Studio for free if you are:

- an individual.
- assessing whether Diffusion Studio is a suitable solution for your organization.
- a for-profit organization with up to five (5) employees.
- a non-profit organization.

### Commercial Use

For commercial use, a separate commercial license must be obtained. Please contact license(at)diffusion.studio to obtain a commercial license.
