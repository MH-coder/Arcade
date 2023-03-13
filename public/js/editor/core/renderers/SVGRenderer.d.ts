import {
	Object3D,
	Color,
	Scene,
	Camera
} from '../../../src/Three';

export default class SVGObject extends Object3D {

	constructor( node: SVGElement );
	node: SVGElement;

}

export default class SVGRenderer {

	constructor();
	domElement: SVGElement;
	autoClear: boolean;
	sortObjects: boolean;
	sortElements: boolean;
	overdraw: number;
	info: {render: {vertices: number, faces: number}};

	getSize(): { width: number, height: number };
	setQuality( quality: string ): void;
	setClearColor( color: Color, alpha: number ): void;
	setPixelRatio(): void;
	setSize( width: number, height: number ): void;
	setPrecision( precision: number ): void;
	clear(): void;
	render( scene: Scene, camera: Camera ): void;

}
