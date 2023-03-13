import * as THREE from '../libs/three.module.js';
import { ParticleEmitter } from '../objects/particle/ParticleEmitter.js';
import { TextMesh } from '../objects/text/TextMesh.js';
import { TextGeometry } from '../core/geometries/TextGeometry.js';
import { ParametricGeometry } from '../core/geometries/ParametricGeometry.js';

const TYPED_ARRAYS = {
	Int8Array: Int8Array,
	Uint8Array: Uint8Array,
	Uint8ClampedArray: Uint8ClampedArray,
	Int16Array: Int16Array,
	Uint16Array: Uint16Array,
	Int32Array: Int32Array,
	Uint32Array: Uint32Array,
	Float32Array: Float32Array,
	Float64Array: Float64Array
};

function getTypedArray( type, buffer ) {

	return new TYPED_ARRAYS[ type ]( buffer );

}

class ObjectLoader extends THREE.Loader {

	constructor( assets, manager ) {

		super( manager );

		this.assets = assets;

	}

	load( url, onLoad, onProgress, onError ) {

		const scope = this;

		const path = ( this.path === '' ) ? THREE.LoaderUtils.extractUrlBase( url ) : this.path;
		this.resourcePath = this.resourcePath || path;

		const loader = new THREE.FileLoader( this.manager );
		loader.setPath( this.path );
		loader.setRequestHeader( this.requestHeader );
		loader.setWithCredentials( this.withCredentials );
		loader.load( url, function ( text ) {

			let json = null;

			try {

				json = JSON.parse( text );

			} catch ( error ) {

				if ( onError !== undefined ) onError( error );

				console.error( 'THREE:ObjectLoader: Can\'t parse ' + url + '.', error.message );

				return;

			}

			const metadata = json.metadata;

			if ( metadata === undefined || metadata.type === undefined || metadata.type.toLowerCase() === 'geometry' ) {

				console.error( 'THREE.ObjectLoader: Can\'t load ' + url );
				return;

			}

			scope.parse( json, onLoad );

		}, onProgress, onError );

	}

	parse( json, onLoad ) {

		
		//need for support old project publications
		if(!json){
			return null;
		}

		const animations = this.parseAnimations( json.animations );
		const shapes = this.parseShapes( json.shapes );
		const geometries = this.parseGeometries( json.geometries, shapes );

		const images = this.parseImages( json.images, function () {

			if ( onLoad !== undefined ) onLoad( object );

		} );

		const textures = this.parseTextures( json.textures, images );
		const materials = this.parseMaterials( json.materials, textures );

		const object = this.parseObject( json.object, geometries, materials, textures, animations );
		const skeletons = this.parseSkeletons( json.skeletons, object );

		this.bindSkeletons( object, skeletons );

		//

		if ( onLoad !== undefined ) {

			let hasImages = false;

			for ( const uuid in images ) {

				if ( images[ uuid ] instanceof HTMLImageElement ) {

					hasImages = true;
					break;

				}

			}

			if ( hasImages === false ) onLoad( object );

		}

		return object;

	}

	parseShapes( json ) {

		const shapes = {};

		if ( json !== undefined ) {

			for ( let i = 0, l = json.length; i < l; i ++ ) {

				const shape = new THREE.Shape().fromJSON( json[ i ] );

				shapes[ shape.uuid ] = shape;

			}

		}

		return shapes;

	}

	parseSkeletons( json, object ) {

		const skeletons = {};
		const bones = {};

		// generate bone lookup table

		object.traverse( function ( child ) {

			if ( child.isBone ) bones[ child.uuid ] = child;

		} );

		// create skeletons

		if ( json !== undefined ) {

			for ( let i = 0, l = json.length; i < l; i ++ ) {

				const skeleton = new THREE.Skeleton().fromJSON( json[ i ], bones );

				skeletons[ skeleton.uuid ] = skeleton;

			}

		}

		return skeletons;

	}

