import { XMLBuilder } from "xmlbuilder2/lib/interfaces";
import { VideoClip } from "../../../clips";

export class XMLVideoClipEncoder {
    /**
     * Encode a video clip to XML
     * @param clip The video clip to encode
     * @param sourceNameIdMap The source name to ID map
     * @param videoFormatId The video format ID
     * @param spine The spine XMLBuilder
     * @param currentEndTime The current end time of the previous clip for adding gaps
     * 
     * @example
     * ```typescript
     * const clip = new core.VideoClip(videoSource, {
     *   volume: 0.1,
     *   anchor: 0.5,
     *   position: 'center',
     *   height: '100%',
     * })
     *   .subclip(30, 60)
     *   .offsetBy(-30);
     * XMLVideoClipEncoder.encode(clip, sourceNameIdMap, videoFormatId, spine);
     * ```
     * Resulting XML:
     * ```xml
     * <spine>
     *   <asset-clip format="r0" tcFormat="NDF" start="1000/1000s" ref="r1" name="sample_aac_h264_yuv420p_1080p_60fps.mp4" offset="0/1000s" duration="1000/1000s"/>
     * </spine>
     * ```
     */
    static encode(
        clip: VideoClip,
        sourceNameIdMap: Map<string, string>,
        videoFormatId: string,
        spine: XMLBuilder,
        currentEndTime: number
    ): number {
        const assetId = sourceNameIdMap.get(clip.source.name);
        if (!assetId) {
            throw new Error(`Asset with name ${clip.source.name} not found`);
        }

        // only need to add gap if this is the first clip of the track
        if (currentEndTime < clip.start.millis && currentEndTime === 0) {
            spine.ele("gap", {
                name: `Gap_${currentEndTime}_${clip.start.millis}`,
                duration: `${clip.start.millis - currentEndTime}/1000s`,
                offset: `${currentEndTime}/1000s`,
            });
        }

        spine.ele("asset-clip", {
            format: videoFormatId,
            tcFormat: "NDF",
            start: `${clip.start.millis - clip.offset.millis}/1000s`,
            ref: assetId,
            name: clip.source.name,
            offset: `${clip.start.millis}/1000s`,
            duration: `${clip.stop.millis - clip.start.millis}/1000s`,
        });
        return clip.stop.millis;
    }
}
