import { XMLBuilder } from "xmlbuilder2/lib/interfaces";
import { VideoTrack } from "../../../tracks";


export class XMLVideoTrackEncoder {
    /**
     * Encodes a video track to an XML sequence.
     * @param track - The video track to encode.
     * @param resources - The resources element to add the sequence to.
     * @param sourceNameIdMap - The map of source names to asset ids.
     */
    static encode(track: VideoTrack, resources: XMLBuilder, sourceNameIdMap: Map<string, string>, videoFormatId: string) {
        // const sequence = resources.ele("sequence", {
        //     format: videoFormatId,
        //     tcFormat: "NDF",
        //     tcStart: "0/1s",
        //     duration: `${track.duration}/1s`,
        // });
        track.clips.forEach((clip) => {
            console.log("clip", clip);
            
        });
    }
}
