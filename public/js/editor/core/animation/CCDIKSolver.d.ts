import {
	SkinnedMesh,
} from '../../../src/Three';

export interface IKS {
	effector: number;
	iteration: number;
	links: {
		enabled: boolean;
		index: number;
	}
	maxAngle: number;
	target: number;
}

export default class CCDIKSolver {

	constructor( mesh: SkinnedMesh, iks: IKS[] );

	update(): this;
	createHelper(): CCDIKHelper;

}

export default class CCDIKHelper {

	constructor( mesh: SkinnedMesh, iks: IKS[] );

}
