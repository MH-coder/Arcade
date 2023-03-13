import { Command } from './Command.js';

import * as THREE from '../libs/three.module.js';

/**
 * @param editor Editor
 * @param object THREE.Object3D
 * @param newPosition THREE.Vector3
 * @param optionalOldPosition THREE.Vector3
 * @constructor
 */
function SetPositionsMultyCommand( editor, group, objectNewPositionArray, positionsToAdd, voxelsToRemove, mytimer ) {

	Command.call( this, editor );

	this.type = 'SetPositionsMultyCommand';
	this.name = 'Set Positions Multy';
	this.updatable = false;

	this.mytimer = mytimer;
	// move start
	this.objectsToMove = [];
	this.oldPositions = [];
	this.newPositions = [];

	for(let i=0;i<objectNewPositionArray.length; i++){
		let object = objectNewPositionArray[i].object;
		let newPosition = objectNewPositionArray[i].newPosition;
		if ( object !== undefined && newPosition !== undefined ) {

			this.objectsToMove.push(object)
			this.oldPositions.push(object.position.clone());
			this.newPositions.push(newPosition.clone());

		}
	}
	//move end

	// add start
	this.voxelsToAdd = [];
	var tempVoxels = positionsToAdd.map( ( {position, voxel} ) => {
		var exists = false;
		if(!exists){

			//var mesh = new THREE.Mesh( new THREE.BoxBufferGeometry( 1, 1, 1, 1, 1, 1 ), new THREE.MeshStandardMaterial() );
			var mat = new THREE.MeshStandardMaterial();
			mat.copy(voxel.material);
			var mesh = new THREE.Mesh( new THREE.BoxBufferGeometry( 1, 1, 1, 1, 1, 1 ), mat );
			mesh.name = 'voxel';
			mesh.userData.isVoxel = true;
			mesh.position.copy( position );

			return mesh;
		}else{
			return null;
		}

	} );
	for(var i=0; i< tempVoxels.length; i++){
		if(tempVoxels[i]){
			this.voxelsToAdd.push(tempVoxels[i])
		}
	}
	// add end

	// remove start
	this.parent = group;
	this.objectsToRemove = voxelsToRemove;
	//remove end
}

SetPositionsMultyCommand.prototype = {

	execute: function () {

this.editor.signals.sceneGraphChanged.active = false;
			//var t1 = performance.now()

		//move start
		for(let i=0;i<this.objectsToMove.length; i++){
			let object = this.objectsToMove[i];
			let newPosition = this.newPositions[i];
			object.position.copy( newPosition );
			object.updateMatrixWorld( true );
			this.editor.signals.objectChanged.dispatch( object );
		}
		//move end
			//var t2 = performance.now();
			//console.log(`move time ${t2 - t1} milliseconds`)
		//add start
		if(this.voxelsToAdd.length>0){
			this.editor.addObjects( this.voxelsToAdd, this.parent );
		}
		//add end
			//var t3 = performance.now();
			//console.log(`addObjects time ${t3 - t2} milliseconds`)

		//remove start
		if(this.objectsToRemove.length>0){
			this.editor.removeObjects( this.objectsToRemove, this.parent );
		}
		//remove end

		//var t4 = performance.now();
		//console.log(`removeObjects time ${t4 - t3} milliseconds`)

		//this.editor.signals.sceneGraphChanged.dispatch();

		//var t5 = performance.now();
		//console.log(`sceneGraphChanged time ${t5 - t4} milliseconds`)

		this.editor.signals.sceneGraphChanged.active = true;

	},

	undo: function () {
		//move start
		for(let i=0;i<this.objectsToMove.length; i++){
			let object = this.objectsToMove[i];
			let oldPosition = this.oldPositions[i];
			object.position.copy( oldPosition );
			object.updateMatrixWorld( true );
			this.editor.signals.objectChanged.dispatch( object );
		}
		//move end

		//add start
		this.editor.removeObjects( this.voxelsToAdd, this.parent );
		//add end

		//remove start
		this.editor.addObjects( this.objectsToRemove, this.parent );
		//remove end

		this.editor.signals.voxelsUnselect.dispatch();
		this.editor.select(null);
	},

	update: function ( command ) {

		//this.newPosition.copy( command.newPosition );

	},

	toJSON: function () {

		var output = Command.prototype.toJSON.call( this );

		output.mytimer = this.mytimer;
		// move start
		output.objectUuids = [];
		output.oldPositions = [];
		output.newPositions = [];
		for(let i=0; i<this.objectsToMove.length; i++){
			output.objectUuids.push(this.objectsToMove[i].uuid);
			output.oldPositions.push(this.oldPositions[i].toArray());
			output.newPositions.push(this.newPositions[i].toArray());
		}
		// move end

		//add start
		output.parent = this.parent.toJSON();
		output.voxelsToAdd = this.voxelsToAdd.map( ( voxel ) => voxel.toJSON() );
		//add end

		//remove start
		output.objectsToRemove = this.objectsToRemove.map( object => object.uuid );
		output.parentUuid = this.parent.uuid;
		//remove end

		return output;

	},

	fromJSON: function ( json ) {
		this.objectsToMove = [];
		this.oldPositions = [];
		this.newPositions = [];
		Command.prototype.fromJSON.call( this, json );
		this.mytimer = output.mytimer;
		for(let i=0; i<json.objectUuids.length; i++){
			this.objectsToMove[i] = this.editor.objectByUuid( json.objectUuids[i] );
			this.oldPositions[i] = new THREE.Vector3().fromArray( json.oldPositions[i] );
			this.newPositions[i] = new THREE.Vector3().fromArray( json.newPositions[i] );
		}

		this.parent = this.editor.objectByUuid( json.parentUuid );

		if ( this.parent === undefined ) {

			this.parent = loader.parse( json.parent );

		}

		var loader = new ObjectLoader();

		this.voxelsToAdd = json.voxelsToAdd.map( ( voxel ) => {

			var voxel = this.editor.objectByUuid( voxel.object.uuid );

			if ( voxel === undefined ) {

				voxel = loader.parse( voxel );

			}

			return voxel;

		} );


		this.objectsToRemove = json.objectsToRemove.map( ( uuid ) => this.editor.objectByUuid( uuid ) );


	}

};

export { SetPositionsMultyCommand };
