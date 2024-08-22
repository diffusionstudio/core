import { Application, buildGeometryFromPath, GraphicsPath, Mesh, Texture } from 'pixi.js';
import { CanvasEncoder, downloadObject } from '@diffusionstudio/core';

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({
    backgroundColor: 'brown',
    height: 1080,
    width: 1920,
  });

  document.body.appendChild(app.canvas);

  const path = new GraphicsPath()
    .rect(-50, -50, 100, 100)
    .circle(80, 80, 50)
    .circle(80, -80, 50)
    .circle(-80, 80, 50)
    .circle(-80, -80, 50);

  const geometry = buildGeometryFromPath({
    path,
  });

  const meshes: Mesh[] = [];

  for (let i = 0; i < 200; i++) {
    const x = Math.random() * app.screen.width;
    const y = Math.random() * app.screen.height;

    const mesh = new Mesh({
      geometry,
      texture: Texture.WHITE,
      x,
      y,
      tint: Math.random() * 0xffffff,
    });

    app.stage.addChild(mesh);

    meshes.push(mesh);
  }

  // create new encoder with a framerate of 30FPS
  const encoder = new CanvasEncoder(app.canvas);

  for (let i = 0; i < 180; i++) {
    // render to canvas
    app.render();
    // encode current canvas state
    await encoder.encodeVideo();
    // animate
    meshes.forEach((mesh) => {
      mesh.rotation += 0.02;
    });
  }

  // optionally create audio buffer
  // using the WebAudio API
  const response = await fetch('https://diffusion-studio-public.s3.eu-central-1.amazonaws.com/audio/sfx/tada.mp3');
  const arrayBuffer = await response.arrayBuffer();
  const context = new OfflineAudioContext(1, 1, 48e3);
  const audioBuffer = await context.decodeAudioData(arrayBuffer);

  // encode audio buffer (sample rate will be adapted for you)
  await encoder.encodeAudio(audioBuffer);

  // finalize encoding/muxing and download result
  downloadObject(await encoder.export(), 'test.mp4');
})();
