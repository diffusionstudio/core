import * as core from '@diffusionstudio/core';

const select = document.querySelector('select') as HTMLSelectElement;
const container = document.querySelector('[id="player-container"]') as HTMLDivElement;
const player = document.querySelector('[id="player"]') as HTMLDivElement;
const loader = document.querySelector('.loader') as HTMLDivElement;
const time = document.querySelector('[id="time"]') as HTMLSpanElement;
const exportButton = document.querySelector('[id="export"]') as HTMLSpanElement;
const playButton = document.querySelector('[data-lucide="play"]') as HTMLElement;
const pauseButton = document.querySelector('[data-lucide="pause"]') as HTMLElement;
const backButton = document.querySelector('[data-lucide="skip-back"]') as HTMLElement;
const forwardButton = document.querySelector('[data-lucide="skip-forward"]') as HTMLElement;

async function loadScript(name: string) {
  const comp = (await import(`./scripts/${name}.ts`)).comp as core.Composition;

  const handlePlay = () => comp.play();
  const handlePause = () => comp.pause();
  const handleBack = () => comp.seek(0);
  const handleForward = () => comp.seek(comp.duration.frames);
  const handleExport = () => fileApiExport(comp);

  playButton.addEventListener('click', handlePlay);
  pauseButton.addEventListener('click', handlePause);
  backButton.addEventListener('click', handleBack);
  forwardButton.addEventListener('click', handleForward);
  exportButton.addEventListener('click', handleExport);

  const playId = comp.on('play', () => {
    playButton.style.display = 'none';
    pauseButton.style.display = 'block';
  });
  const pauseId = comp.on('pause', () => {
    pauseButton.style.display = 'none';
    playButton.style.display = 'block';
  });
  const frameId = comp.on('currentframe', () => {
    time.textContent = comp.time();
  });

  comp.attachPlayer(player);

  const scale = Math.min(
    container.clientWidth / comp.width,
    container.clientHeight / comp.height
  );

  player.style.width = `${comp.width}px`;
  player.style.height = `${comp.height}px`;
  player.style.transform = `scale(${scale})`;
  player.style.transformOrigin = 'center';

  time.textContent = comp.time();

  comp.seek(0);

  return () => {
    playButton.removeEventListener('click', handlePlay);
    pauseButton.removeEventListener('click', handlePause);
    backButton.removeEventListener('click', handleBack);
    forwardButton.removeEventListener('click', handleForward);
    exportButton.removeEventListener('click', handleExport);

    comp.off(playId, pauseId, frameId);
    comp.detachPlayer(player);
  }
}

async function fileApiExport(composition: core.Composition) {
  if (loader.style.display != 'none') return;
  if (!('showSaveFilePicker' in window)) {
    // use in memory as fallback
    Object.assign(window, { showSaveFilePicker: async () => undefined })
  }

  try {
    const encoder = new core.WebcodecsEncoder(composition);

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
  }
}

let removeListeners = await loadScript(select.value);

select.addEventListener('change', async (event) => {
  loader.style.display = 'block';
  removeListeners();
  removeListeners = await loadScript((event.target as HTMLSelectElement).value);
  loader.style.display = 'none';
});