	parseGeometries( json, shapes ) {

		const geometries = {};
		let geometryShapes;

		if ( json !== undefined ) {

			const bufferGeometryLoader = new THREE.BufferGeometryLoader();

			for ( let i = 0, l = json.length; i < l; i ++ ) {

				let geometry;
				const data = json[ i ];

				switch ( data.type ) {

					case 'PlaneGeometry':
					case 'PlaneBufferGeometry':

						geometry = new Geometries[ data.type ](
							data.width,
							data.height,
							data.widthSegments,
							data.heightSegments
						);

						break;

					case 'BoxGeometry':
					case 'BoxBufferGeometry':
					case 'CubeGeometry': // backwards compatible

						geometry = new Geometries[ data.type ](
							data.width,
							data.height,
							data.depth,
							data.widthSegments,
							data.heightSegments,
							data.depthSegments
						);

						break;

					case 'CircleGeometry':
					case 'CircleBufferGeometry':

						geometry = new Geometries[ data.type ](
							data.radius,
							data.segments,
							data.thetaStart,
							data.thetaLength
						);

						break;

					case 'CylinderGeometry':
					case 'CylinderBufferGeometry':

						geometry = new Geometries[ data.type ](
							data.radiusTop,
							data.radiusBottom,
							data.height,
							data.radialSegments,
							data.heightSegments,
							data.openEnded,
							data.thetaStart,
							data.thetaLength
						);

						break;

					case 'ConeGeometry':
					case 'ConeBufferGeometry':

						geometry = new Geometries[ data.type ](
							data.radius,
							data.height,
							data.radialSegments,
							data.heightSegments,
							data.openEnded,
							data.thetaStart,
							data.thetaLength
						);

						break;

					case 'SphereGeometry':
					case 'SphereBufferGeometry':

						geometry = new Geometries[ data.type ](
							data.radius,
							data.widthSegments,
							data.heightSegments,
							data.phiStart,
							data.phiLength,
							data.thetaStart,
							data.thetaLength
						);

						break;

					case 'DodecahedronGeometry':
					case 'DodecahedronBufferGeometry':
					case 'IcosahedronGeometry':
					case 'IcosahedronBufferGeometry':
					case 'OctahedronGeometry':
					case 'OctahedronBufferGeometry':
					case 'TetrahedronGeometry':
					case 'TetrahedronBufferGeometry':

						geometry = new Geometries[ data.type ](
							data.radius,
							data.detail
						);

						break;

					case 'RingGeometry':
					case 'RingBufferGeometry':

						geometry = new Geometries[ data.type ](
							data.innerRadius,
							data.outerRadius,
							data.thetaSegments,
							data.phiSegments,
							data.thetaStart,
							data.thetaLength
						);

						break;

					case 'TorusGeometry':
					case 'TorusBufferGeometry':

						geometry = new Geometries[ data.type ](
							data.radius,
							data.tube,
							data.radialSegments,
							data.tubularSegments,
							data.arc
						);

						break;

					case 'TorusKnotGeometry':
					case 'TorusKnotBufferGeometry':

						geometry = new Geometries[ data.type ](
							data.radius,
							data.tube,
							data.tubularSegments,
							data.radialSegments,
							data.p,
							data.q
						);

						break;

					case 'TubeGeometry':
					case 'TubeBufferGeometry':

						// This only works for built-in curves (e.g. CatmullRomCurve3).
						// User defined curves or instances of CurvePath will not be deserialized.
						geometry = new Geometries[ data.type ](
							new Curves[ data.path.type ]().fromJSON( data.path ),
							data.tubularSegments,
							data.radius,
							data.radialSegments,
							data.closed
						);

						break;

					case 'LatheGeometry':
					case 'LatheBufferGeometry':

						geometry = new Geometries[ data.type ](
							data.points,
							data.segments,
							data.phiStart,
							data.phiLength
						);

						break;

					case 'PolyhedronGeometry':
					case 'PolyhedronBufferGeometry':

						geometry = new Geometries[ data.type ](
							data.vertices,
							data.indices,
							data.radius,
							data.details
						);

						break;

					case 'ShapeGeometry':
					case 'ShapeBufferGeometry':

						geometryShapes = [];

						for ( let j = 0, jl = data.shapes.length; j < jl; j ++ ) {

							const shape = shapes[ data.shapes[ j ] ];

							geometryShapes.push( shape );

						}

						geometry = new Geometries[ data.type ](
							geometryShapes,
							data.curveSegments
						);

						break;


					case 'ExtrudeGeometry':
					case 'ExtrudeBufferGeometry':

						geometryShapes = [];

						for ( let j = 0, jl = data.shapes.length; j < jl; j ++ ) {

							const shape = shapes[ data.shapes[ j ] ];

							geometryShapes.push( shape );

						}

						const extrudePath = data.options.extrudePath;

						if ( extrudePath !== undefined ) {

							data.options.extrudePath = new Curves[ extrudePath.type ]().fromJSON( extrudePath );

						}

						geometry = new Geometries[ data.type ](
							geometryShapes,
							data.options
						);

						break;

					case 'BufferGeometry':
					case 'InstancedBufferGeometry':

						geometry = bufferGeometryLoader.parse( data );

						break;

					case 'Geometry':

						console.error( 'THREE.ObjectLoader: Loading "Geometry" is not supported anymore.' );

						break;

					default:

						console.warn( 'THREE.ObjectLoader: Unsupported geometry type "' + data.type + '"' );

						continue;

				}

				geometry.uuid = data.uuid;

				if ( data.name !== undefined ) geometry.name = data.name;
				if ( geometry.isBufferGeometry === true && data.userData !== undefined ) geometry.userData = data.userData;

				geometries[ data.uuid ] = geometry;

			}

		}

		return geometries;

	}

