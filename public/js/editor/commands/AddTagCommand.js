/**
 * @author dforrer / https://github.com/dforrer
 * Developed as part of a project at University of Applied Sciences and Arts Northwestern Switzerland (www.fhnw.ch)
 */

import { Command } from './Command.js';

/**
 * @param editor Editor
 * @param object THREE.Object3D
 * @param tag javascript object
 * @constructor
 */

var AddTagCommand = function ( editor, tag ) {

	Command.call( this, editor );

	this.type = 'AddTagCommand';
	this.name = 'Add Tag';

	this.tag = tag;

};

AddTagCommand.prototype = {

	execute: function () {

		if ( this.editor.tags[ this.tag ] === undefined ) {

			this.editor.tags[ this.tag ] = [];

		}

		this.editor.signals.tagAdded.dispatch( this.tag );

	},

	undo: function () {

		if ( this.editor.tags[ this.tag ] === undefined ) return;

		delete this.editor.tags[ this.tag ];

		this.editor.signals.tagRemoved.dispatch( this.tag );

	},

	toJSON: function () {

		var output = Command.prototype.toJSON.call( this );

		output.tag = this.tag;

		return output;

	},

	fromJSON: function ( json ) {

		Command.prototype.fromJSON.call( this, json );

		this.tag = json.tag;

	}

};

export { AddTagCommand };