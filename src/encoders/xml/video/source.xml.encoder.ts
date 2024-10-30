import { XMLBuilder } from "xmlbuilder2/lib/interfaces";
import { VideoSource } from "../../../sources";

export class XMLVideoEncoder {
    /**
     * Encodes a video source to an asset and returns the asset id.
     * @param videoSource - The video source to encode.
     * @param resources - The resources element to add the asset to.
     * @param assetIdCounter - The counter to use for the asset id.
     * @param formatId - The id of the format to use for the asset.
     * @returns The id of the asset.
     * 
     * @example
     * const assetId = XMLVideoEncoder.encode(videoSource, resources, assetIdCounter, formatId);
     * 
     * Resulting XML:
     * 
     * <asset id="r1" start="0" duration="16/1s" hasVideo="1" hasAudio="1" format="r0" audioSources="1" audioChannels="1" audioRate="48000" name="sample_aac_h264_yuv420p_1080p_60fps.mp4">
     *   <mediaRep kind="video/mp4" src="./sample_aac_h264_yuv420p_1080p_60fps.mp4"/>
     * </asset>
     * 
     */
    static encode(
        videoSource: VideoSource,
        resources: XMLBuilder,
        assetIdCounter: number,
        formatId: string
    ): string {
        const assetId = `r${assetIdCounter}`;
        const asset = resources.ele("asset", {
            id: assetId,
            start: 0,
            duration: `${videoSource.duration.millis}/1000s`,
            hasVideo: 1,
            hasAudio: 1,
            format: formatId,
            audioSources: 1,
            audioChannels: 1,
            audioRate: 48000, // TODO: Get from source
            name: videoSource.name,
        });
        const mediaRep = asset.ele("mediaRep", {
            kind: "video/mp4",
            src: `./${videoSource.name}`,
        });
        return assetId;
    }
}
