import * as core from '@diffusionstudio/core';

let fps = 30;

export async function render(composition: core.Composition) {
  if (loader.style.display != 'none') return;

  try {
    const encoder = new core.Encoder(composition, { debug: true, video: { fps } });

    container.addEventListener('click', () => encoder.cancel());

    encoder.onProgress = (event) => {
      const { progress, total } = event;
      container.style.display = 'flex';
      text.innerHTML = `${Math.round(progress * 100 / total)}%`;
    }

    const fileHandle = await window.showSaveFilePicker({
      suggestedName: `untitled_video.mp4`,
      types: [
        {
          description: 'Video File',
          accept: { 'video/mp4': ['.mp4'] },
        },
      ],
    });

    await encoder.render(fileHandle);
  } catch (e) {
    if (e instanceof DOMException) {
      console.error(e);
      // user canceled file picker
    } else if (e instanceof core.EncoderError) {
      alert(e.message);
    } else {
      alert(String(e));
    }
  } finally {
    loader.style.display = 'none';
    container.style.display = 'none';
  }
}

const container = document.querySelector('[id="progress"]') as HTMLDivElement;
const text = document.querySelector('[id="progress"] > h1') as HTMLHeadingElement;
const loader = document.querySelector('.loader') as HTMLDivElement;
const fpsButton = document.querySelector('[data-lucide="gauge"]') as HTMLElement;

fpsButton.addEventListener('click', () => {
  const value = parseFloat(
    prompt("Please enter the desired frame rate", fps.toString()) ?? fps.toString()
  );

  if (!Number.isNaN(value)) fps = value;
});

if (!('showSaveFilePicker' in window)) {
  Object.assign(window, { showSaveFilePicker: async () => 'untitled_video.mp4' });
}
