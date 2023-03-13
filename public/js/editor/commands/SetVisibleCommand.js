import { Command } from './Command.js';

/**
 * @param editor Editor
 * @param object THREE.Object3D
 * @param attribute javaattribute object
 * @param attributeName string
 * @param newValue string, object
 * @constructor
 */

var SetVisibleCommand = function ( editor, object, visible ) {

	Command.call( this, editor );

	this.type = 'SetVisibleCommand';
	this.name = 'Set Visible';

	this.object = object;
	this.visible = visible;
	this.prevVisible = object.visible;

};

SetVisibleCommand.prototype = {

	execute: function () {

		this.object.visible = this.visible;
		if( this.object.type == "Group" && this.object.children.length>0 && this.object.children[0].userData && this.object.children[0].userData.isVoxel){
			for(let i=0; i<this.object.children.length; i++){
				this.object.children[i].visible = this.visible;
				if(!this.visible && this.editor.selected === this.object.children[i]){
					this.editor.select(null);
				}

			}
		}
		/*if(!this.visible && this.editor.selected === this.object){
			this.editor.select(null);
		}else if (this.visible){
			this.editor.select(this.object);
		}*/
		this.editor.select(this.object, true);
		this.editor.signals.sceneGraphChanged.dispatch();
	},

	undo: function () {

		this.object.visible = this.prevVisible;
		if( this.object.type == "Group" && this.object.children.length>0 && this.object.children[0].userData && this.object.children[0].userData.isVoxel){
			for(let i=0; i<this.object.children.length; i++){
				this.object.children[i].visible = this.prevVisible;
			}
		}
		this.editor.select(null);
		this.editor.signals.sceneGraphChanged.dispatch();
	},

	toJSON: function () {

		var output = Command.prototype.toJSON.call( this );

		output.objectUuid = this.object.uuid;
		output.visible = this.visible;
		output.prevVisible = this.prevVisible;

		return output;

	},

	fromJSON: function ( json ) {

		Command.prototype.fromJSON.call( this, json );

		this.visible = json.visible;
		this.prevVisible = json.prevVisible;
		this.object = this.editor.objectByUuid( json.objectUuid );

	}

};

export { SetVisibleCommand };
