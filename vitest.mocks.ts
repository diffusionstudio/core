/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { vi } from 'vitest';

export class FontFaceMock {
	id: string;
	uri: string;
	weight = '';

	constructor(id: string, uri: string) {
		this.id = id;
		this.uri = uri;
	}

	async load() {
		return this;
	}
}

export class FileMock {
	name: string;
	data: Array<any>;
	type: string;

	constructor(data: Array<any>, fileName: string, options?: { type: string }) {
		this.name = fileName;
		this.data = data;
		this.type = options?.type ?? 'video/mp4';
	}

	async arrayBuffer() {
		return new ArrayBuffer(0);
	}

	stream() {
		return {
			pipeTo: async (writable: {
				write: () => Promise<void>;
				close: () => void;
				file: (file: FileMock) => void;
			}) => writable.file(this),
		};
	}
}

export class URLMock {
	href: string;

	constructor(name: string, path: string) {
		this.href = path + '/' + name;
	}

	static createObjectURL(_: Blob | File) {
		return 'blob:chrome://new-tab-page/3dc0f2b7-7773-4cd4-a397-2e43b1bba7cd';
	}
}

export const defaultFetchMockReturnValue = {
	ok: true,
	json: () => new Promise((resolve) => resolve({})),
	arrayBuffer: () => new Promise((resolve) => resolve(new ArrayBuffer(0))),
	blob: () => new Promise((resolve) => resolve(new Blob())),
};

export function setFetchMockReturnValue(response: Partial<Response>) {
	const fetchMock = vi.fn().mockResolvedValue(response);
	Object.assign(globalThis, { fetch: fetchMock });

	return () => {
		const fetchMock = vi.fn().mockResolvedValue(defaultFetchMockReturnValue);
		Object.assign(globalThis, { fetch: fetchMock });
	};
}

export function queryLocalFonts() {
	return [
		{
			family: 'Al Bayan',
			fullName: 'Al Bayan Plain',
			postscriptName: 'AlBayan',
			style: 'Plain',
		},
		{
			family: 'Al Bayan',
			fullName: 'Al Bayan Bold',
			postscriptName: 'AlBayan-Bold',
			style: 'Bold',
		},
		{
			family: 'Al Nile',
			fullName: 'Al Nile',
			postscriptName: 'AlNile',
			style: 'Regular',
		},
		{
			family: 'Al Nile',
			fullName: 'Al Nile Bold',
			postscriptName: 'AlNile-Bold',
			style: 'Bold',
		},
		{
			family: 'Al Tarikh',
			fullName: 'Al Tarikh Regular',
			postscriptName: 'AlTarikh',
			style: 'Regular',
		},
		{
			family: 'American Typewriter',
			fullName: 'American Typewriter',
			postscriptName: 'AmericanTypewriter',
			style: 'Regular',
		},
		{
			family: 'American Typewriter',
			fullName: 'American Typewriter Bold',
			postscriptName: 'AmericanTypewriter-Bold',
			style: 'Bold',
		},
	];
}

export class AudioEncoderMock {
	init: AudioEncoderInit;
	config?: AudioEncoderConfig;
	data: AudioData[] = [];

	public constructor(init: AudioEncoderInit) {
		this.init = init;
	}

	public configure(config: AudioEncoderConfig): void {
		this.config = config;
	}

	public encode(data: AudioData): void {
		this.data.push(data);
	}

	public async flush(): Promise<void> {
		return;
	}

	public static async isConfigSupported(config: VideoEncoderConfig): Promise<VideoEncoderSupport> {
		return {
			supported: true,
			config
		};
	}
}

export class AudioDataMock {
	init: AudioDataInit;

	constructor(init: AudioDataInit) {
		this.init = init;
	}
}

export class VideoEncoderMock {
	init: VideoEncoderInit;
	config?: VideoEncoderConfig;
	data: { frame: VideoFrame; options?: VideoEncoderEncodeOptions }[] = [];

	ondequeue?(): void;

	public constructor(init: VideoEncoderInit) {
		this.init = init;
	}

	public configure(config: VideoEncoderConfig): void {
		this.config = config;
	}

	public encode(frame: VideoFrame, options?: VideoEncoderEncodeOptions): void {
		this.data.push({ frame, options });
		this.ondequeue?.();
	}

	public static async isConfigSupported(_: VideoEncoderConfig): Promise<VideoEncoderSupport> {
		return {
			supported: true,
		};
	}

	public async flush(): Promise<void> {
		return;
	}
}

export class VideoFrameMock {
	image: CanvasImageSource;
	init?: VideoFrameInit;

	constructor(image: CanvasImageSource, init?: VideoFrameInit) {
		this.image = image;
		this.init = init;
	}

	public close() {
		return;
	}
}


export class FileSystemWritableFileStreamMock {
	data: any;
	fileName: string;

