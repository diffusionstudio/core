
import * as core from '../src';

export async function exportComposition(composition: core.Composition) {
  if (loader.style.display != 'none') return;

  try {
    const encoder = new core.WebcodecsEncoder(composition, { debug: true });

    encoder.on('render', (event) => {
      const { progress, total } = event.detail;
      container.style.display = 'flex';
      text.innerHTML = `${Math.round(progress * 100 / total)}%`;
    })

    const fileHandle = await window.showSaveFilePicker({
      suggestedName: `untitled_video.mp4`,
      types: [
        {
          description: 'Video File',
          accept: { 'video/mp4': ['.mp4'] },
        },
      ],
    });
    loader.style.display = 'block';
    await encoder.export(fileHandle);
  } catch (e) {
    if (e instanceof DOMException) {
      // user canceled file picker
    } else if (e instanceof core.ExportError) {
      alert(e.message);
    } else {
      alert(String(e))
    }
  } finally {
    loader.style.display = 'none';
    container.style.display = 'none';
  }
}

const container = document.querySelector('[id="progress"]') as HTMLDivElement;
const text = document.querySelector('[id="progress"] > h1') as HTMLHeadingElement;
const loader = document.querySelector('.loader') as HTMLDivElement;
