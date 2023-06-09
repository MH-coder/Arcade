import {
	BufferGeometry,
	Geometry
} from '../../../src/Three';

export default class SubdivisionModifier {

	constructor( subdivisions?: number );
	subdivisions: number;

	modify( geometry: Geometry | BufferGeometry ): Geometry | BufferGeometry;
	smooth( geometry: Geometry ): void;

}
