export default class ObjectManipulator {

	constructor();

	applyProperties( objToAlter: object, params: object, forceCreation: boolean ): void;

}

export default class DefaultWorkerPayloadHandler {

	constructor( parser: object );
	logging: {
		enabled: boolean;
		debug: boolean;
	};
	parser: object;

	handlePayload( payload: object ): void;

}

export default class WorkerRunner {

	constructor( payloadHandler: object );
	payloadHandler: object;

	processMessage( payload: object ): void;

}
