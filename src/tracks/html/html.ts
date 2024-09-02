/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { Track } from '../track';

import type { HtmlClip } from '../../clips';

export class HtmlTrack extends Track<HtmlClip> {
	public readonly type = 'html';
}
