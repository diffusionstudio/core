/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

export class BaseError extends Error {
	public readonly message: string;
	public readonly code: string;
	public constructor({ message = '', code = '' }, ...args: any[]) {
		super(message, ...(args as []));
		console.error(message);
		this.code = code;
		this.message = message;
	}
}
