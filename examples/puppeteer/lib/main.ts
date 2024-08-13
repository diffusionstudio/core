import * as core from '@diffusionstudio/core';
import * as pixi from 'pixi.js';
import * as filters from 'pixi-filters';

Object.assign(window, { core, pixi: { ...pixi, ...filters }});
