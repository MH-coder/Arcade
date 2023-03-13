import {
	BufferGeometry,
	Geometry
} from '../../../src/Three';

export default class SimplifyModifier {

	constructor();
	modify( geometry: BufferGeometry | Geometry, count: number ): BufferGeometry;

}
