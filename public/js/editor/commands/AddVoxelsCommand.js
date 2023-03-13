/**
 * @author codelegend620
 */

import { Command } from './Command.js';

import { ObjectLoader } from '../utils/ObjectLoader.js';
import * as THREE from '../libs/three.module.js';

/**
 * @param editor Editor
 * @param group THREE.Object3D
 * @constructor
 */
var AddVoxelsCommand = function ( editor, parent, positions ) {

		Command.call( this, editor );

		this.type = 'AddVoxelsCommand';

		this.parent = parent;
		this.name = 'Add Voxels: ' + parent.name;
		this.voxels = [];

		var tempVoxels = positions.map( ( {position, voxel} ) => {
			var exists = false;
			for ( var child of parent.children ) {
				if ( child.position.equals( position )) {
					exists = true;
					break;
				}
			}
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
				this.voxels.push(tempVoxels[i])
			}
		}
};

AddVoxelsCommand.prototype = {

	execute: function () {

		this.editor.addObjects( this.voxels, this.parent );

	},

	undo: function () {

		this.editor.removeObjects( this.voxels, this.parent );

	},

	toJSON: function () {

		var output = Command.prototype.toJSON.call( this );
		output.parent = this.parent.toJSON();
		output.voxels = this.voxels.map( ( voxel ) => voxel.toJSON() );

		return output;

	},

	fromJSON: function ( json ) {

		Command.prototype.fromJSON.call( this, json );

		this.parent = this.editor.objectByUuid( json.parent.object.uuid );

		if ( this.parent === undefined ) {

			this.parent = loader.parse( json.parent );

		}

		var loader = new ObjectLoader();

		this.voxels = json.voxels.map( ( voxel ) => {

			var voxel = this.editor.objectByUuid( voxel.object.uuid );

			if ( voxel === undefined ) {

				voxel = loader.parse( voxel );

			}

			return voxel;

		} );

	}

};

export { AddVoxelsCommand };
