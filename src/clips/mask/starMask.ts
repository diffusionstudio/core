import {Graphics} from "pixi.js";


export interface StarMaskProps {
    points?: number,
    radius?: number,
    InnerRadius?: number,
}

export class StarMask extends Graphics {

    public points = 5
    public radius = 30
    public InnerRadius = 0
    public constructor(props: StarMaskProps){
        super()

        Object.assign(this, props);

        this.star(this.position.x + this.radius, this.position.y + this.radius, this.points, this.radius, this.InnerRadius, this.rotation)
        this.fill({color: '#FFF'})
    }
}
