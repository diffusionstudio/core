```typescript
/**
 * Represents a media clip with various properties and methods to manipulate its playback, offset, volume, and more.
 * Extends the `Clip` class.
 */
class MediaClip extends Clip {
    /**
     * The audio source of the media clip.
     */
    readonly source: AudioSource;

    /**
     * The HTML element associated with the media clip, either audio or video.
     */
    element?: HTMLAudioElement | HTMLVideoElement;

    /**
     * Indicates whether the media is currently playing.
     */
    playing: boolean;

    /**
     * The total duration of the media.
     */
    duration: Timestamp;

    /**
     * The trimmed start and stop values of the media.
     */
    range: [Timestamp, Timestamp];

    /**
     * The transcript of the video or audio.
     */
    transcript?: Transcript;

    /**
     * The offset from frame 0 of the composition.
     */
    get offset(): Timestamp;

    /**
     * Sets the clip's offset to zero in frames. Can be negative.
     * @param time - The new offset time in frames or as a Timestamp.
     */
    set offset(time: frame | Timestamp);

    /**
     * Offsets the clip by a given frame number.
     * @param time - The time by which to offset the clip, in frames or as a Timestamp.
     * @returns The instance of the MediaClip.
     */
    offsetBy(time: frame | Timestamp): this;

    /**
     * Indicates whether the clip is currently muted.
     * @default false
     */
    get muted(): boolean;

    /**
     * Mutes or unmutes the clip.
     * @param state - The new mute state.
     */
    set muted(state: boolean);

    /**
     * Sets the media playback to a given frame.
     * @param frame - The frame to seek to.
     * @returns A promise that resolves when the seek operation is complete.
     */
    seek(frame: frame): Promise<void>;

    /**
     * Returns a slice of a media clip with trimmed start and stop values.
     * @param start - The start time of the subclip, in frames or as a Timestamp.
     * @param stop - The stop time of the subclip, in frames or as a Timestamp.
     * @returns The instance of the MediaClip.
     */
    subclip(start?: frame | Timestamp, stop?: frame | Timestamp): this;

    /**
     * A number between 0 and 1 defining the volume of the media.
     * @default 1
     */
    get volume(): float;

    /**
     * Sets the volume of the media.
     * @param volume - The new volume level, between 0 and 1.
     */
    set volume(volume: float);

    /**
     * Creates a copy of the MediaClip.
     * @returns A new instance of MediaClip.
     */
    copy(): MediaClip;

    /**
     * Splits the media clip at the given time.
     * @param time - The time at which to split the clip, in frames or as a Timestamp.
     * @returns A promise that resolves with the new instance of the MediaClip.
     */
    split(time?: frame | Timestamp): Promise<this>;
}
```
