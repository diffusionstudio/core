/* c8 ignore start */ 
/**
 * sync with ffmpeg libavutil/avutil.h
 */
export enum AVMediaType {
	AVMEDIA_TYPE_UNKNOWN = -1, ///< Usually treated as AVMEDIA_TYPE_DATA
	AVMEDIA_TYPE_VIDEO,
	AVMEDIA_TYPE_AUDIO,
	AVMEDIA_TYPE_DATA, ///< Opaque data information usually continuous
	AVMEDIA_TYPE_SUBTITLE,
	AVMEDIA_TYPE_ATTACHMENT, ///< Opaque data information usually sparse
	AVMEDIA_TYPE_NB,
}
