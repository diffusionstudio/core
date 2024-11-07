import { EllipseMaskProps } from './mask.types';
import { Mask } from './mask';

export class EllipseMask extends Mask {
	private _radius: { x: number; y: number };

	public constructor(props: EllipseMaskProps) {
		super(props);

		this._radius = props.radius;

		this.ellipse(
			this.position.x,
			this.position.y,
			this._radius.x,
			this._radius.y,
		);
		this.fill({ color: '#FFF' });
	}
}
