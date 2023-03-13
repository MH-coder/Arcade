import * as THREE from '../libs/three.module.js';

function EditorControls( camera, domElement ) {

	// API

	this.camera = camera;
	this.enabled = true;
	this.center = new THREE.Vector3();
	this.panSpeed = 0.002;
	this.zoomSpeed = 0.01;
	this.rotationSpeed = 0.005;

	this.movementSpeed = 1.0;
	this.lookSpeed = 0.005;

	this.autoForward = false;

	this.heightSpeed = false;
	this.heightCoef = 1.0;
	this.heightMin = 0.0;
	this.heightMax = 1.0;

	this.mouseDragOn = false;

	// internals

	this.autoSpeedFactor = 0.0;

	this.mouseX = 0;
	this.mouseY = 0;

	this.moveForward = false;
	this.moveBackward = false;
	this.moveLeft = false;
	this.moveRight = false;
	this.moveUp = false;
	this.moveDown = false;

	var logicBlockToggle = false;

	this.viewHalfX = 0;
	this.viewHalfY = 0;

	// private internals

	var scope = this;
	var vector = new THREE.Vector3();
	var delta = new THREE.Vector3();
	var box = new THREE.Box3();

	var STATE = { NONE: - 1, ROTATE: 0, ZOOM: 1, PAN: 2 };
	var state = STATE.NONE;

	var center = this.center;
	var normalMatrix = new THREE.Matrix3();
	var pointer = new THREE.Vector2();
	var pointerOld = new THREE.Vector2();
	var spherical = new THREE.Spherical();
	var sphere = new THREE.Sphere();

	var lat = 0;
	var lon = 0;

	// events

	var changeEvent = { type: 'change' };

	this.handleResize = function () {

		this.viewHalfX = window.innerWidth / 2;
		this.viewHalfY = window.innerHeight / 2;

	};

	this.focus = function ( target ) {
		
		// disable focusing when logicblock is specified
		if(logicBlockToggle) return;
		
		var distance;

		box.setFromObject( target );

		if ( box.isEmpty() === false ) {

			box.getCenter( center );
			distance = box.getBoundingSphere( sphere ).radius;

		} else {

			// Focusing on an Group, AmbientLight, etc

			center.setFromMatrixPosition( target.matrixWorld );
			distance = 0.1;

		}

		delta.set( 0, 0, 1 );
		delta.applyQuaternion( this.camera.quaternion );
		delta.multiplyScalar( distance * 4 );

		this.camera.position.copy( center ).add( delta );

		scope.dispatchEvent( changeEvent );
		setOrientation( this );

	};

	this.pan = function ( delta ) {

		var distance = this.camera.position.distanceTo( center );

		delta.multiplyScalar( distance * scope.panSpeed );
		delta.applyMatrix3( normalMatrix.getNormalMatrix( this.camera.matrix ) );

		this.camera.position.add( delta );
		center.add( delta );

		scope.dispatchEvent( changeEvent );
		setOrientation( this );

	};

	this.zoom = function ( delta ) {

		var distance = this.camera.position.distanceTo( center );

		delta.multiplyScalar( distance * scope.zoomSpeed );

		if ( delta.length() > distance ) return;

		delta.applyMatrix3( normalMatrix.getNormalMatrix( this.camera.matrix ) );

		this.camera.position.add( delta );

		scope.dispatchEvent( changeEvent );
		setOrientation( this );

	};

	this.rotate = function ( delta ) {

		vector.copy( this.camera.position ).sub( center );

		spherical.setFromVector3( vector );

		spherical.theta += delta.x * scope.rotationSpeed;
		spherical.phi += delta.y * scope.rotationSpeed;

		spherical.makeSafe();

		vector.setFromSpherical( spherical );

		this.camera.position.copy( center ).add( vector );

		this.camera.lookAt( center );

		scope.dispatchEvent( changeEvent );
		setOrientation( this );

	};

	this.update = function () {

		return function update( delta ) {

			if ( this.enabled === false ) return;

			if ( this.heightSpeed ) {

				var y = THREE.MathUtils.clamp( this.camera.position.y, this.heightMin, this.heightMax );
				var heightDelta = y - this.heightMin;

				this.autoSpeedFactor = delta * ( heightDelta * this.heightCoef );

			} else {

				this.autoSpeedFactor = 0.0;

			}

			if(!logicBlockToggle){
				var actualMoveSpeed = delta * this.movementSpeed;
				var prevPos = this.camera.position.clone();

				if ( this.moveForward || ( this.autoForward && ! this.moveBackward ) ) this.camera.translateZ( - ( actualMoveSpeed + this.autoSpeedFactor ) );
				if ( this.moveBackward ) this.camera.translateZ( actualMoveSpeed );

				if ( this.moveLeft ) this.camera.translateX( - actualMoveSpeed );
				if ( this.moveRight ) this.camera.translateX( actualMoveSpeed );

				if ( this.moveUp ) this.camera.translateY( actualMoveSpeed );
				if ( this.moveDown ) this.camera.translateY( - actualMoveSpeed );

				center.add( this.camera.position.clone().sub( prevPos ) );

				if ( this.moveForward || this.moveBackward || this.moveLeft || this.moveRight || this.moveUp || this.moveDown ) {

					var actualLookSpeed = this.lookSpeed * delta;

					lon -= this.mouseX * actualLookSpeed;
					lat -= this.mouseY * actualLookSpeed;

					lat = Math.max( - 85, Math.min( 85, lat ) );

					var phi = THREE.MathUtils.degToRad( 90 - lat );
					var theta = THREE.MathUtils.degToRad( lon );

					vector.setFromSphericalCoords( 1, phi, theta ).add( this.camera.position );

					this.camera.lookAt( vector );
				}
			}
		};

	}();

	//

	function onPointerDown( event ) {

		if ( scope.enabled === false ) return;

		switch ( event.pointerType ) {

			case 'mouse':
				onMouseDown( event );
				break;

			// TODO touch

		}

		domElement.ownerDocument.addEventListener( 'pointermove', onPointerMove, false );
		domElement.ownerDocument.addEventListener( 'pointerup', onPointerUp, false );

		document.getElementById( 'library' ).style.pointerEvents = 'none';
		document.getElementById( 'sidebar' ).style.pointerEvents = 'none';
		document.getElementById( 'timeliner' ).style.pointerEvents = 'none';

	}

	function onPointerMove( event ) {

		if ( scope.enabled === false ) return;

		switch ( event.pointerType ) {

			case 'mouse':
				onMouseMove( event );
				break;

			// TODO touch

		}

	}

	function onPointerUp( event ) {

		switch ( event.pointerType ) {

			case 'mouse':
				onMouseUp();
				break;

			// TODO touch

		}

		domElement.ownerDocument.removeEventListener( 'pointermove', onPointerMove, false );
		domElement.ownerDocument.removeEventListener( 'pointerup', onPointerUp, false );
		
		document.getElementById( 'library' ).style.pointerEvents = 'auto';
		document.getElementById( 'sidebar' ).style.pointerEvents = 'auto';
		document.getElementById( 'timeliner' ).style.pointerEvents = 'auto';

	}

	// mouse

	function onMouseDown( event ) {

		if ( event.button === 0 ) {

			state = STATE.ROTATE;

		} else if ( event.button === 1 ) {

			state = STATE.ZOOM;

		} else if ( event.button === 2 ) {

			state = STATE.PAN;

		}

		pointerOld.set( event.clientX, event.clientY );

	}

	function onMouseMove( event ) {

		pointer.set( event.clientX, event.clientY );

		var movementX = pointer.x - pointerOld.x;
		var movementY = pointer.y - pointerOld.y;

		if ( state === STATE.ROTATE && event.altKey != true ) {

			scope.rotate( delta.set( - movementX, - movementY, 0 ) );

		} else if ( state === STATE.ZOOM ) {

			scope.zoom( delta.set( 0, 0, movementY ) );

		} else if ( state === STATE.PAN || event.altKey == true ) {

			scope.pan( delta.set( - movementX, movementY, 0 ) );

		}

		pointerOld.set( event.clientX, event.clientY );

	}

	function onMouseUp() {

		state = STATE.NONE;

	}

	function onMouseWheel( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault();

		// Normalize deltaY due to https://bugzilla.mozilla.org/show_bug.cgi?id=1392460
		scope.zoom( delta.set( 0, 0, event.deltaY > 0 ? 1 : - 1 ) );

	}

	function contextmenu( event ) {

		event.preventDefault();

	}

	this.onKeyDown = function ( event ) {

		//event.preventDefault();
		var IS_MAC = navigator.platform.toUpperCase().indexOf( 'MAC' ) >= 0;

		switch ( event.keyCode ) {

			case 87: /*W*/ if ( ! ( ( IS_MAC ? event.metaKey : event.ctrlKey ) || event.shiftKey ) ) this.moveForward = true; break;
			case 65: /*A*/ if ( ! ( ( IS_MAC ? event.metaKey : event.ctrlKey ) || event.shiftKey ) ) this.moveLeft = true; break;
			case 83: /*S*/ if ( ! ( ( IS_MAC ? event.metaKey : event.ctrlKey ) || event.shiftKey ) ) this.moveBackward = true; break;
			case 68: /*D*/ if ( ! ( ( IS_MAC ? event.metaKey : event.ctrlKey ) || event.shiftKey ) ) this.moveRight = true; break;
			case 82: /*R*/ if ( ! ( ( IS_MAC ? event.metaKey : event.ctrlKey ) || event.shiftKey ) ) this.moveUp = true; break;
			case 70: /*F*/ if ( ! ( ( IS_MAC ? event.metaKey : event.ctrlKey ) || event.shiftKey ) ) this.moveDown = true; break;
			case 49: /*1*/ logicBlockToggle = !logicBlockToggle; break; //Toggling WASDRF Controls here

		}

	}

	this.onKeyUp = function ( event ) {

		switch ( event.keyCode ) {

			case 87: /*W*/ this.moveForward = false; break;
			case 65: /*A*/ this.moveLeft = false; break;
			case 83: /*S*/ this.moveBackward = false; break;
			case 68: /*D*/ this.moveRight = false; break;
			case 82: /*R*/ this.moveUp = false; break;
			case 70: /*F*/ this.moveDown = false; break;
		}

	}

	this.onMove = function ( event ) {

		scope.mouseX = event.pageX - scope.viewHalfX;
		scope.mouseY = event.pageY - scope.viewHalfY;

	}

	this.dispose = function () {

		domElement.removeEventListener( 'contextmenu', contextmenu, false );
		domElement.removeEventListener( 'dblclick', onMouseUp, false );
		domElement.removeEventListener( 'wheel', onMouseWheel, false );

		domElement.removeEventListener( 'pointerdown', onPointerDown, false );

		domElement.removeEventListener( 'touchstart', touchStart, false );
		domElement.removeEventListener( 'touchmove', touchMove, false );

		document.removeEventListener( 'keydown', _onKeyDown, false );
		document.removeEventListener( 'keyup', _onKeyUp, false );
		document.removeEventListener( 'mousemove', _onMove, false );

	};

	var _onKeyDown = bind( this, this.onKeyDown );
	var _onKeyUp = bind( this, this.onKeyUp );
	var _onMove = bind( this, this.onMove );

	domElement.addEventListener( 'contextmenu', contextmenu, false );
	domElement.addEventListener( 'dblclick', onMouseUp, false );
	domElement.addEventListener( 'wheel', onMouseWheel, false );

	domElement.addEventListener( 'pointerdown', onPointerDown, false );
	document.addEventListener( 'keydown', _onKeyDown, false );
	document.addEventListener( 'keyup', _onKeyUp, false );
	document.addEventListener( 'mousemove', _onMove, false );

	// touch

	var touches = [ new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3() ];
	var prevTouches = [ new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3() ];

	var prevDistance = null;

	function touchStart( event ) {

		if ( scope.enabled === false ) return;

		switch ( event.touches.length ) {

			case 1:
				touches[ 0 ].set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY, 0 ).divideScalar( window.devicePixelRatio );
				touches[ 1 ].set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY, 0 ).divideScalar( window.devicePixelRatio );
				break;

			case 2:
				touches[ 0 ].set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY, 0 ).divideScalar( window.devicePixelRatio );
				touches[ 1 ].set( event.touches[ 1 ].pageX, event.touches[ 1 ].pageY, 0 ).divideScalar( window.devicePixelRatio );
				prevDistance = touches[ 0 ].distanceTo( touches[ 1 ] );
				break;

		}

		prevTouches[ 0 ].copy( touches[ 0 ] );
		prevTouches[ 1 ].copy( touches[ 1 ] );

	}


	function touchMove( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		function getClosest( touch, touches ) {

			var closest = touches[ 0 ];

			for ( var i in touches ) {

				if ( closest.distanceTo( touch ) > touches[ i ].distanceTo( touch ) ) closest = touches[ i ];

			}

			return closest;

		}

		switch ( event.touches.length ) {

			case 1:
				touches[ 0 ].set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY, 0 ).divideScalar( window.devicePixelRatio );
				touches[ 1 ].set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY, 0 ).divideScalar( window.devicePixelRatio );
				scope.rotate( touches[ 0 ].sub( getClosest( touches[ 0 ], prevTouches ) ).multiplyScalar( - 1 ) );
				break;

			case 2:
				touches[ 0 ].set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY, 0 ).divideScalar( window.devicePixelRatio );
				touches[ 1 ].set( event.touches[ 1 ].pageX, event.touches[ 1 ].pageY, 0 ).divideScalar( window.devicePixelRatio );
				var distance = touches[ 0 ].distanceTo( touches[ 1 ] );
				scope.zoom( delta.set( 0, 0, prevDistance - distance ) );
				prevDistance = distance;


				var offset0 = touches[ 0 ].clone().sub( getClosest( touches[ 0 ], prevTouches ) );
				var offset1 = touches[ 1 ].clone().sub( getClosest( touches[ 1 ], prevTouches ) );
				offset0.x = - offset0.x;
				offset1.x = - offset1.x;

				scope.pan( offset0.add( offset1 ) );

				break;

		}

		prevTouches[ 0 ].copy( touches[ 0 ] );
		prevTouches[ 1 ].copy( touches[ 1 ] );

	}

	domElement.addEventListener( 'touchstart', touchStart, false );
	domElement.addEventListener( 'touchmove', touchMove, false );

	function bind( scope, fn ) {

		return function () {

			fn.apply( scope, arguments );

		};

	}

	function setOrientation( controls ) {

		var quaternion = controls.camera.quaternion;

		vector.set( 0, 0, - 1 ).applyQuaternion( quaternion );
		spherical.setFromVector3( vector );

		lat = 90 - THREE.MathUtils.radToDeg( spherical.phi );
		lon = THREE.MathUtils.radToDeg( spherical.theta );

	}

	this.handleResize();

	setOrientation( this );

}

EditorControls.prototype = Object.create( THREE.EventDispatcher.prototype );
EditorControls.prototype.constructor = EditorControls;

export { EditorControls };
