/* c8 ignore start */ 
import { AVMediaType, FFMpegWorkerMessageType } from './types';
import FFmpegWorker from './ffmpeg.worker.ts?worker&inline';

import type { FFMpegWorkerMessageData, WebAVPacket, WebAVStream } from './types';

const TIME_BASE = 1000000;

interface WebDemuxerOptions {
	/**
	 * path to the wasm loader
	 */
	wasmLoaderPath: string;
}

/**
 * WebDemuxer
 *
 * Timeline:
 * FFmpegWorkerLoaded => LoadWASM => WASMRuntimeInitialized
 */
export class WebDemuxer {
	private ffmpegWorker: Worker;
	private ffmpegWorkerLoadStatus: Promise<boolean>;
	private msgId: number;

	public file?: File;

	constructor(options: WebDemuxerOptions) {
		this.ffmpegWorker = new FFmpegWorker();
		this.ffmpegWorkerLoadStatus = new Promise((resolve, reject) => {
			this.ffmpegWorker.addEventListener('message', (e) => {
				const { type, errMsg } = e.data;

				if (type === FFMpegWorkerMessageType.FFmpegWorkerLoaded) {
					this.post(FFMpegWorkerMessageType.LoadWASM, {
						wasmLoaderPath: options.wasmLoaderPath,
					});
				}

				if (type === FFMpegWorkerMessageType.WASMRuntimeInitialized) {
					resolve(true);
				}

				if (type === FFMpegWorkerMessageType.LoadWASM && errMsg) {
					reject(errMsg);
				}
			});
		});

		this.msgId = 0;
	}

	private post(type: FFMpegWorkerMessageType, data?: FFMpegWorkerMessageData, msgId?: number) {
		this.ffmpegWorker.postMessage({
			type,
			msgId: msgId ?? this.msgId++,
			data,
		});
	}

	/**
	 * load a file
	 * @param file file to load
	 * @returns load status
	 */
	public async load(file: File) {
		const status = await this.ffmpegWorkerLoadStatus;

		this.file = file;

		return status;
	}

	/**
	 * destroy the instance
	 */
	public destroy() {
		this.file = undefined;
		this.ffmpegWorker.terminate();
	}

	// ================ base api ================
	/**
	 * get av stream
	 * @param streamType
	 * @param streamIndex
	 * @returns
	 */
	public getAVStream(
		streamType = AVMediaType.AVMEDIA_TYPE_VIDEO,
		streamIndex = -1,
	): Promise<WebAVStream> {
		return new Promise((resolve, reject) => {
			if (!this.file) {
				reject('file is not loaded');
				return;
			}

			const msgId = this.msgId;
			const msgListener = ({ data }: MessageEvent) => {
				if (data.type === FFMpegWorkerMessageType.GetAVStream && data.msgId === msgId) {
					if (data.errMsg) {
						reject(data.errMsg);
					} else {
						resolve(data.result);
					}
					this.ffmpegWorker.removeEventListener('message', msgListener);
				}
			};

			this.ffmpegWorker.addEventListener('message', msgListener);
			this.post(FFMpegWorkerMessageType.GetAVStream, {
				file: this.file,
				streamType,
				streamIndex,
			});
		});
	}

	/**
	 * get all av streams
	 */
	public getAVStreams(): Promise<WebAVStream[]> {
		return new Promise((resolve, reject) => {
			if (!this.file) {
				reject('file is not loaded');
				return;
			}

			const msgId = this.msgId;
			const msgListener = ({ data }: MessageEvent) => {
				if (data.type === FFMpegWorkerMessageType.GetAVStreams && data.msgId === msgId) {
					if (data.errMsg) {
						reject(data.errMsg);
					} else {
						resolve(data.result);
					}
					this.ffmpegWorker.removeEventListener('message', msgListener);
				}
			};

			this.ffmpegWorker.addEventListener('message', msgListener);
			this.post(FFMpegWorkerMessageType.GetAVStreams, {
				file: this.file,
			});
		});
	}

	/**
	 * get av packet
	 * @param time
	 * @param streamType
	 * @param streamIndex
	 * @returns
	 */
	public getAVPacket(
		time: number,
		streamType = AVMediaType.AVMEDIA_TYPE_VIDEO,
		streamIndex = -1,
	): Promise<WebAVPacket> {
		return new Promise((resolve, reject) => {
			if (!this.file) {
				reject('file is not loaded');
				return;
			}

			const msgId = this.msgId;
			const msgListener = (e: MessageEvent) => {
				const data = e.data;

				if (data.type === FFMpegWorkerMessageType.GetAVPacket && data.msgId === msgId) {
					if (data.errMsg) {
						reject(data.errMsg);
					} else {
						resolve(data.result);
					}
					this.ffmpegWorker.removeEventListener('message', msgListener);
				}
			};

			this.ffmpegWorker.addEventListener('message', msgListener);
			this.post(FFMpegWorkerMessageType.GetAVPacket, {
				file: this.file,
				time,
				streamType,
				streamIndex,
			});
		});
	}

	/**
	 * get av packets in all streams
	 * @param time
	 * @returns
	 */
	public getAVPackets(time: number): Promise<WebAVPacket[]> {
		return new Promise((resolve, reject) => {
			if (!this.file) {
				reject('file is not loaded');
				return;
			}

			const msgId = this.msgId;
			const msgListener = (e: MessageEvent) => {
				const data = e.data;

				if (data.type === FFMpegWorkerMessageType.GetAVPackets && data.msgId === msgId) {
					if (data.errMsg) {
						reject(data.errMsg);
					} else {
						resolve(data.result);
					}
					this.ffmpegWorker.removeEventListener('message', msgListener);
				}
			};

			this.ffmpegWorker.addEventListener('message', msgListener);
			this.post(FFMpegWorkerMessageType.GetAVPackets, {
				file: this.file,
				time,
			});
		});
	}

