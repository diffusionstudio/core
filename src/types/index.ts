/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import type { SUPPORTED_MIME_TYPES } from '../fixtures';
import type { Keyframe, Timestamp } from '../models';

/**
 * Defines a number without decimal places
 */
export type int = (number & { _int: void }) | number;

/**
 * Defines an interger that correspondes
 * to a point in time
 */
export type frame = (number & { _frame: void }) | number;

/**
 * Defines a floating point number
 */
export type float = (number & { _float: void }) | number;

/**
 * Defines a color hex value
 */
export type hex = `#${string}`;

/**
 * Defines a uuid 4
 */
export type uuid = `${string}-${string}-${string}-${string}-${string}`;

/**
 * Defines a string that starts with a number
 * and ends with a `%` character
 * @example '50%'
 */
export type Percent = `${number}%`;

/**
 * Defines the constructor required by mixins
 */
export type Constructor<T = {}> = new (...args: any[]) => T;

/**
 * Error message structure
 */
export type ErrorEventDetail = {
	msg: string;
	code: string;
	params?: any;
};

export type ImageMimeType = keyof (typeof SUPPORTED_MIME_TYPES)['IMAGE'];
export type VideoMimeType = keyof (typeof SUPPORTED_MIME_TYPES)['VIDEO'];
export type AudioMimeType = keyof (typeof SUPPORTED_MIME_TYPES)['AUDIO'];
export type MimeType = ImageMimeType | VideoMimeType | AudioMimeType;

/**
 * Function that will be called for each render 
 * with the relative time
 */
export type NumberCallback = (reltime: Timestamp) => number;

/**
 * Defines the relative coordinates
 */
export type Position = {
	x: int | Keyframe<int> | Percent | NumberCallback;
	y: int | Keyframe<int> | Percent | NumberCallback;
};

/**
 * Defines the x and y coorinates of
 * a 2D offset relative to the postion
 */
export type Translate2D = {
	x: int | Keyframe<int> | NumberCallback;
	y: int | Keyframe<int> | NumberCallback;
}

/**
 * Defines the x and y scaling of an object
 */
export type Scale = {
	x: int | Keyframe<int> | NumberCallback;
	y: int | Keyframe<int> | NumberCallback;
};

/**
 * Defines the position of the anchor as 
 * a ratio of the width an height
 */
export type Anchor = {
	x: float,
	y: float,
}

/**
 * Defines the absolute height and width
 */
export type Size = {
	width: float;
	height: float;
};

/**
 * Defines the captions transport format
 */
export type Captions = {
	/**
	 * Defines the word or token
	 * currently spoken
	 */
	token: string;
	/**
	 * Defines the time when the token
	 * will be spoken in **milliseconds**
	 */
	start: number;
	/**
	 * Defines the time when the token
	 * has been spoken in **milliseconds**
	 */
	stop: number;
}[][];

export type ArgumentTypes<F extends Function> = F extends (...args: infer A) => any ? A : never;
export type MixinType<T extends (...args: any[]) => { new(...args: any[]): any }> = InstanceType<
	ReturnType<T>
>;
