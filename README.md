<p align="center">
  <img src="./assets/banner.png" alt="Library Banner" style="aspect-ratio: 1200/500;width: 100%;" />
  <h1 align="center">diffusionstudio/core</h1>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Made with-Typescript-blue?color=000000&logo=typescript&logoColor=ffffff" alt="Static Badge">
  <a href="https://vitejs.dev"><img src="https://img.shields.io/badge/Powered%20by-Vite-000000?style=flat&logo=Vite&logoColor=ffffff" alt="powered by vite"></a>
  <a href="https://discord.com/invite/zPQJrNGuFB"><img src="https://img.shields.io/discord/1115673443141156924?style=flat&logo=discord&logoColor=fff&color=000000" alt="discord"></a>
  <a href="https://x.com/diffusionhq"><img src="https://img.shields.io/badge/Follow for-Updates-blue?color=000000&logo=X&logoColor=ffffff" alt="Static Badge"></a>
  <a href="https://www.ycombinator.com/companies/diffusion-studio"><img src="https://img.shields.io/badge/Combinator-F24-blue?color=000000&logo=ycombinator&logoColor=ffffff" alt="Static Badge"></a>
</p>
<br/>

# Getting Started
`@diffusionstudio/core` is a 2D motion graphics and video rendering engine powered by WebCodecs. Developers commonly use it for video editing automations and to build editing [playgrounds/web apps](https://playground.diffusion.studio).

## Documentation
Explore the full documentation at [docs.diffusion.studio](https://docs.diffusion.studio/docs).

## Credits
This project owes much to [@Vanilagy's](https://github.com/Vanilagy) exceptional muxer implementations.

## Why Use Diffusion Studio
💻 100% **client-side**<br/>
🪽 **Small bundle size** – Only 75 KB with a single dependency<br/>
🩸 Blazingly **fast** WebCodecs renderer<br/>
🦾 **AI-first** architecture<br/>

## Getting Started
```sh
npm install @diffusionstudio/core
```

## Benchmarks
![Benchmarks](./assets/benchmarks.png)

## Basic Usage
Here’s an example of how to use the library:

```javascript
import * as core from '@diffusionstudio/core';

const url = 'https://diffusion-studio-public.s3.eu-central-1.amazonaws.com/videos/big_buck_bunny_1080p_30fps.mp4';

// create a video clip and trim it
const video = new core.VideoClip(url).subclip(0, '10s');

// create a text clip and add styles
const text = new core.TextClip({ 
  text: 'Bunny - Our Brave Hero', 
  position: 'center', 
  duration: '5s', 
  stroke: { color: '#000000' } 
});

const composition = new core.Composition(); // 1920x1080

// this is how to compose your clips
await composition.add(video);  // convenience function for 
await composition.add(text);   // clip -> layer -> composition

await new core.Encoder(composition).render('hello_world.mp4');
```

The API models the structure of conventional video editing applications like Adobe Premiere or CapCut, using a layer-based system. Each layer contains zero or more clips of a single type, arranged in ascending chronological order.

Layers are created implicitly with `composition.add(clip)`, but you can also create them manually:

```typescript
const layer = composition.createLayer();
await layer.add(text0);
await layer.add(text1);
await layer.add(text2);
...
```

## Examples
Find more [examples here.](https://github.com/diffusionstudio/examples), or test all capabilities on our [Playground.]( https://app.diffusion.studio)

https://github.com/user-attachments/assets/7a943407-e916-4d9f-b46a-3163dbff44c3

## How Does Diffusion Studio Compare?

### Remotion
A React-based video creation tool that converts the DOM into videos. It’s beginner-friendly, allowing web developers to leverage their existing skills.

### Motion Canvas 
A standalone editor designed for high-quality animations. It features an imperative API, adding elements procedurally rather than relying on keyframes, making it ideal for detailed animations.

### Diffusion Studio
A video editing **library** rather than a framework with a visual interface. It’s lightweight, operates entirely on the **client-side**, and supports WebCodecs without relying on WebAssembly/ffmpeg. Ideal for integration into existing projects.

## Contributing

Currently, version ^2.0.0 is invite-only. You can request access on our Discord if you're interested in contributing. The source code for version ^1.0.0 is available in this repository.

## Current features
* **Video/Audio** trimming and offsets
* **Layering**
* **Splitting** clips
* **Html & Image** rendering
* **Relative** units (e.g. 80% clip height)
* **Shapes** (e.g., rectangles, circles)
* **Text** with multiple styles
* **Audio Visualization**
* High Quality **Captions**
* **Silence Removal** for audio
* Web & Local **Fonts**
* **Custom Clips**
* **Filters**
* **Masks**
* **Blending** modes
* **Keyframe** animations
  * **Numbers, Text and Colors**
  * **Easing** (ease in, ease out etc.)
  * **Extrapolation** `'clamp' | 'extend'`
* **Realtime playback**
* **Hardware accelerated** encoding via WebCodecs
* **Dynamic render resolution and framerate**

## Background

This project was initiated in March 2023 with the mission of creating a “video processing toolkit for the era of AI.” As someone passionate about video editing for over a decade, the release of WebCodecs and WebGPU without feature flags in Chrome presented the perfect opportunity to build something new.

Traditional browser-based video editors rely on server-side rendering, requiring time-consuming uploads and downloads of large files. With WebCodecs, video processing can now be done directly in the browser, making it significantly faster and more efficient.

I’m excited to contribute to the next generation of video editing technology.

## License

This library is free to use under the **Diffusion Studio Non-Commercial License**, as long as your project is **not monetized**.

### ✅ You Can Use This Library for Free If:
- You are an **individual or a company** and your project is **not generating revenue** (no sales, ads, donations beyond operational costs, or other forms of monetization).
- Your project **may become commercial in the future**, as long as you obtain a commercial license before monetization.

### 💼 If Your Project Becomes Commercial:
- If you decide to **monetize your project** (e.g., through sales, ads, premium features, or enterprise use), you must purchase a commercial license.
- Visit our website to obtain a license when you’re ready to monetize.

### 📄 More Details:
-	See LICENSE for the Non-Commercial License.
-	See LICENSE_COMMERCIAL for the Commercial License terms.

For any questions, feel free to [contact us](https://diffusion.studio).

## Version History  

### v1.x _(Released October 2024)_  
- Fully open-source (MPL-2.0 license)  
- Relied on Pixi.js for rendering (resulting in a large library size)  
- WebGPU support  
- FFmpeg-compiled demuxer  
- Limited to short-form content  

### v2.x _(Released February 1, 2025)_  
- **Source code access by invite only** (Commercial & Non-Commercial license)  
- Removed Pixi.js, significantly reducing library size  
- Introduced a custom Canvas 2D renderer  
- Continued FFmpeg-based demuxing  
- Still limited to short-form content  

### v3.x _(Released February 18, 2025)_  
- **Source code access by invite only** (Commercial & Non-Commercial license)  
- Removed all FFmpeg dependencies  
- Retained Canvas 2D rendering  
- Introduced pure TypeScript-based muxers/demuxers  
- Added support for long-form content  

### v4.x _(Estimated Release: July 2025)_  
- **Source code access by invite only** (Commercial & Non-Commercial license)  
- Introducing a custom WebGL2 renderer  
