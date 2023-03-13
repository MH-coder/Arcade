const { default: isDefined } = require("../utils");


window.ObjectControls = function ( object, scene, renderer, camera, player ) {

	const getLookAtTargetQuaternion = getLookAtTargetQuaternionFunction();
	this.getLookAtTargetQuaternion = getLookAtTargetQuaternion;


	var scope = this;

	this.object = object;

	if ( this.object.geometry && this.object.geometry.boundingSphere === null ) this.object.geometry.computeBoundingSphere();

	this.scene = scene;
	this.renderer = renderer;
	this.camera = camera;
	this.player = player;
	this.keyboardState = player.keyboardState;
	this.movement = object.userData.movement ? JSON.parse( JSON.stringify( object.userData.movement ) ) : undefined;

	if (this.movement){
		['lookAt', 'goTo'].forEach(property=>{
			if (this.movement[property] && this.movement[property].uuid==="none" ){
				delete this.movement[property];
			}
		})
		
	}

	this.selectable = object.userData.selectable ? JSON.parse( JSON.stringify( object.userData.selectable ) ) : undefined;

	var pos = this.object.getWorldPosition( new THREE.Vector3() );
	this.srcPos = pos;
	this.lookAtPos = pos;
	this.lookAtQuaternion= null;
	this.goToPos = pos; // expected to be in world axis; to be converted to local pos in this.update func

	this.clock = new THREE.Clock();
	this.controls = null;
	this.controlType = null;
	this.raycaster = null;

	this.moveForward = false;
	this.moveBackward = false;
	this.moveLeft = false;
	this.moveRight = false;
	this.canJump = false;
	this.prevTime = performance.now();
	this.velocity = new THREE.Vector3();
	this.direction = new THREE.Vector3();
	this.vertex = new THREE.Vector3();
	this.color = new THREE.Color();

	this.copy = {
		position: this.object.position.clone(),
		rotation: this.object.rotation.clone(),
		scale: this.object.scale.clone(),
	};

	this.validPos = this.object.position.clone();
	this.posLimit = {
		x: null,
		y: null,
		z: null
	};
	this.dragging = false;
	this.customLimitObjects = [];

	this.bounceDirection = new THREE.Vector3();

	this.updateLimit = function ( attribute, data ) {

		var id = attribute + 'Limit';
		var axis = data.axis.toUpperCase();
		var type = data.type == 'min' ? 'Min' : 'Max';
		var value = UtilsHelper.parseValue( data.value );
		var duration = UtilsHelper.parseValue( data.duration ) * 1000;

		if ( !scope.movement ) scope.movement = { };

		if ( !scope.movement[ id ] ) scope.movement[ id ] = {  };

		scope.movement[ id ][ axis + 'Enabled' ] = data.enabled == 'on';
		scope.movement[ id ][ axis + type ] = 0;

		if ( scope.movement[ id ][ axis + 'Enabled' ] ) {

			UtilsHelper.tween( scope.movement[ id ], axis + type, value, duration, data.easing, data.easingType );

		}

	};

	this.updateMovement = function ( attribute, data ) {

		switch ( attribute ) {

			case 'direction': case 'rotation': case 'grow':

				if ( scope.movement == undefined ) {
					scope.movement = { };
				}
				if(scope.movement[ attribute ] == undefined){
					scope.movement[ attribute ] = { x: 0, y: 0, z: 0 };
				}

				if (data.local == 'local' && attribute != 'grow'){
					scope.movement[ attribute ]['local'] = true;
				}

				/*
				var offset = new THREE.Vector3();
				offset[data.axis] = UtilsHelper.parseValue( data.value );

				if (data.local == 'local1'){
					var worldPosition = new THREE.Vector3();
					var worldQuaternion = new THREE.Quaternion();
					var worldScale = new THREE.Vector3();

					scope.object.matrixWorld.decompose( worldPosition, worldQuaternion, worldScale );

					offset.applyQuaternion( worldQuaternion );
					UtilsHelper.tweenVector( scope.movement[ attribute ], offset, UtilsHelper.parseValue( data.duration ) * 1000, data.easing, data.easingType );
				}else{
					UtilsHelper.tween( scope.movement[ attribute ], data.axis, UtilsHelper.parseValue( data.value ), UtilsHelper.parseValue( data.duration ) * 1000, data.easing, data.easingType );
				}
				*/

				UtilsHelper.tween( scope.movement[ attribute ], data.axis, UtilsHelper.parseValue( data.value ), UtilsHelper.parseValue( data.duration ) * 1000, data.easing, data.easingType );

				break;

			case 'go to': case 'look at':

				if (!this.movement) this.movement = {}; 

				const KEY = attribute === "go to"? "goTo": "lookAt";

				if (!this.movement[KEY] ){
					this.movement[KEY] = {
						uuid: 'none',
						xEnabled:true,
						yEnabled:true,
						zEnabled:true
					};
					if (KEY==="goTo"){
						this.movement.goTo.speed=1;
					}else{
						this.movement.lookAt.drag= 0;
					}
				}

				if (attribute === "go to"){
					scope.movement.goTo.uuid= data.uuid;
				}else if (attribute === "look at"){
					scope.movement.lookAt.uuid = data.uuid === "cursor location" ? "cursor":data.uuid;				
				}


				const isAboutAxisEnabling = data.enableOrDrag === "enable in";

				if (isAboutAxisEnabling && data.uuid !== "cursor location"){
					let axisEnabled = data.axis + "Enabled";
					if (!isDefined(data[ axisEnabled ])){
						break;
					}
					if (typeof data[ axisEnabled ] === "boolean" ){
						scope.movement[KEY][ axisEnabled ] = data[ axisEnabled ]
					}else{
						scope.movement[KEY][ axisEnabled ] = data[ axisEnabled ] === "on" ? true : false;
						
					}
					break;
				}

				if (attribute === "go to"){
					if (scope.movement.goTo){

						const isObjectUuid = scope.movement.goTo.uuid != 'none' && scope.movement.goTo.uuid != 'cursor' && scope.movement.goTo.uuid;
							
					
						if ( scope.movement.goTo.uuid == "location" ) {

							// if properties are defined in data and not axis specifc data
							if (!data.axis){
								const duration = (UtilsHelper.parseValue( data.duration || data.speedSeconds) ?? 0) * 1000;
								const speed = UtilsHelper.parseValue( data.speed ) ?? 1;

								scope.movement.goTo.duration=  duration;
								scope.movement.goTo.endSpeed=  speed;

								UtilsHelper.tween( scope.movement.goTo, 'speed', speed, duration, data.easing, data.easingType );

								break;
							}else{
								
								var value = UtilsHelper.parseValue( data.value );
								
								let {duration, endSpeed} = scope.movement.goTo;

								// if there is no speed defined i.e main properties not defined in the logic block, and this command is only for moveing object in one axis;

								if (!isDefined(endSpeed)){

									const duration = (UtilsHelper.parseValue( data.duration || data.speedSeconds) ?? 0) *1000;
									
									UtilsHelper.tween( scope.goToPos, data.axis, value, duration, data.easing, data.easingType );

									break;

								}else{

									UtilsHelper.tween( scope.movement.goTo, 'speed', endSpeed, duration, data.easing, data.easingType );

									scope.goToPos[data.axis]= value;
								}

								
							}
	
							
							
						
						// if  goto object
						} else if (isObjectUuid) {

							const speed = UtilsHelper.parseValue( data.speed ) ?? 1;

							const duration = (UtilsHelper.parseValue( data.speedSeconds ) ?? 0) * 1000; 

							let targetObj = scope.scene.getObjectByProperty('uuid', scope.movement.goTo.uuid);

							if (!targetObj){
								console.warn(`Goto: No object with uuid:${scope.movement.goTo.uuid} found`)
								break;
							}

							scope.goToPos = targetObj.position;
							UtilsHelper.tween( scope.movement.goTo, 'speed', speed, duration, data.easing, data.easingType );
	
						}
					}
				}else if(attribute === "look at"){
					const isObjectUuid =scope.movement.lookAt.uuid != 'none' && scope.movement.lookAt.uuid != 'cursor' && scope.movement.lookAt.uuid; 
					if ( scope.movement.lookAt.uuid == "location" ) {

						// if properties are defined in data and not axis specifc data
						if (!data.axis){

							const duration = (UtilsHelper.parseValue( data.duration || data.speedSeconds) ?? 0) * 1000;
							const drag = UtilsHelper.parseValue( data.drag ) ?? 0;

							scope.movement.lookAt.duration=  duration;
							scope.movement.lookAt.endDrag=  drag;

							UtilsHelper.tween( scope.movement.lookAt, 'drag', drag, duration, data.easing, data.easingType );

							break;
						}	else {
							let {endDrag, duration} = scope.movement.lookAt;


							// if endDrag is not set, set it to duration instantly

							if (!endDrag){
								duration=0;

								endDrag = (UtilsHelper.parseValue( data.duration || data.speedSeconds) ?? 0);

								UtilsHelper.tween( scope.movement.lookAt, 'drag', endDrag, duration, data.easing, data.easingType );
							}

							var value = UtilsHelper.parseValue( data.value ) ;

							if (typeof value !== "number") break;
							
							scope.lookAtPos[data.axis]= value;

							const lookAtPos = scope.lookAtPos;
							
							// creating a targetObj to mimic lookAt Object

							const targetObj = new THREE.Object3D();
							
							targetObj.position.set(lookAtPos.x ?? scope.object.position.x, lookAtPos.y ??scope.object.position.y, lookAtPos.z ?? scope.object.position.z*1.1);

							scope.object.add(targetObj);

							let lookAtTargetQuaternion = getLookAtTargetQuaternion({object:this.object, target:targetObj, axes:{xEnabled:true, yEnabled:true, zEnabled:true}});
							
							scope.lookAtQuaternion= lookAtTargetQuaternion;
							
							targetObj.parent.remove(targetObj)
							break;
						}

						

					// if lookat object
					} else if (isObjectUuid  ) {

						const drag = UtilsHelper.parseValue( data.speed ) ?? 0; 
						const duration =UtilsHelper.parseValue( data.speedSeconds ) * 1000; 

						
						const targetObj = scene.getObjectByProperty('uuid', scope.movement.lookAt.uuid);

						if (!targetObj){
							console.warn(`No object with uuid:'${scope.movement.lookAt.uuid}' found to look at `);
							break;
						}

						let lookAtTargetQuaternion = getLookAtTargetQuaternion({object:this.object, target:targetObj, axes:scope.movement.lookAt});
						
						scope.lookAtQuaternion= lookAtTargetQuaternion;
						scope.movement.lookAt.drag = scope.movement.lookAt.drag ?? 0; 

						UtilsHelper.tween( scope.movement.lookAt, 'drag', drag, duration, data.easing, data.easingType );
						
					} else if (scope.movement.lookAt.uuid === "cursor"){
						this.renderer.domElement.addEventListener( 'mousemove', this.handleMouseMove, false );
					}
				}

				break;
			case 'controls':

				if (data.control === "none"){
					if ( this.controls != null ) {

						this.controls.dispose();
			
					}
				}
				
				if ( scope.movement && scope.movement.controller.type != 'none' && this.controlType == data.control ) {

					switch ( data.control ) {

						case 'keyboard':
							{
							var array = data.direction.split(' ');
							array = array.map(x => x.replace('+', 'Plus ').replace('-', 'Minus '));
							if ( data.movement == 'global movements' ) {
								array.unshift( 'global' );
							}
							var key = UtilsHelper.toCamelCase( array.join(' ') ) + 'Speed';
							var value = UtilsHelper.parseValue( data.speed );
							var duration = UtilsHelper.parseValue( data.duration ) * 1000;
							UtilsHelper.tween( scope.movement.controller, key, value, duration, data.easing, data.easingType );
							break;
						}

						case 'bounce':
							var value = UtilsHelper.parseValue( data.speed );
							var duration = UtilsHelper.parseValue( data.duration ) * 1000;
							this.bounceDirection[ data.axis ] = UtilsHelper.parseValue( data.start );
							UtilsHelper.tween( scope.movement.controller, 'speed', value, duration, data.easing, data.easingType );
							break;

						case 'orbit':

							switch ( data.mode ) {

								case 'center':
									this.controls.target = new THREE.Vector3(
										...(['x', 'y','z'].map((axis)=>{
											let axisName = `orbitCenter${axis.toUpperCase()}`; 										return UtilsHelper.parseValue(data[axisName] ?? data[axis] );

										}))
									);
									break;

								case 'zoom':
									this.controls.enableZoom = data.enabled == 'on';
									this.controls.minDistance = UtilsHelper.parseValue( data.min );
									this.controls.maxDistance = UtilsHelper.parseValue( data.max );
									break;

								case 'zoom speed':
									UtilsHelper.tween( this.controls, 'zoomSpeed', UtilsHelper.parseValue( data.value ), UtilsHelper.parseValue( data.duration ) * 1000, data.easing, data.easingType );
									break;

								case 'orbit':
									this.controls.enableOrbit = data.enabled == 'on';
									this.controls.minAzimuthAngle = UtilsHelper.parseValue( data.min );
									this.controls.maxAzimuthAngle = UtilsHelper.parseValue( data.max );
									break;

								case 'picth':
									this.controls.enablePitch = data.enabled == 'on';
									this.controls.minPolarAngle = UtilsHelper.parseValue( data.min );
									this.controls.maxPolarAngle = UtilsHelper.parseValue( data.max );
									break;

							}

							break;

						case 'map':

							switch ( data.mode ) {

								case 'zoom':
									this.controls.enableZoom = data.enabled == 'on';
									this.controls.minDistance = UtilsHelper.parseValue( data.min );
									this.controls.maxDistance = UtilsHelper.parseValue( data.max );
									break;

								case 'zoom speed':
									UtilsHelper.tween( this.controls, 'zoomSpeed', UtilsHelper.parseValue( data.value ), UtilsHelper.parseValue( data.duration ) * 1000, data.easing, data.easingType );
									break;

							}

							break;

						case 'pointer lock':
							var key = UtilsHelper.toCamelCase( data.direction.replace('+', 'Plus ').replace('-', 'Minus ') );
							if (data.direction != 'Y Position') {
								key += 'Speed';
							}
							var value = UtilsHelper.parseValue( data.speed );
							var duration = UtilsHelper.parseValue( data.duration ) * 1000;
							UtilsHelper.tween( scope.movement.controller, key, value, duration, data.easing, data.easingType );
							break;

						case 'lookAt':
							scope.movement.controller.uuid = data.uuid;
							break;

						case 'follow':
							scope.movement.controller.uuid = data.uuid;
							UtilsHelper.tween( scope.movement.controller, 'distance', UtilsHelper.parseValue( data.distance ), UtilsHelper.parseValue( data.duration ), data.easing, data.easingType );
							break;

						case 'WASDRF':
							var key = data.mode == 'movement speed' ? 'movementSpeed' : 'pointerSpeed';
							var value = data.mode == 'movement speed' ? UtilsHelper.parseValue( data.value ) : UtilsHelper.parseValue( data.value ) / 1000;
							var duration = UtilsHelper.parseValue( data.duration ) * 1000;

							UtilsHelper.tween( this.controls, key, value, duration, data.easing, data.easingType );
							break;



					}

				}

				break;
		}

	};

	this.createOrbitCameraControls = function () {

		var controller = this.movement.controller;
		this.controls = new OrbitControls( this.object, this.renderer.domElement );
		const {orbitCenterX, orbitCenterY, orbitCenterZ} = controller; this.controls.target = new THREE.Vector3( orbitCenterX ?? controller.x, orbitCenterY ?? controller.y, orbitCenterZ ?? controller.z );
		this.controls.enableZoom = controller.zoom;
		this.controls.zoomSpeed = controller.zoomSpeed;
		this.controls.minDistance = controller.minDistanceOrbit;
		this.controls.maxDistance = controller.maxDistanceOrbit;

		this.controls.enableOrbit = controller.horizontal;
		this.controls.minAzimuthAngle = THREE.MathUtils.degToRad( controller.minHorizontal );
		this.controls.maxAzimuthAngle = THREE.MathUtils.degToRad( controller.maxHorizontal );

		this.controls.enablePitch = controller.rotational;
		this.controls.minPolarAngle = THREE.MathUtils.degToRad( controller.minRotational );
		this.controls.maxPolarAngle = THREE.MathUtils.degToRad( controller.maxRotational );

	};

	this.createMapCameraControls = function () {

		var controller = this.movement.controller;
		this.controls = new MapControls( this.object, this.renderer.domElement );
		this.controls.enableZoom = controller.zoomMap;
		this.controls.zoomSpeed = controller.zoomSpeedMap;
		this.controls.minDistance = controller.minDistanceMap;
		this.controls.maxDistance = controller.maxDistanceMap;

	};

	this.createPointerLockCameraControls = function () {

		this.controls = new PointerLockControls( this.object, document.body );
		this.controls.lock();
		this.raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );

	};

	this.createFollowControls = function () {

		this.controls = new FollowControls( this.object, document.body );
		this.controls.lock();

	};

	this.createFirstPersonControls = function () {

		var controller = this.movement.controller;
		this.controls = new FirstPersonControls( this.object, this.renderer.domElement );
		this.controls.movementSpeed = controller.movementSpeed;
		this.controls.lookSpeed = controller.pointerSpeed / 1000;

		// this.controls.movementSpeed = 0;
		// this.controls.lookSpeed = 0;

	};

	this.updatePointerLockState = function () {

		var controller = this.movement.controller;

		if ( controller.moveMinusX !== 'undefined' && this.keyboardState.isHeldDown( controller.moveMinusX ) )
			this.moveLeft = true;
		if ( controller.movePlusX !== 'undefined' && this.keyboardState.isHeldDown( controller.movePlusX ) )
			this.moveRight = true;
		if ( controller.movePlusZ !== 'undefined' && this.keyboardState.isHeldDown( controller.movePlusZ ) )
			this.moveForward = true;
		if ( controller.moveMinusZ !== 'undefined' && this.keyboardState.isHeldDown( controller.moveMinusZ ) )
			this.moveBackward = true;

		if ( controller.moveMinusX !== 'undefined' && this.keyboardState.isUp( controller.moveMinusX ) )
			this.moveLeft = false;
		if ( controller.movePlusX !== 'undefined' && this.keyboardState.isUp( controller.movePlusX ) )
			this.moveRight = false;
		if ( controller.movePlusZ !== 'undefined' && this.keyboardState.isUp( controller.movePlusZ ) )
			this.moveForward = false;
		if ( controller.moveMinusZ !== 'undefined' && this.keyboardState.isUp( controller.moveMinusZ ) )
			this.moveBackward = false;

	};

	this.handleMouseMove = function ( e ) {

		if ( scope.movement.lookAt.uuid == 'cursor' ) {

			var rect = renderer.domElement.getBoundingClientRect();
			var raycaster = new THREE.Raycaster();
			//var z = scope.object.position.z+1;
			// var z = Math.max(scope.object.position.z+1, 4)
			// var plane = new THREE.Plane( new THREE.Vector3( 0, 0, 1 ), -z );
			var mouse = new THREE.Vector2();
			var pos = new THREE.Vector3();

			const { camera } = scope.player;

			
			//let camera = scope.scene.getObjectByProperty( "uuid", scope.player.cameraUUID );
			//plane.normal.applyQuaternion( scope.camera.quaternion.clone() );
			// plane.normal.applyQuaternion( camera.quaternion.clone() );

			const plane = getPlaneInBetween({ camera, object: scope.object });

			mouse.x = ( ( e.clientX - rect.left ) / rect.width ) * 2 - 1;
			mouse.y = - ( ( e.clientY - rect.top ) / rect.height ) * 2 + 1;

			raycaster.setFromCamera( mouse, camera );
			//raycaster.setFromCamera( mouse, scope.camera );
			raycaster.ray.intersectPlane( plane, pos );

			const camPos = camera.getWorldPosition(new THREE.Vector3());
			const camUp = camera.localToWorld(camera.up.clone());
			const toLookUp = camPos.clone().subVectors(camUp, camPos);
			scope.object.up = toLookUp;

			scope.object.lookAt( pos );

		}

	}

	this.init();

};

