/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

export class BaseError extends Error {
	public readonly message: string;
	public readonly i18n: string;
	public constructor({ message = '', i18n = '' }, ...args: any[]) {
		super(message, ...(args as []));
		console.error(message);
		this.i18n = i18n;
		this.message = message;
	}
}
