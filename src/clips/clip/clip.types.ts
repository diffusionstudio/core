/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import type { Timestamp } from '../../models';

export type ClipType = 'image' | 'audio' | 'text' | 'video' | 'base' | 'html' | 'complex_text';

export type ClipState = 'IDLE' | 'LOADING' | 'ATTACHED' | 'READY' | 'ERROR';

export type ClipEvents = {
	offsetBy: Timestamp;
	update: any;
	frame: number | undefined;
	attach: undefined;
	detach: undefined;
	load: undefined;
};
