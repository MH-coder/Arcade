import {
	Object3D,
	Quaternion,
	Euler,
	Raycaster,
	Vector2,
	Vector3
} from "../libs/three.module.js";

var changeEvent = { type: "change" };
var mouseDownEvent = { type: "mouseDown" };
var mouseUpEvent = { type: "mouseUp" };
var objectChangeEvent = { type: "objectChange" };

var raycaster = new Raycaster();

function intersectObjectWithRay( object, raycaster, includeInvisible ) {
	var allIntersections = raycaster.intersectObject( object, true );
	for ( var i = 0; i < allIntersections.length; i ++ ) {
		if ( allIntersections[ i ].object.visible || includeInvisible ) {
			return allIntersections[ i ];
		}
	}
	return false;
}

var positionDown = new Vector2();
var positionMove = new Vector2();

var _tempVector = new Vector3();
var _tempVector2 = new Vector3();
var _tempQuaternion = new Quaternion();
var _unit = {
	X: new Vector3( 1, 0, 0 ),
	Y: new Vector3( 0, 1, 0 ),
			Z: new Vector3( 0, 0, 1 ),
			XY: new Vector3( 1, 1, 0 ),
			XZ: new Vector3( 1, 0, 1 ),
			YZ: new Vector3( 0, 1, 1 ),
};

var pointStart = new Vector3();
var pointEnd = new Vector3();
var offset = new Vector3();
var rotationAxis = new Vector3();
var startNorm = new Vector3();
var endNorm = new Vector3();
var rotationAngle = 0;

var cameraPosition = new Vector3();
var cameraQuaternion = new Quaternion();
var cameraScale = new Vector3();

var parentPosition = new Vector3();
var parentQuaternion = new Quaternion();
var parentQuaternionInv = new Quaternion();
var parentScale = new Vector3();

var worldPositionStart = new Vector3();
var worldQuaternionStart = new Quaternion();
var worldScaleStart = new Vector3();

var worldPosition = new Vector3();
var worldQuaternion = new Quaternion();
var worldQuaternionInv = new Quaternion();
var worldScale = new Vector3();

var eye = new Vector3();

var positionStart = new Vector3();
var quaternionStart = new Quaternion();
var scaleStart = new Vector3();



class RotateControls extends Object3D {
//class RotateControls {
	constructor( camera, domElement ) {
		super();
		if ( domElement === undefined ) {
			console.warn( 'THREE.RotateControls: The second parameter "domElement" is now mandatory.' );
			domElement = document;
		}
		this.visible = false;
		this.domElement = domElement;

		this.isRotateControls = true;

		/* */
		this.defineProperty( "camera", camera );
		this.defineProperty( "object", undefined );
		this.defineProperty( "enabled", true );
		this.defineProperty( "axis", null );
		this.defineProperty( "dragging", false );
		this.defineProperty( "space", "world" );
		this.defineProperty( "size", 1 );
		/* */

		var scope = this;

		this.defineProperty( "worldPosition", worldPosition );
		this.defineProperty( "worldPositionStart", worldPositionStart );
		this.defineProperty( "worldQuaternion", worldQuaternion );
		this.defineProperty( "worldQuaternionStart", worldQuaternionStart );
		this.defineProperty( "cameraPosition", cameraPosition );
		this.defineProperty( "cameraQuaternion", cameraQuaternion );
		this.defineProperty( "pointStart", pointStart );
		this.defineProperty( "pointEnd", pointEnd );
		this.defineProperty( "rotationAxis", rotationAxis );
		this.defineProperty( "rotationAngle", rotationAngle );
		this.defineProperty( "eye", eye );


		this._onTouchStart = this.onTouchStart.bind(this);
		this._onPointerDown = this.onPointerDown.bind(this);
		this._onPointerUp = this.onPointerUp.bind(this);
		this._onPointerMove = this.onPointerMove.bind(this);

		this.domElement.addEventListener( "touchstart", this._onTouchStart, false );
		this.domElement.addEventListener( "pointerdown", this._onPointerDown, false );
		this.domElement.ownerDocument.addEventListener( "pointerup", this._onPointerUp, false );

	}
	dispose () {
		this.domElement.removeEventListener( "touchstart", this._onTouchStart );
		this.domElement.removeEventListener( "pointerdown", this._onPointerDown );
		this.domElement.ownerDocument.removeEventListener( "pointermove", this._onPointerMove );
		this.domElement.ownerDocument.removeEventListener( "pointerup", this._onPointerUp );
		this.traverse( function ( child ) {
			if ( child.geometry ) child.geometry.dispose();
			if ( child.material ) child.material.dispose();
		} );
	}

	// Set current object
	attach ( object ) {
		this.object = object;
		this.visible = true;
		return this;
	}

	// Detatch from object
	detach () {
		this.object = undefined;
		this.visible = false;
		return this;
	}

	// Defined getter, setter and store for a property
	defineProperty( propName, defaultValue ) {
		var scope = this;
		var propValue = defaultValue;

		Object.defineProperty( scope, propName, {
			get: function () {
				return propValue !== undefined ? propValue : defaultValue;
			},
			set: function ( value ) {
				if ( propValue !== value ) {
					propValue = value;
					scope.dispatchEvent( { type: propName + "-changed", value: value } );
					scope.dispatchEvent( changeEvent );
				}
			}
		} );
		scope[ propName ] = defaultValue;
	}

