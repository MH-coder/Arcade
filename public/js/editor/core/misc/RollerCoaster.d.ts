import {
	BufferGeometry,
	Curve,
	Mesh,
	Vector3
} from '../../../src/Three';

export default class RollerCoasterGeometry extends BufferGeometry {

	constructor( curve: Curve<Vector3>, divisions: number );

}

export default class RollerCoasterLiftersGeometry extends BufferGeometry {

	constructor( curve: Curve<Vector3>, divisions: number );

}

export default class RollerCoasterShadowGeometry extends BufferGeometry {

	constructor( curve: Curve<Vector3>, divisions: number );

}

export default class SkyGeometry extends BufferGeometry {

	constructor( curve: Curve<Vector3>, divisions: number );

}

export default class TreesGeometry extends BufferGeometry {

	constructor( landscape: Mesh );

}