ObjectControls.prototype = Object.assign( Object.create( { } ), {
	

	constructor: ObjectControls,

	init: function () {
		
		this.reusableVec3= new THREE.Vector3();
		var movement = this.movement;

		if ( movement ) {

			if ( movement.controller ) this.controlType = movement.controller.type;

			var lookAt = movement.lookAt;
			var goTo = movement.goTo;
			var controller = movement.controller;
			var customLimit = movement.customLimit;

			if ( lookAt ) {

				movement.lookAt.drag =movement.lookAt.drag ?? (movement.lookAt.speed ?? 0) ;

				// set axis enable/ disable
			

				// do the rest

				// look at object
				if (lookAt.uuid !== "location" && lookAt.uuid !== "none"){
					lookAt.enableOrDrag="enable in";

					this.updateMovement("look at", movement.lookAt);
					// lookAt.easing=null;
					delete lookAt.enableOrDrag;

					this.updateMovement("look at", movement.lookAt);

					// look at location
				}else{
					lookAt.duration=0;
					delete lookAt.enableOrDrag;
					this.updateMovement("look at", movement.lookAt);
					['x','y','z'].forEach(axis=>{
						lookAt.axis=axis;
						lookAt.value=lookAt[axis];
						this.updateMovement("look at", movement.lookAt);
					});
				}

	

			}

			if ( goTo ) {

				// goto object
				if (goTo.uuid !== "location" && goTo.uuid !== "none"){
					this.updateMovement("go to", movement.goTo);
				// it checks easing property to detech whether the logicblock is able enabling axes or describing movement values;
					// goTo.easing=null;
					goTo.enableOrDrag="enable in";
					this.updateMovement("go to", movement.goTo);
					// delete goTo.easing;
					delete goTo.enableOrDrag;

					// goto location
				}else if (goTo.uuid === "location"){
					goTo.duration=0;
					// goTo.easing=null;
					// goTo.enableOrDrag="enable in";
					delete goTo.enableOrDrag;

					this.updateMovement("go to", movement.goTo);


					['x','y','z'].forEach(axis=>{
						goTo.axis=axis;
						goTo.value=goTo[axis];
						this.updateMovement("go to", movement.goTo);
					})
					// delete goTo.easing;
				}
				

			}

			if ( controller.type == 'bounce' ) {

				this.bounceDirection.set( controller.x, controller.y, controller.z );
				this.bounceDirection.normalize();
				this.bounceDirection.multiplyScalar( 0.5 );

			}

			if ( customLimit ) {

				customLimit.filter( l => l.enabled ).map( l => {

					var uuids = ( l.type == 'tag' ? this.player.tags[ l.name ] : [ l.uuid ] );

					uuids.map( uuid => this.customLimitObjects.push( this.scene.getObjectByProperty( 'uuid', uuid ) ) );

				} );

			}

			if ( this.object.isCamera ) {

				switch ( this.movement.controller.type ) {

					case 'map':
						this.createMapCameraControls();
						this.player.addCameraControls( this.controls );
						break;

					case 'orbit':
						this.createOrbitCameraControls();
						this.player.addCameraControls( this.controls );
						break;

					case 'pointerLock':
						this.createPointerLockCameraControls();
						this.player.addCameraControls( this.controls );
						break;

					case 'follow':
						if ( this.movement.controller.uuid != 'none' ) {

							this.createFollowControls();
							this.player.addCameraControls( this.controls );

						}
						break;

					case 'WASDRF':
						this.createFirstPersonControls();
						this.player.addCameraControls( this.controls );
						break;

				}

			}

		}

		if ( this.object.isMesh || this.object.isSprite ) {

			var selectable = this.object.userData.selectable;
			this.player.addSelectable( this.object.uuid, selectable );

			this.object.userData.clicked = false;
			this.object.userData.selectionState = selectable !== undefined && selectable.selected === true ? 'is selected' : 'is not selected';

			if (selectable && !selectable.drag){
				selectable.drag ={}
			}

			if ( selectable && selectable.drag.type == 'transform' ) {
				this.player.addTransformControl( this.object );
			}

			if ( selectable && selectable.drag.type == 'rotate' ) {
				this.player.addRotateControl( this.object, selectable.drag );
			}

			if ( selectable && selectable.drag.type == 'move' ) {
				this.player.addDragControl( this.object );
			}

		}

	},

	dispose: function () {

		this.renderer.domElement.removeEventListener( 'mousemove', this.handleMouseMove, false );

		if ( this.controls != null ) {

			this.controls.dispose();

			switch ( this.movement.controller.type ) {

				case 'pointerLock':
				case 'follow':
					this.controls.unlock();
					break;

			}

		}

		if ( this.object.isMesh || this.object.isSprite ) {

			delete this.object.userData[ 'selectionState' ];
			delete this.object.userData[ 'cursorState' ];
			delete this.object.userData[ 'clicked' ];

		}

	},
	update: function () {

		var scope = this;

		if ( this.movement ) {

			var { direction, rotation, grow, goTo, lookAt, controller } = this.movement;

			var vec = {
				X: new THREE.Vector3( 1, 0, 0 ),
				Y: new THREE.Vector3( 0, 1, 0 ),
				Z: new THREE.Vector3( 0, 0, 1 )
			};
			var delta = this.clock.getDelta();

			if ( direction ) {

				[ 'x', 'y', 'z' ].map( axis => {

					if ( direction.hasOwnProperty( axis ) ) {

						if ( direction.local ) {

							this.object.translateOnAxis( vec[ axis.toUpperCase() ], Math.PI * direction[ axis ] * delta / 5 );

						} else {

							this.object.position[ axis ] += direction[ axis ] * delta;

						}

					}

				} );

			}

			if ( goTo ) {
				var movePositionTo = function ( src, dest, speed ) {

					if ( ! src.equals( dest ) ) {
						// src is position vector?
						// t is time?
						var t = src.distanceTo( dest ) / speed;
						src.add( dest.clone().sub( src ).divideScalar( t ) );

						if ( t < 1 ) {

							src.set( dest.x, dest.y, dest.z );

						}

					}

				};

				if ( goTo.uuid == 'location' ) {
					let isSpeedDefinedByUser = isDefined(goTo.endSpeed);
					let speed = isSpeedDefinedByUser? goTo.speed: Number.MAX_SAFE_INTEGER ;
					this.reusableVec3.copy(this.goToPos);
					const goToPos = this.object.parent.worldToLocal(this.reusableVec3);
					movePositionTo( this.object.position, goToPos, delta * speed );

				} else if ( goTo.uuid && goTo.uuid != 'none' ) {
					var goToObj = this.scene.getObjectByProperty( 'uuid', goTo.uuid );
					goToObj.getWorldPosition(this.reusableVec3);

					const goToPos = this.object.parent.worldToLocal(this.reusableVec3);

					[ 'x', 'y', 'z' ].map( axis => {
						if (! goTo[ axis + 'Enabled' ]){
							goToPos[axis] = this.object.position[axis]
						}
					} );
					movePositionTo( this.object.position, goToPos, delta * goTo.speed );
				}

			}

			if ( this.object.isGroup || this.object.isMesh || this.object.isSprite || this.object.isCamera || this.object.isRectAreaLight ) {

				if ( rotation ) {

					[ 'x', 'y', 'z' ].map( axis => {

						if ( rotation.hasOwnProperty( axis ) && rotation[ axis ] != 0 ) {

							if ( rotation.local ) {

								this.object.rotateOnAxis( vec[ axis.toUpperCase() ], Math.PI * rotation[ axis ] * delta / 5 );

							} else {


								var orders = {x:"XYZ", y:'YZX', z:'ZXY'}
								this.object.rotation.order = orders[axis];
								this.object.rotation[ axis ] += rotation[ axis ] * delta;

							}

						}

					} );

				}

				if ( this.object.isMesh || this.object.isGroup || this.object.isSprite ) {

					if ( grow ) {

						[ 'x', 'y', 'z' ].map( axis => {

							if ( grow.hasOwnProperty( axis ) ) this.object.scale[ axis ] += grow[ axis ] * delta;

						} );

					}

					if ( lookAt ) {

						// if i don't do this, it will break
						if (lookAt.drag===0){
							lookAt.drag=0.000000000001;
						}


						if ( lookAt.uuid == 'location' ) {

						
							if (this.lookAtQuaternion){
								this.targetObj = this.targetObj || new THREE.Object3D();

								let lookAtPos = this.lookAtPos;


								this.targetObj.position.set(lookAtPos.x ?? this.object.position.x, lookAtPos.y ??this.object.position.y, lookAtPos.z ?? this.object.position.z*1.1);
		
								// this.object.add(this.targetObj);
		
								let lookAtTargetQuaternion = this.getLookAtTargetQuaternion({object:this.object, target:this.targetObj, axes:{xEnabled:true, yEnabled:true, zEnabled:true}});
								
								this.lookAtQuaternion= lookAtTargetQuaternion;
								
								// this.targetObj.parent.remove(this.targetObj)
									
	
								this.object.quaternion.slerp(this.lookAtQuaternion,
									Math.min(1,delta / this.movement.lookAt.drag));
							}

						} else if ( lookAt.uuid != 'none' && lookAt.uuid != 'cursor' && lookAt.uuid ) {
						
							if (this.lookAtQuaternion){

						
								const targetObj = this.scene.getObjectByProperty('uuid', this.movement.lookAt.uuid);

								if (targetObj){
									let lookAtTargetQuaternion = this.getLookAtTargetQuaternion({object:this.object, target:targetObj, axes:this.movement.lookAt});
								
									scope.lookAtQuaternion= lookAtTargetQuaternion;
	
									this.object.quaternion.slerp(this.lookAtQuaternion,
										  Math.min(1,delta / this.movement.lookAt.drag));
								}

								
							}

						}

					}

				}

			}

			if ( controller ) {

				if ( controller.type === 'bounce' ) {

					var positionLimit = this.movement.positionLimit;

					if ( positionLimit ) {

						[ 'X', 'Y', 'Z' ].map( x => {

							var axis = x.toLowerCase();
							if ( positionLimit[ x + 'Enabled' ] ) {

								if ( Number.isNaN( positionLimit[ x + 'Min' ] ) || Number.isNaN( positionLimit[ x + 'Min' ] ) ) {

									this.object.position[ axis ] = this.copy.position[ axis ];

								} else {

									if ( this.object.position[ axis ] < positionLimit[ x + 'Min' ] || this.object.position[ axis ] > positionLimit[ x + 'Max' ] ) {

										this.bounceDirection[ axis ] = - this.bounceDirection[ axis ];

									}

									this.object.position[ axis ] = Math.max( this.object.position[ axis ], positionLimit[ x + 'Min' ] );
									this.object.position[ axis ] = Math.min( this.object.position[ axis ], positionLimit[ x + 'Max' ] );

								}

							}

						} );

					}

/*
var targetBoundingBox = getBoundingBox( this.customLimitObjects[i] );

var _vector = new THREE.Vector3();
var clampedPoint2 = _vector.copy( this.object.position ).clamp( targetBoundingBox.min, targetBoundingBox.max ).sub(this.object.position);
var angle2 = this.bounceDirection.angleTo(clampedPoint2);

if(angle2 < 1.5707963267948966){
	this.bounceDirection.reflect( this.bounceDirection.normalize() ).multiplyScalar(0.5);
}
*/
/**/

					//checkCollision

					var getBoundingBox = function ( mesh ) {

						var objectHelper = new THREE.BoxHelper(mesh, 0x00ff00);
						objectHelper.update();
						var objectBox = new THREE.Box3();
						objectBox.setFromObject(objectHelper);

						return objectBox;

					};

					var checkCollision = function ( moving, target ) {

						var movingBox = getBoundingBox( moving );
						var targetBox = getBoundingBox( target );

						return targetBox.intersectsBox( movingBox );

					}
					var velocity = new THREE.Vector3();
					velocity.copy( this.bounceDirection ).multiplyScalar( delta * controller.speed );

					for(var i=0;i<this.customLimitObjects.length; i++){
						if(checkCollision(this.object, this.customLimitObjects[i])){

							var raycaster = new THREE.Raycaster();
							raycaster.set( this.object.position, this.bounceDirection );

							var intersections = raycaster.intersectObject( this.customLimitObjects[i] );

							if ( intersections.length > 0 ) {

								var intersection = intersections[ 0 ];


								var raycastNormal = intersection.face.normal;
								var add = raycastNormal.clone().multiplyScalar( velocity.clone().dot( raycastNormal ) );
								velocity.add( add );

								this.bounceDirection.reflect( intersection.face.normal );
								velocity.copy( this.bounceDirection ).multiplyScalar( delta * controller.speed );

							}


						}
					}
					//velocity.copy( this.bounceDirection ).multiplyScalar( delta * controller.speed );
					this.object.position.add( velocity );
/**/
/*
					var raycaster = new THREE.Raycaster();

					raycaster.set( this.object.position, this.bounceDirection );

					var velocity = new THREE.Vector3();
					velocity.copy( this.bounceDirection ).multiplyScalar( delta * controller.speed );

					var intersections = raycaster.intersectObjects( this.customLimitObjects );

					if ( intersections.length > 0 ) {

						var threshold = controller.speed / 50;
						var intersection = intersections[ 0 ];

						if ( intersection.distance < threshold ) {

							var raycastNormal = intersection.face.normal;
							var add = raycastNormal.clone().multiplyScalar( velocity.clone().dot( raycastNormal ) );
							velocity.add( add );

							console.log("change bounce direction")
							this.bounceDirection.reflect( intersection.face.normal );

						}

					}

					this.object.position.add( velocity );
/**/
				} else if ( controller.type === 'keyboard' ) {

					var data = {
						X: [ 'pitchPlus', 'pitchMinus', 'globalPitchPlus', 'globalPitchMinus' ],
						Y: [ 'yawPlus', 'yawMinus', 'globalYawPlus', 'globalYawMinus' ],
						Z: [ 'rollPlus', 'rollMinus', 'globalRollPlus', 'globalRollMinus' ]
					};

					var move = [ 'movePlus', 'moveMinus', 'globalMovePlus', 'globalMoveMinus' ];

					var doAction = function ( action, axis, type ) {

						var key = controller[ action + axis ];
						var speed = controller[ action + axis + 'Speed' ];
						var dir = action.includes( 'Plus' ) ? 1 : - 1;
						var global = action.includes( 'global' );
						var func = ( type == 'position' ? 'translateOnAxis' : 'rotateOnAxis' );

						if ( key != '?' && scope.keyboardState.isHeldDown( key ) ) {

							if ( global ) {

								scope.object[ type ][ axis.toLowerCase() ] += dir * speed * delta;

							} else {

								scope.object[ func ]( vec[ axis ], dir * Math.PI * speed * delta / 5 );

							}

						}

					};

					Object.keys( data ).map( axis => {

						move.map( m => {

							doAction( m, axis, 'position' );

						} );

						data[ axis ].map( p => {

							doAction( p, axis, 'rotation' );

						} );


					} );

				} else if ( controller.type === 'orbit' || controller.type === 'map' ) {

					this.controls.update();

				} else if ( controller.type === 'WASDRF' ) {

					this.controls.update( delta );

				} else if ( controller.type === 'pointerLock' ) {

					this.updatePointerLockState();

					this.raycaster.ray.origin.copy( this.controls.getObject().position );
					this.raycaster.ray.origin.y -= 10;
					var time = performance.now();
					var delta = ( time - this.prevTime ) / 1000;
					this.velocity.x -= this.velocity.x * 10.0 * delta;
					this.velocity.z -= this.velocity.z * 10.0 * delta;
					this.direction.z = Number( this.moveForward ) - Number( this.moveBackward );
					this.direction.x = Number( this.moveRight ) - Number( this.moveLeft );
					this.direction.normalize(); // this ensures consistent movements in all directions
					if ( this.moveForward )
						this.velocity.z -= this.direction.z * controller.movePlusZSpeed * delta;
					else if ( this.moveBackward )
						this.velocity.z -= this.direction.z * controller.moveMinusZSpeed * delta;
					else if ( this.moveLeft )
						this.velocity.x -= this.direction.x * controller.moveMinusXSpeed * delta;
					else if ( this.moveRight )
						this.velocity.x -= this.direction.x * controller.movePlusXSpeed * delta;
					this.controls.moveRight( - this.velocity.x * delta );
					this.controls.moveForward( - this.velocity.z * delta );
					this.controls.getObject().position.y = controller.yPosition;
					if ( this.controls.getObject().position.y < 10 ) {

						this.velocity.y = 0;
						this.controls.getObject().position.y = 10;
						this.canJump = true;

					}

					this.prevTime = time;

				} else if ( controller.type === 'lookAt' && controller.uuid && controller.uuid !== 'none' ) {
					let lookAtPosition = new THREE.Vector3();
					if(controller.uuid !== "location"){
						let target = this.scene.getObjectByProperty( 'uuid', controller.uuid );
						lookAtPosition.copy(target.position);
					}
					else 
						lookAtPosition.set(UtilsHelper.parseValue(controller.x),
											UtilsHelper.parseValue(controller.y),
											UtilsHelper.parseValue(controller.z))
					if(!(controller.uuid !== "location" && !controller.xEnabled && !controller.yEnabled && !controller.zEnabled)){
						this.object.lookAt( lookAtPosition );
						this.object.up = new THREE.Vector3( 0, 1, 0 );
					}
					

				} else if ( controller.type === 'follow' && controller.uuid !== 'none' ) {

					var followed = this.scene.getObjectByProperty( 'uuid', controller.uuid );
					this.controls.update( followed, controller.distance );

				}

			}

			[ 'position', 'rotation', 'scale' ].map( s => {

				if ( controller && controller.type !== 'bounce' || s !== 'position' ) {

					var limit = this.movement[ s + 'Limit' ];

					if ( limit ) {

						[ 'x', 'y', 'z' ].map( t => {

							var axis = t.toUpperCase();

							if ( limit[ axis + 'Enabled' ] == true ) {

								if ( Number.isNaN( limit[ axis + 'Min' ] ) || Number.isNaN( limit[ axis + 'Min' ] ) ) {

									this.object[ s ][ t ] = this.copy[ s ][ t ];

								} else {

									this.object[ s ][ t ] = Math.max( this.object[ s ][ t ], limit[ axis + 'Min' ] );
									this.object[ s ][ t ] = Math.min( this.object[ s ][ t ], limit[ axis + 'Max' ] );

								}

							}

						} );

					}

				}

			} );

			if ( controller && controller.type !== 'bounce' ) this.detectCustomLimit();

		}
	},

	detectCustomLimit: function () {

		var customLimit = false;

		var box = new THREE.Box3();
		box.setFromObject( this.object );

		// Remove objects that are not in scene
		this.customLimitObjects = this.customLimitObjects.filter(obj=>{
			return Boolean(this.scene.getObjectByProperty('uuid',obj.uuid)); 
		})

		for ( var target of this.customLimitObjects ) {

			if ( target.isCamera ) {

				var frustum = new THREE.Frustum();
				frustum.setFromProjectionMatrix( new THREE.Matrix4().multiplyMatrices( target.projectionMatrix, target.matrixWorldInverse ) );

				if ( ! ( frustum.containsPoint( box.min ) && frustum.containsPoint( box.max ) ) ) {

					customLimit = true;

				}

			} else {

				var intersect = new THREE.Box3();
				intersect.setFromObject( target );
				intersect.intersect( box );

				if ( ! intersect.isEmpty() ) {

					customLimit = true;

					var difference = intersect.max.clone().sub( intersect.min );
					var axis = 'x';
					var delta = difference.x;

					[ 'x', 'y', 'z' ].map( x => {

						if ( difference[ x ] < delta ) {

							delta = difference[ x ];
							axis = x;

						}

					} );

					if ( this.posLimit[ axis ] ) {

						this.object.position[ axis ] = this.posLimit[ axis ];

					} else {

						var dir = this.object.position[ axis ] < intersect.max[ axis ] ? - 1 : 1;
						this.posLimit[ axis ] = this.object.position[ axis ] + dir * delta;

					}

				} else if ( this.dragging == false ) {

					this.posLimit = {
						x: null,
						y: null,
						z: null
					};

				}

			}

		}

		if ( customLimit && this.dragging == false ) {

			this.object.position.copy( this.validPos );

		} else {

			this.validPos.copy( this.object.position );

		}
	}

} );



