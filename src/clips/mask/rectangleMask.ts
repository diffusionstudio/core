import { Mask } from './mask';
import { RectangleMaskProps } from './mask.types';



export class RectangleMask extends Mask  {
	private _rectangleWidth: number;
	private _rectangleHeight: number;

	public constructor(props: RectangleMaskProps) {
		super(props);
        
        this._rectangleWidth = props.rectangleWidth;
        this._rectangleHeight = props.rectangleHeight;

		this.rect(this.position.x, this.position.y, this._rectangleWidth, this._rectangleHeight);
		this.fill({ color: '#FFF' });
	}
}
