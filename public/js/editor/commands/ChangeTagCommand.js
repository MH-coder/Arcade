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

var ChangeTagCommand = function ( editor, oldTag, newTag ) {

	Command.call( this, editor );

	this.type = 'ChangeTagCommand';
	this.name = 'Change Tag';

	this.oldTag = oldTag;
	this.newTag = newTag;

};

ChangeTagCommand.prototype = {

	execute: function () {

		if ( this.editor.tags[ this.oldTag ] === undefined ) {

			this.editor.tags[ this.oldTag ] = [];

		}

		this.editor.tags[ this.newTag ] = this.editor.tags[ this.oldTag ];

		delete this.editor.tags[ this.oldTag ];

		this.editor.signals.tagChanged.dispatch( this.newTag );

	},

	undo: function () {

		this.editor.tags[ this.oldTag ] = this.editor.tags[ this.newTag ];

		delete this.editor.tags[ this.newTag ];

		this.editor.signals.tagChanged.dispatch( this.oldTag );

	},

	toJSON: function () {

		var output = Command.prototype.toJSON.call( this );

		output.oldTag = this.oldTag;
		output.newTag = this.newTag;

		return output;

	},

	fromJSON: function ( json ) {

		Command.prototype.fromJSON.call( this, json );

		this.oldTag = json.oldTag;
		this.newTag = json.newTag;

	}

};

export { ChangeTagCommand };