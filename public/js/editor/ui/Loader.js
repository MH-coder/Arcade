import * as THREE from '../libs/three.module.js';

import { Rhino3dmLoader } from '../core/loaders/3DMLoader.js';
import { ThreeMFLoader } from '../core/loaders/3MFLoader.js';
import { AMFLoader } from '../core/loaders/AMFLoader.js';
import { ColladaLoader } from '../core/loaders/ColladaLoader.js';
import { DRACOLoader } from '../core/loaders/DRACOLoader.js';
import { FBXLoader } from '../core/loaders/FBXLoader.js';
import { GLTFLoader } from '../core/loaders/GLTFLoader.js';
import { KMZLoader } from '../core/loaders/KMZLoader.js';
import { MD2Loader } from '../core/loaders/MD2Loader.js';
import { MTLLoader } from '../core/loaders/MTLLoader.js';
import { OBJLoader } from '../core/loaders/OBJLoader.js';
import { PLYLoader } from '../core/loaders/PLYLoader.js';
import { STLLoader } from '../core/loaders/STLLoader.js';
import { SVGLoader } from '../core/loaders/SVGLoader.js';
import { TDSLoader } from '../core/loaders/TDSLoader.js';
import { VTKLoader } from '../core/loaders/VTKLoader.js';
import { VRMLLoader } from '../core/loaders/VRMLLoader.js';
import { XYZLoader } from '../core/loaders/XYZLoader.js';
import { LottieLoader } from '../core/loaders/LottieLoader.js';
import { VOXLoader, VOXMesh } from '../core/loaders/VOXLoader.js';

import { TGALoader } from '../core/loaders/TGALoader.js';

import { ObjectLoader } from '../utils/ObjectLoader.js';
import { AddObjectCommand } from '../commands/AddObjectCommand.js';
import { SetSceneCommand } from '../commands/SetSceneCommand.js';

import { LoaderUtils } from './LoaderUtils.js';

import { JSZip } from '../core/libs/jszip.module.min.js';
import { RGBELoader } from '../core/loaders/RGBELoader.js';

import { FontLoader } from '../core/loaders/FontLoader.js';

