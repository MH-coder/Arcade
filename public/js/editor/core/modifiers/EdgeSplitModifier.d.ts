import { BufferGeometry, Geometry } from "../../../src/Three";

export default class EdgeSplitModifier {

	constructor();
	modify( geometry: Geometry, cutOffPoint: number ): BufferGeometry;

}
