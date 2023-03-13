/**
 * @author dforrer / https://github.com/dforrer
 * Developed as part of a project at University of Applied Sciences and Arts Northwestern Switzerland (www.fhnw.ch)
 */

import { Command } from './Command.js';

/**
 * @param editor Editor
 * @param object THREE.Object3D
 * @param attribute javaattribute object
 * @constructor
 */

var RemoveAttributeCommand = function ( editor, attribute ) {

	Command.call( this, editor );

	this.type = 'RemoveAttributeCommand';
	this.name = 'Remove Attribute';

	this.attribute = attribute;
	if ( this.attribute ) {

		this.index = this.editor.attributes.indexOf( this.attribute );

	}

};

RemoveAttributeCommand.prototype = {

	execute: function () {

		if ( this.index !== - 1 ) {

			this.editor.attributes.splice( this.index, 1 );

		}

		this.editor.signals.attributeRemoved.dispatch( this.attribute );

	},

	undo: function () {

		this.editor.attributes.splice( this.index, 0, this.attribute );

		this.editor.signals.attributeAdded.dispatch( this.attribute );

	},

	toJSON: function () {

		var output = Command.prototype.toJSON.call( this );

		output.attribute = this.attribute;
		output.index = this.index;

		return output;

	},

	fromJSON: function ( json ) {

		Command.prototype.fromJSON.call( this, json );

		this.attribute = json.attribute;
		this.index = json.index;

	}

};

export { RemoveAttributeCommand };
