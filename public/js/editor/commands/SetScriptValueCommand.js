import { Command } from './Command.js';

/**
 * @param editor Editor
 * @param script javascript object
 * @param attributeName string
 * @param newValue string, object
 * @constructor
 */
function SetScriptValueCommand( editor, index, attributeName, newValue ) {

	Command.call( this, editor );

	this.type = 'SetScriptValueCommand';
	this.name = 'Set Script.' + attributeName;
	this.updatable = true;

	this.index = index;

	this.attributeName = attributeName;
	this.oldValue = editor.scripts[ this.index ];
	this.newValue = newValue;

}

SetScriptValueCommand.prototype = {

	execute: function () {

		editor.scripts[ this.index ][ this.attributeName ] = this.newValue;

		this.editor.signals.scriptChanged.dispatch();

	},

	undo: function () {

		editor.scripts[ this.index ][ this.attributeName ] = this.oldValue;

		this.editor.signals.scriptChanged.dispatch();

	},

	update: function ( cmd ) {

		this.newValue = cmd.newValue;

	},

	toJSON: function () {

		var output = Command.prototype.toJSON.call( this );

		output.index = this.index;
		output.attributeName = this.attributeName;
		output.oldValue = this.oldValue;
		output.newValue = this.newValue;

		return output;

	},

	fromJSON: function ( json ) {

		Command.prototype.fromJSON.call( this, json );

		this.oldValue = json.oldValue;
		this.newValue = json.newValue;
		this.attributeName = json.attributeName;
		this.index = json.index;

	}

};

export { SetScriptValueCommand };
