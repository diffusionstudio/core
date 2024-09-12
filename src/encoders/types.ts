/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

export type EncoderEvents = {
	render: {
		/**
		 * Defines how many were rendered yet
		 */
		progress: number;
		/**
		 * Defines the total number of frames
		 * to be rendered
		 */
		total: number;
		/**
		 * Defines the estimated remaining
		 * render time
		 */
		remaining: Date;
	};
};
