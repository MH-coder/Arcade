import {
	Color,
	Line,
	RectAreaLight
} from '../../../src/Three';

export default class RectAreaLightHelper extends Line {

	constructor( light: RectAreaLight, color?: Color | string | number );

	light: RectAreaLight;
	color: Color | string | number | undefined;

	update(): void;
	updateMatrixWorld(): void;
	dispose(): void;

}
