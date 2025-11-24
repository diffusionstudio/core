import * as core from '@diffusionstudio/core';
import { render } from './render';

export function setupControls(composition: core.Composition) {
  const handlePlay = () => composition.play();
  const handlePause = () => composition.pause();
  const handleBack = () => composition.seek(0);
  const handleForward = () => composition.seek(composition.duration);
  const handleExport = () => render(composition);

  playButton.addEventListener('click', handlePlay);
  pauseButton.addEventListener('click', handlePause);
  backButton.addEventListener('click', handleBack);
  forwardButton.addEventListener('click', handleForward);
  exportButton.addEventListener('click', handleExport);

  composition.on('playback:start', () => {
    playButton.style.display = 'none';
    pauseButton.style.display = 'block';
  });
  composition.on('playback:end', () => {
    pauseButton.style.display = 'none';
    playButton.style.display = 'block';
  });
  composition.on('playback:time', () => {
    time.textContent = composition.time();
  });

  composition.mount(player);

  const handleResize = () => {
    const scale = Math.min(
      container.clientWidth / composition.width,
      container.clientHeight / composition.height
    );

    player.style.width = `${composition.width}px`;
    player.style.height = `${composition.height}px`;
    player.style.transform = `scale(${scale})`;
    player.style.transformOrigin = 'center';
  }

  const observer = new ResizeObserver(handleResize);

  observer.observe(document.body);
  composition.on('resize', handleResize);
  time.textContent = composition.time();
  composition.seek(0);
}

const container = document.querySelector('[id="player-container"]') as HTMLDivElement;
const player = document.querySelector('[id="player"]') as HTMLDivElement;
const time = document.querySelector('[id="time"]') as HTMLSpanElement;
const exportButton = document.querySelector('[id="export"]') as HTMLButtonElement;
const playButton = document.querySelector('[data-lucide="play"]') as HTMLElement;
const pauseButton = document.querySelector('[data-lucide="pause"]') as HTMLElement;
const backButton = document.querySelector('[data-lucide="skip-back"]') as HTMLElement;
const forwardButton = document.querySelector('[data-lucide="skip-forward"]') as HTMLElement;