function getPlaneInBetween({
	object,
	camera,
}) {

	const infinitePlane = new THREE.Plane();

	let cameraPos = camera.getWorldPosition(new THREE.Vector3());
	let objectPos = object.getWorldPosition(new THREE.Vector3());

	let posDif = new THREE.Vector3().subVectors(cameraPos, objectPos);

	let cameraFrontDist = Math.min(posDif.length() / 1.5, posDif.length());
	let cameraFront = camera.localToWorld(new THREE.Vector3(0, 0, -1 * cameraFrontDist));

	infinitePlane.set(cameraPos.clone().sub(cameraFront), 0);

	infinitePlane.translate(cameraFront);

	return infinitePlane;
}

//  function inside function for performance reasons of not creating objects multiple times

function getLookAtTargetQuaternionFunction  () {

	// much of the complexity in this function is for disabling rotation in certain axes

	
	const objectMock = new THREE.Object3D();

	// for keeping in front of Object
	const boxGeom = new THREE.BoxGeometry()
	const normalMat = new THREE.MeshNormalMaterial();
	const targetMock = new THREE.Mesh(boxGeom, normalMat);

	let targetWorldPosition = new THREE.Vector3();

	return function getLookAtTargetQuaternion({object, target, axes}){
	
			// considering z as facing side of all objects (-z of camera)?
		object.add(targetMock);
		targetMock.position.setZ(0.1);
		// targetMock.position.setZ(1);

		targetWorldPosition = target.getWorldPosition(targetWorldPosition);

		let targetLocalPos = object.worldToLocal(targetWorldPosition.clone());

		let targetMockPos = targetMock.position;

		object.parent.add(objectMock);
		objectMock.position.copy(object.position);

		// Date 11 Nov 22
		// If y is banned, target has to be in any y location and +z; x=0;
		// If x is banned, target has to be in any x location and +z; y=0;
		// If z is banned, target has to be in any z location, x and y=0;

		if (!axes.yEnabled){
			targetLocalPos.setX(targetMockPos.x)
			if (targetLocalPos.z <= targetMockPos.z ){
				targetLocalPos.setZ(targetMockPos.z + 0.1);
			}
		}
		if (!axes.xEnabled){
			targetLocalPos.setY(targetMockPos.y)
			if (targetLocalPos.z <= targetMockPos.z ){
				targetLocalPos.setZ(targetMockPos.z + 0.1);
			}
		}
		// It doesn't rotate around z axis at all?
		// if (!axes.zEnabled){
		// 	targetLocalPos.setY(targetMockPos.y)
		// 	targetLocalPos.setX(targetMockPos.x)
		// }


		const toLookAt = object.localToWorld(targetLocalPos)
		objectMock.lookAt(toLookAt);
	
		const targetQuaternion = objectMock.quaternion.clone();
	
		objectMock.parent.remove(objectMock);
		targetMock.parent.remove(targetMock);

		return targetQuaternion;	
	}

	


	
  };