/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { Demuxer } from './demuxer';
import { Decoder } from './decoder';
import { withThreadErrorHandler } from '../../services';
import { validateDecoderConfig } from './worker.utils';

import type { InitMessageData } from './worker.types';

const MAX_QUEUE = 30;

async function main(event: MessageEvent<InitMessageData>) {
	if (event.data?.type != 'init') return;

	const { file, range, fps } = event.data;

	const demuxer = new Demuxer({
		wasmLoaderPath:
			'https://cdn.jsdelivr.net/npm/@diffusionstudio/ffmpeg-wasm@1.0.0/dist/ffmpeg.js',
	});

	await demuxer.load(file);

	const config = await demuxer.getVideoDecoderConfig();
	validateDecoderConfig(config);

	const decoder = new Decoder(range, fps);

	decoder.video.configure(config);

	const reader = demuxer.readAVPacket(range[0], range[1]).getReader();

	reader.read().then(async function processPacket({ done, value }): Promise<void> {
		if (done) {
			await decoder.video.flush();
			self.postMessage({ type: 'done' });
			self.close();
			return;
		}

		const chunk = demuxer.genEncodedVideoChunk(value);

		if (decoder.video.decodeQueueSize > MAX_QUEUE) {
			await new Promise<void>((resolve) => {
				decoder.video.ondequeue = () => resolve();
			});
		}

		if (chunk.timestamp <= range[1] * 1e6) {
			decoder.video.decode(chunk);
		}

		return reader.read().then(processPacket);
	});
}

self.addEventListener('message', withThreadErrorHandler(main));
