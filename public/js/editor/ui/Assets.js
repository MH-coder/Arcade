/**
 * @author codelegend620
 */

import { FontLoader } from '../core/loaders/FontLoader.js';
import { GeometryAsset } from "../assets/GeometryAsset.js";
import { ImageAsset } from "../assets/ImageAsset.js";
import { AudioAsset } from "../assets/AudioAsset.js";
import { VideoAsset } from "../assets/VideoAsset.js";
import { EnvironmentAsset } from "../assets/EnvironmentAsset.js";
import { MaterialAsset } from "../assets/MaterialAsset.js";
import { FontAsset } from "../assets/FontAsset.js";
import { AnimationAsset } from "../assets/AnimationAsset.js";
import DefaultFont from "../assets/fonts/helvetiker_regular.typeface.json";

var Assets = function ( editor ) {

	this.map = {
		'Geometry': 'geometries',
		'Material': 'materials',
		'Image': 'images',
		'Audio': 'audios',
		'Video': 'videos',
		'Environment': 'environments',
		'Animation': 'animations',
	};

	this.editor = editor;
	this.geometries = [];
	this.materials = [];
	this.images = [];
	this.audios = [];
	this.videos = [];
	this.environments = [];
	this.fonts = [];
	this.animations = [];

	var canvas = document.createElement( "canvas" );
	canvas.width = 1;
	canvas.height = 1;

	var context = canvas.getContext( "2d" );
	context.fillStyle = '#ff0000';
	context.fillRect( 0, 0, 1, 1 );

	this.images.push( { id: 0, name: 'Recent', items: [] } );
	this.addImage( 0, { id: 'defaultParticleTexture', url: canvas.toDataURL() } );

	var loader = new FontLoader();
	var defaultFont = new FontAsset( editor, 'defaultFont', 'default', null );
	defaultFont.font = loader.parse( DefaultFont );

	this.fonts.push( defaultFont );

};

