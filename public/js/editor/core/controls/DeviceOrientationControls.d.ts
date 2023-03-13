import { Camera, EventDispatcher } from '../../../src/Three';

export default class DeviceOrientationControls extends EventDispatcher {

	constructor( object: Camera );

	object: Camera;

	// API

	alphaOffset: number;
	deviceOrientation: any;
	enabled: boolean;
	screenOrientation: number;

	connect(): void;
	disconnect(): void;
	dispose(): void;
	update(): void;

}
