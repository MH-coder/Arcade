
/**
 * @author mrdoob / http://mrdoob.com/
 */

import { RotateControls } from "../controls/RotateControls";
import isDefined from "../utils";
import { ObjectLoader } from "../utils/ObjectLoader.js";
var APP = {

	Player: function ( assets ) {

		var self = this;

		var renderer = new THREE.WebGLRenderer( { antialias: true } );
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.outputEncoding = THREE.sRGBEncoding;

		var pmremGenerator = new THREE.PMREMGenerator( renderer );
		pmremGenerator.compileCubemapShader();
		pmremGenerator.compileEquirectangularShader();

		var loader = new ObjectLoader( assets );
		var camera, scene, composer, defaultCamera;

		var cameraControls = [];
		var dragControls;
		var transformControls = {};

		var objectPositions = {};
		var dragObjects = [];
		var transformObjects = [];
		var selectables = {};
		var movements = {};

		var vrButton = VRButton.createButton( renderer );

		var events = {};

		var dom = document.createElement( 'div' );
		dom.appendChild( renderer.domElement );

		this.dom = dom;

		this.width = 500;
		this.height = 500;

		this.keyboardState = new KeyboardState();
		this.mouseState = new MouseState();
		this.assets = assets;
		this.attributes = {};
		this.attributeTextMap = {};
		this.tags = {};
		this.animations = [];
		this.timelineConnects = [];
		this.animationConnects = [];
		this.audios = [];
		this.actions = {};
		this.mixer = null;
		this.mixers = [];
		this.filter = false;
		this.filters = {};
		this.timers = [];
		this.collisionState = [];

		this.load = function ( json ) {
			this.autostart = json.autostart;

			this.keyboardState.init();
			this.mouseState.init();

			var project = json.project;
			var objects = json.objects;

			renderer.shadowMap.enabled = project.shadows === true;
			renderer.xr.enabled = project.vr === true;
			self.filter = project.filter;

			//need for support old project publications
			defaultCamera = loader.parse( json.camera );

			this.setScene( loader.parse( json.scene ) );
			this.setCamera( scene.userData.activeCamera );
			this.setComposer();
			this.setDragControls();
			this.setSpotLights();

			self.filterEnabled = json.filterEnabled;
			self.attributes = JSON.parse( JSON.stringify( json.attributes ) );
			self.attributeTextMap = json.attributeTextMap ? JSON.parse( JSON.stringify( json.attributeTextMap ) ) : {};
			self.tags = json.tags;
			self.animations = [];
			self.timelineConnects = [];
			self.animationConnects = [];

			for ( var i = 0; i < json.timelines.length; i ++ ) {

				var t = json.timelines[ i ];
				var tracks = [];
				var animation_audios = [];

				for ( var j = 0, n = t.tracks.length; j !== n; ++ j ) {

					var spec = t.tracks[ j ];

					if ( ! spec.audio ) {

						var track = new THREE[ spec.type ]( spec.propertyPath, [ 0 ], spec.initialValue, spec.interpolation );

						track.times = Array.prototype.slice.call( track.times );
						track.values = Array.prototype.slice.call( track.values );

						var channel = t.channels[ spec.propertyPath ];

						var _setArray = function ( dst, src ) {

							dst.length = 0;
							dst.push.apply( dst, src );

						};

						_setArray( track.times, channel.times );
						_setArray( track.values, channel.values );

						tracks.push( track );

					} else {

						var asset = assets.get( 'Audio', 'id', parseInt( spec.id ) );
						var audio = MediaHelper.cloneAudio( asset.audio );
						audio.delayTime = spec.delayTime;
						audio.play();
						audio.stop();
						animation_audios.push( audio );
						self.audios.push( audio );

					}

				}

				var mixer = new THREE.AnimationMixer( scene );
				var anim = mixer.clipAction( new THREE.AnimationClip( `clip_${i + 1}`, t.duration, tracks ) );
				var aaa = new AnimationControls( mixer, anim, animation_audios  );

				self.animations.push( aaa );
				self.mixers.push( mixer );

			}

			self.setFilters();

			// if ( scene.userData.background ) {

			// 	if ( scene.userData.background.type == 'Texture' ) {
			// 		var asset = assets.get( 'Image', 'id', scene.userData.background.id );
			// 		if(asset){
			// 			scene.background = asset.texture;
			// 			scene.environment = null;
			// 		}

			// 	} else {
			// 		asset = assets.get( 'Environment', 'id', scene.userData.background.id );
			// 		if(!asset){
			// 			asset = assets.get( 'Image', 'id', scene.userData.background.id );
			// 		}
			// 		if(asset){
			// 			var backgroundEquirectangularTexture = asset.texture;
			// 			var pmremTexture = pmremGenerator.fromEquirectangular( backgroundEquirectangularTexture ).texture;

			// 			var renderTarget = new THREE.WebGLCubeRenderTarget( 512 );
			// 			renderTarget.fromEquirectangularTexture( renderer, backgroundEquirectangularTexture );
			// 			renderTarget.toJSON = function () {

			// 				return null;

			// 			}; // TODO Remove hack

			// 			scene.background = renderTarget;
			// 		}

			// 	}

			// }
			switch(scene.userData.selectedBackground){
				case 'None':
					break;
				case 'Color':
					break;
				case 'Texture':
					let textureBG = assets.get( 'Image', 'id', scene.userData.backgroundTexture.id );
					if(textureBG)
						scene.background = textureBG.texture;
					break;
				case 'Equirectangular':
					let asset = assets.get( 'Environment', 'id', scene.userData.background.id );
					if(!asset)
						asset = assets.get( 'Image', 'id', scene.userData.background.id );
					if(asset && asset.texture){
						let backgroundEquirectangularTexture = asset.texture;
						backgroundEquirectangularTexture.mapping = THREE.EquirectangularReflectionMapping;
						scene.background = backgroundEquirectangularTexture;
					}
					break;
				default: 
					break;
			}
			// if ( scene.userData.backgroundTexture ) {

			// 	var asset = assets.get( 'Image', 'id', scene.userData.backgroundTexture.id );

			// 	if( asset ) {

			// 		scene.background = asset.texture;

			// 		// scene.environment = null;

			// 	}

			// } else if ( scene.userData.background ) {

			// 	asset = assets.get( 'Environment', 'id', scene.userData.background.id );

			// 	if ( !asset ) {

			// 		asset = assets.get( 'Image', 'id', scene.userData.background.id );

			// 	}

			// 	if ( asset ) {

			// 		var backgroundEquirectangularTexture = asset.texture;

			// 		backgroundEquirectangularTexture.mapping = THREE.EquirectangularReflectionMapping;
			// 		scene.background = backgroundEquirectangularTexture;
			// 	}
			// }


			events = {
				init: [],
				start: [],
				stop: [],
				keydown: [],
				keyup: [],
				mousedown: [],
				mouseup: [],
				mousemove: [],
				wheel: [],
				touchstart: [],
				touchend: [],
				touchmove: [],
				update: []
			};

			for ( var uuid of objects ) {

				var object = scene.getObjectByProperty( 'uuid', uuid );
				if ( ! object ) object = defaultCamera;

				self.addScript( ScriptHelper.generate( 'movement' ), object );

				if ( object.userData.connection ) self.addScript( ScriptHelper.generate( 'connection', object ), object );

			}

			self.addScript( ScriptHelper.generate( 'timeline_connect' ) );
			self.addScript( ScriptHelper.generate( 'animation_connect' ) );


			for ( var script of json.scripts ) {
				self.addScript( script.source );
			}

			dispatch( events.init, arguments );

		};

		this.setCamera = function ( uuid ) {

			camera = scene.getObjectByProperty( "uuid", uuid );

			if ( ! camera ) {

				camera = defaultCamera;

			}
			//console.log(camera);
			this.cameraUUID = camera.uuid;
			this.camera = camera;

			camera.aspect = this.width / this.height;
			camera.updateProjectionMatrix();

		};

		this.setScene = function ( value ) {

			scene = value;

			this.mixer = new THREE.AnimationMixer( scene );

			scene.traverse( function ( child ) {

				if ( child.animations.length > 0 ) {

					self.actions[ child.uuid ] = {};

					child.animations.forEach( ( animation ) => {

						self.actions[ child.uuid ][ animation.uuid ] = self.mixer.clipAction( animation, child );

					} );

				}

			} );

		};

		this.setFilters = function () {

			if ( scene.userData.filter && scene.userData.filter.length > 0 ) {

				scene.userData.filter.map( f => {

					if ( f.enabled ) {

						self.filters[ f.type.toLowerCase() ] = new FilterHelper[ f.name ]( composer, f, renderer, scene, camera );

					}

				} );

			}

		};

		this.setComposer = function () {

			SceneHelper.initComposer = function () {

				composer = new EffectComposer( renderer );
				composer.addPass( new RenderPass( scene, camera ) );

			};

			SceneHelper.updateComposer = function () {

				this.initComposer();
				self.setFilters();

			};

			SceneHelper.initComposer();

		};

		this.setSpotLights = function () {

			scene.traverse( function( node ) {

				if ( node.isSpotLight ) {

					var target = node.userData.target;

					if ( target.uuid == 'none' ) {

						scene.add( node.target );
						node.target.position.fromArray( target.position );

					} else {

						node.target = scene.getObjectByProperty( 'uuid', target.uuid, true );

					}

					node.updateMatrixWorld( true );

				}

			} );

		};

		this.setMovement = function ( uuid, movement ) {
			movements[ uuid ] = movement;

		};

		this.getMovement = function ( uuid ) {
			// TODO:: Remove reference to defaultCamera
			var id = movements[ uuid ] ? uuid : defaultCamera.uuid;
			return movements[ id ];
		};

		this.updateMovement = function ( uuid, attribute, input ) {
			// TODO:: Remove reference to defaultCamera
			var id = movements[ uuid ] ? uuid : defaultCamera.uuid;
			movements[ id ].updateMovement( attribute, input );
		};

		this.updateLimit = function ( uuid, attribute, input ) {
			// TODO:: Remove reference to defaultCamera
			var id = movements[ uuid ] ? uuid : defaultCamera.uuid;

			movements[ id ].updateLimit( attribute, input );

		};

		this.setSize = function ( width, height ) {

			this.width = width;
			this.height = height;

			if ( camera ) {

				camera.aspect = this.width / this.height;
				camera.updateProjectionMatrix();

			}

			if ( renderer ) {

				renderer.setSize( width, height );

			}

			if ( composer ) {

				composer.setSize( width, height );

			}

		};

		function dispatch( array, event ) {

			for ( var i = 0, l = array.length; i < l; i ++ ) {

				array[ i ]( event );

			}

		}

		var time, prevTime;

		function animate() {

			time = performance.now();

			try {

				dispatch( events.update, { time: time, delta: time - prevTime } );

			} catch ( e ) {

				console.error( ( e.message || e ), ( e.stack || "" ) );

			}

			self.filter ? composer.render() : renderer.render( scene, camera );

			self.mixers.forEach( mixer => {

				mixer.update( ( time - prevTime ) / 1000 );

			} );

			self.mixer.update( ( time - prevTime ) / 1000 );

			prevTime = time;



			self.keyboardState.update();
			self.mouseState.update();

		}

		this.play = function () {

			if ( renderer.xr.enabled ) dom.appendChild( vrButton );

			prevTime = performance.now();

			document.addEventListener( 'keydown', onDocumentKeyDown );
			document.addEventListener( 'keyup', onDocumentKeyUp );
			document.addEventListener( 'mousedown', onDocumentMouseDown );
			document.addEventListener( 'mouseup', onDocumentMouseUp );
			document.addEventListener( 'mousemove', onDocumentMouseMove );
			document.addEventListener( 'wheel', onDocumentWheel );
			document.addEventListener( 'touchstart', onDocumentTouchStart );
			document.addEventListener( 'touchend', onDocumentTouchEnd );
			document.addEventListener( 'touchmove', onDocumentTouchMove );

			dispatch( events.start, arguments );

			renderer.setAnimationLoop( animate );

		};

		this.stop = function () {

			if ( renderer.xr.enabled ) vrButton.remove();

			document.removeEventListener( 'keydown', onDocumentKeyDown );
			document.removeEventListener( 'keyup', onDocumentKeyUp );
			document.removeEventListener( 'mousedown', onDocumentMouseDown );
			document.removeEventListener( 'mouseup', onDocumentMouseUp );
			document.removeEventListener( 'mousemove', onDocumentMouseMove );
			document.removeEventListener( 'wheel', onDocumentWheel );
			document.removeEventListener( 'touchstart', onDocumentTouchStart );
			document.removeEventListener( 'touchend', onDocumentTouchEnd );
			document.removeEventListener( 'touchmove', onDocumentTouchMove );

			dispatch( events.stop, arguments );

			renderer.setAnimationLoop( null );

		};

		this.dispose = function () {

			dragControls.dispose();
			dragControls.removeEventListener( 'dragstart' );
			dragControls.removeEventListener( 'dragend' );
			dragControls.removeEventListener( 'drag' );

			for ( const uuid in transformControls ) {

				if (transformControls[uuid]){
					transformControls[ uuid ].removeEventListener( 'dragging-changed' );
					transformControls[ uuid ].detach();
					transformControls[ uuid ].dispose();
				}
				
			}

			for ( const pass of composer.passes ) {

				for ( const key of Object.keys( pass ) ) {

					if ( pass[ key ] !== undefined && ! pass[ key ].isScene && typeof pass[ key ].dispose === "function" ) {

						pass[ key ].dispose();

					}

				}

			}

			renderer.clear();
			renderer.dispose();

			self.keyboardState.dispose();
			self.mouseState.dispose();

			for ( const audio of self.audios ) {

				audio.stop();

			}

			for ( let i = 0; i < self.animations.length; i ++ ) {

				self.animations[ i ].dispose();
				self.mixers[ i ] = null;

			}

			for ( var uuid in self.actions ) {

				for ( var id in self.actions[ uuid ] ) {

					self.actions[ uuid ][ id ].stop();
					cancelAnimationFrame( id );

				}

			}
			self.actions = {};

			for ( const key in self.filters ) {

				delete self.filters[ key ];

			}

			for ( const timerId of self.timers ) {

				clearInterval( timerId );

			}

			self.animations = [];
			self.timelineConnects = [];
			self.animationConnects = [];
			self.mixers = [];
			self.timers = [];
			self.collisionState = [];
			self.filters = {};

			camera = null;
			scene = null;
			composer = null;

			cameraControls = [];
			objectPositions = {};
			dragControls = null;
			dragObjects = [];
			transformControls = {};
			transformObjects = {};
			selectables = {};
			movements = {};

		};

		this.addScript = function ( script, object ) {

			var scriptWrapParams = 'player,composer,renderer,scene,camera';
			var scriptWrapResultObj = {};

			for ( var eventKey in events ) {

				scriptWrapParams += ',' + eventKey;
				scriptWrapResultObj[ eventKey ] = eventKey;

			}

			var scriptWrapResult = JSON.stringify( scriptWrapResultObj ).replace( /\"/g, '' );

			var functions;

			if ( ! object ) {

				functions = ( new Function( scriptWrapParams, script + '\nreturn ' + scriptWrapResult + ';' ) )( self, composer, renderer, scene, camera );

			} else {

				functions = ( new Function( scriptWrapParams, script + '\nreturn ' + scriptWrapResult + ';' ).bind( object ) )( self, composer, renderer, scene, camera );

			}

			for ( var name in functions ) {

				if ( functions[ name ] === undefined ) continue;

				if ( events[ name ] === undefined ) {

					console.warn( 'APP.Player: Event type not supported (', name, ')' );
					continue;

				}

				events[ name ].push( functions[ name ].bind( object ) );

			}

		};

		this.addSelectable = function ( uuid, selectable ) {

			if ( selectable ) {

				selectables[ uuid ] = JSON.parse( JSON.stringify( selectable ) );

			} else {

				selectables[ uuid ] = {
					drag: {
						type: "none"
					},
					selected: false,
					canSelect: true,
					canDeselect: true
				};

			}

			// return this.addDragControl( scene.getObjectByProperty( 'uuid', uuid ) );
			// return this.addRotateControl( scene.getObjectByProperty( 'uuid', uuid ), {}//options
			//  );
			this.addTransformControl( scene.getObjectByProperty( 'uuid', uuid ) );
			return;
		};

		function updateTransformControlAxis( uuid, options ) {

			[ 'x', 'y', 'z' ].map( axis => {

				var key = 'show' + axis.toUpperCase();
				var value = options[ axis ] == "on" || options[ axis ] == true ? true : false;

				transformControls[ uuid ][ key ] = value;

			} );

		}

		function updateDragControlAxis( uuid, options ) {

			[ 'x', 'y', 'z' ].map( axis => {

				var value = options[ axis ] == "on" ? true : false;
				selectables[ uuid ].drag[ axis ] = value;

				if ( value == false ) {

					objectPositions[ uuid ] = dragObjects.find( x => x.uuid === uuid ).position.clone();

				}

			} );

		}

		this.updateSelectable = function ( uuid, options, selectable ) {
			const object = scene.getObjectByProperty( 'uuid', uuid );
			
			if (isDefined(options.selected)){
				selectables[ uuid ].selected = options.selected == "on" ? true : false;
			}
			if (isDefined(options.canSelect)){
				selectables[ uuid ].canSelect = options.canSelect == "on" ? true : false;
			}
			if (isDefined(options.canDeselect)){
				selectables[ uuid ].canDeselect = options.canDeselect == "on" ? true : false;
			}

			// console.log({options})
			var oldDragType = selectables[ uuid ].drag.type;
			// selectables[ uuid ].drag.type = options.dragType == 'transform handles' ? 'transform' : selectable.drag.type;

			if (isDefined(options.dragType)){
				selectables[ uuid ].drag.type = options.dragType == 'transform handles' ? 'transform' : options.dragType;
			}

			//check if axes are turned off/ on/ toggle
			if (isDefined(options.axis) && isDefined(options.value)){
				let newValue = null;
				switch (options.value){
					case "on":
						newValue=true;
						break;
					case "off":
						newValue= false;
						break;
					case "toggle":
						newValue = !(selectables[ uuid ].drag[options.axis])
						break;
					default:
						break;
				}
				selectables[ uuid ].drag[options.axis] = newValue 
			}

			if (isDefined(options.selected)){
				object.userData.selectionState = options.selected==="on" ? "is selected": "de-selected";
			}
			
			// console.log(options, selectables[uuid])
			// return;
			
			const newDragType = selectables[ uuid ].drag.type;

			if ( oldDragType == 'move' ) {

				var obj = dragObjects.find( x => x.uuid == uuid );
				var index = dragObjects.indexOf( obj );
				dragObjects.splice( index, 1 );

			} else if ( oldDragType == 'rotate' || oldDragType == 'transform' ) {

				delete transformObjects[ uuid ];

				if (transformControls[ uuid ]){
					transformControls[ uuid ].removeEventListener( 'dragging-changed' );
					transformControls[ uuid ].detach();
					transformControls[ uuid ].dispose();
					delete transformControls[ uuid ];
				}
			

			}

			switch(newDragType){
				case 'move': 
					if ( dragObjects.find( x => x.uuid == uuid ) == undefined ) {
						this.addDragControl( scene.getObjectByProperty( 'uuid', uuid ) );
					}
					// updateDragControlAxis( uuid, options );
					break;
				case  'rotate':  
					if ( transformObjects[ uuid ] == undefined ) {
	
						this.addRotateControl( scene.getObjectByProperty( 'uuid', uuid ), options );
	
					}
					break;

				case "transform": 
				    // if (!!object.userData.selectionState){
				    if (true){
						if ( transformObjects[ uuid ] == undefined ) {
	
							this.addTransformControl( scene.getObjectByProperty( 'uuid', uuid ) );
							// transformControls[ uuid ].attach( transformObjects[ uuid ] );
		
						}
						if (isDefined(options.show)){
							selectables[ uuid ].drag.show = options.show;
						}

						if ( options.show == 'always' || ( transformObjects[ uuid ].selectionState == 'is selected' ) ) {
		
							if (transformControls[ uuid ]){
								transformControls[ uuid ].attach( transformObjects[ uuid ] );
							}
						}
						
					}
					
					break;
				default:
					break;
			}			
			
		

		}

		this.removeDragControls = function (uuid){
			// move
			// if ( oldDragType == 'move' ) {

				var obj = dragObjects.find( x => x.uuid == uuid );
				var index = dragObjects.indexOf( obj );
				if (index>=0){
					dragObjects.splice( index, 1 );
				}

			// } else if ( oldDragType == 'rotate' || oldDragType == 'transform' ) {


				if (transformControls[ uuid ]){
					transformControls[ uuid ].removeEventListener( 'dragging-changed' );
					transformControls[ uuid ].detach();
					transformControls[ uuid ].dispose();
					delete transformControls[ uuid ];
				}
			

			// }
		}

		// camera controls

		this.addCameraControls = function ( control ) {

			cameraControls.push( control );

		}

		function enableCameraControls( bEnabled ) {

			for ( const control of cameraControls ) {

				if ( ! ( control instanceof FirstPersonControls ) ) control.enabled = bEnabled;

			}

		}

		// transform

		this.addTransformControl = function ( object ) {

			transformObjects[ object.uuid ] = object;

			var control = new TransformControls( camera, renderer.domElement );
			var selectable = selectables[ object.uuid ];

			if ( selectable.drag.show == 'always' || object.userData.selectionState == 'is selected' ) {
				control.attach( object );
				// control.attach( object );

			}

			control.addEventListener( 'dragging-changed', function ( event ) {

				enableCameraControls( ! event.value );

			} );

			scene.add( control );

			transformControls[ object.uuid ] = control;

			updateTransformControlAxis( object.uuid, selectable.drag );

		};

		function setTransformControlKey( key ) {

			for ( const uuid in transformObjects ) {

				var drag = selectables[ uuid ].drag;
				var control = transformControls[ uuid ];

				if ( drag.type == 'transform' ) {

					if ( drag.local === key ) {

						control.setSpace( control.space === "local" ? "world" : "local" );

					} else if ( drag.grid == key ) {

						control.setTranslationSnap( 1 );
						control.setRotationSnap( THREE.Math.degToRad( 15 ) );
						control.setScaleSnap( 0.25 );

					} else if ( drag.translate == key ) {

						control.setMode( "translate" );

					} else if ( drag.rotate == key ) {

						control.setMode( "rotate" );

					} else if ( drag.scale == key ) {

						control.setMode( "scale" );

					} else if ( drag.sizePlus == key ) {

						control.setSize( control.size + 0.1 );

					} else if ( drag.sizeMinus == key ) {

						control.setSize( Math.max( control.size - 0.1, 0.1 ) );

					} else if ( drag.toggleX == key ) {

						control.showX = ! control.showX;

					} else if ( drag.toggleY == key ) {

						control.showY = ! control.showY;

					} else if ( drag.toggleZ == key ) {

						control.showZ = ! control.showZ;

					} else if ( drag.toggleEnabled == key ) {

						control.enabled = ! control.enabled;

					}

				}

			}

		}

		// rotate

		this.addRotateControl = function ( object, options ) {

			transformObjects[ object.uuid ] = object;

			const selectable = 	selectables[ object.uuid ]

			var control = new RotateControls( camera, renderer.domElement );

			let axis = '';

			[ 'x', 'y', 'z' ].map( a => {

				if ( selectable.drag[ a ] == "on" || selectable.drag[ a ] == true ) {

					axis += a.toUpperCase();

				}

			} );

			control.setAxis( axis );
			control.attach( object );
			control.addEventListener( 'dragging-changed', function ( event ) {

				enableCameraControls( ! event.value );

			} );

			scene.add( control );

			transformControls[ object.uuid ] = control;

		};

		// drag

		this.setDragControls = function () {

			dragControls = new DragControls( dragObjects, camera, renderer.domElement );
			dragControls.addEventListener( 'hoveron', function ( event ) {

				enableCameraControls( false );

			} );
			dragControls.addEventListener( 'hoveroff', function ( event ) {

				enableCameraControls( true );

			} );
			dragControls.addEventListener( 'dragstart', function ( event ) {

				movements[ event.object.uuid ].dragging = true;

			} );
			dragControls.addEventListener( 'dragend', function ( event ) {

				movements[ event.object.uuid ].dragging = false;
				movements[ event.object.uuid ].detectCustomLimit();
				movements[ event.object.uuid ].posLimit = {
					x: null,
					y: null,
					z: null
				};

			} );
			dragControls.addEventListener( 'drag', function ( event ) {

				var object = event.object;
				var uuid = object.uuid;

				[ 'x', 'y', 'z' ].map( axis => {

					if ( selectables[ uuid ].drag[ axis ] == false ) {

						object.position[ axis ] = objectPositions[ uuid ][ axis ];

					}

				} );

			} );

		};

		this.addDragControl = function ( object ) {

			dragObjects.push( object );
			objectPositions[ object.uuid ] = object.position.clone();

		};

		function onDocumentKeyDown( event ) {

			dispatch( events.keydown, event );

			setTransformControlKey( event.key );

		}

		function onDocumentKeyUp( event ) {

			dispatch( events.keyup, event );

		}

		var onDownPosition = new THREE.Vector2();
		var onUpPosition = new THREE.Vector2();
		var onMovePosition = new THREE.Vector2();
		var INTERSECTED;

		function getMousePosition( dom, x, y ) {

			var rect = dom.getBoundingClientRect();
			return [ ( x - rect.left ) / rect.width, ( y - rect.top ) / rect.height ];

		}

		function getIntersects( point, objects ) {

			var raycaster = new THREE.Raycaster();
			var mouse = new THREE.Vector2();

			mouse.set( ( point.x * 2 ) - 1, - ( point.y * 2 ) + 1 );

			raycaster.setFromCamera( mouse, camera );

			return raycaster.intersectObjects( objects );

		}

		function handleClick() {

			
			if ( onDownPosition.distanceTo( onUpPosition ) === 0 ) {

				var intersects = getIntersects( onUpPosition, scene.children );

				if ( intersects.length > 0 ) {

					intersects.forEach(intersect=>{

						var object = intersect.object;

						var selectable = selectables[ object.uuid ];
						var state = object.userData.selectionState;

						object.userData.clicked = true;

						if (!state || state == 'is not selected' || state == 'de-selected') {

							object.userData.selectionState= "is selected";

							if ( selectable && selectable.drag.type == 'transform' && selectable.drag.show != 'always' &&  selectable.canSelect ) {

								if (transformControls[ object.uuid ]){
								
									transformControls[ object.uuid ].attach( object );
								}


							}

						} else if ( state == 'is selected' ) {

							if (selectable && selectable.canDeselect){
								object.userData.selectionState = 'de-selected';

								if ( selectable.drag.type == 'transform' && selectable.drag.show != 'always' ) {
									if (transformControls[ object.uuid ]){
										transformControls[ object.uuid ].detach();
									}
								}
							}
							}
						})
				

					

				}

			}

		}

		

		function checkObjectVisible(object)
		{
			let isVisible = object.visible;

			let parent = object.parent;
			while(parent)
			{
				if(!parent.visible) 
				{
					isVisible = false;
					break;
				}
				parent = parent.parent;
			}
			return isVisible;

		}

		function handleMove() {

			var intersects = getIntersects( onMovePosition, scene.children );

			if(INTERSECTED) 
				INTERSECTED.userData.cursorState = 'cursor is not over object';
			INTERSECTED = undefined;

			if ( intersects.length > 0 ) {

				
				
				// recursive check on parent is visible before setting this object to be the intersected one 
				for(let intersect of intersects)
				{
					if(checkObjectVisible(intersect.object) && intersect.face)
					{
						var object = intersect.object;
						object.userData.cursorState = 'cursor is over object';
						INTERSECTED = object;
						console.log(object)
						break; 
					}
				}

				// enableCameraControls( false );

			}

		}

		function onDocumentMouseDown( event ) {

			dispatch( events.mousedown, event );

			var array = getMousePosition( renderer.domElement, event.clientX, event.clientY );
			onDownPosition.fromArray( array );

		}

		function onDocumentMouseUp( event ) {

			dispatch( events.mouseup, event );

			var array = getMousePosition( renderer.domElement, event.clientX, event.clientY );
			onUpPosition.fromArray( array );
			handleClick();

		}

		function onDocumentMouseMove( event ) {

			dispatch( events.mousemove, event );

			var array = getMousePosition( renderer.domElement, event.clientX, event.clientY );
			onMovePosition.fromArray( array );
			handleMove();

		}

		function onDocumentWheel( event ) {

			dispatch( events.wheel, event );

		}

		function onDocumentTouchStart( event ) {

			dispatch( events.touchstart, event );

			var array = getMousePosition( container.dom, event.clientX, event.clientY );
			onDownPosition.fromArray( array );

		}

		function onDocumentTouchEnd( event ) {

			dispatch( events.touchend, event );

			var array = getMousePosition( container.dom, event.clientX, event.clientY );
			onUpPosition.fromArray( array );
			handleClick();

		}

		function onDocumentTouchMove( event ) {

			dispatch( events.touchmove, event );

			var array = getMousePosition( renderer.domElement, event.clientX, event.clientY );
			onMovePosition.fromArray( array );
			handleMove();

		}

	}

};

export { APP };
