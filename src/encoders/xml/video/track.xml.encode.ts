import { XMLBuilder } from "xmlbuilder2/lib/interfaces";
import { VideoTrack } from "../../../tracks";
import { XMLVideoClipEncoder } from "./clip.xml.encode";

export class XMLVideoTrackEncoder {
    /**
     * Encodes a video track to an XML sequence.
     * @param track - The video track to encode.
     * @param sourceNameIdMap - The map of source names to asset ids.
     * @param videoFormatId - The id of the video format.
     * @param event - The event element to add the sequence to.
     * 
     * @example
     * 
     * ```typescript
     * const track = new core.VideoTrack();
     * 
     * await track.add(new core.VideoClip(videoSource, {
     *   volume: 0.1,
     *   anchor: 0.5,
     *   position: 'center',
     *   height: '100%',
     * })
     *   .subclip(30, 60)
     *   .offsetBy(-30));
     * 
     * await track.add(
     *   new core.VideoClip(videoSource, {
     *     volume: 0.1,
     *     anchor: 0.5,
     *     position: 'center',
     *     height: '100%',
     *   })
     *     .subclip(90, 120)
     *     .offsetBy(-30)
     * );
     * 
     * XMLVideoTrackEncoder.encode(track, sourceNameIdMap, videoFormatId, project);
     * ```
     * Resulting XML:
     * ```xml
     *      <spine lane="0">
     *       <asset-clip format="r0" tcFormat="NDF" start="3000/1000s" ref="r1" name="sample_aac_h264_yuv420p_1080p_60fps.mp4" offset="2000/1000s" duration="1000/1000s"/>
     *       <asset-clip format="r0" tcFormat="NDF" start="1000/1000s" ref="r1" name="sample_aac_h264_yuv420p_1080p_60fps.mp4" offset="0/1000s" duration="1000/1000s"/>
     *     </spine>
     * ```
     */
    static encode(
        track: VideoTrack,
        sourceNameIdMap: Map<string, string>,
        videoFormatId: string,
        sequence: XMLBuilder,
        lane: number
    ) {
        let currentEndTime = 0;
        const spine = sequence.ele("spine", { lane });
        track.clips.forEach((clip) => {
            currentEndTime = XMLVideoClipEncoder.encode(clip, sourceNameIdMap, videoFormatId, spine, currentEndTime);
        });
    }
}
