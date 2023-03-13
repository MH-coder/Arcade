import {
	Group,
	Object3D,
	Texture
} from '../../../src/Three';

import { GLTFLoader } from '../loaders/GLTFLoader';

export default class XRControllerModel extends Object3D {

	constructor();

	motionController: any;

	setEnvironmentMap( envMap: Texture ): XRControllerModel;

}

export default class XRControllerModelFactory {

	constructor( gltfLoader?: GLTFLoader );
	gltfLoader: GLTFLoader | null;
	path: string;

	createControllerModel( controller: Group ): XRControllerModel;

}
