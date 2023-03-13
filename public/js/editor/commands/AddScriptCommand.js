import { Command } from './Command.js';

/**
 * @param editor Editor
 * @param script javascript object
 * @constructor
 */
function AddScriptCommand( editor, script ) {

	Command.call( this, editor );

	this.type = 'AddScriptCommand';
	this.name = 'Add Script';

	this.script = script;
	this.index = -1;

}

AddScriptCommand.prototype = {

	execute: function () {

		this.editor.scripts.push( this.script );

		this.index = this.editor.scripts.length - 1;

		this.editor.signals.scriptAdded.dispatch( this.script );

	},

	undo: function () {

		this.editor.scripts.splice( this.index, 1 );

		this.editor.signals.scriptRemoved.dispatch( this.script );

	},

	toJSON: function () {

		var output = Command.prototype.toJSON.call( this );

		output.script = this.script;
		output.index = this.index;

		return output;

	},

	fromJSON: function ( json ) {

		Command.prototype.fromJSON.call( this, json );

		this.script = json.script;
		this.index = json.index;

	}

};

export { AddScriptCommand };
