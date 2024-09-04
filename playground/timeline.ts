import * as core from '../src';

export function setupTimeline(composition: core.Composition) {
  composition.on('currentframe', (evt) => {
    const pos = evt.detail / composition.duration.frames;

    cursor.style.left = `${timeline.clientWidth * pos}px`;
  });

  timeline.addEventListener('click', (evt: MouseEvent) => {
    const pos = evt.offsetX / timeline.clientWidth;

    composition.seek(composition.duration.frames * pos);
  });
}

const timeline = document.querySelector('[id="timeline"]') as HTMLDivElement;
const cursor = document.querySelector('[id="timeline"] > div') as HTMLDivElement;
