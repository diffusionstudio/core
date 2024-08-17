```typescript
/**
 * Represents a composition for rendering and playback management.
 * Extends EventEmitter to handle composition-specific events.
 */
class Composition extends EventEmitter<CompositionEvents> {
    /**
     * Access to the underlying PixiJS WebGPU Renderer.
     */
    renderer: Renderer;

    /**
     * Unique identifier of the composition.
     */
    readonly id: uuid;

    /**
     * Settings of the composition.
     */
    settings: CompositionSettings;

    /**
     * Tracks attached to the composition.
     */
    tracks: Track<Clip>[];

    /**
     * The current frame that the playback is set to.
     */
    frame: frame;

    /**
     * User-defined fixed duration. Use the `duration` property to change this value.
     */
    durationLimit?: Timestamp;

    /**
     * Indicates whether the GPU renderer has been initialized.
     */
    initialized: boolean;

    /**
     * The current state of the composition.
     */
    state: CompositionState;

    /**
     * Frames per second used for rendering.
     */
    fps: float;

    /**
     * The canvas element that has been added to the DOM.
     */
    canvas?: HTMLCanvasElement;

    /**
     * Creates a new Composition instance.
     * @param settings - Partial settings for the composition.
     */
    constructor({ height, width, background, backend, }?: Partial<CompositionSettings>);

    /**
     * Indicates whether the realtime playback has started.
     */
    get playing(): boolean;

    /**
     * Indicates whether the composition is rendering in non-realtime.
     */
    get rendering(): boolean;

    /**
     * Gets the current width of the canvas.
     */
    get width(): number;

    /**
     * Gets the current height of the canvas.
     */
    get height(): number;

    /**
     * Gets the duration where the playback stops.
     */
    get duration(): Timestamp;

    /**
     * Sets the total duration limit of the composition.
     * @param time - The new playback duration.
     */
    set duration(time: frame | Timestamp | undefined);

    /**
     * Attaches the player as a child of the specified HTML element.
     * @param element - The HTML element to attach the player to.
     */
    attachPlayer(element: HTMLElement): void;

    /**
     * Removes the player from the DOM.
     * @param element - The HTML element to detach the player from.
     */
    detachPlayer(element: HTMLElement): void;

    /**
     * Appends a track containing an array of clips in chronological order.
     * @param Track - The track to append.
     * @returns The appended track.
     */
    appendTrack<L extends Track<Clip>>(Track: (new () => L) | L): L;

    /**
     * Convenience function for appending a track as well as the clip to the composition.
     * @param clip - The clip to append.
     * @returns A promise that resolves with the appended clip.
     */
    appendClip<L extends Clip>(clip: L): Promise<L>;

    /**
     * Removes all tracks of the specified type.
     * @param Track - The track type to remove.
     * @returns The removed tracks.
     */
    removeTracks(Track: new (composition: Composition) => Track<Clip>): Track<Clip>[];

    /**
     * Finds tracks that match the provided parameters.
     * @param predicate - The condition to match tracks against.
     * @returns An array of matching tracks.
     */
    findTracks<T extends Track<Clip>>(predicate: ((value: Track<Clip>) => boolean) | (new () => T)): T[];

    /**
     * Finds clips that match the provided parameters.
     * @param predicate - The condition to match clips against.
     * @returns An array of matching clips.
     */
    findClips<T extends Clip>(predicate: ((value: Clip) => boolean) | (new () => T)): T[];

    /**
     * Computes the currently active frame.
     */
    computeFrame(): void;

    /**
     * Takes a screenshot of the current frame.
     * @param format - The image format for the screenshot.
     * @param quality - The quality of the screenshot.
     * @returns A base64 encoded string of the screenshot.
     */
    screenshot(format?: ScreenshotImageFormat, quality?: number): string;

    /**
     * Sets the playback position to a specific time.
     * @param frame - The new playback time.
     * @returns A promise that resolves when the seek operation is complete.
     */
    seek(frame: frame): Promise<void>;

    /**
     * Plays the composition.
     * @returns A promise that resolves when playback starts.
     */
    play(): Promise<void>;

    /**
     * Pauses the composition.
     * @returns A promise that resolves when playback is paused.
     */
    pause(): Promise<void>;

    /**
     * Gets the current playback time and composition duration formatted as `00:00 / 00:00` by default.
     * If `hours` is set, the format is `HH:mm:ss`. If `milliseconds` is set, the format is `mm:ss.SSS`.
     * @param precision - The formatting options.
     * @returns The formatted time string.
     */
    time(precision?: {
        hours?: boolean;
        milliseconds?: boolean;
    }): string;
}
```
