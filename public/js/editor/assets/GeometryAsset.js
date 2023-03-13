import * as THREE from '../libs/three.module.js';

import { ThreeMFLoader } from '../core/loaders/3MFLoader.js';
import { AMFLoader } from '../core/loaders/AMFLoader.js';
import { ColladaLoader } from '../core/loaders/ColladaLoader.js';
import { DRACOLoader } from '../core/loaders/DRACOLoader.js';
import { FBXLoader } from '../core/loaders/FBXLoader.js';
import { GLTFLoader } from '../core/loaders/GLTFLoader.js';
import { KMZLoader } from '../core/loaders/KMZLoader.js';
import { MD2Loader } from '../core/loaders/MD2Loader.js';
import { OBJLoader } from '../core/loaders/OBJLoader.js';
import { PLYLoader } from '../core/loaders/PLYLoader.js';
import { STLLoader } from '../core/loaders/STLLoader.js';
import { SVGLoader } from '../core/loaders/SVGLoader.js';
import { TDSLoader } from '../core/loaders/TDSLoader.js';
import { VTKLoader } from '../core/loaders/VTKLoader.js';
import { VOXLoader, VOXMesh } from '../core/loaders/VOXLoader.js';
import { VRMLLoader } from '../core/loaders/VRMLLoader.js';
import { Rhino3dmLoader } from '../core/loaders/3DMLoader.js';
import * as SkeletonUtils from '../core/utils/SkeletonUtils.js';
import { ObjectLoader } from '../utils/ObjectLoader.js';

import { Asset } from './Asset.js';
import { AddObjectCommand } from '../commands/AddObjectCommand.js';
import { SetSceneCommand } from '../commands/SetSceneCommand.js';

var GeometryAsset = function ( editor, id, geometryId, name, ext, thumbUrl, url ) {

	Asset.call( this, editor, 'Geometry', id, name );

	this.geometryId = geometryId;
	this.ext = ext.toLowerCase();
	this.thumbUrl = thumbUrl;
	this.url = url;

};

