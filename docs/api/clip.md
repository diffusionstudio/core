```typescript
import { ContainerChild } from 'pixi.js';

/**
 * Represents a clip with various properties and methods for managing and rendering.
 * Extends EventEmitter with ClipEvents.
 */
class Clip extends EventEmitter<ClipEvents> {
    /**
     * Unique identifier of the clip object.
     * Format: `${string}-${string}-${string}-${string}-${string}`
     */
    readonly id: `${string}-${string}-${string}-${string}-${string}`;

    /**
     * Identifier used to search clips by type.
     */
    readonly type: ClipType;

    /**
     * Defines the source of the clip with a one-to-many relationship.
     * Optional.
     */
    source?: Source;

    /**
     * The container holding render-related information.
     */
    readonly container: Container<ContainerChild>;

    /**
     * Timestamp indicating when the clip was created.
     */
    readonly createdAt: Date;

    /**
     * Controls the visibility of the clip.
     * When `true`, the clip is hidden.
     */
    disabled: boolean;

    /**
     * The current state of the clip indicating readiness for rendering.
     */
    state: ClipState;

    /**
     * Accessor for the parent track containing this clip.
     * Optional.
     */
    track?: Track<Clip>;

    /**
     * Human-readable identifier for the clip.
     */
    get name(): string | undefined;
    set name(name: string);

    /**
     * Gets the timestamp of the first visible frame of the clip.
     */
    get start(): Timestamp;

    /**
     * Gets the timestamp of the last visible frame of the clip.
     */
    get stop(): Timestamp;

    /**
     * Connects the clip to a specified track.
     * @param track - The track to connect the clip to.
     * @returns A promise that resolves when the connection is complete.
     */
    connect(track: Track<Clip>): Promise<void>;

    /**
     * Sets the start time of the clip.
     * The start time can be zero or negative.
     * @param time - The start time as a frame or timestamp.
     */
    set start(time: frame | Timestamp);

    /**
     * Sets the stop time of the clip.
     * @param time - The stop time as a frame or timestamp.
     */
    set stop(time: frame | Timestamp);

    /**
     * Offsets the clip by a given time.
     * @param time - The offset time as a frame or timestamp.
     * @returns The current clip instance.
     */
    offsetBy(time: frame | Timestamp): this;

    /**
     * Renders the current frame of the clip.
     * @param renderer - The renderer to use for rendering.
     * @param time - The current time for rendering.
     * @returns A promise that resolves when rendering is complete, or void.
     */
    render(renderer: Renderer, time: number): void | Promise<void>;

    /**
     * Detaches the clip from its parent track.
     * @returns The current clip instance.
     */
    detach(): this;

    /**
     * Splits the clip into two clips at the specified time.
     * @param time - The time to split the clip. If not specified, the current frame time is used.
     * @returns A promise that resolves with the new clip created by the split.
     */
    split(time?: frame | Timestamp): Promise<this>;

    /**
     * Creates a copy of the clip.
     * @returns A new instance of Clip that is a copy of the current clip.
     */
    copy(): Clip;
}
```