	// updateMatrixWorld  updates key transformation variables
	updateMatrixWorld () {

		if ( this.object !== undefined ) {
			this.object.updateMatrixWorld();
			if ( this.object.parent === null ) {
				console.error( 'RotateControls: The attached 3D object must be a part of the scene graph.' );
			} else {
				this.object.parent.matrixWorld.decompose( parentPosition, parentQuaternion, parentScale );
			}
			this.object.matrixWorld.decompose( worldPosition, worldQuaternion, worldScale );
			parentQuaternionInv.copy( parentQuaternion ).invert();
			worldQuaternionInv.copy( worldQuaternion ).invert();
		}

		this.camera.updateMatrixWorld();
		this.camera.matrixWorld.decompose( cameraPosition, cameraQuaternion, cameraScale );

		eye.copy( cameraPosition ).sub( worldPosition ).normalize();

		super.updateMatrixWorld( this );

	}
	pointerDown ( pointer ) {
		if ( this.object === undefined || this.dragging === true || pointer.button !== 0 ) return;
		if ( this.axis !== null ) {
			raycaster.setFromCamera( pointer, this.camera );
			var planeIntersect = intersectObjectWithRay( this.object, raycaster, true );
			if ( planeIntersect ) {
				var space = this.space;
				if ( this.axis === 'XYZ' ) {
					space = 'world';
				}
				if ( space === 'local' ) {
					var snap = this.rotationSnap;
					if ( ( this.axis === 'X' ) && snap ) this.object.rotation.x = Math.round( this.object.rotation.x / snap ) * snap;
					if ( ( this.axis === 'Y' ) && snap ) this.object.rotation.y = Math.round( this.object.rotation.y / snap ) * snap;
					if ( ( this.axis === 'Z' ) && snap ) this.object.rotation.z = Math.round( this.object.rotation.z / snap ) * snap;
				}
				this.object.updateMatrixWorld();
				this.object.parent.updateMatrixWorld();
				positionStart.copy( this.object.position );
				quaternionStart.copy( this.object.quaternion );
				this.object.matrixWorld.decompose( worldPositionStart, worldQuaternionStart, worldScaleStart );
				pointStart.copy( planeIntersect.point ).sub( worldPositionStart );
				positionDown.set( pointer.offsetX, pointer.offsetY );
				this.dragging = true;
				this.dispatchEvent( mouseDownEvent );
			}
		}
	}

	pointerMove ( pointer ) {
		var axis = this.axis;
		var object = this.object;
		var space = this.space;
		if ( axis === 'XYZ' ) {
			space = 'world';
		}
		if ( object === undefined || axis === null || this.dragging === false || pointer.button !== - 1 ) return;
		var toRadians = function ( angle ) {
			return angle * ( Math.PI / 180 );
		};
		var r_X = toRadians( pointer.offsetY - positionDown.y + pointer.offsetX - positionDown.x)
		var r_Y = toRadians( pointer.offsetX - positionDown.x );
		var r_Z = toRadians( pointer.offsetY - positionDown.y );
		if(axis.indexOf('X')==-1){
			r_X = 0;
		}
		if(axis.indexOf('Y')==-1){
			r_Y = 0;
		}
		if(axis.indexOf('Z')==-1){
			r_Z = 0;
		}
		var deltaRotationQuaternion = new Quaternion().setFromEuler( new Euler(
			r_X,
			r_Y,
			r_Z,
			'XYZ'
		) );
		positionDown.set( pointer.offsetX, pointer.offsetY );
    object.quaternion.multiplyQuaternions( deltaRotationQuaternion, object.quaternion );
		this.dispatchEvent( changeEvent );
		this.dispatchEvent( objectChangeEvent );
	}

	pointerUp ( pointer ) {
		if ( pointer.button !== 0 ) return;
		if ( this.dragging && ( this.axis !== null ) ) {
			this.dispatchEvent( mouseUpEvent );
		}
		this.dragging = false;
	}
	getPointer( event ) {
		if ( this.domElement.ownerDocument.pointerLockElement ) {
			return {
				x: 0,
				y: 0,
				shiftKey: event.shiftKey,
				button: event.button
			};
		} else {
			var pointer = event.changedTouches ? event.changedTouches[ 0 ] : event;
			var rect = this.domElement.getBoundingClientRect();
			return {
				x: ( pointer.clientX - rect.left ) / rect.width * 2 - 1,
				y: - ( pointer.clientY - rect.top ) / rect.height * 2 + 1,
				offsetX: event.offsetX,
				offsetY: event.offsetY,
				shiftKey: event.shiftKey,
				button: event.button
			};
		}
	}

	onPointerDown( event ) {
		if ( ! this.enabled ) return;
		this.domElement.ownerDocument.addEventListener( "pointermove", this._onPointerMove, false );
		this.pointerDown( this.getPointer( event ) );
	}
	onPointerMove( event ) {
		if ( ! this.enabled ) return;
		this.pointerMove( this.getPointer( event ) );
	}
	onPointerUp( event ) {
    if ( ! this.enabled ) return;
    this.domElement.ownerDocument.removeEventListener( "mousemove", this._onPointerMove, false );
		this.pointerUp( this.getPointer( event ) );
	}
	onTouchStart( event ) {
		if ( this.enabled === false ) return;
		event.preventDefault(); // prevent scrolling
	}
	setAxis ( axis ) {
			this.axis = axis;
	}

	setRotationSnap ( rotationSnap ) {
		this.rotationSnap = rotationSnap;
	};

	setSpace ( space ) {
		this.space = space;
	};

	update () {
		console.warn( 'THREE.RotateControls: update function has no more functionality and therefore has been deprecated.' );
	};

}


export { RotateControls };