GeometryAsset.prototype.load = function ( onLoad ) {

	var scope = this;
	var manager = new THREE.LoadingManager();
	var loaders = {
		'.3dm': new Rhino3dmLoader( manager ),
		'.3ds': new TDSLoader( manager ),
		'.3mf': new ThreeMFLoader( manager ),
		'.amf': new AMFLoader( manager ),
		'.dae': new ColladaLoader( manager ),
		'.drc': new DRACOLoader( manager ),
		'.fbx': new FBXLoader( manager ),
		'.glb': new GLTFLoader( manager ),
		'.gltf': new GLTFLoader( manager ),
		'.json': new ObjectLoader( scope.editor.assets, manager ),
		'.kmz': new KMZLoader( manager ),
		'.md2': new MD2Loader( manager ),
		'.obj': new OBJLoader( manager ),
		'.ply': new PLYLoader( manager ),
		'.stl': new STLLoader( manager ),
		'.svg': new SVGLoader( manager ),
		'.vtk': new VTKLoader( manager ),
		'.vox': new VOXLoader( manager ),
		'.wrl': new VRMLLoader( manager ),
		'.zip': new GLTFLoader( manager ),
	};

	var loader = loaders[ scope.ext ];

	if ( scope.ext == '.3dm' ) loader.setLibraryPath( '../../core/libs/rhino3dm/' );

	if ( scope.ext == '.drc' ) loader.setDecoderPath( '../../core/libs/draco/' );

	if ( scope.ext == '.glb' || scope.ext == '.gltf' ) {

		var dracoLoader = new DRACOLoader();
		dracoLoader.setDecoderPath( '../../core/libs/draco/gltf/' );
		loader.setDRACOLoader( dracoLoader );

	}

	if ( scope.ext == '.zip' ) {
		loader.loadZip( scope.url, function ( obj ) {
			 editor.loader.loadGeometryFileZip( obj, manager ).then( function ( result ) {
				if (!scope.object)
					scope['object'] = null;
				scope.object = result.object;
				onLoad();
			} );
	
			
			});
	} else {
		loader.load( scope.url, function ( obj ) {



			if ( scope.ext == '.dae' || scope.ext == '.glb' || scope.ext == '.gltf' ) {
	
				scope.object = obj.scene;
				scope.object.animations.push( ...obj.animations );
	
			} else if ( scope.ext == '.drc' ) {
	
				var material = new THREE.MeshStandardMaterial();
	
				scope.object = new THREE.Mesh( obj, material );
	
			} else if ( scope.ext == '.fbx' ) {
	
				scope.object = obj;
	
			} else if ( scope.ext == '.svg' ) {
	
				var paths = obj.paths;
				var group = new THREE.Group();
	
				group.scale.multiplyScalar( 0.1 );
				group.scale.y *= - 1;
	
				for ( var i = 0; i < paths.length; i ++ ) {
	
					var path = paths[ i ];
	
					var material = new THREE.MeshBasicMaterial( {
						color: path.color,
						side: THREE.DoubleSide,
						depthWrite: false
					} );
	
					var shapes = path.toShapes( true );
	
					for ( var j = 0; j < shapes.length; j ++ ) {
	
						var shape = shapes[ j ];
	
						var geometry = new THREE.ShapeBufferGeometry( shape );
						var mesh = new THREE.Mesh( geometry, material );
	
						group.add( mesh );
	
					}
	
				}
	
				scope.object = group;
	
			} else if ( scope.ext == '.kmz' ) {
	
				scope.object = obj.scene;
	
			} else if ( scope.ext == '.md2' ) {
	
				var material = new THREE.MeshStandardMaterial( {
					morphTargets: true,
					morphNormals: true
				} );
	
				scope.object = new THREE.Mesh( obj, material );
				scope.object.mixer = new THREE.AnimationMixer( scope.object );
				scope.object.animations.push( ...obj.animations );
	
			} else if ( scope.ext == '.ply' ) {
	
				var material = new THREE.MeshStandardMaterial();
	
				scope.object = new THREE.Mesh( obj, material );
	
			} else if ( scope.ext == '.stl' ) {
	
				obj.sourceType = "stl";
				obj.sourceFile = scope.name;
	
				var material = new THREE.MeshStandardMaterial();
	
				scope.object = new THREE.Mesh( obj, material );
	
			} else if ( scope.ext == '.vtk' ) {
	
				obj.sourceType = "vtk";
				obj.sourceFile = scope.name;
	
				var material = new THREE.MeshStandardMaterial();
	
				scope.object = new THREE.Mesh( obj, material );
	
			} else if ( scope.ext == '.vox' ) {
	
				scope.object = new THREE.Group();
	
				for ( let i = 0; i < obj.length; i ++ ) {
	
					const chunk = obj[ i ];
	
					const mesh = new VOXMesh( chunk );
					scope.object.add( mesh );
	
				}
	
			} else {
	
				scope.object = obj;
	
			}
	
			scope.object.name = scope.name;
	
			onLoad();
	
		} );
	}


};

GeometryAsset.prototype.render = function () {

	var scope = this;

	var renderToScene = function () {

		if ( scope.object.isScene ) {

			scope.editor.execute( new SetSceneCommand( scope.editor, scope.object ) );

		} else {

			var newObject = scope.object.animations ? SkeletonUtils.clone( scope.object ) : scope.object.clone();
			newObject.animations.push( ...scope.object.animations );

			newObject.traverse( ( node ) => {

				if ( node.isMesh ) {

					if ( Array.isArray( node.material ) ) {

						var materials = node.material;
						var newMaterials = [];

						for ( var i = 0; i < materials.length; i ++ ) {

							newMaterials.push( materials[ i ].clone() );

						}

						node.material = newMaterials;

					} else {

						node.material = node.material.clone();

					}

				}

			} );

			scope.editor.execute( new AddObjectCommand( scope.editor, newObject ) );

		}
		
	}

	if ( scope.object ) {

		renderToScene();

	} else {

		scope.editor.signals.geometryAssetDownloading.dispatch( scope.id, true );
		scope.load( function () {

			scope.editor.signals.geometryAssetDownloading.dispatch( scope.id, false );
			renderToScene();
			
		} );
		
	}

};

export { GeometryAsset };