Assets.prototype = {

	addGeometry: function ( folderId, item ) {

		var scope = this;

		return new Promise( function ( resolve ) {

			var asset = new GeometryAsset( scope.editor, item.id, item.geometryId, item.name, item.ext, item.thumbUrl, item.url );
			var geometryFolder = scope.geometries.find( gf => gf.id == folderId );

			geometryFolder.items.push( asset );

			if ( item.projectId == scope.editor.projectId ) {

				asset.load( function () {

					resolve( asset );

				} );

			} else {

				resolve( asset );

			}

		} );

	},

	uploadGeometry: function ( name, ext, object ) {

		var asset = new GeometryAsset( this.editor, null, null, name, ext, this.editor.config.getImage( 'gallery/geometry.jpg' ), null );
		asset.object = object;

		var geometryFolder = this.geometries.find( x => x.id == 0 );
		geometryFolder.items.push( asset );

		return asset;

	},

	addMaterial: function ( folderId, item ) {

		var scope = this;

		return new Promise( function ( resolve ) {

			var asset = new MaterialAsset( scope.editor, item.id, item.materialId, item.name, item.thumbUrl, item.urls );
			var materialFolder = scope.materials.find( mf => mf.id == folderId );

			materialFolder.items.push( asset );

			if ( item.projectId == scope.editor.projectId ) {

				asset.load( function () {

					resolve( asset );

				} );

			} else {

				resolve( asset );

			}

		} );

	},

	addImage: function ( folderId, item ) {

		var scope = this;

		return new Promise( function ( resolve ) {

			var asset = new ImageAsset( scope.editor, item.id, item.imageId, item.url);
			var imageFolder = scope.images.find( x => x.id == folderId );

			imageFolder.items.push( asset );

			// if ( item.projectId == scope.editor.projectId ) {

			asset.load( function () {

				resolve( asset );

			} );

			// } else {

			// 	resolve( asset );

			// }

		} );

	},

	uploadImage: function ( texture, isHDR ) {

		var asset = new ImageAsset( this.editor, null, null, texture.image.src, isHDR, texture );
		asset.texture = texture;

		var imageFolder = this.images.find( x => x.id == 0 );
		imageFolder.items.push( asset );

		return asset;

	},

	addAudio: function ( folderId, item ) {

		var scope = this;

		return new Promise( function ( resolve ) {

			var asset = new AudioAsset( scope.editor, item.id, item.audioId, item.name, item.duration, item.url );
			var audioFolder = scope.audios.find( x => x.id == folderId );

			audioFolder.items.push( asset );

			// if ( item.projectId == scope.editor.projectId ) {

				asset.load( function () {

					resolve( asset );

				} );

			// } else {

			// 	resolve( asset );

			// }

		} );

	},

	uploadAudio: function ( name, buffer ) {

		var asset = new AudioAsset( this.editor, null, null, name, buffer.duration, name );
		asset.audio.setBuffer( buffer );

		var audioFolder = this.audios.find( x => x.id == 0 );
		audioFolder.items.push( asset );

		return asset;

	},

	addVideo: function ( folderId, item ) {

		var scope = this;

		return new Promise( function ( resolve ) {

			var asset = new VideoAsset( scope.editor, item.id, item.videoId, item.name, item.url );
			var videoFolder = scope.videos.find( x => x.id == folderId );

			videoFolder.items.push( asset );

			if ( item.projectId == scope.editor.projectId ) {

				asset.load( function () {

					resolve( asset );

				} );

			} else {

				resolve( asset );

			}

		} );

	},

	uploadVideo: function ( name, url, modifiedName ) {

		if(modifiedName){
			name = modifiedName;
		}
		var asset = new VideoAsset( this.editor, null, null, name, url );
		asset.load();

		var videoFolder = this.videos.find( x => x.id == 0 );
		videoFolder.items.push( asset );

		return asset;

	},

	addEnvironment: function ( folderId, item ) {


		var scope = this;

		return new Promise( function ( resolve ) {

			var asset = new EnvironmentAsset( scope.editor, item.id, item.environmentId, item.name, item.thumbUrl, item.url );
			var environmentFolder = scope.environments.find( x => x.id == folderId );

			environmentFolder.items.push( asset );

			if ( item.projectId == scope.editor.projectId ) {

				asset.load( function () {

					resolve( asset );

				} );

			} else {

				resolve( asset );

			}

		} );

	},

	addFont: function ( item ) {

		var scope = this;

		return new Promise( function ( resolve ) {

			var asset = new FontAsset( scope.editor, item.id, item.name, item.url );

			scope.fonts.push( asset );

			if ( item.projectId == scope.editor.projectId ) {

				asset.load( function () {

					resolve( asset );

				} );

			} else {

				resolve( asset );

			}

		} );

	},

	uploadFont: function ( name, font ) {

		var asset = new FontAsset( this.editor, null, name, null );
		asset.font = font;

		this.fonts.push( asset );

		return asset;

	},

	getFont: function ( id ) {

		return this.fonts.find( m => m.id == id );

	},

	removeFont: function ( id ) {

		var index = this.fonts.indexOf( this.getFont( id ) );

		this.fonts.splice( index, 1 );

	},

	addAnimation: function ( folderId, item ) {

		var scope = this;

		return new Promise( function ( resolve ) {

			var asset = new AnimationAsset( scope.editor, item.id, item.animationId, item.name, item.url );
			var animationFolder = scope.animations.find( x => x.id == folderId );

			animationFolder.items.push( asset );

			asset.load( function () {

				resolve( asset );

			} );

		} );

	},

	uploadAnimation: function ( animation ) {

		var asset = new AnimationAsset( this.editor, null, null, animation.filename, animation.url );
		asset.texture = animation.texture;

		var animationFolder = this.animations.find( x => x.id == 0 );
		animationFolder.items.push( asset );

		return asset;

	},

	load: function ( type, url, onProgress ) {

		var scope = this;

		return new Promise( function ( resolve, reject ) {

			scope.editor.api.get( url ).then( assets => {

				function progressPromise( promises ) {

					var len = promises.length;
	
					function tick( promise ) {
	
						promise.then( function () {
	
							onProgress( 1.0 / len );
	
						} );
	
						return promise;
	
					}
	
					return Promise.all( promises.map( tick ) );
	
				}

				var promises = [];

				for ( var folder of assets ) {

					if ( !scope[ scope.map[ type ] ].find( f => f.id == folder.id ) ) {

						scope[ scope.map[ type ] ].push( { ...folder, items: [] } );

					}

					for ( var asset of folder.items ) {
						scope[ 'add' + type ]( folder.id, asset );
						// promises.push( scope[ 'add' + type ]( folder.id, asset ) );

					}
					

				}

				if ( promises.length ) {

					progressPromise( promises ).then( results => {

						resolve();

					} );

				} else {

					onProgress( 1.0 );
					resolve();

				}

			} ).catch( err => {
				console.error(err);
				onProgress( 1.0 );
				resolve();

			} );

		} );

	},

	loadFont: function( projectId, onProgress ) {

		var scope = this;

		return new Promise( function ( resolve, reject ) {

			scope.editor.api.get( '/asset/my-font/' + projectId ).then( fonts => {

				function progressPromise( promises ) {

					var len = promises.length;

					function tick( promise ) {

						promise.then( function () {

							onProgress( 1.0 / len );

						} );

						return promise;

					}

					return Promise.all( promises.map( tick ) );

				}

				var promises = [];

				for ( var font of fonts ) {

					promises.push( scope.addFont( font ) );

				}

				if ( promises.length ) {

					progressPromise( promises ).then( results => {

						resolve();

					} );

				} else {

					onProgress( 1.0 );
					resolve();

				}

			} ).catch( err => {

				console.log( err );

			} );

		} );

	},

	add: function ( type, folderId, item ) {

		return this[ 'add' + type ]( folderId, item );

	},

	addFolder: function ( type, id, name ) {

		var folders = this[ this.map[ type ] ];
		var folder = folders.find( x => x.id == id );

		if ( !folder ) {

			folders.push( { id, name, items: [] } );

		}

	},

	remove: function ( type, property, value ) {

		var folder = null;
		var item = null;
		var scope = this;

		for ( folder of scope[ scope.map[ type ] ] ) {

			item = folder.items.find( x => x[ property ] == value );

			if ( item ) break;

		}

		if ( folder && item ) {

			var index = folder.items.indexOf( item );
			folder.items.splice( index, 1 );

		}

	},

	removeFolder: function ( type, id ) {

		var folders = this[ this.map[ type ] ];
		var folder = folders.find( x => x.id == id );
		var index = folders.indexOf( folder );

		folders.splice( index, 1 );

	},

	get: function ( type, property, value ) {

		var scope = this;
		var item = null;

		for ( var folder of scope[ scope.map[ type ] ] ) {

			item = folder.items.find( x => x[ property ] == value );

			if ( item ) break;

		}

		return item;

	},

	move: function ( type, id, from, to, altKey ) {

		var fromFolder = this[ this.map[ type ] ].find( x => x.id == from );
		var toFolder = this[ this.map[ type ] ].find( x => x.id == to );
		var asset = fromFolder.items.find( x => x.id == id );
		var index = fromFolder.items.indexOf( asset );

		toFolder.items.push( asset );

		if ( !altKey ) fromFolder.items.splice( index, 1 );

	},

	getItems: function ( type ) {

		var result = [];

		this[type].map( folder => {

			result = result.concat( folder.items );

		} );

		return result;

	},

};

export { Assets };
