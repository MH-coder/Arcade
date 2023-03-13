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

var SetAttributeValueCommand = function ( editor, attribute, attributeName, newValue ) {

	Command.call( this, editor );

	this.type = 'SetAttributeValueCommand';
	this.name = 'Set Attribute.' + attributeName;
	this.updatable = true;

	this.attribute = attribute;
	this.attributeName = attributeName;
	this.oldValue = ( attribute !== undefined ) ? attribute[ this.attributeName ] : undefined;
	this.newValue = newValue;

};

SetAttributeValueCommand.prototype = {

	execute: function () {

		this.attribute[ this.attributeName ] = this.newValue;

		this.editor.signals.attributeChanged.dispatch( this.attribute );

	},

	undo: function () {

		this.attribute[ this.attributeName ] = this.oldValue;

		this.editor.signals.attributeChanged.dispatch( this.attribute );

	},

	update: function ( cmd ) {

		this.newValue = cmd.newValue;

	},

	toJSON: function () {

		var output = Command.prototype.toJSON.call( this );

		output.index = this.object.attributes.indexOf( this.attribute );
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
		this.attribute = this.object.attributes[ json.index ];

	}

};

export { SetAttributeValueCommand };
