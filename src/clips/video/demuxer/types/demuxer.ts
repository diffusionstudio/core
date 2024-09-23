/* c8 ignore start */ 
/**
 * sync with web-demuxer.h
 */
import type { AVMediaType } from './avutil';

export interface WebAVCodecParameters {
	codec_type: AVMediaType;
	codec_id: number;
	codec_string: string;
	format: number;
	profile: number;
	level: number;
	width: number;
	height: number;
	channels: number;
	sample_rate: number;
	extradata_size: number;
	extradata: Uint8Array;
}

export interface WebAVStream {
	index: number;
	id: number;
	start_time: number;
	duration: number;
	nb_frames: number;
	codecpar: WebAVCodecParameters;
}

export interface WebAVPacket {
	keyframe: 0 | 1;
	timestamp: number;
	duration: number;
	size: number;
	data: Uint8Array;
}
