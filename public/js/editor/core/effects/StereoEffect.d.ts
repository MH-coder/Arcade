import {
	Camera,
	Scene,
	WebGLRenderer
} from '../../../src/Three';

export default class StereoEffect {

	constructor( renderer: WebGLRenderer );

	setEyeSeparation( eyeSep: number ): void;
	render( scene: Scene, camera: Camera ): void;
	setSize( width: number, height: number ): void;

}
