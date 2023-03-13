import * as THREE from '../libs/three.module.js';
import { Command } from './Command.js';

/**
 * @param editor Editor
 * @param particle THREE.Object3D
 * @param attributeName string
 * @param newValue number, string, boolean or object
 * @constructor
 */
function SetParticleValueCommand( editor, particle, objectName, attributeName, newValue ) {

	Command.call( this, editor );

	this.type = 'SetParticleValueCommand';
	this.name = 'Set ' + objectName + ' ' + attributeName;
	this.updatable = true;

	this.particle = particle;
	this.objectName = objectName;
	this.attributeName = attributeName;
	this.oldValue = ( particle === undefined ) ? undefined : SetParticleValueCommand.isVetorial( particle ) ? this.get()[ attributeName ].clone() : this.get()[ attributeName ];
	this.newValue = newValue;

}

SetParticleValueCommand.prototype = {

	get: function () {

		var attributes = this.objectName.split('.');
		var value = this.particle;

		for ( var attribute of attributes ) {

			if ( attribute ) value = value[ attribute ];
			
		}

		return value;

	},

	execute: function () {

		var value = this.get();
		if ( SetParticleValueCommand.isVetorial( value[ this.attributeName ] ) ) {

			value[ this.attributeName ].copy( this.newValue );
			
		} else {

			value[ this.attributeName ] = this.newValue;
			
		}
		this.particle.reload();
		this.editor.signals.objectChanged.dispatch( this.particle );
		// this.editor.signals.sceneGraphChanged.dispatch();

	},

	undo: function () {

		var value = this.get();
		if ( SetParticleValueCommand.isVetorial( value[ this.attributeName ] ) ) {

			value[ this.attributeName ].copy( this.oldValue );
			
		} else {

			value[ this.attributeName ] = this.oldValue;
			
		}
		this.particle.reload();
		this.editor.signals.objectChanged.dispatch( this.particle );
		// this.editor.signals.sceneGraphChanged.dispatch();

	},

	update: function ( cmd ) {

		if ( SetParticleValueCommand.isVetorial( this.newValue ) ) {

			this.newValue.copy( cmd.newValue );
			
		} else {

			this.newValue = cmd.newValue;
			
		}

	},

	toJSON: function () {

		var output = Command.prototype.toJSON.call( this );

		output.objectUuid = this.particle.uuid;
		output.objectName = this.objectName;
		output.attributeName = this.attributeName;
		output.oldValue = this.oldValue;
		output.newValue = this.newValue;

		return output;

	},

	fromJSON: function ( json ) {

		Command.prototype.fromJSON.call( this, json );

		this.objectName = json.objectName;
		this.attributeName = json.attributeName;
		this.oldValue = json.oldValue;
		this.newValue = json.newValue;
		this.particle = this.editor.objectByUuid( json.objectUuid );

	}

};

SetParticleValueCommand.isVetorial = function ( object ) {

	return ( object && ( object.isVector3 || object.isEuler || object instanceof THREE.Quaternion || object.isVector2 || object.isVector4 || object.isMatrix3  || object.isMatrix4 || object.isColor ) );
};

export { SetParticleValueCommand };
