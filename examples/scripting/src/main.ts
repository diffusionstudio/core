import * as core from '@diffusionstudio/core';
import { MainFn, Settings } from './types';
import { isMobile } from './borwser-support';

const select = document.querySelector('select') as HTMLSelectElement;
const container = document.querySelector('[id="player-container"]') as HTMLDivElement;
const progressContainer = document.querySelector('[id="progress"]') as HTMLDivElement;
const progressText = document.querySelector('[id="progress"] > h1') as HTMLHeadingElement;
const player = document.querySelector('[id="player"]') as HTMLDivElement;
const loader = document.querySelector('.loader') as HTMLDivElement;
const time = document.querySelector('[id="time"]') as HTMLSpanElement;
const exportButton = document.querySelector('[id="export"]') as HTMLSpanElement;
const playButton = document.querySelector('[data-lucide="play"]') as HTMLElement;
const pauseButton = document.querySelector('[data-lucide="pause"]') as HTMLElement;
const backButton = document.querySelector('[data-lucide="skip-back"]') as HTMLElement;
const forwardButton = document.querySelector('[data-lucide="skip-forward"]') as HTMLElement;

async function loadScript(name: string) {
  const module = await import(`./${name}.ts`);
  const main: MainFn = module.main;
  const settings: Settings = module.settings;
  const composition = new core.Composition({
    ...settings, // force webgl on mobile
    backend: isMobile ? 'webgl' : undefined
  });
  await main(composition);

  const handlePlay = () => composition.play();
  const handlePause = () => composition.pause();
  const handleBack = () => composition.seek(0);
  const handleForward = () => composition.seek(composition.duration.frames);
  const handleExport = () => fileApiExport(composition);

  playButton.addEventListener('click', handlePlay);
  pauseButton.addEventListener('click', handlePause);
  backButton.addEventListener('click', handleBack);
  forwardButton.addEventListener('click', handleForward);
  exportButton.addEventListener('click', handleExport);

  const playId = composition.on('play', () => {
    playButton.style.display = 'none';
    pauseButton.style.display = 'block';
  });
  const pauseId = composition.on('pause', () => {
    pauseButton.style.display = 'none';
    playButton.style.display = 'block';
  });
  const frameId = composition.on('currentframe', () => {
    time.textContent = composition.time();
  });

  composition.attachPlayer(player);

  const observer = new ResizeObserver(() => {
    const scale = Math.min(
      container.clientWidth / composition.width,
      container.clientHeight / composition.height
    );

    player.style.width = `${composition.width}px`;
    player.style.height = `${composition.height}px`;
    player.style.transform = `scale(${scale})`;
    player.style.transformOrigin = 'center';
  });

  observer.observe(document.body);
  time.textContent = composition.time();
  composition.seek(0);

  return () => {
    composition.pause();

    playButton.removeEventListener('click', handlePlay);
    pauseButton.removeEventListener('click', handlePause);
    backButton.removeEventListener('click', handleBack);
    forwardButton.removeEventListener('click', handleForward);
    exportButton.removeEventListener('click', handleExport);

    composition.off(playId, pauseId, frameId);
    composition.detachPlayer(player);

    observer.unobserve(document.body);
  }
}

async function fileApiExport(composition: core.Composition) {
  if (loader.style.display != 'none') return;
  if (!('showSaveFilePicker' in window)) {
    // use in memory as fallback
    Object.assign(window, { showSaveFilePicker: async () => undefined })
  }

  try {
    const encoder = new core.WebcodecsEncoder(composition, { debug: true });

    encoder.on('render', (event) => {
      const { progress, total } = event.detail;
      progressContainer.style.display = 'flex';
      progressText.innerHTML = `${Math.round(progress * 100 / total)}%`;
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
    await encoder.export(fileHandle); // undefined or file handle
    alert('Video has been rendered successfully!')
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
    progressContainer.style.display = 'none';
  }
}

let removeListeners: () => void;

select.addEventListener('change', async (event) => {
  loader.style.display = 'block';
  removeListeners?.();
  removeListeners = await loadScript((event.target as HTMLSelectElement).value);
  loader.style.display = 'none';
});

select.dispatchEvent(new Event('change'));
