import {
	BoxBufferGeometry,
	BufferGeometry,
	Color,
	CylinderBufferGeometry,
	DoubleSide,
	Euler,
	Float32BufferAttribute,
	Line,
	LineBasicMaterial,
	Matrix4,
	Mesh,
	MeshBasicMaterial,
	Object3D,
	OctahedronBufferGeometry,
	PlaneBufferGeometry,
	Quaternion,
	Raycaster,
	SphereBufferGeometry,
	TorusBufferGeometry,
	Vector3
} from "../../libs/three.module.js";

class TransformControls extends Object3D {
	constructor(camera, domElement) {
		super();

		if (domElement === undefined) {

			console.warn('THREE.TransformControls: The second parameter "domElement" is now mandatory.');
			domElement = document;

		}

		this.isTransformControls = true;
		this.visible = false;
		this.domElement = domElement;

		var _gizmo = new TransformControlsGizmo();
		this.add(_gizmo);

		var _plane = new TransformControlsPlane();
		this.add(_plane);

		var scope = this;

		// Define properties with getters/setter
		// Setting the defined property will automatically trigger change event
		// Defined properties are passed down to gizmo and plane
		defineProperty("camera", camera);
		defineProperty("object", undefined);
		defineProperty("enabled", true);
		defineProperty("axis", null);
		defineProperty("currentAxis", '');
		defineProperty("mode", "universal");
		defineProperty("translationSnap", null);
		defineProperty("rotationSnap", null);
		defineProperty("scaleSnap", null);
		defineProperty("space", "world");
		defineProperty("size", 1);
		defineProperty("dragging", false);
		defineProperty("showX", true);
		defineProperty("showY", true);
		defineProperty("showZ", true);

		var changeEvent = { type: "change" };
		var mouseDownEvent = { type: "mouseDown" };
		var mouseUpEvent = { type: "mouseUp", mode: scope.mode };
		var objectChangeEvent = { type: "objectChange" };

		// Reusable utility variables
		var raycaster = new Raycaster();

		function intersectObjectWithRay(object, raycaster, includeInvisible) {

			var allIntersections = raycaster.intersectObject(object, true);

			for (var i = 0; i < allIntersections.length; i++) {

				if (allIntersections[i].object.visible || includeInvisible) {

					return allIntersections[i];

				}

			}

			return false;

		}

		var axisCopy = null;
		var _tempVector = new Vector3();
		var _tempVector2 = new Vector3();
		var _tempQuaternion = new Quaternion();
		var _unit = {
			X: new Vector3(1, 0, 0),
			Y: new Vector3(0, 1, 0),
			Z: new Vector3(0, 0, 1)
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

		// TODO: remove properties unused in plane and gizmo
		defineProperty("worldPosition", worldPosition);
		defineProperty("worldPositionStart", worldPositionStart);
		defineProperty("worldQuaternion", worldQuaternion);
		defineProperty("worldQuaternionStart", worldQuaternionStart);
		defineProperty("cameraPosition", cameraPosition);
		defineProperty("cameraQuaternion", cameraQuaternion);
		defineProperty("pointStart", pointStart);
		defineProperty("pointEnd", pointEnd);
		defineProperty("rotationAxis", rotationAxis);
		defineProperty("rotationAngle", rotationAngle);
		defineProperty("eye", eye);

		{

			domElement.addEventListener("pointerdown", onPointerDown, false);
			domElement.addEventListener("pointermove", onPointerHover, false);
			scope.domElement.ownerDocument.addEventListener("pointerup", onPointerUp, false);
			document.addEventListener("dblclick", onPointerDblClick, false);

		}

		this.dispose = function () {

			domElement.removeEventListener("pointerdown", onPointerDown);
			domElement.removeEventListener("pointermove", onPointerHover);
			scope.domElement.ownerDocument.removeEventListener("pointermove", onPointerMove);
			scope.domElement.ownerDocument.removeEventListener("pointerup", onPointerUp);
			document.removeEventListener("dblclick", onPointerDblClick);

			this.traverse(function (child) {

				if (child.geometry)
					child.geometry.dispose();
				if (child.material)
					child.material.dispose();

			});

		};

		// Set current object
		this.attach = function (object) {

			this.object = object;
			this.visible = true;

			return this;

		};

		// Detach from object
		this.detach = function () {

			this.object = undefined;
			this.visible = false;
			this.axis = null;

			return this;

		};

		// Defined getter, setter and store for a property
		function defineProperty(propName, defaultValue) {

			var propValue = defaultValue;

			Object.defineProperty(scope, propName, {
				get: function () {

					return propValue !== undefined ? propValue : defaultValue;

				},

				set: function (value) {

					if (propValue !== value) {

						propValue = value;
						_plane[propName] = value;
						_gizmo[propName] = value;

						scope.dispatchEvent({ type: propName + "-changed", value: value });
						scope.dispatchEvent(changeEvent);

					}

				}
			});

			scope[propName] = defaultValue;
			_plane[propName] = defaultValue;
			_gizmo[propName] = defaultValue;

		}

		// updateMatrixWorld  updates key transformation variables
		this.updateMatrixWorld = function () {

			if (this.object !== undefined) {

				this.object.updateMatrixWorld();

				if (this.object.parent === null) {

					console.error('TransformControls: The attached 3D object must be a part of the scene graph.');

				} else {

					this.object.parent.matrixWorld.decompose(parentPosition, parentQuaternion, parentScale);

				}

				this.object.matrixWorld.decompose(worldPosition, worldQuaternion, worldScale);

				parentQuaternionInv.copy(parentQuaternion).invert();
				worldQuaternionInv.copy(worldQuaternion).invert();

			}

			this.camera.updateMatrixWorld();
			this.camera.matrixWorld.decompose(cameraPosition, cameraQuaternion, cameraScale);

			if ( this.camera.isOrthographicCamera ) {

				this.camera.getWorldDirection( this.eye ).negate();

			} else {

				this.eye.copy( this.cameraPosition ).sub( this.worldPosition ).normalize();

			}

			Object3D.prototype.updateMatrixWorld.call(this);

		};

		this.pointerHover = function (pointer) {

			if (this.object === undefined || this.dragging === true)
				return;

			raycaster.setFromCamera(pointer, this.camera);

			var intersect = intersectObjectWithRay(_gizmo.picker[this.mode], raycaster);

			if (intersect) {

				this.axis = intersect.object.name;

			} else {

				this.axis = null;

			}

			axisCopy = this.axis;

		};

		this.pointerDown = function (pointer) {

			if (this.object === undefined || this.dragging === true || pointer.button !== 0)
				return;

			if (this.axis !== null) {

				raycaster.setFromCamera(pointer, this.camera);

				var planeIntersect = intersectObjectWithRay(_plane, raycaster, true);

				if (planeIntersect) {

					var space = this.space;

					if (this.mode === 'scale' || this.axis.search('scale') != -1) {

						space = 'local';

					} else if (this.axis === 'E' || this.axis === 'rotateE' || this.axis === 'XYZE' || this.axis === 'rotateXYZE' || this.axis === 'XYZ' || this.axis === 'translateXYZ') {

						space = 'world';

					}

					if (space === 'local' && (this.mode === 'rotate' || this.axis.search('rotate') != -1)) {

						var snap = this.rotationSnap;

						if ((this.axis === 'X' || this.axis === 'rotateX') && snap)
							this.object.rotation.x = Math.round(this.object.rotation.x / snap) * snap;
						if ((this.axis === 'Y' || this.axis === 'rotateY') && snap)
							this.object.rotation.y = Math.round(this.object.rotation.y / snap) * snap;
						if ((this.axis === 'Z' || this.axis === 'rotateZ') && snap)
							this.object.rotation.z = Math.round(this.object.rotation.z / snap) * snap;

					}

					this.object.updateMatrixWorld();
					this.object.parent.updateMatrixWorld();

					positionStart.copy(this.object.position);
					quaternionStart.copy(this.object.quaternion);

					if (this.object.isRectAreaLight) {

						scaleStart.set(this.object.width, this.object.height, 0);

					} else {

						scaleStart.copy(this.object.scale);

					}

					this.object.matrixWorld.decompose(worldPositionStart, worldQuaternionStart, worldScaleStart);

					pointStart.copy(planeIntersect.point).sub(worldPositionStart);

				}


				this.dragging = true;
				mouseDownEvent.mode = this.mode;

				if (this.axis.includes('translate')) {

					var alignVector = new Vector3();
					var quaternion = this.space === "local" ? this.worldQuaternion : new Quaternion();
					var faceVector = new Vector3(
						this.axis == 'translateX' ? 1 : 0,
						this.axis == 'translateY' ? 1 : 0,
						this.axis == 'translateZ' ? 1 : 0
					);
					var dir = alignVector.copy(faceVector).applyQuaternion(quaternion).dot(this.eye);
					faceVector.multiplyScalar(dir < 0 ? -1 : 1);

					mouseDownEvent.face = faceVector;

				}


				this.dispatchEvent(mouseDownEvent);

			}

		};

		this.pointerDblClick = function () {

			if (axisCopy && (axisCopy.search('translate') != -1 || axisCopy.search('rotate') != -1)) {

				this.setSpace(this.space == 'local' ? 'world' : 'local');

			}

		};

		this.pointerMove = function (pointer) {

			var axis = this.axis;
			var mode = this.mode;
			var object = this.object;
			var space = this.space;

			if (mode === 'translateVoxel' || mode === 'scale' || (axis != null && axis.search('scale') != -1)) {

				space = 'local';

			} else if (axis === 'E' || axis === 'rotateE' || axis === 'XYZE' || axis === 'rotateXYZE' || axis === 'XYZ' || this.axis === 'translateXYZ') {

				space = 'world';

			}

			if (object === undefined || axis === null || this.dragging === false || pointer.button !== -1)
				return;

			raycaster.setFromCamera(pointer, this.camera);

			var planeIntersect = intersectObjectWithRay(_plane, raycaster, true);

			if (!planeIntersect)
				return;

			pointEnd.copy(planeIntersect.point).sub(worldPositionStart);

			if (mode === 'translate' || mode === 'translateVoxel' || axis.search('translate') != -1) {

				// Apply translate
				offset.copy(pointEnd).sub(pointStart);

				if (space === 'local' && axis !== 'XYZ' && axis !== 'translateXYZ') {

					offset.applyQuaternion(worldQuaternionInv);

				}

				if (axis.indexOf('X') === -1)
					offset.x = 0;
				if (axis.indexOf('Y') === -1)
					offset.y = 0;
				if (axis.indexOf('Z') === -1)
					offset.z = 0;

				if (space === 'local' && axis !== 'XYZ' && axis !== 'translateXYZ') {

					offset.applyQuaternion(quaternionStart).divide(parentScale);

				} else {

					offset.applyQuaternion(parentQuaternionInv).divide(parentScale);

				}

				//if ( object.userData.isVoxel && pointer.shiftKey ) {
				if (object.userData.isVoxel) {

					if (this.currentAxis == '') {
						this.currentAxis = "x";
						if (Math.abs(offset.y) > Math.abs(offset.x)) {
							this.currentAxis = "y";
							if (Math.abs(offset.z) > Math.abs(offset.y)) {
								this.currentAxis = "z";
							}
						} else {
							if (Math.abs(offset.z) > Math.abs(offset.x)) {
								this.currentAxis = "z";
							}
						}

						if (Math.abs(offset[this.currentAxis]) < 0.4) {
							this.currentAxis = '';
						}
					}

					this.dispatchEvent({ type: "change", mode: "voxel", offset: offset, axis: this.currentAxis });
					return;

				}

				object.position.copy(offset).add(positionStart);

				// Apply translation snap
				if (this.translationSnap) {

					if (space === 'local') {

						object.position.applyQuaternion(_tempQuaternion.copy(quaternionStart).invert());

						if (axis.search('X') !== -1) {

							object.position.x = Math.round(object.position.x / this.translationSnap) * this.translationSnap;

						}

						if (axis.search('Y') !== -1) {

							object.position.y = Math.round(object.position.y / this.translationSnap) * this.translationSnap;

						}

						if (axis.search('Z') !== -1) {

							object.position.z = Math.round(object.position.z / this.translationSnap) * this.translationSnap;

						}

						object.position.applyQuaternion(quaternionStart);

					}

					if (space === 'world') {

						if (object.parent) {

							object.position.add(_tempVector.setFromMatrixPosition(object.parent.matrixWorld));

						}

						if (axis.search('X') !== -1) {

							object.position.x = Math.round(object.position.x / this.translationSnap) * this.translationSnap;

						}

						if (axis.search('Y') !== -1) {

							object.position.y = Math.round(object.position.y / this.translationSnap) * this.translationSnap;

						}

						if (axis.search('Z') !== -1) {

							object.position.z = Math.round(object.position.z / this.translationSnap) * this.translationSnap;

						}

						if (object.parent) {

							object.position.sub(_tempVector.setFromMatrixPosition(object.parent.matrixWorld));

						}

					}

				}

			} else if (mode === 'scale' || axis.search('scale') != -1) {

				if (axis.search('XYZ') !== -1 || pointer.shiftKey) {

					var d = pointEnd.length() / pointStart.length();

					if (pointEnd.dot(pointStart) < 0)
						d *= -1;

					_tempVector2.set(d, d, d);

				} else {

					_tempVector.copy(pointStart);
					_tempVector2.copy(pointEnd);

					_tempVector.applyQuaternion(worldQuaternionInv);
					_tempVector2.applyQuaternion(worldQuaternionInv);

					_tempVector2.divide(_tempVector);

					if (axis.search('X') === -1) {

						_tempVector2.x = 1;

					}

					if (axis.search('Y') === -1) {

						_tempVector2.y = 1;

					}

					if (axis.search('Z') === -1) {

						_tempVector2.z = 1;

					}

				}

				// Apply scale
				if (object.isRectAreaLight) {

					var updatedScale = scaleStart.clone();
					updatedScale.multiply(_tempVector2);
					object.width = updatedScale.x;
					object.height = updatedScale.y;

				} else {

					object.scale.copy(scaleStart).multiply(_tempVector2);

				}

				if (this.scaleSnap) {

					if (axis.search('X') !== -1) {

						if (object.isRectAreaLight) {

							object.width = Math.round(object.width / this.scaleSnap) * this.scaleSnap || this.scaleSnap;

						} else {

							object.scale.x = Math.round(object.scale.x / this.scaleSnap) * this.scaleSnap || this.scaleSnap;

						}

					}

					if (axis.search('Y') !== -1) {

						if (object.isRectAreaLight) {

							object.height = Math.round(object.height / this.scaleSnap) * this.scaleSnap || this.scaleSnap;

						} else {

							object.scale.y = Math.round(object.scale.y / this.scaleSnap) * this.scaleSnap || this.scaleSnap;

						}

					}

					if (axis.search('Z') !== -1) {

						object.scale.z = Math.round(object.scale.z / this.scaleSnap) * this.scaleSnap || this.scaleSnap;

					}

				}

			} else if (mode === 'rotate' || axis.search('rotate') != -1) {

				offset.copy(pointEnd).sub(pointStart);

				var ROTATION_SPEED = 20 / worldPosition.distanceTo(_tempVector.setFromMatrixPosition(this.camera.matrixWorld));

				if (axis === 'E' || axis === 'rotateE') {

					rotationAxis.copy(eye);
					rotationAngle = pointEnd.angleTo(pointStart);

					startNorm.copy(pointStart).normalize();
					endNorm.copy(pointEnd).normalize();

					rotationAngle *= (endNorm.cross(startNorm).dot(eye) < 0 ? 1 : -1);

				} else if (axis === 'XYZE' || axis === 'rotateXYZE') {

					rotationAxis.copy(offset).cross(eye).normalize();
					rotationAngle = offset.dot(_tempVector.copy(rotationAxis).cross(this.eye)) * ROTATION_SPEED;

				} else if ((axis === 'X' || axis === 'Y' || axis === 'Z') || (axis === 'rotateX' || axis === 'rotateY' || axis === 'rotateZ')) {

					rotationAxis.copy(_unit[axis.substr(axis.length - 1)]);

					_tempVector.copy(_unit[axis.substr(axis.length - 1)]);

					if (space === 'local') {

						_tempVector.applyQuaternion(worldQuaternion);

					}

					rotationAngle = offset.dot(_tempVector.cross(eye).normalize()) * ROTATION_SPEED;

				}

				// Apply rotation snap
				if (this.rotationSnap)
					rotationAngle = Math.round(rotationAngle / this.rotationSnap) * this.rotationSnap;

				this.rotationAngle = rotationAngle;

				// Apply rotate
				if (space === 'local' && (axis !== 'E' && axis !== 'XYZE' && axis !== 'rotateE' && axis != 'rotateXYZE')) {

					object.quaternion.copy(quaternionStart);
					object.quaternion.multiply(_tempQuaternion.setFromAxisAngle(rotationAxis, rotationAngle)).normalize();

				} else {

					rotationAxis.applyQuaternion(parentQuaternionInv);
					object.quaternion.copy(_tempQuaternion.setFromAxisAngle(rotationAxis, rotationAngle));
					object.quaternion.multiply(quaternionStart).normalize();

				}

			}

			this.dispatchEvent(changeEvent);
			this.dispatchEvent(objectChangeEvent);

		};

		this.pointerUp = function (pointer) {

			if (pointer.button !== 0)
				return;

			if (this.dragging && (this.axis !== null)) {

				mouseUpEvent.mode = this.mode;
				this.dispatchEvent(mouseUpEvent);

			}

			this.dragging = false;
			this.axis = null;
			this.currentAxis = '';

		};

		// normalize mouse / touch pointer and remap {x,y} to view space.
		function getPointer(event) {

			if (scope.domElement.ownerDocument.pointerLockElement) {

				return {
					x: 0,
					y: 0,
					shiftKey: event.shiftKey,
					button: event.button
				};

			} else {

				var pointer = event.changedTouches ? event.changedTouches[0] : event;

				var rect = domElement.getBoundingClientRect();

				return {
					x: (pointer.clientX - rect.left) / rect.width * 2 - 1,
					y: -(pointer.clientY - rect.top) / rect.height * 2 + 1,
					shiftKey: event.shiftKey,
					button: event.button
				};

			}

		}

		// mouse / touch event handlers
		function onPointerHover(event) {

			if (!scope.enabled)
				return;

			switch (event.pointerType) {

				case 'mouse':
				case 'pen':
					scope.pointerHover(getPointer(event));
					break;

			}

		}

		function onPointerDown(event) {

			if (!scope.enabled)
				return;

			scope.domElement.style.touchAction = 'none'; // disable touch scroll
			scope.domElement.ownerDocument.addEventListener("pointermove", onPointerMove, false);

			scope.pointerHover(getPointer(event));
			scope.pointerDown(getPointer(event));

		}

		function onPointerDblClick(event) {

			if (!scope.enabled)
				return;

			scope.pointerHover(getPointer(event));
			scope.pointerDblClick();

		}

		function onPointerMove(event) {

			if (!scope.enabled)
				return;

			scope.pointerMove(getPointer(event));

		}

		function onPointerUp(event) {

			if (!scope.enabled)
				return;

			document.getElementById('library').style.pointerEvents = 'auto';
			document.getElementById('sidebar').style.pointerEvents = 'auto';
			document.getElementById('timeliner').style.pointerEvents = 'auto';

			scope.domElement.style.touchAction = '';
			scope.domElement.ownerDocument.removeEventListener("pointermove", onPointerMove, false);

			scope.pointerUp(getPointer(event));

		}

		// TODO: deprecate
		this.getMode = function () {

			return scope.mode;

		};

		this.setMode = function (mode) {

			scope.mode = mode;

		};

		this.setTranslationSnap = function (translationSnap) {

			scope.translationSnap = translationSnap;

		};

		this.setRotationSnap = function (rotationSnap) {

			scope.rotationSnap = rotationSnap;

		};

		this.setScaleSnap = function (scaleSnap) {

			scope.scaleSnap = scaleSnap;

		};

		this.setSize = function (size) {

			scope.size = size;

		};

		this.setSpace = function (space) {

			scope.space = space;

		};

	}
}

TransformControls.isTransformControls = true;


class TransformControlsGizmo extends Object3D {
	constructor() {
		'use strict';

		super();
		this.type = 'TransformControlsGizmo';

		// shared materials
		var gizmoMaterial = new MeshBasicMaterial({
			depthTest: false,
			depthWrite: false,
			transparent: true,
			side: DoubleSide,
			fog: false,
			toneMapped: false
		});

		var gizmoLineMaterial = new LineBasicMaterial({
			depthTest: false,
			depthWrite: false,
			transparent: true,
			linewidth: 1,
			fog: false,
			toneMapped: false
		});

		// Make unique material for each axis/color
		var matInvisible = gizmoMaterial.clone();
		matInvisible.opacity = 0.15;

		var matHelper = gizmoMaterial.clone();
		matHelper.opacity = 0.33;

		var matGreenHelper = gizmoMaterial.clone();
		matGreenHelper.opacity = 0.33;
		matGreenHelper.color.set(0x1c467f);

		var matRed = gizmoMaterial.clone();
		matRed.color.set(0xff0000);

		var matGreen = gizmoMaterial.clone();
		matGreen.color.set(0x00ff00);

		var matBlue = gizmoMaterial.clone();
		matBlue.color.set(0x0000ff);

		var matWhiteTransparent = gizmoMaterial.clone();
		matWhiteTransparent.opacity = 0.25;

		var matYellowTransparent = matWhiteTransparent.clone();
		matYellowTransparent.color.set(0xffff00);

		var matCyanTransparent = matWhiteTransparent.clone();
		matCyanTransparent.color.set(0x00ffff);

		var matMagentaTransparent = matWhiteTransparent.clone();
		matMagentaTransparent.color.set(0xff00ff);

		var matYellow = gizmoMaterial.clone();
		matYellow.color.set(0xffff00);

		var matLineRed = gizmoLineMaterial.clone();
		matLineRed.color.set(0xff0000);

		var matLineGreen = gizmoLineMaterial.clone();
		matLineGreen.color.set(0x00ff00);

		var matLineBlue = gizmoLineMaterial.clone();
		matLineBlue.color.set(0x0000ff);

		var matLineCyan = gizmoLineMaterial.clone();
		matLineCyan.color.set(0x00ffff);

		var matLineMagenta = gizmoLineMaterial.clone();
		matLineMagenta.color.set(0xff00ff);

		var matLineYellow = gizmoLineMaterial.clone();
		matLineYellow.color.set(0xffff00);

		var matLineGray = gizmoLineMaterial.clone();
		matLineGray.color.set(0x787878);

		var matLineYellowTransparent = matLineYellow.clone();
		matLineYellowTransparent.opacity = 0.25;

		var matUniversalTranslate = gizmoMaterial.clone();
		matUniversalTranslate.color.set(0x325a90);

		var matUniversalTranslateDark = matUniversalTranslate.clone();
		matUniversalTranslateDark.color.set(0x0d1f38);
		matUniversalTranslateDark.opacity = 0.5;

		var matUniversalTranslateXYZ = gizmoMaterial.clone();
		matUniversalTranslateXYZ.color.set(0x1c467f);


		var matUniversalTranslateVoxel = gizmoMaterial.clone();
		matUniversalTranslateVoxel.color.set(0x1c467f);
		matUniversalTranslateVoxel.opacity = 0.15;



		var matUniversalLine = gizmoMaterial.clone();
		matUniversalLine.color.set(0x1b324f);

		var matUniversalRotate = gizmoMaterial.clone();
		matUniversalRotate.color.set(0x4074b9);

		var matUniversalScaleLight = gizmoMaterial.clone();
		matUniversalScaleLight.color.set(0x2a4974);

		var matUniversalScaleDark = gizmoMaterial.clone();
		matUniversalScaleDark.color.set(0x182b43);

		// reusable geometry
		var arrowGeometry = new CylinderBufferGeometry(0, 0.05, 0.2, 12, 1, false);

		var scaleHandleGeometry = new BoxBufferGeometry(0.125, 0.125, 0.125);

		var lineGeometry = new BufferGeometry();
		lineGeometry.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 1, 0, 0], 3));

		var line2Geometry = new BufferGeometry();
		line2Geometry.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 2, 0, 0], 3));

		var CircleGeometry = function (radius, arc) {

			var geometry = new BufferGeometry();
			var vertices = [];

			for (var i = 0; i <= 64 * arc; ++i) {

				vertices.push(0, Math.cos(i / 32 * Math.PI) * radius, Math.sin(i / 32 * Math.PI) * radius);

			}

			geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));

			return geometry;

		};

		// Special geometry for transform helper. If scaled with position vector it spans from [0,0,0] to position
		var TranslateHelperGeometry = function () {

			var geometry = new BufferGeometry();

			geometry.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 1, 1, 1], 3));

			return geometry;

		};

		// Gizmo definitions - custom hierarchy definitions for setupGizmo() function
		var gizmoTranslate = {
			X: [
				[new Mesh(arrowGeometry, matUniversalTranslate.clone()), [0.95, 0, 0], [0, 0, -Math.PI / 2], null, 'fwd'],
				[new Mesh(arrowGeometry, matUniversalTranslate.clone()), [0.95, 0, 0], [0, 0, Math.PI / 2], null, 'bwd'],
				[new Line(lineGeometry, matUniversalTranslate.clone())]
			],
			Y: [
				[new Mesh(arrowGeometry, matUniversalTranslate.clone()), [0, 0.95, 0], null, null, 'fwd'],
				[new Mesh(arrowGeometry, matUniversalTranslate.clone()), [0, 0.95, 0], [Math.PI, 0, 0], null, 'bwd'],
				[new Line(lineGeometry, matUniversalTranslate.clone()), null, [0, 0, Math.PI / 2]]
			],
			Z: [
				[new Mesh(arrowGeometry, matUniversalTranslate.clone()), [0, 0, 0.95], [Math.PI / 2, 0, 0], null, 'fwd'],
				[new Mesh(arrowGeometry, matUniversalTranslate.clone()), [0, 0, 0.95], [-Math.PI / 2, 0, 0], null, 'bwd'],
				[new Line(lineGeometry, matUniversalTranslate.clone()), null, [0, -Math.PI / 2, 0]]
			],
			XYZ: [
				[new Mesh(new OctahedronBufferGeometry(0.1, 0), matUniversalTranslateXYZ), [0, 0, 0], [0, 0, 0]]
			],
			XY: [
				[new Mesh(new PlaneBufferGeometry(0.295, 0.295), matUniversalTranslateDark.clone()), [0.15, 0.15, 0]],
				[new Line(lineGeometry, matLineYellow), [0.18, 0.3, 0], null, [0.125, 1, 1]],
				[new Line(lineGeometry, matLineYellow), [0.3, 0.18, 0], [0, 0, Math.PI / 2], [0.125, 1, 1]]
			],
			YZ: [
				[new Mesh(new PlaneBufferGeometry(0.295, 0.295), matUniversalTranslateDark.clone()), [0, 0.15, 0.15], [0, Math.PI / 2, 0]],
				[new Line(lineGeometry, matLineCyan), [0, 0.18, 0.3], [0, 0, Math.PI / 2], [0.125, 1, 1]],
				[new Line(lineGeometry, matLineCyan), [0, 0.3, 0.18], [0, -Math.PI / 2, 0], [0.125, 1, 1]]
			],
			XZ: [
				[new Mesh(new PlaneBufferGeometry(0.295, 0.295), matUniversalTranslateDark.clone()), [0.15, 0, 0.15], [-Math.PI / 2, 0, 0]],
				[new Line(lineGeometry, matLineMagenta), [0.18, 0, 0.3], null, [0.125, 1, 1]],
				[new Line(lineGeometry, matLineMagenta), [0.3, 0, 0.18], [0, -Math.PI / 2, 0], [0.125, 1, 1]]
			]
		};

		var pickerTranslate = {
			X: [
				[new Mesh(new CylinderBufferGeometry(0.2, 0, 1, 4, 1, false), matInvisible), [0.55, 0, 0], [0, 0, -Math.PI / 2]]
			],
			Y: [
				[new Mesh(new CylinderBufferGeometry(0.2, 0, 1, 4, 1, false), matInvisible), [0, 0.55, 0]]
			],
			Z: [
				[new Mesh(new CylinderBufferGeometry(0.2, 0, 1, 4, 1, false), matInvisible), [0, 0, 0.55], [Math.PI / 2, 0, 0]]
			],
			XYZ: [
				[new Mesh(new OctahedronBufferGeometry(0.2, 0), matInvisible)]
			],
			XY: [
				[new Mesh(new PlaneBufferGeometry(0.4, 0.4), matInvisible), [0.2, 0.2, 0]]
			],
			YZ: [
				[new Mesh(new PlaneBufferGeometry(0.4, 0.4), matInvisible), [0, 0.2, 0.2], [0, Math.PI / 2, 0]]
			],
			XZ: [
				[new Mesh(new PlaneBufferGeometry(0.4, 0.4), matInvisible), [0.2, 0, 0.2], [-Math.PI / 2, 0, 0]]
			]
		};

		var helperTranslate = {
			START: [
				[new Mesh(new OctahedronBufferGeometry(0.01, 2), matHelper), null, null, null, 'helper']
			],
			END: [
				[new Mesh(new OctahedronBufferGeometry(0.01, 2), matHelper), null, null, null, 'helper']
			],
			DELTA: [
				[new Line(TranslateHelperGeometry(), matHelper), null, null, null, 'helper']
			],
			X: [
				[new Line(lineGeometry, matHelper.clone()), [-1e3, 0, 0], null, [1e6, 1, 1], 'helper']
			],
			Y: [
				[new Line(lineGeometry, matHelper.clone()), [0, -1e3, 0], [0, 0, Math.PI / 2], [1e6, 1, 1], 'helper']
			],
			Z: [
				[new Line(lineGeometry, matHelper.clone()), [0, 0, -1e3], [0, -Math.PI / 2, 0], [1e6, 1, 1], 'helper']
			]
		};

		var gizmoRotate = {
			X: [
				[new Line(CircleGeometry(1, 0.5), matLineRed)],
				[new Mesh(new OctahedronBufferGeometry(0.04, 0), matRed), [0, 0, 0.99], null, [1, 3, 1]],
			],
			Y: [
				[new Line(CircleGeometry(1, 0.5), matLineGreen), null, [0, 0, -Math.PI / 2]],
				[new Mesh(new OctahedronBufferGeometry(0.04, 0), matGreen), [0, 0, 0.99], null, [3, 1, 1]],
			],
			Z: [
				[new Line(CircleGeometry(1, 0.5), matLineBlue), null, [0, Math.PI / 2, 0]],
				[new Mesh(new OctahedronBufferGeometry(0.04, 0), matBlue), [0.99, 0, 0], null, [1, 3, 1]],
			],
			E: [
				[new Line(CircleGeometry(1.25, 1), matLineYellowTransparent), null, [0, Math.PI / 2, 0]],
				[new Mesh(new CylinderBufferGeometry(0.03, 0, 0.15, 4, 1, false), matLineYellowTransparent), [1.17, 0, 0], [0, 0, -Math.PI / 2], [1, 1, 0.001]],
				[new Mesh(new CylinderBufferGeometry(0.03, 0, 0.15, 4, 1, false), matLineYellowTransparent), [-1.17, 0, 0], [0, 0, Math.PI / 2], [1, 1, 0.001]],
				[new Mesh(new CylinderBufferGeometry(0.03, 0, 0.15, 4, 1, false), matLineYellowTransparent), [0, -1.17, 0], [Math.PI, 0, 0], [1, 1, 0.001]],
				[new Mesh(new CylinderBufferGeometry(0.03, 0, 0.15, 4, 1, false), matLineYellowTransparent), [0, 1.17, 0], [0, 0, 0], [1, 1, 0.001]],
			],
			XYZE: [
				[new Line(CircleGeometry(1, 1), matLineGray), null, [0, Math.PI / 2, 0]]
			]
		};

		var helperRotate = {
			AXIS: [
				[new Line(lineGeometry, matHelper.clone()), [-1e3, 0, 0], null, [1e6, 1, 1], 'helper']
			]
		};

		var pickerRotate = {
			X: [
				[new Mesh(new TorusBufferGeometry(1, 0.1, 4, 24), matInvisible), [0, 0, 0], [0, -Math.PI / 2, -Math.PI / 2]],
			],
			Y: [
				[new Mesh(new TorusBufferGeometry(1, 0.1, 4, 24), matInvisible), [0, 0, 0], [Math.PI / 2, 0, 0]],
			],
			Z: [
				[new Mesh(new TorusBufferGeometry(1, 0.1, 4, 24), matInvisible), [0, 0, 0], [0, 0, -Math.PI / 2]],
			],
			E: [
				[new Mesh(new TorusBufferGeometry(1.25, 0.1, 2, 24), matInvisible)]
			],
			XYZE: [
				[new Mesh(new SphereBufferGeometry(0.7, 10, 8), matInvisible)]
			]
		};

		var gizmoScale = {
			X: [
				[new Mesh(scaleHandleGeometry, matRed), [0.8, 0, 0], [0, 0, -Math.PI / 2]],
				[new Line(lineGeometry, matLineRed), null, null, [0.8, 1, 1]]
			],
			Y: [
				[new Mesh(scaleHandleGeometry, matGreen), [0, 0.8, 0]],
				[new Line(lineGeometry, matLineGreen), null, [0, 0, Math.PI / 2], [0.8, 1, 1]]
			],
			Z: [
				[new Mesh(scaleHandleGeometry, matBlue), [0, 0, 0.8], [Math.PI / 2, 0, 0]],
				[new Line(lineGeometry, matLineBlue), null, [0, -Math.PI / 2, 0], [0.8, 1, 1]]
			],
			XY: [
				[new Mesh(scaleHandleGeometry, matYellowTransparent), [0.85, 0.85, 0], null, [2, 2, 0.2]],
				[new Line(lineGeometry, matLineYellow), [0.855, 0.98, 0], null, [0.125, 1, 1]],
				[new Line(lineGeometry, matLineYellow), [0.98, 0.855, 0], [0, 0, Math.PI / 2], [0.125, 1, 1]]
			],
			YZ: [
				[new Mesh(scaleHandleGeometry, matCyanTransparent), [0, 0.85, 0.85], null, [0.2, 2, 2]],
				[new Line(lineGeometry, matLineCyan), [0, 0.855, 0.98], [0, 0, Math.PI / 2], [0.125, 1, 1]],
				[new Line(lineGeometry, matLineCyan), [0, 0.98, 0.855], [0, -Math.PI / 2, 0], [0.125, 1, 1]]
			],
			XZ: [
				[new Mesh(scaleHandleGeometry, matMagentaTransparent), [0.85, 0, 0.85], null, [2, 0.2, 2]],
				[new Line(lineGeometry, matLineMagenta), [0.855, 0, 0.98], null, [0.125, 1, 1]],
				[new Line(lineGeometry, matLineMagenta), [0.98, 0, 0.855], [0, -Math.PI / 2, 0], [0.125, 1, 1]]
			],
			XYZX: [
				[new Mesh(new BoxBufferGeometry(0.125, 0.125, 0.125), matWhiteTransparent.clone()), [1.1, 0, 0]],
			],
			XYZY: [
				[new Mesh(new BoxBufferGeometry(0.125, 0.125, 0.125), matWhiteTransparent.clone()), [0, 1.1, 0]],
			],
			XYZZ: [
				[new Mesh(new BoxBufferGeometry(0.125, 0.125, 0.125), matWhiteTransparent.clone()), [0, 0, 1.1]],
			]
		};

		var pickerScale = {
			X: [
				[new Mesh(new CylinderBufferGeometry(0.2, 0, 0.8, 4, 1, false), matInvisible), [0.5, 0, 0], [0, 0, -Math.PI / 2]]
			],
			Y: [
				[new Mesh(new CylinderBufferGeometry(0.2, 0, 0.8, 4, 1, false), matInvisible), [0, 0.5, 0]]
			],
			Z: [
				[new Mesh(new CylinderBufferGeometry(0.2, 0, 0.8, 4, 1, false), matInvisible), [0, 0, 0.5], [Math.PI / 2, 0, 0]]
			],
			XY: [
				[new Mesh(scaleHandleGeometry, matInvisible), [0.85, 0.85, 0], null, [3, 3, 0.2]],
			],
			YZ: [
				[new Mesh(scaleHandleGeometry, matInvisible), [0, 0.85, 0.85], null, [0.2, 3, 3]],
			],
			XZ: [
				[new Mesh(scaleHandleGeometry, matInvisible), [0.85, 0, 0.85], null, [3, 0.2, 3]],
			],
			XYZX: [
				[new Mesh(new BoxBufferGeometry(0.2, 0.2, 0.2), matInvisible), [1.1, 0, 0]],
			],
			XYZY: [
				[new Mesh(new BoxBufferGeometry(0.2, 0.2, 0.2), matInvisible), [0, 1.1, 0]],
			],
			XYZZ: [
				[new Mesh(new BoxBufferGeometry(0.2, 0.2, 0.2), matInvisible), [0, 0, 1.1]],
			]
		};

		var helperScale = {
			X: [
				[new Line(lineGeometry, matHelper.clone()), [-1e3, 0, 0], null, [1e6, 1, 1], 'helper']
			],
			Y: [
				[new Line(lineGeometry, matHelper.clone()), [0, -1e3, 0], [0, 0, Math.PI / 2], [1e6, 1, 1], 'helper']
			],
			Z: [
				[new Line(lineGeometry, matHelper.clone()), [0, 0, -1e3], [0, -Math.PI / 2, 0], [1e6, 1, 1], 'helper']
			]
		};

		var gizmoUniversal = {
			translateX: [
				[new Mesh(arrowGeometry, matUniversalTranslate.clone()), [0.95, 0, 0], [0, 0, -Math.PI / 2], null, 'fwd'],
				[new Mesh(arrowGeometry, matUniversalTranslate.clone()), [0.95, 0, 0], [0, 0, Math.PI / 2], null, 'bwd'],
				[new Line(lineGeometry, matUniversalTranslate.clone())]
			],
			translateY: [
				[new Mesh(arrowGeometry, matUniversalTranslate.clone()), [0, 0.95, 0], null, null, 'fwd'],
				[new Mesh(arrowGeometry, matUniversalTranslate.clone()), [0, 0.95, 0], [Math.PI, 0, 0], null, 'bwd'],
				[new Line(lineGeometry, matUniversalTranslate.clone()), null, [0, 0, Math.PI / 2]]
			],
			translateZ: [
				[new Mesh(arrowGeometry, matUniversalTranslate.clone()), [0, 0, 0.95], [Math.PI / 2, 0, 0], null, 'fwd'],
				[new Mesh(arrowGeometry, matUniversalTranslate.clone()), [0, 0, 0.95], [-Math.PI / 2, 0, 0], null, 'bwd'],
				[new Line(lineGeometry, matUniversalTranslate.clone()), null, [0, -Math.PI / 2, 0]]
			],
			translateXYZ: [
				[new Mesh(new OctahedronBufferGeometry(0.1, 0), matUniversalTranslateXYZ), [0, 0, 0], [0, 0, 0]]
			],
			translateXY: [
				[new Mesh(new PlaneBufferGeometry(0.295, 0.295), matUniversalTranslateDark.clone()), [0.15, 0.15, 0]],
				[new Line(lineGeometry, matLineYellow), [0.18, 0.3, 0], null, [0.125, 1, 1]],
				[new Line(lineGeometry, matLineYellow), [0.3, 0.18, 0], [0, 0, Math.PI / 2], [0.125, 1, 1]]
			],
			translateYZ: [
				[new Mesh(new PlaneBufferGeometry(0.295, 0.295), matUniversalTranslateDark.clone()), [0, 0.15, 0.15], [0, Math.PI / 2, 0]],
				[new Line(lineGeometry, matLineCyan), [0, 0.18, 0.3], [0, 0, Math.PI / 2], [0.125, 1, 1]],
				[new Line(lineGeometry, matLineCyan), [0, 0.3, 0.18], [0, -Math.PI / 2, 0], [0.125, 1, 1]]
			],
			translateXZ: [
				[new Mesh(new PlaneBufferGeometry(0.295, 0.295), matUniversalTranslateDark.clone()), [0.15, 0, 0.15], [-Math.PI / 2, 0, 0]],
				[new Line(lineGeometry, matLineMagenta), [0.18, 0, 0.3], null, [0.125, 1, 1]],
				[new Line(lineGeometry, matLineMagenta), [0.3, 0, 0.18], [0, -Math.PI / 2, 0], [0.125, 1, 1]]
			],
			rotateX: [
				[new Line(CircleGeometry(0.85, 0.5), matUniversalLine.clone())],
				[new Mesh(new OctahedronBufferGeometry(0.04, 0), matUniversalRotate.clone()), [0, 0, 0.84], null, [1, 3, 1]],
			],
			rotateY: [
				[new Line(CircleGeometry(0.85, 0.5), matUniversalLine.clone()), null, [0, 0, -Math.PI / 2]],
				[new Mesh(new OctahedronBufferGeometry(0.04, 0), matUniversalRotate.clone()), [0, 0, 0.84], null, [3, 1, 1]],
			],
			rotateZ: [
				[new Line(CircleGeometry(0.85, 0.5), matUniversalLine.clone()), null, [0, Math.PI / 2, 0]],
				[new Mesh(new OctahedronBufferGeometry(0.04, 0), matUniversalRotate.clone()), [0.84, 0, 0], null, [1, 3, 1]],
			],
			rotateE: [
				[new Line(CircleGeometry(1, 1), matUniversalLine.clone()), null, [0, Math.PI / 2, 0]],
			],
			rotateXYZE: [
				[new Line(CircleGeometry(0.85, 1), matUniversalLine.clone()), null, [0, Math.PI / 2, 0]]
			],
			scaleX: [
				[new Mesh(scaleHandleGeometry, matUniversalScaleLight.clone()), [1.4, 0, 0], [0, 0, -Math.PI / 2]],
			],
			scaleY: [
				[new Mesh(scaleHandleGeometry, matUniversalScaleLight.clone()), [0, 1.4, 0]],
			],
			scaleZ: [
				[new Mesh(scaleHandleGeometry, matUniversalScaleLight.clone()), [0, 0, 1.4], [Math.PI / 2, 0, 0]],
			],
			scaleXY: [
				[new Mesh(scaleHandleGeometry, matUniversalScaleDark.clone()), [1.2, 1.2, 0], null, [2, 2, 0.2]],
			],
			scaleYZ: [
				[new Mesh(scaleHandleGeometry, matUniversalScaleDark.clone()), [0, 1.2, 1.2], null, [0.2, 2, 2]],
			],
			scaleXZ: [
				[new Mesh(scaleHandleGeometry, matUniversalScaleDark.clone()), [1.2, 0, 1.2], null, [2, 0.2, 2]],
			],
		};

		var pickerUniversal = {
			translateX: [
				[new Mesh(new CylinderBufferGeometry(0.2, 0, 1, 4, 1, false), matInvisible), [0.55, 0, 0], [0, 0, -Math.PI / 2]]
			],
			translateY: [
				[new Mesh(new CylinderBufferGeometry(0.2, 0, 1, 4, 1, false), matInvisible), [0, 0.55, 0]]
			],
			translateZ: [
				[new Mesh(new CylinderBufferGeometry(0.2, 0, 1, 4, 1, false), matInvisible), [0, 0, 0.55], [Math.PI / 2, 0, 0]]
			],
			translateXYZ: [
				[new Mesh(new OctahedronBufferGeometry(0.2, 0), matInvisible)]
			],
			translateXY: [
				[new Mesh(new PlaneBufferGeometry(0.4, 0.4), matInvisible), [0.2, 0.2, 0]]
			],
			translateYZ: [
				[new Mesh(new PlaneBufferGeometry(0.4, 0.4), matInvisible), [0, 0.2, 0.2], [0, Math.PI / 2, 0]]
			],
			translateXZ: [
				[new Mesh(new PlaneBufferGeometry(0.4, 0.4), matInvisible), [0.2, 0, 0.2], [-Math.PI / 2, 0, 0]]
			],
			rotateX: [
				[new Mesh(new TorusBufferGeometry(0.85, 0.1, 4, 24), matInvisible), [0, 0, 0], [0, -Math.PI / 2, -Math.PI / 2]],
			],
			rotateY: [
				[new Mesh(new TorusBufferGeometry(0.85, 0.1, 4, 24), matInvisible), [0, 0, 0], [Math.PI / 2, 0, 0]],
			],
			rotateZ: [
				[new Mesh(new TorusBufferGeometry(0.85, 0.1, 4, 24), matInvisible), [0, 0, 0], [0, 0, -Math.PI / 2]],
			],
			rotateE: [
				[new Mesh(new TorusBufferGeometry(1, 0.1, 2, 24), matInvisible)]
			],
			rotateXYZE: [
				[new Mesh(new TorusBufferGeometry(0.6, 0.25, 2, 24), matInvisible)]
			],
			scaleX: [
				[new Mesh(new CylinderBufferGeometry(0.2, 0, 0.8, 4, 1, false), matInvisible), [1.1, 0, 0], [0, 0, -Math.PI / 2]]
			],
			scaleY: [
				[new Mesh(new CylinderBufferGeometry(0.2, 0, 0.8, 4, 1, false), matInvisible), [0, 1.1, 0]]
			],
			scaleZ: [
				[new Mesh(new CylinderBufferGeometry(0.2, 0, 0.8, 4, 1, false), matInvisible), [0, 0, 1.1], [Math.PI / 2, 0, 0]]
			],
			scaleXY: [
				[new Mesh(scaleHandleGeometry, matInvisible), [1.2, 1.2, 0], null, [3, 3, 0.2]],
			],
			scaleYZ: [
				[new Mesh(scaleHandleGeometry, matInvisible), [0, 1.2, 1.2], null, [0.2, 3, 3]],
			],
			scaleXZ: [
				[new Mesh(scaleHandleGeometry, matInvisible), [1.2, 0, 1.2], null, [3, 0.2, 3]],
			],
		};


		var gizmoTranslateVoxel = {
			XYZ: [
				//[ new Mesh( new OctahedronBufferGeometry( 0.2, 0 ), matUniversalTranslateXYZ ), [ 0, 0, 0 ], [ 0, 0, 0 ]]
				//[ new Mesh( new BoxBufferGeometry( 1,1,1,1,1,1 ), matUniversalTranslate.clone() ), [ 0, 0, 0 ], [ 0, 0, 0 ]]
				[new Mesh(new BoxBufferGeometry(1, 1, 1, 1, 1, 1), matUniversalTranslateVoxel.clone()), [0, 0, 0], [0, 0, 0]]
			],
			X: [
				[new Mesh(arrowGeometry, matUniversalTranslate.clone()), [1.95, 0, 0], [0, 0, -Math.PI / 2], null, 'fwd'],
				[new Mesh(arrowGeometry, matUniversalTranslate.clone()), [-1.95, 0, 0], [0, 0, Math.PI / 2], null, 'bwd'],
				[new Line(line2Geometry, matUniversalTranslate.clone()), [-2, 0, 0]],
				[new Line(line2Geometry, matUniversalTranslate.clone())],
			],
			Y: [
				[new Mesh(arrowGeometry, matUniversalTranslate.clone()), [0, 1.95, 0], null, null, 'fwd'],
				[new Mesh(arrowGeometry, matUniversalTranslate.clone()), [0, -1.95, 0], [Math.PI, 0, 0], null, 'bwd'],
				[new Line(line2Geometry, matUniversalTranslate.clone()), null, [0, 0, Math.PI / 2]],
				[new Line(line2Geometry, matUniversalTranslate.clone()), null, [0, 0, -Math.PI / 2]],
			],
			Z: [
				[new Mesh(arrowGeometry, matUniversalTranslate.clone()), [0, 0, 1.95], [Math.PI / 2, 0, 0], null, 'fwd'],
				[new Mesh(arrowGeometry, matUniversalTranslate.clone()), [0, 0, -1.95], [-Math.PI / 2, 0, 0], null, 'bwd'],
				[new Line(line2Geometry, matUniversalTranslate.clone()), null, [0, -Math.PI / 2, 0]],
				[new Line(line2Geometry, matUniversalTranslate.clone()), null, [0, Math.PI / 2, 0]],
			],
		};
		var pickerTranslateVoxel = {
			XYZ: [
				//[ new Mesh( new OctahedronBufferGeometry( 0.2, 0 ), matUniversalTranslateXYZ ), [ 0, 0, 0 ], [ 0, 0, 0 ]]
				[new Mesh(new BoxBufferGeometry(1, 1, 1, 1, 1, 1), matUniversalTranslateVoxel), [0, 0, 0], [0, 0, 0]]
			],
			X: [
				[new Mesh(new CylinderBufferGeometry(0.2, 0, 2, 4, 1, false), matInvisible), [1.05, 0, 0], [0, 0, -Math.PI / 2]],
				[new Mesh(new CylinderBufferGeometry(0.2, 0, 2, 4, 1, false), matInvisible), [-1.05, 0, 0], [0, 0, Math.PI / 2]]
			],
			Y: [
				[new Mesh(new CylinderBufferGeometry(0.2, 0, 2, 4, 1, false), matInvisible), [0, 1.05, 0]],
				[new Mesh(new CylinderBufferGeometry(0.2, 0, 2, 4, 1, false), matInvisible), [0, -1.05, 0], [Math.PI, 0, 0]],
			],
			Z: [
				[new Mesh(new CylinderBufferGeometry(0.2, 0, 2, 4, 1, false), matInvisible), [0, 0, 1.05], [Math.PI / 2, 0, 0]],
				[new Mesh(new CylinderBufferGeometry(0.2, 0, 2, 4, 1, false), matInvisible), [0, 0, -1.05], [-Math.PI / 2, 0, 0]],
			],
		};
		var helperTranslateVoxel = {
			XYZ: [
				//[ new Mesh( new OctahedronBufferGeometry( 0.2, 0 ), matInvisible ) ]
				[new Mesh(new BoxBufferGeometry(1, 1, 1, 1, 1, 1), matInvisible), [0, 0, 0], [0, 0, 0]]
			],
			X: [
				[new Line(line2Geometry, matGreenHelper.clone()), [-1e3, 0, 0], null, [1e6, 1, 1], 'helper']
			],
			Y: [
				[new Line(line2Geometry, matGreenHelper.clone()), [0, -1e3, 0], [0, 0, Math.PI / 2], [1e6, 1, 1], 'helper']
			],
			Z: [
				[new Line(line2Geometry, matGreenHelper.clone()), [0, 0, -1e3], [0, -Math.PI / 2, 0], [1e6, 1, 1], 'helper']
			],
		};

		var helperUniversal = {};

		// Creates an Object3D with gizmos described in custom hierarchy definition.
		var setupGizmo = function (gizmoMap) {

			var gizmo = new Object3D();

			for (var name in gizmoMap) {

				for (var i = gizmoMap[name].length; i--;) {

					var object = gizmoMap[name][i][0].clone();
					var position = gizmoMap[name][i][1];
					var rotation = gizmoMap[name][i][2];
					var scale = gizmoMap[name][i][3];
					var tag = gizmoMap[name][i][4];

					// name and tag properties are essential for picking and updating logic.
					object.name = name;
					object.tag = tag;

					if (position) {

						object.position.set(position[0], position[1], position[2]);

					}

					if (rotation) {

						object.rotation.set(rotation[0], rotation[1], rotation[2]);

					}

					if (scale) {

						object.scale.set(scale[0], scale[1], scale[2]);

					}

					object.updateMatrix();

					var tempGeometry = object.geometry.clone();
					tempGeometry.applyMatrix4(object.matrix);
					object.geometry = tempGeometry;
					object.renderOrder = Infinity;

					object.position.set(0, 0, 0);
					object.rotation.set(0, 0, 0);
					object.scale.set(1, 1, 1);

					gizmo.add(object);

				}

			}

			return gizmo;

		};

		// Reusable utility variables
		var tempVector = new Vector3(0, 0, 0);
		var tempEuler = new Euler();
		var alignVector = new Vector3(0, 1, 0);
		var zeroVector = new Vector3(0, 0, 0);
		var lookAtMatrix = new Matrix4();
		var tempQuaternion = new Quaternion();
		var tempQuaternion2 = new Quaternion();
		var identityQuaternion = new Quaternion();

		var unitX = new Vector3(1, 0, 0);
		var unitY = new Vector3(0, 1, 0);
		var unitZ = new Vector3(0, 0, 1);

		// Gizmo creation
		this.gizmo = {};
		this.picker = {};
		this.helper = {};

		this.add(this.gizmo["translateVoxel"] = setupGizmo(gizmoTranslateVoxel));
		this.add(this.gizmo["translate"] = setupGizmo(gizmoTranslate));
		this.add(this.gizmo["rotate"] = setupGizmo(gizmoRotate));
		this.add(this.gizmo["scale"] = setupGizmo(gizmoScale));
		this.add(this.gizmo["universal"] = setupGizmo(gizmoUniversal));

		this.add(this.picker["translateVoxel"] = setupGizmo(pickerTranslateVoxel));
		this.add(this.picker["translate"] = setupGizmo(pickerTranslate));
		this.add(this.picker["rotate"] = setupGizmo(pickerRotate));
		this.add(this.picker["scale"] = setupGizmo(pickerScale));
		this.add(this.picker["universal"] = setupGizmo(pickerUniversal));

		this.add(this.helper["translateVoxel"] = setupGizmo(helperTranslateVoxel));
		this.add(this.helper["translate"] = setupGizmo(helperTranslate));
		this.add(this.helper["rotate"] = setupGizmo(helperRotate));
		this.add(this.helper["scale"] = setupGizmo(helperScale));
		this.add(this.helper["universal"] = setupGizmo(helperUniversal));

		// Pickers should be hidden always
		this.picker["translateVoxel"].visible = false;
		this.picker["translate"].visible = false;
		this.picker["rotate"].visible = false;
		this.picker["scale"].visible = false;
		this.picker["universal"].visible = false;

		// updateMatrixWorld will update transformations and appearance of individual handles
		this.updateMatrixWorld = function () {

			var space = this.space;

			if (this.mode === 'scale')
				space = 'local'; // scale always oriented to local rotation
			if (this.mode === 'translateVoxel')
				space = 'local'; // translateVoxel always oriented to local rotation

			var quaternion = space === "local" ? this.worldQuaternion : identityQuaternion;

			// Show only gizmos for current transform mode
			this.gizmo["translateVoxel"].visible = this.mode === "translateVoxel";
			this.gizmo["translate"].visible = this.mode === "translate";
			this.gizmo["rotate"].visible = this.mode === "rotate";
			this.gizmo["scale"].visible = this.mode === "scale";
			this.gizmo["universal"].visible = this.mode === "universal";

			this.helper["translateVoxel"].visible = this.mode === "translateVoxel";
			this.helper["translate"].visible = this.mode === "translate";
			this.helper["rotate"].visible = this.mode === "rotate";
			this.helper["scale"].visible = this.mode === "scale";
			this.helper["universal"].visible = this.mode === "universal";


			var handles = [];
			handles = handles.concat(this.picker[this.mode].children);
			handles = handles.concat(this.gizmo[this.mode].children);
			handles = handles.concat(this.helper[this.mode].children);

			for (var i = 0; i < handles.length; i++) {

				var handle = handles[i];

				// hide aligned to camera
				handle.visible = true;
				handle.rotation.set(0, 0, 0);
				handle.position.copy(this.worldPosition);

				var factor;

				if (this.camera.isOrthographicCamera) {

					factor = (this.camera.top - this.camera.bottom) / this.camera.zoom;

				} else {

					factor = this.worldPosition.distanceTo(this.cameraPosition) * Math.min(1.9 * Math.tan(Math.PI * this.camera.fov / 360) / this.camera.zoom, 7);

				}
				if (this.mode !== "translateVoxel") {

					handle.scale.set(1, 1, 1).multiplyScalar(factor * this.size / 7);

				} else {
					if (this.object && this.object.parent) {
						handle.scale.copy(this.object.parent.scale);
					}

				}

				// TODO: simplify helpers and consider decoupling from gizmo
				if (handle.tag === 'helper') {

					handle.visible = false;

					if (handle.name === 'AXIS') {

						handle.position.copy(this.worldPositionStart);
						handle.visible = !!this.axis;

						if (this.axis === 'X') {

							tempQuaternion.setFromEuler(tempEuler.set(0, 0, 0));
							handle.quaternion.copy(quaternion).multiply(tempQuaternion);

							if (Math.abs(alignVector.copy(unitX).applyQuaternion(quaternion).dot(this.eye)) > 0.9) {

								handle.visible = false;

							}

						}

						if (this.axis === 'Y') {

							tempQuaternion.setFromEuler(tempEuler.set(0, 0, Math.PI / 2));
							handle.quaternion.copy(quaternion).multiply(tempQuaternion);

							if (Math.abs(alignVector.copy(unitY).applyQuaternion(quaternion).dot(this.eye)) > 0.9) {

								handle.visible = false;

							}

						}

						if (this.axis === 'Z') {

							tempQuaternion.setFromEuler(tempEuler.set(0, Math.PI / 2, 0));
							handle.quaternion.copy(quaternion).multiply(tempQuaternion);

							if (Math.abs(alignVector.copy(unitZ).applyQuaternion(quaternion).dot(this.eye)) > 0.9) {

								handle.visible = false;

							}

						}

						if (this.axis === 'XYZE') {

							tempQuaternion.setFromEuler(tempEuler.set(0, Math.PI / 2, 0));
							alignVector.copy(this.rotationAxis);
							handle.quaternion.setFromRotationMatrix(lookAtMatrix.lookAt(zeroVector, alignVector, unitY));
							handle.quaternion.multiply(tempQuaternion);
							handle.visible = this.dragging;

						}

						if (this.axis === 'E') {

							handle.visible = false;

						}


					} else if (handle.name === 'START') {

						handle.position.copy(this.worldPositionStart);
						handle.visible = this.dragging;

					} else if (handle.name === 'END') {

						handle.position.copy(this.worldPosition);
						handle.visible = this.dragging;

					} else if (handle.name === 'DELTA') {

						handle.position.copy(this.worldPositionStart);
						handle.quaternion.copy(this.worldQuaternionStart);
						tempVector.set(1e-10, 1e-10, 1e-10).add(this.worldPositionStart).sub(this.worldPosition).multiplyScalar(-1);
						tempVector.applyQuaternion(this.worldQuaternionStart.clone().invert());
						handle.scale.copy(tempVector);
						handle.visible = this.dragging;

					} else {

						handle.quaternion.copy(quaternion);

						if (this.dragging) {

							handle.position.copy(this.worldPositionStart);

						} else {

							handle.position.copy(this.worldPosition);

						}

						if (this.axis) {

							if (this.mode === 'translateVoxel') {
								if (this.currentAxis != '') {
									handle.visible = this.currentAxis == String(handle.name).toLowerCase();
								} else {
									handle.visible = this.axis.search(handle.name) !== -1;
								}
							} else {
								handle.visible = this.axis.search(handle.name) !== -1;
							}

						}

					}

					// If updating helper, skip rest of the loop
					continue;

				}

				// Align handles to current local or world rotation
				handle.quaternion.copy(quaternion);

				if (this.mode === 'translate' || this.mode === 'translateVoxel' || this.mode === 'scale' || handle.name.search('translate') != -1 || handle.name.search('scale') != -1) {

					// Hide translate and scale axis facing the camera
					var AXIS_HIDE_THRESHOLD  = 0.99;
					var PLANE_HIDE_THRESHOLD = 0.2;
					var AXIS_FLIP_THRESHOLD = 0.0;


					if (handle.name === 'X' || handle.name === 'XYZX' || handle.name === 'translateX' || handle.name === 'scaleX' || handle.name === 'scaleXYZX') {
						if (this.mode !== 'translateVoxel') {
							if (Math.abs(alignVector.copy(unitX).applyQuaternion(quaternion).dot(this.eye)) > AXIS_HIDE_THRESHOLD ) {

								handle.scale.set(1e-10, 1e-10, 1e-10);
								handle.visible = false;

							}
						} else {
							if (this.currentAxis == "x" || this.currentAxis == "") {
								handle.scale.set(1, 1, 1);
								handle.visible = true;
							} else {
								handle.scale.set(1e-10, 1e-10, 1e-10);
								handle.visible = false;
							}
						}

					}

					if (handle.name === 'Y' || handle.name === 'XYZY' || handle.name === 'translateY' || handle.name === 'scaleY' || handle.name === 'scaleXYZY') {
						if (this.mode !== 'translateVoxel') {
							if (Math.abs(alignVector.copy(unitY).applyQuaternion(quaternion).dot(this.eye)) > AXIS_HIDE_THRESHOLD ) {

								handle.scale.set(1e-10, 1e-10, 1e-10);
								handle.visible = false;

							}
						} else {
							if (this.currentAxis == "y" || this.currentAxis == "") {
								handle.scale.set(1, 1, 1);
								handle.visible = true;
							} else {
								handle.scale.set(1e-10, 1e-10, 1e-10);
								handle.visible = false;
							}
						}

					}

					if (handle.name === 'Z' || handle.name === 'XYZZ' || handle.name === 'translateZ' || handle.name === 'scaleZ' || handle.name === 'scaleXYZZ') {
						if (this.mode !== 'translateVoxel') {
							if (Math.abs(alignVector.copy(unitZ).applyQuaternion(quaternion).dot(this.eye)) > AXIS_HIDE_THRESHOLD ) {

								handle.scale.set(1e-10, 1e-10, 1e-10);
								handle.visible = false;

							}
						} else {
							if (this.currentAxis == "z" || this.currentAxis == "") {
								handle.scale.set(1, 1, 1);
								handle.visible = true;
							} else {
								handle.scale.set(1e-10, 1e-10, 1e-10);
								handle.visible = false;
							}
						}

					}

					if (handle.name === 'XY' || handle.name === 'scaleXY' || handle.name === 'translateXY') {

						if (Math.abs(alignVector.copy(unitZ).applyQuaternion(quaternion).dot(this.eye)) < PLANE_HIDE_THRESHOLD) {

							handle.scale.set(1e-10, 1e-10, 1e-10);
							handle.visible = false;

						}

					}

					if (handle.name === 'YZ' || handle.name === 'scaleYZ' || handle.name === 'translateYZ') {

						if (Math.abs(alignVector.copy(unitX).applyQuaternion(quaternion).dot(this.eye)) < PLANE_HIDE_THRESHOLD) {

							handle.scale.set(1e-10, 1e-10, 1e-10);
							handle.visible = false;

						}

					}

					if (handle.name === 'XZ' || handle.name === 'scaleXZ' || handle.name === 'translateXZ') {

						if (Math.abs(alignVector.copy(unitY).applyQuaternion(quaternion).dot(this.eye)) < PLANE_HIDE_THRESHOLD) {

							handle.scale.set(1e-10, 1e-10, 1e-10);
							handle.visible = false;

						}

					}

					// Flip translate and scale axis ocluded behind another axis
					if (handle.name.search('X') !== -1) {
						if (this.mode !== 'translateVoxel') {
							if (alignVector.copy(unitX).applyQuaternion(quaternion).dot(this.eye) < AXIS_FLIP_THRESHOLD) {

								if (handle.tag === 'fwd') {

									handle.visible = false;

								} else {

									handle.scale.x *= -1;

								}

							} else if (handle.tag === 'bwd') {

								handle.visible = false;

							}
						} else {
							handle.visible = true;
						}

					}

					if (handle.name.search('Y') !== -1) {
						if (this.mode !== 'translateVoxel') {
							if (alignVector.copy(unitY).applyQuaternion(quaternion).dot(this.eye) < AXIS_FLIP_THRESHOLD) {

								if (handle.tag === 'fwd') {

									handle.visible = false;

								} else {

									handle.scale.y *= -1;

								}

							} else if (handle.tag === 'bwd') {

								handle.visible = false;

							}
						} else {
							handle.visible = true;
						}
					}

					if (handle.name.search('Z') !== -1) {

						if (this.mode !== 'translateVoxel') {

							if (alignVector.copy(unitZ).applyQuaternion(quaternion).dot(this.eye) < AXIS_FLIP_THRESHOLD) {

								if (handle.tag === 'fwd') {

									handle.visible = false;

								} else {

									handle.scale.z *= -1;

								}

							} else if (handle.tag === 'bwd') {

								handle.visible = false;

							}
						} else {
							handle.visible = true;
						}

					}

				} else if (this.mode === 'rotate' || handle.name.search('rotate') != -1) {

					// Align handles to current local or world rotation
					tempQuaternion2.copy(quaternion);
					alignVector.copy(this.eye).applyQuaternion(tempQuaternion.copy(quaternion).invert());

					if (handle.name.search("E") !== -1) {

						handle.quaternion.setFromRotationMatrix(lookAtMatrix.lookAt(this.eye, zeroVector, unitY));

					}

					if (handle.name === 'X' || handle.name === 'rotateX') {

						tempQuaternion.setFromAxisAngle(unitX, Math.atan2(-alignVector.y, alignVector.z));
						tempQuaternion.multiplyQuaternions(tempQuaternion2, tempQuaternion);
						handle.quaternion.copy(tempQuaternion);

					}

					if (handle.name === 'Y' || handle.name === 'rotateY') {

						tempQuaternion.setFromAxisAngle(unitY, Math.atan2(alignVector.x, alignVector.z));
						tempQuaternion.multiplyQuaternions(tempQuaternion2, tempQuaternion);
						handle.quaternion.copy(tempQuaternion);

					}

					if (handle.name === 'Z' || handle.name === 'rotateZ') {

						tempQuaternion.setFromAxisAngle(unitZ, Math.atan2(alignVector.y, alignVector.x));
						tempQuaternion.multiplyQuaternions(tempQuaternion2, tempQuaternion);
						handle.quaternion.copy(tempQuaternion);

					}

				}

				// Hide disabled axes
				handle.visible = handle.visible && (handle.name.indexOf("X") === -1 || this.showX);
				handle.visible = handle.visible && (handle.name.indexOf("Y") === -1 || this.showY);
				handle.visible = handle.visible && (handle.name.indexOf("Z") === -1 || this.showZ);
				handle.visible = handle.visible && (handle.name.indexOf("E") === -1 || (this.showX && this.showY && this.showZ));

				// highlight selected axis
				handle.material._opacity = handle.material._opacity || handle.material.opacity;
				handle.material._color = handle.material._color || handle.material.color.clone();

				handle.material.color.copy(handle.material._color);
				handle.material.opacity = handle.material._opacity;

				if (!this.enabled) {
					handle.material.opacity *= 0.5;
					handle.material.color.lerp(new Color(1, 1, 1), 0.5);

				} else if (this.axis) {

					if (handle.name === this.axis) {
						//if(this.mode != 'translateVoxel'){
						handle.material.opacity = 1.0;
						handle.material.color.lerp(new Color(1, 1, 1), 0.5);
						//}
					} else if (this.axis.split('').some(function (a) {

						return handle.name === a;

					})) {
						//if(this.mode != 'translateVoxel'){
						handle.material.opacity = 1.0;
						handle.material.color.lerp(new Color(1, 1, 1), 0.5);
						//}
					} else {
						// handle.material.opacity *= 0.25;
						// handle.material.color.lerp( new Color( 1, 1, 1 ), 0.5 );
					}

				}

			}

			Object3D.prototype.updateMatrixWorld.call(this);

		};

	}
}