	/**
	 * read av packet
	 * @param start start time
	 * @param end end time
	 * @param streamType
	 * @param streamIndex
	 * @returns
	 */
	public readAVPacket(
		start = 0,
		end = 0,
		streamType = AVMediaType.AVMEDIA_TYPE_VIDEO,
		streamIndex = -1,
	): ReadableStream<WebAVPacket> {
		const queueingStrategy = new CountQueuingStrategy({ highWaterMark: 1 });
		const msgId = this.msgId;
		let pullCounter = 0;

		return new ReadableStream(
			{
				start: (controller) => {
					if (!this.file) {
						controller.error('file is not loaded');
						return;
					}
					const msgListener = (e: MessageEvent) => {
						const data = e.data;

						if (data.type === FFMpegWorkerMessageType.ReadAVPacket && data.msgId === msgId) {
							if (data.errMsg) {
								controller.error(data.errMsg);
								this.ffmpegWorker.removeEventListener('message', msgListener);
							} else {
								// noop
							}
						}

						if (data.type === FFMpegWorkerMessageType.AVPacketStream && data.msgId === msgId) {
							if (data.result) {
								controller.enqueue(data.result);
							} else {
								controller.close();
							}
						}
					};

					this.ffmpegWorker.addEventListener('message', msgListener);
					this.post(FFMpegWorkerMessageType.ReadAVPacket, {
						file: this.file,
						start,
						end,
						streamType,
						streamIndex,
					});
				},
				pull: () => {
					// first pull called by read don't send read next message
					if (pullCounter > 0) {
						this.post(FFMpegWorkerMessageType.ReadNextAVPacket, undefined, msgId);
					}
					pullCounter++;
				},
				cancel: () => {
					this.post(FFMpegWorkerMessageType.StopReadAVPacket, undefined, msgId);
				},
			},
			queueingStrategy,
		);
	}

	// ================ convenience api ================

	public getVideoStream(streamIndex?: number) {
		return this.getAVStream(AVMediaType.AVMEDIA_TYPE_VIDEO, streamIndex);
	}

	public getAudioStream(streamIndex?: number) {
		return this.getAVStream(AVMediaType.AVMEDIA_TYPE_AUDIO, streamIndex);
	}

	public seekVideoPacket(time: number) {
		return this.getAVPacket(time, AVMediaType.AVMEDIA_TYPE_VIDEO);
	}

	public seekAudioPacket(time: number) {
		return this.getAVPacket(time, AVMediaType.AVMEDIA_TYPE_AUDIO);
	}

	public readVideoPacket(start?: number, end?: number) {
		return this.readAVPacket(start, end, AVMediaType.AVMEDIA_TYPE_VIDEO);
	}

	public readAudioPacket(start?: number, end?: number) {
		return this.readAVPacket(start, end, AVMediaType.AVMEDIA_TYPE_AUDIO);
	}

	// =========== custom api for webcodecs ===========

	public genVideoDecoderConfig(avStream: WebAVStream): VideoDecoderConfig {
		return {
			codec: avStream.codecpar.codec_string,
			codedWidth: avStream.codecpar.width,
			codedHeight: avStream.codecpar.height,
			description:
				avStream.codecpar.extradata?.length > 0 ? avStream.codecpar.extradata : undefined,
		};
	}

	public genEncodedVideoChunk(avPacket: WebAVPacket): EncodedVideoChunk {
		return new EncodedVideoChunk({
			type: avPacket.keyframe === 1 ? 'key' : 'delta',
			timestamp: avPacket.timestamp * TIME_BASE,
			duration: avPacket.duration * TIME_BASE,
			data: avPacket.data,
		});
	}

	public genAudioDecoderConfig(avStream: WebAVStream): AudioDecoderConfig {
		return {
			codec: avStream.codecpar.codec_string || '',
			sampleRate: avStream.codecpar.sample_rate,
			numberOfChannels: avStream.codecpar.channels,
			description:
				avStream.codecpar.extradata?.length > 0 ? avStream.codecpar.extradata : undefined,
		};
	}

	public genEncodedAudioChunk(avPacket: WebAVPacket): EncodedAudioChunk {
		return new EncodedAudioChunk({
			type: avPacket.keyframe === 1 ? 'key' : 'delta',
			timestamp: avPacket.timestamp * TIME_BASE,
			duration: avPacket.duration * TIME_BASE,
			data: avPacket.data,
		});
	}

	public async getVideoDecoderConfig() {
		const videoStream = await this.getVideoStream();

		return this.genVideoDecoderConfig(videoStream);
	}

	public async seekEncodedVideoChunk(timestamp: number) {
		const videoPacket = await this.seekVideoPacket(timestamp);

		return this.genEncodedVideoChunk(videoPacket);
	}

	public async getAudioDecoderConfig() {
		const audioStream = await this.getAudioStream();

		return this.genAudioDecoderConfig(audioStream);
	}

	public async seekEncodedAudioChunk(timestamp: number) {
		const audioPacket = await this.seekAudioPacket(timestamp);

		return this.genEncodedAudioChunk(audioPacket);
	}
}
