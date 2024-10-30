import {Graphics} from "pixi.js";


export interface CircleMaskProps {
    radius?: number,
}

export class CircleMask extends Graphics {

    public radius = 30
    public constructor(props: CircleMaskProps){
        super()

        Object.assign(this, props);

        this.circle(this.position.x + this.radius,  this.position.y + this.radius, this.radius)
        this.fill({color: '#FFF'})
    }
}
