
import { Command } from './Command.js';

import { ObjectLoader } from '../utils/ObjectLoader.js';

/**
 * @param editor Editor
 * @param object THREE.Object3D
 * @constructor
 */
function RemoveVoxelsCommand( editor, objects, parent ) {

	Command.call( this, editor );

	this.type = 'RemoveVoxelsCommand';
	this.name = 'Remove Voxels';

	this.objects = objects;
	this.parent = parent;

}

RemoveVoxelsCommand.prototype = {

	execute: function () {

		this.editor.removeObjects( this.objects, this.parent );

	},

	undo: function () {

		this.editor.addObjects( this.objects, this.parent );

	},

	toJSON: function () {

		var output = Command.prototype.toJSON.call( this );
		output.objects = this.objects.map( object => object.uuid );
		output.parentUuid = this.parent.uuid;

		return output;

	},

	fromJSON: function ( json ) {

		Command.prototype.fromJSON.call( this, json );

		this.parent = this.editor.objectByUuid( json.parentUuid );
		if ( this.parent === undefined ) {

			this.parent = this.editor.scene;

		}

		this.objects.map( ( uuid ) => this.editor.objectByUuid( uuid ) );

	}

};

export { RemoveVoxelsCommand };
