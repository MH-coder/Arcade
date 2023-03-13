import {
	WebGLRenderer,
	MeshStandardMaterial
} from '../../../src/Three';

export default class RoughnessMipmapper {

	constructor( renderer:WebGLRenderer );
	generateMipmaps( material:MeshStandardMaterial ): void;
	dispose(): void;

}
