import * as core from '@diffusionstudio/core';
import { setupControls } from './controls';
import { setupTimeline } from './timeline';
import { main, settings } from './composition';

const composition = new core.Composition(settings);

setupControls(composition);
setupTimeline(composition);

const now = performance.now();

main(composition)
  .then(() => {
    console.log('Composition setup took', ((performance.now() - now) / 1000).toFixed(3), 'seconds');
  })
  .catch((error) => {
    console.error(error);
  });
