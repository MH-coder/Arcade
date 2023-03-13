import {
	LightProbe,
	Mesh
} from '../../../src/Three';

export default class LightProbeHelper extends Mesh {

	constructor( lightProbe: LightProbe, size: number );

	lightProbe: LightProbe;
	size: number;

	dispose(): void;

}
