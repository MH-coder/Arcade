import { Command } from './Command.js';
import { AddObjectCommand } from './AddObjectCommand.js';

/**
 * @param editor Editor
 * @param scene containing children to import
 * @constructor
 */
function ImportSceneCommand( editor, scene ) {

	Command.call( this, editor );

	this.type = 'ImportSceneCommand';
	this.name = 'Import Scene';

	this.cmdArray = [];

	if ( scene !== undefined ) {

		while ( scene.children.length > 0 ) {

			var child = scene.children.pop();
			this.cmdArray.push( new AddObjectCommand( this.editor, child ) );

		}

	}

}

ImportSceneCommand.prototype = {

	execute: function () {

		this.editor.signals.sceneGraphChanged.active = false;

		for ( var i = 0; i < this.cmdArray.length; i ++ ) {

			this.cmdArray[ i ].execute();

		}

		this.editor.signals.sceneGraphChanged.active = true;
		this.editor.signals.sceneGraphChanged.dispatch();

	},

	undo: function () {

		this.editor.signals.sceneGraphChanged.active = false;

		for ( var i = this.cmdArray.length - 1; i >= 0; i -- ) {

			this.cmdArray[ i ].undo();

		}

		this.editor.signals.sceneGraphChanged.active = true;
		this.editor.signals.sceneGraphChanged.dispatch();

	},

	toJSON: function () {

		var output = Command.prototype.toJSON.call( this );

		var cmds = [];
		for ( var i = 0; i < this.cmdArray.length; i ++ ) {

			cmds.push( this.cmdArray[ i ].toJSON() );

		}
		output.cmds = cmds;

		return output;

	},

	fromJSON: function ( json ) {

		Command.prototype.fromJSON.call( this, json );

		var cmds = json.cmds;
		for ( var i = 0; i < cmds.length; i ++ ) {

			var cmd = new window[ cmds[ i ].type ]();	// creates a new object of type "json.type"
			cmd.fromJSON( cmds[ i ] );
			this.cmdArray.push( cmd );

		}

	}

};

export { ImportSceneCommand };