	constructor(data: any, fileName: string) {
		this.data = data;
		this.fileName = fileName;
	}

	async write(data: FileSystemWriteChunkType) {
		this.data[this.fileName] = data;
	}

	async close() { }

	// TODO: Why is this required?
	public file(file: File) {
		Object.assign(file, { name: this.fileName });
		this.data[this.fileName] = file;
	}
}

export class FileSystemFileHandleMock {
	data: any;
	fileName: string;

	constructor(data: any, fileName: string) {
		this.data = data;
		this.fileName = fileName;
	}

	async getFile(): Promise<File> {
		return this.data[this.fileName];
	}

	async remove(): Promise<void> {
		delete this.data[this.fileName];
	}

	async createWritable(): Promise<FileSystemWritableFileStreamMock> {
		return new FileSystemWritableFileStreamMock(this.data, this.fileName);
	}
}

export class FileSystemDirectoryHandleMock {
	data: any = {};
	directory?: string;

	async getDirectoryHandle(name: string, options?: { create: boolean }) {
		if (!(name in this.data) && !options?.create) {
			throw new Error('Directory does not exist');
		}

		if (!(name in this.data)) {
			this.data[name] = {};
		}

		this.directory = name;
		return this;
	}

	async getFileHandle(name: string, options?: { create: boolean }) {
		if (!this.directory) {
			throw new Error('Must get directory handle first');
		}

		if (!(name in this.data[this.directory]) && !options?.create) {
			throw new Error('File does not exist');
		}

		if (!(name in this.data[this.directory])) {
			this.data[this.directory][name] = new File([], '');
		}

		return new FileSystemFileHandleMock(this.data[this.directory], name);
	}

	async remove(_?: { recursive: true }) {
		if (!this.directory) {
			throw new Error('Must get directory handle first');
		}

		delete this.data[this.directory];
	}

	async *keys() {
		if (!this.directory) {
			throw new Error('Must get directory handle first');
		}

		for (const key of Object.keys(this.data[this.directory])) {
			yield key;
		}
	}
}

export const opfs = new FileSystemDirectoryHandleMock();

export class AudioBufferMock {
  sampleRate: number;
  length: number;
  duration: number;
  numberOfChannels: number;
  channelData: Float32Array[];

  constructor({ sampleRate, length, numberOfChannels }: { sampleRate: number; length: number; numberOfChannels: number }) {
    this.sampleRate = sampleRate;
    this.length = length;
    this.duration = length / sampleRate;
    this.numberOfChannels = numberOfChannels;
    this.channelData = Array(numberOfChannels)
      .fill(null)
      .map(() => new Float32Array(length));
  }

  getChannelData(channel: number): Float32Array {
    if (channel >= this.numberOfChannels || channel < 0) {
      throw new Error("Channel index out of range");
    }
    return this.channelData[channel];
  }

  copyToChannel(source: Float32Array, channel: number, startInChannel = 0): void {
    const channelData = this.getChannelData(channel);
    channelData.set(source, startInChannel);
  }

  copyFromChannel(destination: Float32Array, channel: number, startInChannel = 0): void {
    const channelData = this.getChannelData(channel);
    destination.set(channelData.subarray(startInChannel, startInChannel + destination.length));
  }
}

export class OfflineAudioContextMock {
	sampleRate: number;
	length: number;
	numberOfChannels: number;

	constructor({ sampleRate, length, numberOfChannels }: OfflineAudioContextOptions) {
		this.sampleRate = sampleRate;
		this.length = length;
		this.numberOfChannels = numberOfChannels ?? 2;
	}

	createBuffer(numberOfChannels: number, length: number, sampleRate: number): AudioBuffer {
		return new AudioBufferMock({ numberOfChannels, length, sampleRate }) as any as AudioBuffer;
	}
}

export class MockFileSystemFileHandleMock {
  kind: 'file' = 'file';
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  async getFile(): Promise<File> {
    const file = new File(['mock content'], this.name, { type: 'text/plain' });
    return Promise.resolve(file);
  }

  async isSameEntry(other: FileSystemHandle): Promise<boolean> {
    return this as any == other;
  }

  async createWritable(): Promise<FileSystemWritableFileStream> {
    const stream = new MockFileSystemWritableFileStreamMock();
    return Promise.resolve(stream) as any;
  }

  // Other methods can be added if needed
}

export class MockFileSystemWritableFileStreamMock {
  async write(data: BufferSource | Blob | string | ArrayBufferView): Promise<void> {
    // Mock writing to the file
    console.log('Writing data:', data);
    return Promise.resolve();
  }

  async seek(position: number): Promise<void> {
    console.log('Seeking to position:', position);
    return Promise.resolve();
  }

  async truncate(size: number): Promise<void> {
    console.log('Truncating to size:', size);
    return Promise.resolve();
  }

  async close(): Promise<void> {
    console.log('Closing the file stream');
    return Promise.resolve();
  }
}
