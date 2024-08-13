/// <reference types="vite/client" />

import type * as Core from '@diffusionstudio/core';
import type * as Pixi from 'pixi.js';
import type * as Filters from 'pixi-filters';

declare global {
  const core: typeof Core;
  const pixi: typeof Pixi & typeof Filters;
}

export {};
