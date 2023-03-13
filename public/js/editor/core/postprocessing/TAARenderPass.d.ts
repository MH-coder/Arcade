import {
	Scene,
	Camera,
	Color
} from '../../../src/Three';

import { SSAARenderPass } from './SSAARenderPass';

export default class TAARenderPass extends SSAARenderPass {

	constructor( scene: Scene, camera: Camera, clearColor: Color | string | number, clearAlpha: number );
	accumulate: boolean;

}
