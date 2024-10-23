<br/>
<p align="center">
  <img src="./assets/icon.png" alt="Library Icon" width="164" height="164" />
  <h1 align="center">diffusionstudio/core</h1>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Made with-Typescript-blue?color=000000&logo=typescript&logoColor=ffffff" alt="Static Badge">
  <a href="https://vitejs.dev"><img src="https://img.shields.io/badge/Powered%20by-Vite-000000?style=flat&logo=Vite&logoColor=ffffff" alt="powered by vite"></a>
  <a href="https://discord.gg/zPQJrNGuFB"><img src="https://img.shields.io/discord/1115673443141156924?style=flat&logo=discord&logoColor=fff&color=000000" alt="discord"></a>
  <a href="https://x.com/diffusionhq"><img src="https://img.shields.io/badge/Follow for-Updates-blue?color=000000&logo=X&logoColor=ffffff" alt="Static Badge"></a>
  <img src="https://img.shields.io/badge/Combinator-F24-blue?color=000000&logo=ycombinator&logoColor=ffffff" alt="Static Badge">
</p>
<br/>

# Getting Started

`@diffusionstudio/core` is an open-source, browser-based video editing library that allows developers to automate video editing workflows at scale, build custom editing applications, or seamlessly integrate video processing capabilities into existing projects.

## Documentation

Visit https://docs.diffusion.studio to view the full documentation.

## Why Use Diffusion Studio
💻 100% **client-side**<br/>
📦 Fully **extensible** with [Pixi.js](https://pixijs.com/)<br/>
🩸 Blazingly **fast** WebGPU/WebGL renderer<br/>
🏎️ **Cutting edge** WebCodecs export<br/>

## Getting Started

```sh
npm install @diffusionstudio/core
```

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
await composition.add(video);  // convenience function for 
await composition.add(text);   // clip -> track -> composition

// render video using webcodecs at 25 FPS
// use resolution: 2 to render at 4k 
new core.Encoder(composition, { fps: 25 }).render();
```

This may look familiar to some. That is because the API is heavily inspired by **Moviepy** and Swift UI. It models the structure of popular video editing applications such as Adobe Premiere or CapCut. The current state can be visualized as follows:

![Composition Visulization](./assets/composition.png)

Whereas each track contains zero or more clips of a single type in ascending chronological order.

A track will be created implicitly with `composition.add(clip)` however you can also create them manually like this:

```typescript
const track = composition.createTrack('text');
await track.add(text0);
await track.add(text1);
await track.add(text2);
...
```

## Examples
You can find more [examples here.](https://github.com/diffusionstudio/examples), or give them a whirl on: https://examples.diffusion.studio

https://github.com/user-attachments/assets/7a943407-e916-4d9f-b46a-3163dbff44c3

## How does DS Core compare to Remotion and Motion Canvas?

**Remotion** is a React-based video creation tool that transforms the entire DOM into videos. It's particularly suited for beginners, as web developers can start creating videos using the skills they already have.

**Motion Canvas** is intended as a standalone editor for creating production-quality animations. It features a unique imperative API that adds elements to the timeline procedurally, rather than relying on keyframes like traditional video editing tools. This makes Motion Canvas ideal for crafting detailed, animated videos.

In contrast, **Diffusion Studio** is not a framework with a visual editing interface but a **video editing library** that can be integrated into existing projects. It operates entirely on the **client-side**, eliminating the need for additional backend infrastructure. Diffusion Studio is also dedicated to supporting the latest rendering technologies, including WebGPU, WebGL, and WebCodecs. If a feature you need isn't available, you can **easily extend** it using [Pixi.js](https://github.com/pixijs/pixijs).

## Current features
* **Video/Audio** trim and offset
* **Tracks & Layering**
* **Splitting** clips
* **Html & Image** rendering
* **Text** with multiple styles
* Web & Local **Fonts**
* **Custom Clips** based on Pixi.js
* **Filters**
* **Keyframe** animations
  * **Numbers, Degrees and Colors**
  * **Easing** (easeIn, easeOut etc.)
  * **Extrapolation** `'clamp' | 'extend'`
* **Realtime playback**
* **Hardware accelerated** encoding via WebCodecs
* **Dynamic render resolution and framerate**

## Contributing
Contributions to DS Core are welcome and highly appreciated. Simply fork this respository and run:

```sh
npm install
```

Before checking in a pull request please verify that all unit tests are still green by running:

```sh
npm run test
```

## Background

This project began in March 2023 with the mission of creating the "video processing toolkit for the era of AI." As someone passionate about video editing for over a decade, I saw Chrome’s release of Webcodecs and WebGPU without a feature flag as the perfect moment to build something new.

Currently, most browser-based video editors rely on server-side rendering, requiring time-consuming uploads and downloads of large video files. With Webcodecs, video processing can now be handled directly in the browser, making it faster and more efficient.

I’m excited to be part of the next generation of video editing technology.

## Compatability

✅ Supported 
🧪 Experimental 
❌ Not supported 

### Desktop

| Browser           |    | Operating System  |    |
| ----------------- | -- | ----------------- | -- |
| Chrome            | ✅ | Windows           | ✅ |
| Edge              | ✅ | Macos             | ✅ |
| Firefox           | ✅ | Linux             | ✅ |
| Safari            | ✅ |
| Opera             | ✅ |
| Brave             | ✅ |
| Vivaldi           | ✅ |


### Mobile

| Browser           |    | Operating System  |    |
| ----------------- | -- | ----------------- | -- |
| Brave Android     | ✅ | Android           | ✅ |
| Chrome Android    | ✅ | iOS               | 🧪 |
| Firefox Android   | 🧪 |
| Opera Android     | ✅ |
| Safari iOS        | 🧪 |


|             | Demultiplexing | Multiplexing |
| ----------- | -------------- | -------------|
| Mp4         | ✅             | ✅           |
| Webm        | ✅             | ❌           |
| Mov         | ✅             | ❌           |
| Mkv         | ❌             | ❌           |
| Avi         | ❌             | ❌           |

|             | Decoding | Encoding          |
| ----------- | -------- | ----------------- |
| Avc1        | ✅       | ✅                |
| AAC         | ✅       | ✅ (Chromium only)|
| Opus        | ✅       | ✅                |
| Wav         | ✅       | ✅                |
| Hevc        | ✅       | ❌                |
| VP9         | ✅       | ❌                |
| VP8         | ✅       | ❌                |
| Mp3         | ✅       | ❌                |
| Ogg         | ✅       | ❌                |
