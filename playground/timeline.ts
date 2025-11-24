import * as core from '@diffusionstudio/core';

export function setupTimeline(composition: core.Composition) {
  composition.on('playback:time', () => {
    const pos = composition.currentTime / composition.duration;

    cursor.style.left = `${timeline.clientWidth * pos}px`;
  });

  let seeking = false;
  timeline.addEventListener('mousemove', async (evt: MouseEvent) => {
    const pos = evt.offsetX / timeline.clientWidth;

    if(!seeking) {
      seeking = true;
      await composition.seek(composition.duration * pos);
      seeking = false;
    }
  });

  timeline.addEventListener('click', (evt: MouseEvent) => {
    const pos = evt.offsetX / timeline.clientWidth;

    composition.seek(composition.duration * pos);
  });
}

const timeline = document.querySelector('[id="timeline"]') as HTMLDivElement;
const cursor = document.querySelector('[id="timeline"] > div') as HTMLDivElement;
