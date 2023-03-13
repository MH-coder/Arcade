import { Command } from './Command.js';

/**
 * @param editor Editor
 * @param object TextMesh
 * @param attributeName string
 * @param newValue number, string, boolean or object
 * @constructor
 */
function SetAttributeTextConnectionCommand( editor, object, attribute ) {

	Command.call( this, editor );

	this.type = 'SetAttributeTextConnectionCommand';
	this.name = 'Connect Attribute[' + attribute.name + '] to Text[' + object.uuid + ']';

	this.object = object;
	this.attribute = attribute;
	this.oldValue = ( object !== undefined ) ? object.text : undefined;

}

SetAttributeTextConnectionCommand.prototype = {

	execute: function () {

		this.object.text = this.attribute.value.toString();
		this.object.updateGeometry();
		this.editor.attributeTextMap[ this.attribute.name ] = this.object.uuid;
		this.editor.signals.objectChanged.dispatch( this.object );

	},

	undo: function () {

		this.object.text = this.oldValue.toString();
		this.object.updateGeometry();
		delete this.editor.attributeTextMap[ this.attribute.name ];
		this.editor.signals.objectChanged.dispatch( this.object );

	},

	toJSON: function () {

		var output = Command.prototype.toJSON.call( this );

		output.objectUuid = this.object.uuid;
		output.attribute = this.attribute;
		output.oldValue = this.oldValue;

		return output;

	},

	fromJSON: function ( json ) {

		Command.prototype.fromJSON.call( this, json );

		this.attribute = json.attribute;
		this.oldValue = json.oldValue;
		this.object = this.editor.objectByUuid( json.objectUuid );

	}

};

export { SetAttributeTextConnectionCommand };
