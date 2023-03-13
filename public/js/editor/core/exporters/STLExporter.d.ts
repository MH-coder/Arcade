import { Object3D } from '../../../src/Three';

export interface STLExporterOptions {
	binary?: boolean;
}

export default class STLExporter {

	constructor();

	parse( scene: Object3D, options?: STLExporterOptions ): string;

}