function Loader( editor ) {

	var scope = this;

	this.texturePath = '';

	this.loadItemList = function ( items ) {

		LoaderUtils.getFilesFromItemList( items, function ( files, filesMap ) {

			scope.loadFiles( files, filesMap );

		} );

	};

	this.loadFiles = function ( files, filesMap, type ) {

		var promises = [];

		if ( files.length > 0 ) {

			var filesMap = filesMap || LoaderUtils.createFilesMap( files );

			var manager = new THREE.LoadingManager();
			manager.setURLModifier( function ( url ) {

				var file = filesMap[ url ];

				if ( file ) {

					return URL.createObjectURL( file );

				}

				return url;

			} );

			manager.addHandler( /\.tga$/i, new TGALoader() );

			for ( var i = 0; i < files.length; i ++ ) {

				promises.push( scope[ 'load' + type + 'File' ]( files[ i ], manager ) );

			}

		}

		return promises;

	};

	this.loadAudioFile = function ( file, manager ) {

		return new Promise( ( resolve, reject ) => {

			var audioLoader = new THREE.AudioLoader();

			audioLoader.load( URL.createObjectURL( file ), function ( buffer ) {

				resolve( { filename: file.name, buffer: buffer } );

			} );

		} );

	};

	this.loadFontFile = function ( file, manager ) {

		return new Promise( ( resolve, reject ) => {

			var fontLoader = new FontLoader();

			fontLoader.load( URL.createObjectURL( file ), function ( font ) {

				resolve( { filename: file.name, font: font } );

			} );

		} );

	};

	this.loadImageFile = function ( file, manager ) {

		var reader = new FileReader();
		reader.addEventListener( 'progress', function ( event ) {

			var size = '(' + Math.floor( event.total / 1000 ).format() + ' KB)';
			var progress = Math.floor( ( event.loaded / event.total ) * 100 ) + '%';

		} );

		const extension = file.name.split( '.' ).pop().toLowerCase();
		
		if ( extension === 'hdr' ) {

			return new Promise( ( resolve, reject ) => {

				reader.addEventListener( 'load', function ( event ) {

				const loader = new RGBELoader().setDataType( THREE.UnsignedByteType );
				loader.load ( event.target.result, function ( hdrTexture ) {

					hdrTexture.scourceFile = file.name;
					hdrTexture.isHDRTexture = true;

					resolve( { filename: file.name, texture: hdrTexture } );

				} );


				}, false );

				reader.readAsDataURL( file );

			} );
		}

		if ( file.type === 'image/targa' ) {

			return new Promise( ( resolve, reject ) => {

				reader.addEventListener( 'load', function ( event ) {

					var canvas = new TGALoader().parse( event.target.result );

					var texture = new THREE.CanvasTexture( canvas );
					texture.sourceFile = file.name;

					resolve( { filename: file.name, texture } );

				}, false );

				reader.readAsArrayBuffer( file );

			} );

		} else {

			return new Promise( ( resolve, reject ) => {

				reader.addEventListener( 'load', function ( event ) {

					var image = document.createElement( 'img' );
					image.src = event.target.result;

					image.addEventListener( 'load', function ( event ) {

						var texture = new THREE.Texture( this );
						texture.sourceFile = file.name;
						texture.format = file.type === 'image/jpeg' ? THREE.RGBFormat : THREE.RGBAFormat;
						texture.needsUpdate = true;

						resolve( { filename: file.name, texture } );

					}, false );

				}, false );

				reader.readAsDataURL( file );

			} );

		}

	};

	this.loadGeometryFile = function ( file, manager ) {

		var filename = file.name;
		var extension = filename.split( '.' ).pop().toLowerCase();

		var reader = new FileReader();
		reader.addEventListener( 'progress', function ( event ) {

			var size = '(' + Math.floor( event.total / 1000 ).format() + ' KB)';
			var progress = Math.floor( ( event.loaded / event.total ) * 100 ) + '%';

		} );

		switch ( extension ) {

			case '3dm':

				return new Promise( ( resolve, reject ) => {

					reader.addEventListener( 'load', function ( event ) {

						var contents = event.target.result;

						var loader = new Rhino3dmLoader();
						loader.setLibraryPath( '.../core/libs/rhino3dm/' );
						loader.parse( contents, function ( object ) {

							editor.execute( new AddObjectCommand( editor, object ) );
							resolve( { filename, object } );

						} );

					}, false );
					reader.readAsArrayBuffer( file );

				} );

				break;

			case '3ds':

				return new Promise( ( resolve, reject ) => {

					reader.addEventListener( 'load', function ( event ) {

						var loader = new TDSLoader();
						var object = loader.parse( event.target.result );

						editor.execute( new AddObjectCommand( editor, object ) );
						resolve( { filename, object } );

					}, false );
					reader.readAsArrayBuffer( file );

				} );

			case '3mf':

				return new Promise( ( resolve, reject ) => {

					reader.addEventListener( 'load', function ( event ) {

						var loader = new ThreeMFLoader();
						var object = loader.parse( event.target.result );

						editor.execute( new AddObjectCommand( editor, object ) );
						resolve( { filename, object } );

					}, false );
					reader.readAsArrayBuffer( file );

				} );

			case 'amf':

				return new Promise( ( resolve, reject ) => {

					reader.addEventListener( 'load', function ( event ) {

						var loader = new AMFLoader();
						var amfobject = loader.parse( event.target.result );

						editor.execute( new AddObjectCommand( editor, amfobject ) );
						resolve( { filename, object: amfobject } );

					}, false );
					reader.readAsArrayBuffer( file );

				} );

			case 'dae':

				return new Promise( ( resolve, reject ) => {

					reader.addEventListener( 'load', function ( event ) {

						var contents = event.target.result;

						var loader = new ColladaLoader( manager );
						var collada = loader.parse( contents );

						collada.scene.name = filename;

						collada.scene.animations.push( ...collada.animations );
						editor.execute( new AddObjectCommand( editor, collada.scene ) );
						resolve( { filename, object: collada.scene } );

					}, false );
					reader.readAsText( file );

				} );

			case 'drc':

				return new Promise( ( resolve, reject ) => {

					reader.addEventListener( 'load', function ( event ) {

						var contents = event.target.result;

						var loader = new DRACOLoader();
						loader.setDecoderPath( '.../core/libs/draco/' );
						loader.decodeDracoFile( contents, function ( geometry ) {

							var object;

							if ( geometry.index !== null ) {

								var material = new THREE.MeshStandardMaterial();

								object = new THREE.Mesh( geometry, material );
								object.name = filename;

							} else {

								var material = new THREE.PointsMaterial( { size: 0.01 } );

								if ( geometry.hasAttribute( 'color' ) === true ) material.vertexColors = true;

								object = new THREE.Points( geometry, material );
								object.name = filename;

							}

							editor.execute( new AddObjectCommand( editor, object ) );
							resolve( { filename, object: object } );

						} );

					}, false );
					reader.readAsArrayBuffer( file );

				} );

			case 'fbx':

				return new Promise( ( resolve, reject ) => {

					reader.addEventListener( 'load', function ( event ) {

						var contents = event.target.result;

						var loader = new FBXLoader( manager );
						var object = loader.parse( contents );

						editor.execute( new AddObjectCommand( editor, object ) );
						resolve( { filename, object } );

					}, false );
					reader.readAsArrayBuffer( file );

				} );

			case 'glb':

				return new Promise( ( resolve, reject ) => {

					reader.addEventListener( 'load', function ( event ) {

						var contents = event.target.result;

						var dracoLoader = new DRACOLoader();
						dracoLoader.setDecoderPath( '.../core/libs/draco/gltf/' );

						var loader = new GLTFLoader();
						loader.setDRACOLoader( dracoLoader );
						loader.parse( contents, '', function ( result ) {

							var scene = result.scene;
							scene.name = filename;

							scene.animations.push( ...result.animations );
							editor.execute( new AddObjectCommand( editor, scene ) );
							resolve( { filename, object: scene } );

						} );

					}, false );
					reader.readAsArrayBuffer( file );

				} );

			case 'gltf':

				return new Promise( ( resolve, reject ) => {

					reader.addEventListener( 'load', function ( event ) {

						var contents = event.target.result;

						var loader;

						if ( isGLTF1( contents ) ) {

							alert( 'Import of glTF asset not possible. Only versions >= 2.0 are supported. Please try to upgrade the file to glTF 2.0 using glTF-Pipeline.' );

						} else {

							var dracoLoader = new DRACOLoader();
							dracoLoader.setDecoderPath( '.../core/libs/draco/gltf/' );

							loader = new GLTFLoader( manager );
							loader.setDRACOLoader( dracoLoader );

						}

						loader.parse( contents, '', function ( result ) {

							var scene = result.scene;
							scene.name = filename;

							scene.animations.push( ...result.animations );
							editor.execute( new AddObjectCommand( editor, scene ) );
							resolve( { filename, object: scene } );

						} );

					}, false );
					reader.readAsArrayBuffer( file );

				} );

			case 'js':
			case 'json':

			case '3geo':
			case '3mat':
			case '3obj':
			case '3scn':

				return new Promise( ( resolve, reject ) => {

					reader.addEventListener( 'load', function ( event ) {

						var contents = event.target.result;

						// 2.0

						if ( contents.indexOf( 'postMessage' ) !== - 1 ) {

							var blob = new Blob( [ contents ], { type: 'text/javascript' } );
							var url = URL.createObjectURL( blob );

							var worker = new Worker( url );

							worker.onmessage = function ( event ) {

								event.data.metadata = { version: 2 };
								handleJSON( event.data, filename, resolve, reject );

							};

							worker.postMessage( Date.now() );

							return;

						}

						// >= 3.0

						var data;

						try {

							data = JSON.parse( contents );

						} catch ( error ) {

							alert( error );
							return;

						}

						handleJSON( data, filename, resolve, reject );

					}, false );
					reader.readAsText( file );

				} );

			case 'kmz':

				return new Promise( ( resolve, reject ) => {

					reader.addEventListener( 'load', function ( event ) {

						var loader = new KMZLoader();
						var collada = loader.parse( event.target.result );

						collada.scene.name = filename;

						editor.execute( new AddObjectCommand( editor, collada.scene ) );
						resolve( { filename, object: collada.scene } );

					}, false );
					reader.readAsArrayBuffer( file );

				} );

			case 'md2':

				return new Promise( ( resolve, reject ) => {

					reader.addEventListener( 'load', function ( event ) {

						var contents = event.target.result;

						var geometry = new MD2Loader().parse( contents );
						var material = new THREE.MeshStandardMaterial( {
							morphTargets: true,
							morphNormals: true
						} );

						var mesh = new THREE.Mesh( geometry, material );
						mesh.mixer = new THREE.AnimationMixer( mesh );
						mesh.name = filename;

						mesh.animations.push( ...geometry.animations );
						editor.execute( new AddObjectCommand( editor, mesh ) );
						resolve( { filename, object: mesh } );

					}, false );
					reader.readAsArrayBuffer( file );

				} );

			case 'obj':

				return new Promise( ( resolve, reject ) => {

					reader.addEventListener( 'load', function ( event ) {

						var contents = event.target.result;

						var object = new OBJLoader().parse( contents );
						object.name = filename;

						editor.execute( new AddObjectCommand( editor, object ) );
						resolve( { filename, object } );

					}, false );
					reader.readAsText( file );

				} );

			case 'ply':

				return new Promise( ( resolve, reject ) => {

					reader.addEventListener( 'load', function ( event ) {

						var contents = event.target.result;

						var geometry = new PLYLoader().parse( contents );
						geometry.sourceType = 'ply';
						geometry.sourceFile = file.name;

						var material = new THREE.MeshStandardMaterial();

						var mesh = new THREE.Mesh( geometry, material );
						mesh.name = filename;

						editor.execute( new AddObjectCommand( editor, mesh ) );
						resolve( { filename, object: mesh } );

					}, false );
					reader.readAsArrayBuffer( file );

				} );

			case 'stl':

				return new Promise( ( resolve, reject ) => {

					reader.addEventListener( 'load', function ( event ) {

						var contents = event.target.result;

						var geometry = new STLLoader().parse( contents );
						geometry.sourceType = 'stl';
						geometry.sourceFile = file.name;

						var material = new THREE.MeshStandardMaterial();

						var mesh = new THREE.Mesh( geometry, material );
						mesh.name = filename;

						editor.execute( new AddObjectCommand( editor, mesh ) );
						resolve( { filename, object: mesh } );

					}, false );

					if ( reader.readAsBinaryString !== undefined ) {

						reader.readAsBinaryString( file );

					} else {

						reader.readAsArrayBuffer( file );

					}

				} );

			case 'svg':

				return new Promise( ( resolve, reject ) => {

					reader.addEventListener( 'load', function ( event ) {

						var contents = event.target.result;

						var loader = new SVGLoader();
						var paths = loader.parse( contents ).paths;

						//

						var group = new THREE.Group();
						group.scale.multiplyScalar( 0.1 );
						group.scale.y *= - 1;

						for ( var i = 0; i < paths.length; i ++ ) {

							var path = paths[ i ];

							var material = new THREE.MeshBasicMaterial( {
								color: path.color,
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

						editor.execute( new AddObjectCommand( editor, group ) );
						resolve( { filename, object: group } );

					}, false );
					reader.readAsText( file );

				} );

			case 'vtk':

				return new Promise( ( resolve, reject ) => {

					reader.addEventListener( 'load', function ( event ) {

						var contents = event.target.result;

						var geometry = new VTKLoader().parse( contents );
						geometry.sourceType = 'vtk';
						geometry.sourceFile = file.name;

						var material = new THREE.MeshStandardMaterial();

						var mesh = new THREE.Mesh( geometry, material );
						mesh.name = filename;

						editor.execute( new AddObjectCommand( editor, mesh ) );
						resolve( { filename, object: mesh } );

					}, false );
					reader.readAsArrayBuffer( file );

				} );

			case 'vox':

				return new Promise( ( resolve, reject ) => {

					reader.addEventListener( 'load', function ( event ) {

						var contents = event.target.result;

						var chunks = new VOXLoader().parse( contents );

						var group = new THREE.Group();
						group.name = filename;

						for ( let i = 0; i < chunks.length; i ++ ) {

							const chunk = chunks[ i ];
	
							const mesh = new VOXMesh( chunk );
							group.add( mesh );
	
						}

						editor.execute( new AddObjectCommand( editor, group ) );
						resolve( { filename, object: group } );

					}, false );
					reader.readAsArrayBuffer( file );

				} );

			case 'wrl':

				return new Promise( ( resolve, reject ) => {

					reader.addEventListener( 'load', function ( event ) {

						var contents = event.target.result;

						var result = new VRMLLoader().parse( contents );

						editor.execute( new SetSceneCommand( editor, result ) );
						resolve( { filename, object: result } );

					}, false );
					reader.readAsText( file );

				} );

			case 'xyz':

				return new Promise( ( resolve, reject ) => {

					reader.addEventListener( 'load', function ( event ) {

						var contents = event.target.result;

						var geometry = new XYZLoader().parse( contents );

						var material = new THREE.PointsMaterial();

						if ( geometry.hasAttribute( 'color' ) === true ) material.vertexColors = true;

						var points = new THREE.Points( geometry, material );
						points.name = filename;

						editor.execute( new AddObjectCommand( editor, points ) );
						resolve( { filename, object: points } );

					}, false );
					reader.readAsText( file );

				} );

			case 'zip':

				return new Promise( ( resolve, reject ) => {

					reader.addEventListener( 'load', function ( event ) {

						handleZIP(filename, event.target.result, true, resolve, reject );

					}, false );
					reader.readAsBinaryString( file );

				} );

			default:

				console.error( 'Unsupported file format (' + extension + ').' );

				break;

		}

	};

	this.loadGeometryFileZip = function ( file, manager ) {

		var filename = file.name;
		var extension = 'zip';

		var reader = new FileReader();
		reader.addEventListener( 'progress', function ( event ) {

			var size = '(' + Math.floor( event.total / 1000 ).format() + ' KB)';
			var progress = Math.floor( ( event.loaded / event.total ) * 100 ) + '%';

		} );

		switch ( extension ) {

			case '3dm':

				return new Promise( ( resolve, reject ) => {

					reader.addEventListener( 'load', function ( event ) {

						var contents = event.target.result;

						var loader = new Rhino3dmLoader();
						loader.setLibraryPath( '.../core/libs/rhino3dm/' );
						loader.parse( contents, function ( object ) {

							editor.execute( new AddObjectCommand( editor, object ) );
							resolve( { filename, object } );

						} );

					}, false );
					reader.readAsArrayBuffer( file );

				} );

				break;

			case '3ds':

				return new Promise( ( resolve, reject ) => {

					reader.addEventListener( 'load', function ( event ) {

						var loader = new TDSLoader();
						var object = loader.parse( event.target.result );

						editor.execute( new AddObjectCommand( editor, object ) );
						resolve( { filename, object } );

					}, false );
					reader.readAsArrayBuffer( file );

				} );

			case '3mf':

				return new Promise( ( resolve, reject ) => {

					reader.addEventListener( 'load', function ( event ) {

						var loader = new ThreeMFLoader();
						var object = loader.parse( event.target.result );

						editor.execute( new AddObjectCommand( editor, object ) );
						resolve( { filename, object } );

					}, false );
					reader.readAsArrayBuffer( file );

				} );

			case 'amf':

				return new Promise( ( resolve, reject ) => {

					reader.addEventListener( 'load', function ( event ) {

						var loader = new AMFLoader();
						var amfobject = loader.parse( event.target.result );

						editor.execute( new AddObjectCommand( editor, amfobject ) );
						resolve( { filename, object: amfobject } );

					}, false );
					reader.readAsArrayBuffer( file );

				} );

			case 'dae':

				return new Promise( ( resolve, reject ) => {

					reader.addEventListener( 'load', function ( event ) {

						var contents = event.target.result;

						var loader = new ColladaLoader( manager );
						var collada = loader.parse( contents );

						collada.scene.name = filename;

						collada.scene.animations.push( ...collada.animations );
						editor.execute( new AddObjectCommand( editor, collada.scene ) );
						resolve( { filename, object: collada.scene } );

					}, false );
					reader.readAsText( file );

				} );

			case 'drc':

				return new Promise( ( resolve, reject ) => {

					reader.addEventListener( 'load', function ( event ) {

						var contents = event.target.result;

						var loader = new DRACOLoader();
						loader.setDecoderPath( '.../core/libs/draco/' );
						loader.decodeDracoFile( contents, function ( geometry ) {

							var object;

							if ( geometry.index !== null ) {

								var material = new THREE.MeshStandardMaterial();

								object = new THREE.Mesh( geometry, material );
								object.name = filename;

							} else {

								var material = new THREE.PointsMaterial( { size: 0.01 } );

								if ( geometry.hasAttribute( 'color' ) === true ) material.vertexColors = true;

								object = new THREE.Points( geometry, material );
								object.name = filename;

							}

							editor.execute( new AddObjectCommand( editor, object ) );
							resolve( { filename, object: object } );

						} );

					}, false );
					reader.readAsArrayBuffer( file );

				} );

			case 'fbx':

				return new Promise( ( resolve, reject ) => {

					reader.addEventListener( 'load', function ( event ) {

						var contents = event.target.result;

						var loader = new FBXLoader( manager );
						var object = loader.parse( contents );

						editor.execute( new AddObjectCommand( editor, object ) );
						resolve( { filename, object } );

					}, false );
					reader.readAsArrayBuffer( file );

				} );

			case 'glb':

				return new Promise( ( resolve, reject ) => {

					reader.addEventListener( 'load', function ( event ) {

						var contents = event.target.result;

						var dracoLoader = new DRACOLoader();
						dracoLoader.setDecoderPath( '.../core/libs/draco/gltf/' );

						var loader = new GLTFLoader();
						loader.setDRACOLoader( dracoLoader );
						loader.parse( contents, '', function ( result ) {

							var scene = result.scene;
							scene.name = filename;

							scene.animations.push( ...result.animations );
							editor.execute( new AddObjectCommand( editor, scene ) );
							resolve( { filename, object: scene } );

						} );

					}, false );
					reader.readAsArrayBuffer( file );

				} );

			case 'gltf':

				return new Promise( ( resolve, reject ) => {

					reader.addEventListener( 'load', function ( event ) {

						var contents = event.target.result;

						var loader;

						if ( isGLTF1( contents ) ) {

							alert( 'Import of glTF asset not possible. Only versions >= 2.0 are supported. Please try to upgrade the file to glTF 2.0 using glTF-Pipeline.' );

						} else {

							var dracoLoader = new DRACOLoader();
							dracoLoader.setDecoderPath( '.../core/libs/draco/gltf/' );

							loader = new GLTFLoader( manager );
							loader.setDRACOLoader( dracoLoader );

						}

						loader.parse( contents, '', function ( result ) {

							var scene = result.scene;
							scene.name = filename;

							scene.animations.push( ...result.animations );
							editor.execute( new AddObjectCommand( editor, scene ) );
							resolve( { filename, object: scene } );

						} );

					}, false );
					reader.readAsArrayBuffer( file );

				} );

			case 'js':
			case 'json':

			case '3geo':
			case '3mat':
			case '3obj':
			case '3scn':

				return new Promise( ( resolve, reject ) => {

					reader.addEventListener( 'load', function ( event ) {

						var contents = event.target.result;

						// 2.0

						if ( contents.indexOf( 'postMessage' ) !== - 1 ) {

							var blob = new Blob( [ contents ], { type: 'text/javascript' } );
							var url = URL.createObjectURL( blob );

							var worker = new Worker( url );

							worker.onmessage = function ( event ) {

								event.data.metadata = { version: 2 };
								handleJSON( event.data, filename, resolve, reject );

							};

							worker.postMessage( Date.now() );

							return;

						}

						// >= 3.0

						var data;

						try {

							data = JSON.parse( contents );

						} catch ( error ) {

							alert( error );
							return;

						}

						handleJSON( data, filename, resolve, reject );

					}, false );
					reader.readAsText( file );

				} );

			case 'kmz':

				return new Promise( ( resolve, reject ) => {

					reader.addEventListener( 'load', function ( event ) {

						var loader = new KMZLoader();
						var collada = loader.parse( event.target.result );

						collada.scene.name = filename;

						editor.execute( new AddObjectCommand( editor, collada.scene ) );
						resolve( { filename, object: collada.scene } );

					}, false );
					reader.readAsArrayBuffer( file );

				} );

			case 'md2':

				return new Promise( ( resolve, reject ) => {

					reader.addEventListener( 'load', function ( event ) {

						var contents = event.target.result;

						var geometry = new MD2Loader().parse( contents );
						var material = new THREE.MeshStandardMaterial( {
							morphTargets: true,
							morphNormals: true
						} );

						var mesh = new THREE.Mesh( geometry, material );
						mesh.mixer = new THREE.AnimationMixer( mesh );
						mesh.name = filename;

						mesh.animations.push( ...geometry.animations );
						editor.execute( new AddObjectCommand( editor, mesh ) );
						resolve( { filename, object: mesh } );

					}, false );
					reader.readAsArrayBuffer( file );

				} );

			case 'obj':

				return new Promise( ( resolve, reject ) => {

					reader.addEventListener( 'load', function ( event ) {

						var contents = event.target.result;

						var object = new OBJLoader().parse( contents );
						object.name = filename;

						editor.execute( new AddObjectCommand( editor, object ) );
						resolve( { filename, object } );

					}, false );
					reader.readAsText( file );

				} );

			case 'ply':

				return new Promise( ( resolve, reject ) => {

					reader.addEventListener( 'load', function ( event ) {

						var contents = event.target.result;

						var geometry = new PLYLoader().parse( contents );
						geometry.sourceType = 'ply';
						geometry.sourceFile = file.name;

						var material = new THREE.MeshStandardMaterial();

						var mesh = new THREE.Mesh( geometry, material );
						mesh.name = filename;

						editor.execute( new AddObjectCommand( editor, mesh ) );
						resolve( { filename, object: mesh } );

					}, false );
					reader.readAsArrayBuffer( file );

				} );

			case 'stl':

				return new Promise( ( resolve, reject ) => {

					reader.addEventListener( 'load', function ( event ) {

						var contents = event.target.result;

						var geometry = new STLLoader().parse( contents );
						geometry.sourceType = 'stl';
						geometry.sourceFile = file.name;

						var material = new THREE.MeshStandardMaterial();

						var mesh = new THREE.Mesh( geometry, material );
						mesh.name = filename;

						editor.execute( new AddObjectCommand( editor, mesh ) );
						resolve( { filename, object: mesh } );

					}, false );

					if ( reader.readAsBinaryString !== undefined ) {

						reader.readAsBinaryString( file );

					} else {

						reader.readAsArrayBuffer( file );

					}

				} );

			case 'svg':

				return new Promise( ( resolve, reject ) => {

					reader.addEventListener( 'load', function ( event ) {

						var contents = event.target.result;

						var loader = new SVGLoader();
						var paths = loader.parse( contents ).paths;

						//

						var group = new THREE.Group();
						group.scale.multiplyScalar( 0.1 );
						group.scale.y *= - 1;

						for ( var i = 0; i < paths.length; i ++ ) {

							var path = paths[ i ];

							var material = new THREE.MeshBasicMaterial( {
								color: path.color,
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

						editor.execute( new AddObjectCommand( editor, group ) );
						resolve( { filename, object: group } );

					}, false );
					reader.readAsText( file );

				} );

			case 'vtk':

				return new Promise( ( resolve, reject ) => {

					reader.addEventListener( 'load', function ( event ) {

						var contents = event.target.result;

						var geometry = new VTKLoader().parse( contents );
						geometry.sourceType = 'vtk';
						geometry.sourceFile = file.name;

						var material = new THREE.MeshStandardMaterial();

						var mesh = new THREE.Mesh( geometry, material );
						mesh.name = filename;

						editor.execute( new AddObjectCommand( editor, mesh ) );
						resolve( { filename, object: mesh } );

					}, false );
					reader.readAsArrayBuffer( file );

				} );

			case 'vox':

				return new Promise( ( resolve, reject ) => {

					reader.addEventListener( 'load', function ( event ) {

						var contents = event.target.result;

						var chunks = new VOXLoader().parse( contents );

						var group = new THREE.Group();
						group.name = filename;

						for ( let i = 0; i < chunks.length; i ++ ) {

							const chunk = chunks[ i ];
	
							const mesh = new VOXMesh( chunk );
							group.add( mesh );
	
						}

						editor.execute( new AddObjectCommand( editor, group ) );
						resolve( { filename, object: group } );

					}, false );
					reader.readAsArrayBuffer( file );

				} );

			case 'wrl':

				return new Promise( ( resolve, reject ) => {

					reader.addEventListener( 'load', function ( event ) {

						var contents = event.target.result;

						var result = new VRMLLoader().parse( contents );

						editor.execute( new SetSceneCommand( editor, result ) );
						resolve( { filename, object: result } );

					}, false );
					reader.readAsText( file );

				} );

			case 'xyz':

				return new Promise( ( resolve, reject ) => {

					reader.addEventListener( 'load', function ( event ) {

						var contents = event.target.result;

						var geometry = new XYZLoader().parse( contents );

						var material = new THREE.PointsMaterial();

						if ( geometry.hasAttribute( 'color' ) === true ) material.vertexColors = true;

						var points = new THREE.Points( geometry, material );
						points.name = filename;

						editor.execute( new AddObjectCommand( editor, points ) );
						resolve( { filename, object: points } );

					}, false );
					reader.readAsText( file );

				} );

			case 'zip':

				return new Promise( ( resolve, reject ) => {

					reader.addEventListener( 'load', function ( event ) {

						handleZIP(filename, event.target.result, false, resolve, reject );

					}, false );
					reader.readAsBinaryString( file );

				} );

			default:

				console.error( 'Unsupported file format (' + extension + ').' );

				break;

		}

	};

	this.loadAnimationFile = function ( file, manager ) {

		return new Promise( ( resolve, reject ) => {

			var lottieLoader = new LottieLoader();
			var url = URL.createObjectURL( file );

			lottieLoader.load( url, function ( texture ) {

				resolve( { filename: file.name, texture, url } );

			} );

		} );

	};

	function handleJSON( data, filename, resolve, reject ) {

		if ( data.metadata === undefined ) { // 2.0

			data.metadata = { type: 'Geometry' };

		}

		if ( data.metadata.type === undefined ) { // 3.0

			data.metadata.type = 'Geometry';

		}

		if ( data.metadata.formatVersion !== undefined ) {

			data.metadata.version = data.metadata.formatVersion;

		}

		switch ( data.metadata.type.toLowerCase() ) {

			case 'buffergeometry':

				var loader = new THREE.BufferGeometryLoader();
				var result = loader.parse( data );

				var mesh = new THREE.Mesh( result );

				editor.execute( new AddObjectCommand( editor, mesh ) );
				resolve( { filename, object: mesh } );

				break;

			case 'geometry':

				console.error( 'Loader: "Geometry" is no longer supported.' );

				break;

			case 'object':

				var loader = new ObjectLoader( editor.assets );
				loader.setResourcePath( scope.texturePath );

				loader.parse( data, function ( result ) {

					if ( result.isScene ) {

						editor.execute( new SetSceneCommand( editor, result ) );

					} else {

						editor.execute( new AddObjectCommand( editor, result ) );
						resolve( { filename, object: result } );

					}

				} );

				break;

			case 'arcade.scene':

				var loader = new ObjectLoader();
				loader.setResourcePath( scope.texturePath );

				loader.parse( data.scene, function ( scene ) {

					editor.viewportCamera.userData[ 'movement' ] = scene.userData[ 'mainCameraMovement' ]; // TODO:: Review if this is used at all now
					editor.scripts = data.scripts;
					editor.attributes = data.attributes;
					editor.tags = data.tags;
					editor.timelines = data.timelines;
					editor.execute( new SetSceneCommand( editor, scene ) );

				} );

				break;

			case 'app':

				editor.fromJSON( data );

				break;

		}

	}

	function handleZIP(filename, contents, addToScene, resolve, reject ) {

		var zip = new JSZip( contents );
		// Poly

		if ( zip.files[ 'model.obj' ] && zip.files[ 'materials.mtl' ] ) {

			var materials = new MTLLoader().parse( zip.file( 'materials.mtl' ).asText() );
			var object = new OBJLoader().setMaterials( materials ).parse( zip.file( 'model.obj' ).asText() );
			editor.execute( new AddObjectCommand( editor, object ) );
			resolve( { filename: 'model.obj', object } );
			return;

		}

		//

		zip.filter( function ( path, file ) {

			var manager = new THREE.LoadingManager();
			manager.setURLModifier( function ( url ) {

				url = url.replace( /^(\.?\/)/, '' ); // remove './'

				var file = zip.files[ url ];

				if ( file ) {

					var blob = new Blob( [ file.asArrayBuffer() ], { type: 'application/octet-stream' } );
					return URL.createObjectURL( blob );

				}

				return url;

			} );

			var extension = file.name.split( '.' ).pop().toLowerCase();
			if (!file.name.includes('__MACOSX')) {
				switch ( extension ) {

					case 'fbx':

						var loader = new FBXLoader( manager );
						var object = loader.parse( file.asArrayBuffer() );
						if(addToScene)
							editor.execute( new AddObjectCommand( editor, object ) );
						resolve( { filename: filename, object } );

						break;

					case 'glb':

						var dracoLoader = new DRACOLoader();
						dracoLoader.setDecoderPath( '../core/libs/draco/gltf/' );

						var loader = new GLTFLoader();
						loader.setDRACOLoader( dracoLoader );

						loader.parse( file.asArrayBuffer(), '', function ( result ) {

							var scene = result.scene;

							scene.animations.push( ...result.animations );
							if(addToScene)
								editor.execute( new AddObjectCommand( editor, scene ) );
							resolve( { filename: filename, object: scene } );

						} );

						break;

					case 'gltf':

						var dracoLoader = new DRACOLoader();
						dracoLoader.setDecoderPath( '../core/libs/draco/gltf/' );

						var loader = new GLTFLoader( manager );
						loader.setDRACOLoader( dracoLoader );
						loader.parse( file.asText(), '', function ( result ) {

							var scene = result.scene;

							scene.animations.push( ...result.animations );
							if(addToScene)
								editor.execute( new AddObjectCommand( editor, scene ) );
							resolve( { filename: filename, object: scene } );

						} );

						break;

				}
			}

		} );

	}

	function isGLTF1( contents ) {

		var resultContent;

		if ( typeof contents === 'string' ) {

			// contents is a JSON string
			resultContent = contents;

		} else {

			var magic = THREE.LoaderUtils.decodeText( new Uint8Array( contents, 0, 4 ) );

			if ( magic === 'glTF' ) {

				// contents is a .glb file; extract the version
				var version = new DataView( contents ).getUint32( 4, true );

				return version < 2;

			} else {

				// contents is a .gltf file
				resultContent = THREE.LoaderUtils.decodeText( new Uint8Array( contents ) );

			}

		}

		var json = JSON.parse( resultContent );

		return ( json.asset != undefined && json.asset.version[ 0 ] < 2 );

	}

}

export { Loader };