	parseMaterials( json, textures ) {
		const cache = {}; // MultiMaterial
		const materials = {};

		if ( json !== undefined ) {

			const loader = new THREE.MaterialLoader();
			loader.setTextures( textures );

			for ( let i = 0, l = json.length; i < l; i ++ ) {

				const data = json[ i ];

				if ( data.type === 'MultiMaterial' ) {
					// Deprecated

					const array = [];

					for ( let j = 0; j < data.materials.length; j ++ ) {

						const material = data.materials[ j ];

						if ( cache[ material.uuid ] === undefined ) {

							cache[ material.uuid ] = loader.parse( material );

						}

						array.push( cache[ material.uuid ] );

					}

					materials[ data.uuid ] = array;

				} else {

					if ( cache[ data.uuid ] === undefined ) {

						cache[ data.uuid ] = loader.parse( data );

					}

					materials[ data.uuid ] = cache[ data.uuid ];

				}

			}

		}

		return materials;

	}

	parseAnimations( json ) {

		const animations = {};

		if ( json !== undefined ) {

			for ( let i = 0; i < json.length; i ++ ) {

				const data = json[ i ];

				const clip = THREE.AnimationClip.parse( data );

				animations[ clip.uuid ] = clip;

			}

		}

		return animations;

	}

	parseImages( json, onLoad ) {

		const scope = this;
		const images = {};

		let loader;

		function loadImage( url ) {

			scope.manager.itemStart( url );

			return loader.load( url, function () {

				scope.manager.itemEnd( url );

			}, undefined, function () {

				scope.manager.itemError( url );
				scope.manager.itemEnd( url );

			} );

		}

		function deserializeImage( image ) {

			if ( typeof image === 'string' ) {

				const url = image;

				const path = /^(\/\/)|([a-z]+:(\/\/)?)/i.test( url ) ? url : scope.resourcePath + url;

				return loadImage( path );

			} else {

				if ( image.data ) {

					return {
						data: getTypedArray( image.type, image.data ),
						width: image.width,
						height: image.height
					};

				} else {

					return null;

				}

			}

		}

		if ( json !== undefined && json.length > 0 ) {

			const manager = new THREE.LoadingManager( onLoad );

			loader = new THREE.ImageLoader( manager );
			loader.setCrossOrigin( this.crossOrigin );

			for ( let i = 0, il = json.length; i < il; i ++ ) {

				const image = json[ i ];
				const url = image.url;

				if ( Array.isArray( url ) ) {

					// load array of images e.g CubeTexture

					images[ image.uuid ] = [];

					for ( let j = 0, jl = url.length; j < jl; j ++ ) {

						const currentUrl = url[ j ];

						const deserializedImage = deserializeImage( currentUrl );

						if ( deserializedImage !== null ) {

							if ( deserializedImage instanceof HTMLImageElement ) {

								images[ image.uuid ].push( deserializedImage );

							} else {

								// special case: handle array of data textures for cube textures

								images[ image.uuid ].push( new DataTexture( deserializedImage.data, deserializedImage.width, deserializedImage.height ) );

							}

						}

					}

				} else {

					// load single image

					const deserializedImage = deserializeImage( image.url );

					if ( deserializedImage !== null ) {

						images[ image.uuid ] = deserializedImage;

					}

				}

			}

		}

		return images;

	}

