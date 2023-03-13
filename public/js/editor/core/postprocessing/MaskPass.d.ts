import {
	Scene,
	Camera,
} from '../../../src/Three';

import { Pass } from './Pass';

export default class MaskPass extends Pass {

	constructor( scene: Scene, camera: Camera );
	scene: Scene;
	camera: Camera;
	inverse: boolean;

}

export default class ClearMaskPass extends Pass {

	constructor();

}
