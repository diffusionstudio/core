

export interface MaskProps {
    /**
     * The position of the center of the mask for circular, elliptical and star masks and 
     * the top left corner of the mask for rectangular masks
     */
    position?: { x: number, y: number },
}

export interface CircleMaskProps extends MaskProps {
    radius: number,
}

export interface EllipseMaskProps extends MaskProps {
    radius: {
        x: number,
        y: number,
    }
}

export interface RectangleMaskProps extends MaskProps {
	rectangleWidth: number;
	rectangleHeight: number;
}

export interface RoundRectangleMaskProps extends RectangleMaskProps {
    borderRadius: number,
}

export interface StarMaskProps extends MaskProps {
    numberOfPoints: number,
    radius: number,
    innerRadius?: number,
}