	parseTextures( json, images ) {

		function parseConstant( value, type ) {

			if ( typeof value === 'number' ) return value;

			console.warn( 'THREE.ObjectLoader.parseTexture: Constant should be in numeric form.', value );

			return type[ value ];

		}

		const textures = {};

		if ( json !== undefined ) {

			for ( let i = 0, l = json.length; i < l; i ++ ) {

				const data = json[ i ];

				if ( data.image === undefined ) {

					console.warn( 'THREE.ObjectLoader: No "image" specified for', data.uuid );

				}

				if ( images[ data.image ] === undefined ) {

					console.warn( 'THREE.ObjectLoader: Undefined image', data.image );

				}

				let texture;
				const image = images[ data.image ];

				if ( Array.isArray( image ) ) {

					texture = new THREE.CubeTexture( image );

					if ( image.length === 6 ) texture.needsUpdate = true;

				} else {

					if ( image && image.data ) {

						texture = new THREE.DataTexture( image.data, image.width, image.height );

					} else {

						texture = new THREE.Texture( image );

					}

					if ( image ) texture.needsUpdate = true; // textures can have undefined image data

				}

				texture.uuid = data.uuid;

				if ( data.name !== undefined ) texture.name = data.name;

				if ( data.mapping !== undefined ) texture.mapping = parseConstant( data.mapping, TEXTURE_MAPPING );

				if ( data.offset !== undefined ) texture.offset.fromArray( data.offset );
				if ( data.repeat !== undefined ) texture.repeat.fromArray( data.repeat );
				if ( data.center !== undefined ) texture.center.fromArray( data.center );
				if ( data.rotation !== undefined ) texture.rotation = data.rotation;

				if ( data.wrap !== undefined ) {

					texture.wrapS = parseConstant( data.wrap[ 0 ], TEXTURE_WRAPPING );
					texture.wrapT = parseConstant( data.wrap[ 1 ], TEXTURE_WRAPPING );

				}

				if ( data.format !== undefined ) texture.format = data.format;
				if ( data.type !== undefined ) texture.type = data.type;
				if ( data.encoding !== undefined ) texture.encoding = data.encoding;

				if ( data.minFilter !== undefined ) texture.minFilter = parseConstant( data.minFilter, TEXTURE_FILTER );
				if ( data.magFilter !== undefined ) texture.magFilter = parseConstant( data.magFilter, TEXTURE_FILTER );
				if ( data.anisotropy !== undefined ) texture.anisotropy = data.anisotropy;

				if ( data.flipY !== undefined ) texture.flipY = data.flipY;

				if ( data.premultiplyAlpha !== undefined ) texture.premultiplyAlpha = data.premultiplyAlpha;
				if ( data.unpackAlignment !== undefined ) texture.unpackAlignment = data.unpackAlignment;

				textures[ data.uuid ] = texture;

			}

		}

		return textures;

	}

