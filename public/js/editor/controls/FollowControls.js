import {
	Euler,
	EventDispatcher,
	Vector3
} from "../libs/three.module.js";

var FollowControls = function ( object, domElement ) {

	if ( domElement === undefined ) {

		console.warn( 'THREE.FollowControls: The second parameter "domElement" is now mandatory.' );
		domElement = document.body;

	}

	this.object = object;
	this.domElement = domElement;
	this.isLocked = false;

	this.sensitivity = 1;
	this.yaw = Math.PI / 2; // radians
	this.pitch = 0; // radians

	this.object.rotation.order = 'YXZ';

	//
	// internals
	//

	var scope = this;

	var lockEvent = { type: 'lock' };
	var unlockEvent = { type: 'unlock' };

	function onMouseMove( event ) {

		if ( scope.isLocked === false ) return;

		scope.yaw -= event.movementX * 0.001 * scope.sensitivity;
		scope.pitch -= event.movementY * 0.001 * scope.sensitivity;
	}

	function onPointerlockChange() {

		if ( scope.domElement.ownerDocument.pointerLockElement === scope.domElement ) {

			scope.dispatchEvent( lockEvent );

			scope.isLocked = true;

		} else {

			scope.dispatchEvent( unlockEvent );

			scope.isLocked = false;

		}

	}

	function onPointerlockError() {

		console.error( 'FollowControls: Unable to use Pointer Lock API' );

	}

	this.connect = function () {

		scope.domElement.ownerDocument.addEventListener( 'mousemove', onMouseMove, false );
		scope.domElement.ownerDocument.addEventListener( 'pointerlockchange', onPointerlockChange, false );
		scope.domElement.ownerDocument.addEventListener( 'pointerlockerror', onPointerlockError, false );

	};

	this.disconnect = function () {

		scope.domElement.ownerDocument.removeEventListener( 'mousemove', onMouseMove, false );
		scope.domElement.ownerDocument.removeEventListener( 'pointerlockchange', onPointerlockChange, false );
		scope.domElement.ownerDocument.removeEventListener( 'pointerlockerror', onPointerlockError, false );

	};

	this.dispose = function () {

		this.disconnect();

	};

	this.getObject = function () { // retaining this method for backward compatibility

		return camera;

	};

	this.getDirection = function () {

		var direction = new Vector3( 0, 0, - 1 );

		return function ( v ) {

			return v.copy( direction ).applyQuaternion( camera.quaternion );

		};

	}();

	this.lock = function () {

		this.domElement.requestPointerLock();

	};

	this.unlock = function () {

		scope.domElement.ownerDocument.exitPointerLock();

	};

	this.update = function ( followed, distance ) {
				
		var target = followed.position.clone();

		target.y += 2;
		target.z -= Math.cos( this.yaw ) * distance;
		target.x -= Math.sin( this.yaw ) * distance;

		scope.object.position.lerp( target, 0.1 );
		scope.object.rotation.set( this.pitch, this.yaw + Math.PI, 0 );

	}

	this.connect();

};

FollowControls.prototype = Object.create( EventDispatcher.prototype );
FollowControls.prototype.constructor = FollowControls;

export { FollowControls };
