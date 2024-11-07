import { Graphics } from 'pixi.js';

export interface CircleMaskProps {
	/**
	 * The radius of the circle.
	 */
	radius?: number;
	/**
	 * The position of the circle.
	 */
	position?: { x: number; y: number };
}

/**
 * A circle mask.
 * 
 * @example
 * ```ts
 * const video = await composition.add(
 *   new VideoClip(source, {
 *     mask: new CircleMask({
 *       radius: 100,
 *       position: { x: 100, y: 100 }
 *     })
 *   })
 * );
 * ```
 */
export class CircleMask extends Graphics {
	private radius = 30;

	public constructor(props: CircleMaskProps) {
		super();

		Object.assign(this, props);

		this.circle(this.position.x + this.radius, this.position.y + this.radius, this.radius);
		this.fill({ color: '#FFF' });
	}
}