	parseObject( data, geometries, materials, textures, animations ) {

		let object;

		function getGeometry( name ) {

			if ( geometries[ name ] === undefined ) {

				console.warn( 'THREE.ObjectLoader: Undefined geometry', name );

			}

			return geometries[ name ];

		}

		function getMaterial( name ) {

			if ( name === undefined ) return undefined;

			if ( Array.isArray( name ) ) {

				const array = [];

				for ( let i = 0, l = name.length; i < l; i ++ ) {

					const uuid = name[ i ];

					if ( materials[ uuid ] === undefined ) {

						console.warn( 'THREE.ObjectLoader: Undefined material', uuid );

					}

					array.push( materials[ uuid ] );

				}

				return array;

			}

			if ( materials[ name ] === undefined ) {

				console.warn( 'THREE.ObjectLoader: Undefined material', name );

			}

			return materials[ name ];

		}

		function getTexture( uuid ) {

			if ( textures[ uuid ] === undefined ) {

				console.warn( 'THREE.ObjectLoader: Undefined texture', uuid );

			}

			return textures[ uuid ];

		}


		let geometry, material;

		switch ( data.type ) {

			case 'Scene':

				object = new THREE.Scene();

				if ( data.background !== undefined ) {

					if ( Number.isInteger( data.background ) ) {

						object.background = new THREE.Color( data.background );

					} else {

						object.background = getTexture( data.background );

					}

				}

				if ( data.environment !== undefined ) {

					object.environment = getTexture( data.environment );

				}

				if ( data.fog !== undefined ) {

					if ( data.fog.type === 'Fog' ) {

						object.fog = new THREE.Fog( data.fog.color, data.fog.near, data.fog.far );

					} else if ( data.fog.type === 'FogExp2' ) {

						object.fog = new THREE.FogExp2( data.fog.color, data.fog.density );

					}

				}

				break;

			case 'PerspectiveCamera':

				object = new THREE.PerspectiveCamera( data.fov, data.aspect, data.near, data.far );

				if ( data.focus !== undefined ) object.focus = data.focus;
				if ( data.zoom !== undefined ) object.zoom = data.zoom;
				if ( data.filmGauge !== undefined ) object.filmGauge = data.filmGauge;
				if ( data.filmOffset !== undefined ) object.filmOffset = data.filmOffset;
				if ( data.view !== undefined ) object.view = Object.assign( {}, data.view );

				break;

			case 'OrthographicCamera':

				object = new THREE.OrthographicCamera( data.left, data.right, data.top, data.bottom, data.near, data.far );

				if ( data.zoom !== undefined ) object.zoom = data.zoom;
				if ( data.view !== undefined ) object.view = Object.assign( {}, data.view );

				break;

			case 'AmbientLight':

				object = new THREE.AmbientLight( data.color, data.intensity );

				break;

			case 'DirectionalLight':

				object = new THREE.DirectionalLight( data.color, data.intensity );

				break;

			case 'PointLight':

				object = new THREE.PointLight( data.color, data.intensity, data.distance, data.decay );

				break;

			case 'RectAreaLight':

				object = new THREE.RectAreaLight( data.color, data.intensity, data.width, data.height );

				break;

			case 'SpotLight':

				object = new THREE.SpotLight( data.color, data.intensity, data.distance, data.angle, data.penumbra, data.decay );

				break;

			case 'HemisphereLight':

				object = new THREE.HemisphereLight( data.color, data.groundColor, data.intensity );

				break;

			case 'LightProbe':

				object = new THREE.LightProbe().fromJSON( data );

				break;

			case 'SkinnedMesh':

				geometry = getGeometry( data.geometry );
			 	material = getMaterial( data.material );

				object = new THREE.SkinnedMesh( geometry, material );

				if ( data.bindMode !== undefined ) object.bindMode = data.bindMode;
				if ( data.bindMatrix !== undefined ) object.bindMatrix.fromArray( data.bindMatrix );
				if ( data.skeleton !== undefined ) object.skeleton = data.skeleton;

				break;

			case 'Mesh':

				geometry = getGeometry( data.geometry );
				material = getMaterial( data.material );

				object = new THREE.Mesh( geometry, material );

				break;

			case 'InstancedMesh':

				geometry = getGeometry( data.geometry );
				material = getMaterial( data.material );
				const count = data.count;
				const instanceMatrix = data.instanceMatrix;
				const instanceColor = data.instanceColor;

				object = new THREE.InstancedMesh( geometry, material, count );
				object.instanceMatrix = new THREE.BufferAttribute( new Float32Array( instanceMatrix.array ), 16 );
				if ( instanceColor !== undefined ) object.instanceColor = new THREE.InstancedBufferAttribute( new Float32Array( instanceColor.array ), instanceColor.itemSize );

				break;

			case 'LOD':

				object = new THREE.LOD();

				break;

			case 'Line':

				object = new THREE.Line( getGeometry( data.geometry ), getMaterial( data.material ), data.mode );

				break;

			case 'LineLoop':

				object = new THREE.LineLoop( getGeometry( data.geometry ), getMaterial( data.material ) );

				break;

			case 'LineSegments':

				object = new THREE.LineSegments( getGeometry( data.geometry ), getMaterial( data.material ) );

				break;

			case 'PointCloud':
			case 'Points':

				object = new THREE.Points( getGeometry( data.geometry ), getMaterial( data.material ) );

				break;

			case 'Sprite':

				object = new THREE.Sprite( getMaterial( data.material ) );

				break;

			case 'Group':

				object = new THREE.Group();

				break;

			case 'Bone':

				object = new THREE.Bone();

				break;

			case 'Particle':

				object = ParticleEmitter.fromJSON( this.assets, data );

				break;

			case 'TextMesh':

				var fontAsset = this.assets.getFont( data.font );
				object = new TextMesh( data.text, getMaterial( data.material ), fontAsset, data.size, data.extruded, data.curveSegments, data.height, data.bevel, data.bevelThickness, data.bevelSize );

				break;

			default:

				object = new THREE.Object3D();

		}

		object.uuid = data.uuid;

		if ( data.name !== undefined ) object.name = data.name;

		if ( data.matrix !== undefined ) {

			object.matrix.fromArray( data.matrix );

			if ( data.matrixAutoUpdate !== undefined ) object.matrixAutoUpdate = data.matrixAutoUpdate;
			if ( object.matrixAutoUpdate ) object.matrix.decompose( object.position, object.quaternion, object.scale );

		} else {

			if ( data.position !== undefined ) object.position.fromArray( data.position );
			if ( data.rotation !== undefined ) object.rotation.fromArray( data.rotation );
			if ( data.quaternion !== undefined ) object.quaternion.fromArray( data.quaternion );
			if ( data.scale !== undefined ) object.scale.fromArray( data.scale );

		}

		if ( data.castShadow !== undefined ) {
			object.castShadow = data.castShadow;
		}
		if ( data.axesHelper !== undefined) {
			console.log("loading axesHelper: ",data.axesHelper);
			object.axesHelper = data.axesHelper
		};
		if ( data.axesHelperSize !== undefined) object.axesHelperSize = data.axesHelperSize;
		if ( data.receiveShadow !== undefined ) object.receiveShadow = data.receiveShadow;

		if ( data.shadow ) {

			if ( data.shadow.bias !== undefined ) object.shadow.bias = data.shadow.bias;
			if ( data.shadow.normalBias !== undefined ) object.shadow.normalBias = data.shadow.normalBias;
			if ( data.shadow.radius !== undefined ) object.shadow.radius = data.shadow.radius;
			if ( data.shadow.mapSize !== undefined ) object.shadow.mapSize.fromArray( data.shadow.mapSize );
			if ( data.shadow.camera !== undefined ) object.shadow.camera = this.parseObject( data.shadow.camera );

		}

		if ( data.visible !== undefined ) object.visible = data.visible;
		if ( data.frustumCulled !== undefined ) object.frustumCulled = data.frustumCulled;
		if ( data.renderOrder !== undefined ) object.renderOrder = data.renderOrder;
		if ( data.userData !== undefined ) object.userData = data.userData;
		if ( data.layers !== undefined ) object.layers.mask = data.layers;

		if ( data.children !== undefined ) {

			const children = data.children;

			for ( let i = 0; i < children.length; i ++ ) {

				object.add( this.parseObject( children[ i ], geometries, materials, textures, animations ) );

			}

		}

		if ( data.animations !== undefined ) {

			const objectAnimations = data.animations;

			for ( let i = 0; i < objectAnimations.length; i ++ ) {

				const uuid = objectAnimations[ i ];
				if (animations && animations[ uuid ]){
					object.animations.push( animations[ uuid ] );
				}


			}

		}

		if ( data.type === 'LOD' ) {

			if ( data.autoUpdate !== undefined ) object.autoUpdate = data.autoUpdate;

			const levels = data.levels;

			for ( let l = 0; l < levels.length; l ++ ) {

				const level = levels[ l ];
				const child = object.getObjectByProperty( 'uuid', level.object );

				if ( child !== undefined ) {

					object.addLevel( child, level.distance );

				}

			}

		}

		return object;

	}

