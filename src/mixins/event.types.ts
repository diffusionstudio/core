/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

export type ErrorEventDetail = Error;

export type OverrideValues<T, U> = Omit<T, keyof U> & Pick<U, Extract<keyof U, keyof T>>;

export type BaseEvents<E = {}> = {
	'*': any;
	error: Error;
} & E;

export type EmittedEvent<K, T extends {}> = OverrideValues<CustomEvent<K>, { target: T }>;