TransformControlsGizmo.isTransformControlsGizmo = true;


class TransformControlsPlane extends Mesh {
	constructor() {
		'use strict';

		super(
			new PlaneBufferGeometry(100000, 100000, 2, 2),
			new MeshBasicMaterial({ visible: false, wireframe: true, side: DoubleSide, transparent: true, opacity: 0.1, toneMapped: false })
		);

		this.type = 'TransformControlsPlane';

		var unitX = new Vector3(1, 0, 0);
		var unitY = new Vector3(0, 1, 0);
		var unitZ = new Vector3(0, 0, 1);

		var tempVector = new Vector3();
		var dirVector = new Vector3();
		var alignVector = new Vector3();
		var tempMatrix = new Matrix4();
		var identityQuaternion = new Quaternion();

		this.updateMatrixWorld = function () {

			var space = this.space;

			this.position.copy(this.worldPosition);

			if (this.mode === 'scale')
				space = 'local'; // scale always oriented to local rotation
			if (this.mode === 'translateVoxel')
				space = 'local'; // translateVoxel always oriented to local rotation

			unitX.set(1, 0, 0).applyQuaternion(space === "local" ? this.worldQuaternion : identityQuaternion);
			unitY.set(0, 1, 0).applyQuaternion(space === "local" ? this.worldQuaternion : identityQuaternion);
			unitZ.set(0, 0, 1).applyQuaternion(space === "local" ? this.worldQuaternion : identityQuaternion);

			// Align the plane for current transform mode, axis and space.
			alignVector.copy(unitY);

			switch (this.mode) {

				case 'translate':
				case 'translateVoxel':
				case 'scale':
					switch (this.axis) {

						case 'X':
							alignVector.copy(this.eye).cross(unitX);
							dirVector.copy(unitX).cross(alignVector);
							break;
						case 'Y':
							alignVector.copy(this.eye).cross(unitY);
							dirVector.copy(unitY).cross(alignVector);
							break;
						case 'Z':
							alignVector.copy(this.eye).cross(unitZ);
							dirVector.copy(unitZ).cross(alignVector);
							break;
						case 'XY':
							dirVector.copy(unitZ);
							break;
						case 'YZ':
							dirVector.copy(unitX);
							break;
						case 'XZ':
							alignVector.copy(unitZ);
							dirVector.copy(unitY);
							break;
						case 'XYZ':
						case 'E':
							dirVector.set(0, 0, 0);
							break;

					}
					break;
				case 'universal':
					switch (this.axis) {

						case 'translateX': case 'scaleX':
							alignVector.copy(this.eye).cross(unitX);
							dirVector.copy(unitX).cross(alignVector);
							break;
						case 'translateY': case 'scaleY':
							alignVector.copy(this.eye).cross(unitY);
							dirVector.copy(unitY).cross(alignVector);
							break;
						case 'translateZ': case 'scaleZ':
							alignVector.copy(this.eye).cross(unitZ);
							dirVector.copy(unitZ).cross(alignVector);
							break;
						case 'scaleXY': case 'translateXY':
							dirVector.copy(unitZ);
							break;
						case 'scaleYZ': case 'translateYZ':
							dirVector.copy(unitX);
							break;
						case 'scaleXZ': case 'translateXZ':
							alignVector.copy(unitZ);
							dirVector.copy(unitY);
							break;
						case 'rotateX': case 'rotateY': case 'rotateZ': case 'rotateE': case 'rotateXYZE': case 'translateXYZ':
							dirVector.set(0, 0, 0);
							break;

					}
					break;
				case 'rotate':
				default:
					// special case for rotate
					dirVector.set(0, 0, 0);

			}

			if (dirVector.length() === 0) {

				// If in rotate mode, make the plane parallel to camera
				this.quaternion.copy(this.cameraQuaternion);

			} else {

				tempMatrix.lookAt(tempVector.set(0, 0, 0), dirVector, alignVector);

				this.quaternion.setFromRotationMatrix(tempMatrix);

			}

			Object3D.prototype.updateMatrixWorld.call(this);

		};

	}
}

TransformControlsPlane.isTransformControlsPlane = true;

export { TransformControls, TransformControlsGizmo, TransformControlsPlane };
