import { Command } from './Command.js';

/**
 * @param editor Editor
 * @param script javascript object
 * @constructor
 */
function RemoveScriptCommand( editor, index ) {

	Command.call( this, editor );

	this.type = 'RemoveScriptCommand';
	this.name = 'Remove Script';

	this.index = index;
	if ( this.index ) {

		this.script = this.editor.scripts[this.index];

	}

}

RemoveScriptCommand.prototype = {

	execute: function () {

		if ( this.index !== - 1 ) {

			this.editor.scripts.splice( this.index, 1 );

		}

		this.editor.signals.scriptRemoved.dispatch( this.script );

	},

	undo: function () {

		this.editor.scripts.splice( this.index, 0, this.script );

		this.editor.signals.scriptAdded.dispatch( this.script );

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

export { RemoveScriptCommand };
