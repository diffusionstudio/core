/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { IOError } from '../errors';
import { EventEmitterMixin } from '../mixins';
import { Serializer, serializable } from '../services';
import { downloadObject } from '../utils/browser';
import { parseMimeType } from '../clips';
import { Timestamp } from '../models';

import type { MimeType, uuid } from '../types';
import type { ClipType } from '../clips';

type Url = string | URL | Request;

export class Source extends EventEmitterMixin(Serializer) {
	/**
	 * Unique identifier of the source
	 */
	@serializable()
	public readonly id: uuid = crypto.randomUUID();
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
	public readonly type: ClipType = 'BASE';
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
	 * Locally accessible blob address to the data
	 */
	@serializable()
	public objectURL: string | undefined;

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
	public async createObjectURL(obj: Blob): Promise<string> {
		return URL.createObjectURL(obj);
	}

	public async loaded(): Promise<void> {
		if ((this.objectURL?.length ?? 0) == 0) {
			await new Promise(this.resolve('update'));
		}

		return;
	}

	public from(input: File | Url, init?: RequestInit | undefined): Promise<this> {
		return Source.from(input, init, this) as Promise<this>;
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
		if (input instanceof File) {
			source.name = input.name;
			source.mimeType = parseMimeType(input.type);
			source.objectURL = await source.createObjectURL(input);
			source.external = false;
			source.file = input;
			source.trigger('update', undefined);

			return source;
		}

		// case input is a request url
		const res = await fetch(input, init);
		if (!res.ok)
			throw new IOError({
				i18n: 'unexpectedIOError',
				message: 'An unexpected error occurred while fetching the file',
			});

		const blob = await res.blob();
		source.name = input.toString().split('/').at(-1) ?? '';
		source.external = true;
		source.file = new File([blob], source.name, { type: blob.type });
		source.externalURL = input;
		source.mimeType = parseMimeType(blob.type);
		source.objectURL = await source.createObjectURL(blob);
		source.trigger('update', undefined);

		return source;
	}

	/**
	 * Get the source as an array buffer
	 */
	public async arrayBuffer(): Promise<ArrayBuffer> {
		await this.loaded();
		const res = await fetch(this.objectURL ?? '');

		return await res.arrayBuffer();
	}

	/**
	 * Clean up the data associated with this object
	 */
	public async remove(): Promise<void> {
		if (this.objectURL) URL.revokeObjectURL(this.objectURL);
	}

	/**
	 * Downloads the file
	 */
	public async export(): Promise<void> {
		await this.loaded();
		downloadObject(this.objectURL!, this.name);
	}

	/**
	 * Get a visulization of the source
	 * as an html element
	 */
	public async thumbnail(): Promise<HTMLElement> {
		return new HTMLElement();
	}
}
