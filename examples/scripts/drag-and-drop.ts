import * as core from '@diffusionstudio/core';

export const comp = new core.Composition();

const text = await comp.appendClip(
  new core.TextClip('Drop mp4/webm in Window')
    .set({ position: 'center' })
)

// Handle the file drop event
async function handleFileDrop(event: DragEvent): Promise<void> {
  event.preventDefault();

  const files = event.dataTransfer!.files; // FileList object

  if (files.length == 0) return

  const file = files[0];

  text.detach();

  // use file to construct instance
  await comp.appendClip(
    new core.VideoClip(file)
      .set({ height: '100%', position: 'center' })
  )
}

function handleDragOver(event: DragEvent): void {
  event.preventDefault();
  event.dataTransfer!.dropEffect = 'copy';
}

document.addEventListener('drop', handleFileDrop, false);
document.addEventListener('dragover', handleDragOver, false);