	bindSkeletons( object, skeletons ) {

		if ( Object.keys( skeletons ).length === 0 ) return;

		object.traverse( function ( child ) {

			if ( child.isSkinnedMesh === true && child.skeleton !== undefined ) {

				const skeleton = skeletons[ child.skeleton ];

				if ( skeleton === undefined ) {

					console.warn( 'THREE.ObjectLoader: No skeleton found with UUID:', child.skeleton );

				} else {

					child.bind( skeleton, child.bindMatrix );

				}

			}

		} );

	}

	/* DEPRECATED */

	setTexturePath( value ) {

		console.warn( 'THREE.ObjectLoader: .setTexturePath() has been renamed to .setResourcePath().' );
		return this.setResourcePath( value );

	}

}

const TEXTURE_MAPPING = {
	UVMapping: THREE.UVMapping,
	CubeReflectionMapping: THREE.CubeReflectionMapping,
	CubeRefractionMapping: THREE.CubeRefractionMapping,
	EquirectangularReflectionMapping: THREE.EquirectangularReflectionMapping,
	EquirectangularRefractionMapping: THREE.EquirectangularRefractionMapping,
	CubeUVReflectionMapping: THREE.CubeUVReflectionMapping,
	// CubeUVRefractionMapping: THREE.CubeUVRefractionMapping
	//TODO: add CubeUVRefractionMapping not implemented in three.js
	CubeUVRefractionMapping: THREE.CubeUVReflectionMapping
};

