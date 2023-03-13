/**
 * @author dforrer / https://github.com/dforrer
 * Developed as part of a project at University of Applied Sciences and Arts Northwestern Switzerland (www.fhnw.ch)
 */

import { Command } from './Command.js';

/**
 * @param editor Editor
 * @param object THREE.Object3D
 * @param attribute javascript object
 * @constructor
 */

var AddAttributeCommand = function ( editor, attribute ) {

	Command.call( this, editor );

	this.type = 'AddAttributeCommand';
	this.name = 'Add Attribute';

	this.attribute = attribute;

};

AddAttributeCommand.prototype = {

	execute: function () {

		this.editor.attributes.push( this.attribute );

		this.editor.signals.attributeAdded.dispatch( this.attribute );

	},

	undo: function () {

		var index = this.editor.attributes.indexOf( this.attribute );

		if ( index !== - 1 ) {

			this.editor.attributes.splice( index, 1 );

		}

		this.editor.signals.attributeRemoved.dispatch( this.attribute );

	},

	toJSON: function () {

		var output = Command.prototype.toJSON.call( this );

		output.attribute = this.attribute;

		return output;

	},

	fromJSON: function ( json ) {

		Command.prototype.fromJSON.call( this, json );

		this.attribute = json.attribute;

	}

};

export { AddAttributeCommand };