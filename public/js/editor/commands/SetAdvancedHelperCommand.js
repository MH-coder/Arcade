import { Command } from './Command.js';

/**
 * @param editor Editor
 * @param object THREE.Object3D
 * @param attribute javaattribute object
 * @param attributeName string
 * @param newValue string, object
 * @constructor
 */

var SetAdvancedHelperCommand = function ( editor, object, value ) {

	Command.call( this, editor );

	this.type = 'SetAdvancedHelperCommand';
	this.name = 'Set AdvancedHelper';

	this.object = object;
	this.value = value;
	this.prevValue = object.userData.advancedHelper;

};

SetAdvancedHelperCommand.prototype = {

	execute: function () {

		this.object.userData.advancedHelper = this.value;
		if(this.object.advancedHelperObject){
			this.object.advancedHelperObject.visible = this.value;
		}

		/*if(!this.visible && this.editor.selected === this.object){
			this.editor.select(null);
		}else if (this.visible){
			this.editor.select(this.object);
		}*/
		this.editor.signals.sceneGraphChanged.dispatch();
	},

	undo: function () {

		this.object.userData.advancedHelper = this.prevValue;
		if(this.object.advancedHelperObject){
			this.object.advancedHelperObject.visible = this.prevValue;
		}
		this.editor.signals.sceneGraphChanged.dispatch();
	},

	toJSON: function () {

		var output = Command.prototype.toJSON.call( this );

		output.objectUuid = this.object.uuid;
		output.value = this.value;
		output.prevValue = this.prevValue;

		return output;

	},

	fromJSON: function ( json ) {

		Command.prototype.fromJSON.call( this, json );

		this.value = json.value;
		this.prevValue = json.prevValue;
		this.object = this.editor.objectByUuid( json.objectUuid );

	}

};

export { SetAdvancedHelperCommand };
