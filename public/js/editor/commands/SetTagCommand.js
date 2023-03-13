/**
 * @author dforrer / https://github.com/dforrer
 * Developed as part of a project at University of Applied Sciences and Arts Northwestern Switzerland (www.fhnw.ch)
 */

import { Command } from './Command.js';

/**
 * @param editor Editor
 * @param object THREE.Object3D
 * @param attribute javaattribute object
 * @param attributeName string
 * @param newValue string, object
 * @constructor
 */

var SetTagCommand = function ( editor, object, tag, set ) {

	Command.call( this, editor );

	this.type = 'SetTagCommand';
	this.name = 'Set Tag.' + tag;

	this.object = object;
	this.tag = tag;
	this.set = set;

};

SetTagCommand.prototype = {

	execute: function () {

		if ( this.set == true ) {
		
			editor.tags[ this.tag ].push( this.object.uuid );

		} else {

			var index = editor.tags[ this.tag ].indexOf( this.object.uuid );
			editor.tags[ this.tag ].splice( index, 1 );

		}

		this.editor.signals.tagSet.dispatch();

	},

	undo: function () {
		
		if ( this.set == true ) {

			var index = editor.tags[ this.tag ].indexOf( this.object.uuid );

			editor.tags[ this.tag ].splice( index, 1 );

		} else {
			
			editor.tags[ this.tag ].push( this.object.uuid );

		}

		this.editor.signals.tagSet.dispatch();

	},

	toJSON: function () {

		var output = Command.prototype.toJSON.call( this );

		output.objectUuid = this.object.uuid;
		output.tag = this.tag;

		return output;

	},

	fromJSON: function ( json ) {

		Command.prototype.fromJSON.call( this, json );

		this.tag = json.tag;
		this.object = this.editor.objectByUuid( json.objectUuid );

	}

};

export { SetTagCommand };
