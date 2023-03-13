import {
	Mesh,
} from '../../../src/Three';

import { LineMaterial } from './LineMaterial';
import { LineSegmentsGeometry } from './LineSegmentsGeometry';

export default class LineSegments2 extends Mesh {

	geometry: LineSegmentsGeometry;
	material: LineMaterial;

	constructor( geometry?: LineSegmentsGeometry, material?: LineMaterial );
	readonly isLineSegments2: true;

	computeLineDistances(): this;

}