const TEXTURE_WRAPPING = {
	RepeatWrapping: THREE.RepeatWrapping,
	ClampToEdgeWrapping: THREE.ClampToEdgeWrapping,
	MirroredRepeatWrapping: THREE.MirroredRepeatWrapping
};

const TEXTURE_FILTER = {
	NearestFilter: THREE.NearestFilter,
	NearestMipmapNearestFilter: THREE.NearestMipmapNearestFilter,
	NearestMipmapLinearFilter: THREE.NearestMipmapLinearFilter,
	LinearFilter: THREE.LinearFilter,
	LinearMipmapNearestFilter: THREE.LinearMipmapNearestFilter,
	LinearMipmapLinearFilter: THREE.LinearMipmapLinearFilter
};

var Geometries = /*#__PURE__*/Object.freeze({
	__proto__: null,
	BoxGeometry: THREE.BoxGeometry,
	BoxBufferGeometry: THREE.BoxBufferGeometry,
	CircleGeometry: THREE.CircleGeometry,
	CircleBufferGeometry: THREE.CircleBufferGeometry,
	ConeGeometry: THREE.ConeGeometry,
	ConeBufferGeometry: THREE.ConeBufferGeometry,
	CylinderGeometry: THREE.CylinderGeometry,
	CylinderBufferGeometry: THREE.CylinderBufferGeometry,
	DodecahedronGeometry: THREE.DodecahedronGeometry,
	DodecahedronBufferGeometry: THREE.DodecahedronBufferGeometry,
	EdgesGeometry: THREE.EdgesGeometry,
	ExtrudeGeometry: THREE.ExtrudeGeometry,
	ExtrudeBufferGeometry: THREE.ExtrudeBufferGeometry,
	IcosahedronGeometry: THREE.IcosahedronGeometry,
	IcosahedronBufferGeometry: THREE.IcosahedronBufferGeometry,
	LatheGeometry: THREE.LatheGeometry,
	LatheBufferGeometry: THREE.LatheBufferGeometry,
	OctahedronGeometry: THREE.OctahedronGeometry,
	OctahedronBufferGeometry: THREE.OctahedronBufferGeometry,
	ParametricGeometry: ParametricGeometry,
	ParametricBufferGeometry: ParametricGeometry,
	PlaneGeometry: THREE.PlaneGeometry,
	PlaneBufferGeometry: THREE.PlaneBufferGeometry,
	PolyhedronGeometry: THREE.PolyhedronGeometry,
	PolyhedronBufferGeometry: THREE.PolyhedronBufferGeometry,
	RingGeometry: THREE.RingGeometry,
	RingBufferGeometry: THREE.RingBufferGeometry,
	ShapeGeometry: THREE.ShapeGeometry,
	ShapeBufferGeometry: THREE.ShapeBufferGeometry,
	SphereGeometry: THREE.SphereGeometry,
	SphereBufferGeometry: THREE.SphereBufferGeometry,
	TetrahedronGeometry: THREE.TetrahedronGeometry,
	TetrahedronBufferGeometry: THREE.TetrahedronBufferGeometry,
	TextGeometry: TextGeometry,
	TextBufferGeometry: TextGeometry,
	TorusGeometry: THREE.TorusGeometry,
	TorusBufferGeometry: THREE.TorusBufferGeometry,
	TorusKnotGeometry: THREE.TorusKnotGeometry,
	TorusKnotBufferGeometry: THREE.TorusKnotBufferGeometry,
	TubeGeometry: THREE.TubeGeometry,
	TubeBufferGeometry: THREE.TubeBufferGeometry,
	WireframeGeometry: THREE.WireframeGeometry
});

var Curves = /*#__PURE__*/Object.freeze({
	__proto__: null,
	ArcCurve: THREE.ArcCurve,
	CatmullRomCurve3: THREE.CatmullRomCurve3,
	CubicBezierCurve: THREE.CubicBezierCurve,
	CubicBezierCurve3: THREE.CubicBezierCurve3,
	EllipseCurve: THREE.EllipseCurve,
	LineCurve: THREE.LineCurve,
	LineCurve3: THREE.LineCurve3,
	QuadraticBezierCurve: THREE.QuadraticBezierCurve,
	QuadraticBezierCurve3: THREE.QuadraticBezierCurve3,
	SplineCurve: THREE.SplineCurve
});

export { ObjectLoader };
