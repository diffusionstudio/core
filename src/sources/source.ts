/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { IOError, ValidationError } from '../errors';
import { EventEmitterMixin } from '../mixins';
import { Serializer, serializable } from '../services';
import { downloadObject } from '../utils/browser';
import { parseMimeType } from '../clips';
import { Timestamp } from '../models';

import type { MimeType } from '../types';
import type { ClipType } from '../clips';

type Url = string | URL | Request;

export class Source extends EventEmitterMixin(Serializer) {
	/**
	 * Indicates if the track is loading
	 */
	private loading: boolean = false;

	/**
	 * Locally accessible blob address to the data
	 */
	@serializable()
	public objectURL: string | undefined;

	/**
	 * Defines the default duration
	 */
	@serializable()
	public duration = Timestamp.fromSeconds(16);

	/**
	 * Indicates whether the source is used inside the composition
	 */
	public added: boolean = false;

	/**
	 * Type of the source which is compatible
	 * with clips and tracks
	 */
	@serializable()
	public readonly type: ClipType = 'base';
	/**
	 * Original name of the file e.g. clip.mp4
	 */
	@serializable()
	public name: string = '';

	/**
	 * Type of the file that has been loaded
	 */
	@serializable()
	public mimeType: MimeType | undefined;

	/**
	 * External url if the file has been fetched remotely
	 */
	@serializable()
	public externalURL: string | URL | Request | undefined;

	/**
	 * True if the file has been retrieved from an
	 * external source
	 */
	@serializable()
	public external: boolean = false;

	/**
	 * Access to the data of the source
	 */
	public file?: File;

	/**
	 * By default this is a URL.createObjectURL proxy
	 */
	public async createObjectURL(): Promise<string> {
		if (this.objectURL) return this.objectURL;
		this.objectURL = URL.createObjectURL(await this.getFile());

		return this.objectURL
	}

	/**
	 * Method for retrieving the file when 
	 * it has been loaded
	 * @returns The loaded file
	 */
	public async getFile(): Promise<File> {
		if (!this.file && this.loading) {
			await new Promise(this.resolve('load'));
		}

		if (!this.file) {
			throw new ValidationError({
				i18n: 'fileNotAccessible',
				message: 'No source was specified for retrieving the file',
			});
		}

		return this.file;
	}

	public async from(input: File | Url, init?: RequestInit | undefined): Promise<this> {
		if (input instanceof File) {
			this.name = input.name;
			this.mimeType = parseMimeType(input.type);
			this.external = false;
			this.file = input;
			this.trigger('load', undefined);

			return this;
		}


		let res: Response;
		try {
			this.loading = true;
			// case input is a request url
			res = await fetch(input, init);
		} finally {
			this.loading = false;
		}

		if (!res?.ok) {
			throw new IOError({
				i18n: 'unexpectedIOError',
				message: 'An unexpected error occurred while fetching the file',
			});
		}

		const blob = await res.blob();
		this.name = input.toString().split('/').at(-1) ?? '';
		this.external = true;
		this.file = new File([blob], this.name, { type: blob.type });
		this.externalURL = input;
		this.mimeType = parseMimeType(blob.type);
		this.trigger('load', undefined);

		return this;
	}

	/**
	 * Get the source as an array buffer
	 */
	public async arrayBuffer(): Promise<ArrayBuffer> {
		const file = await this.getFile();

		return await file.arrayBuffer();
	}

	/**
	 * Clean up the data associated with this object
	 */
	public async remove(): Promise<void> {
		if (this.objectURL) {
			URL.revokeObjectURL(this.objectURL);
			this.objectURL = undefined;
		}

		delete this.file;
	}

	/**
	 * Downloads the file
	 */
	public async export(): Promise<void> {
		const file = await this.getFile();

		downloadObject(file, this.name);
	}

	/**
	 * Get a visulization of the source
	 * as an html element
	 */
	public async thumbnail(): Promise<HTMLElement> {
		return new HTMLElement();
	}

	/**
	 * Create a new source for the specified input
	 */
	public static async from<T extends Source>(
		this: new () => T,
		input: File | Url,
		init?: RequestInit | undefined,
		source = new this(),
	): Promise<T> {
		return source.from(input, init);
	}
}
