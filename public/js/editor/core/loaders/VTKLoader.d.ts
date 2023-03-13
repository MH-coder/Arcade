import {
	BufferGeometry,
	Loader,
	LoadingManager
} from '../../../src/Three';

export default class VTKLoader extends Loader {

	constructor( manager?: LoadingManager );

	load( url: string, onLoad: ( geometry: BufferGeometry ) => void, onProgress?: ( event: ProgressEvent ) => void, onError?: ( event: ErrorEvent ) => void ): void;
	parse( data: ArrayBuffer | string, path: string ): BufferGeometry;

}
