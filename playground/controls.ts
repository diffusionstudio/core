import * as core from '../src';
import { render } from './render';

export function setupControls(composition: core.Composition) {
  const handlePlay = () => composition.play();
  const handlePause = () => composition.pause();
  const handleBack = () => composition.seek(0);
  const handleForward = () => composition.seek(composition.duration.frames);
  const handleExport = () => render(composition);

  playButton.addEventListener('click', handlePlay);
  pauseButton.addEventListener('click', handlePause);
  backButton.addEventListener('click', handleBack);
  forwardButton.addEventListener('click', handleForward);
  exportButton.addEventListener('click', handleExport);

  composition.on('play', () => {
    playButton.style.display = 'none';
    pauseButton.style.display = 'block';
  });
  composition.on('pause', () => {
    pauseButton.style.display = 'none';
    playButton.style.display = 'block';
  });
  composition.on('currentframe', () => {
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
}

const container = document.querySelector('[id="player-container"]') as HTMLDivElement;
const player = document.querySelector('[id="player"]') as HTMLDivElement;
const time = document.querySelector('[id="time"]') as HTMLSpanElement;
const exportButton = document.querySelector('[id="export"]') as HTMLButtonElement;
const playButton = document.querySelector('[data-lucide="play"]') as HTMLElement;
const pauseButton = document.querySelector('[data-lucide="pause"]') as HTMLElement;
const backButton = document.querySelector('[data-lucide="skip-back"]') as HTMLElement;
const forwardButton = document.querySelector('[data-lucide="skip-forward"]') as HTMLElement;
