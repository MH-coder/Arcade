import { Command } from './Command.js';

import * as THREE from '../libs/three.module.js';

/**
 * @param editor Editor
 * @param object THREE.Object3D
 * @param newPosition THREE.Vector3
 * @param optionalOldPosition THREE.Vector3
 * @constructor
 */
function SetSpotLightTargetCommand( editor, object, newPosition, optionalOldPosition ) {

	Command.call( this, editor );

	this.type = 'SetSpotLightTargetCommand';
	this.name = 'Set SpotLight Target';
	this.updatable = true;

	this.object = object;

	if ( object !== undefined && newPosition !== undefined ) {

		this.oldPosition = object.target.position.clone();
		this.newPosition = newPosition.clone();

	}

	if ( optionalOldPosition !== undefined ) {

		this.oldPosition = optionalOldPosition.clone();

	}

}

SetSpotLightTargetCommand.prototype = {

	execute: function () {

		var userData = this.object.userData;

		this.object.target.position.copy( this.newPosition );
		this.object.target.updateMatrixWorld( true );
		this.editor.signals.objectChanged.dispatch( this.object );

		this.object.userData = {
			...userData,
			target: {
				uuid: 'none',
				position: this.newPosition.toArray()
			}
		}

	},

	undo: function () {

		var userData = this.object.userData;

		this.object.target.position.copy( this.oldPosition );
		this.object.target.updateMatrixWorld( true );
		this.editor.signals.objectChanged.dispatch( this.object );

		this.object.userData = {
			...userData,
			target: {
				uuid: 'none',
				position: this.oldPosition.toArray()
			}
		}
	},

	update: function ( command ) {

		this.newPosition.copy( command.newPosition );

	},

	toJSON: function () {

		var output = Command.prototype.toJSON.call( this );

		output.objectUuid = this.object.uuid;
		output.oldPosition = this.oldPosition.toArray();
		output.newPosition = this.newPosition.toArray();

		return output;

	},

	fromJSON: function ( json ) {

		Command.prototype.fromJSON.call( this, json );

		this.object = this.editor.objectByUuid( json.objectUuid );
		this.oldPosition = new THREE.Vector3().fromArray( json.oldPosition );
		this.newPosition = new THREE.Vector3().fromArray( json.newPosition );

	}

};

export { SetSpotLightTargetCommand };
