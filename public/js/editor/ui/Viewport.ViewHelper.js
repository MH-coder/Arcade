import { UIPanel } from './components/ui.js';

import * as THREE from '../libs/three.module.js';

class ViewHelper extends THREE.Object3D {
	constructor(editorCamera, container) {

		super();

		this.animating = false;
		this.controls = null;
		this.camera = editorCamera;

		var panel = new UIPanel();
		panel.setId('viewHelper');
		panel.setPosition('absolute');
		panel.setLeft('0px');
		panel.setTop('0px');
		panel.setHeight('128px');
		panel.setWidth('128px');

		var scope = this;

		panel.dom.addEventListener('mouseup', function (event) {

			event.stopPropagation();

			scope.handleClick(event);

		});

		panel.dom.addEventListener('mousedown', function (event) {

			event.stopPropagation();

		});

		container.add(panel);

		var color1 = new THREE.Color('#2a4974');
		var color2 = new THREE.Color('#2a4974');
		var color3 = new THREE.Color('#2a4974');

		var interactiveObjects = [];
		var raycaster = new THREE.Raycaster();
		var mouse = new THREE.Vector2();
		var dummy = new THREE.Object3D();

		var camera = new THREE.OrthographicCamera(-2, 2, 2, -2, 0, 4);
		camera.position.set(0, 0, 2);

		var geometry = new THREE.BoxBufferGeometry(0.8, 0.05, 0.05).translate(0.4, 0, 0);

		var xAxis = new THREE.Mesh(geometry, getAxisMaterial(color1));
		var yAxis = new THREE.Mesh(geometry, getAxisMaterial(color2));
		var zAxis = new THREE.Mesh(geometry, getAxisMaterial(color3));

		yAxis.rotation.z = Math.PI / 2;
		zAxis.rotation.y = -Math.PI / 2;

		this.add(xAxis);
		this.add(zAxis);
		this.add(yAxis);

		var posXAxisHelper = new THREE.Sprite(getSpriteMaterial(color1, 'X'));
		posXAxisHelper.userData.type = 'posX';
		var posYAxisHelper = new THREE.Sprite(getSpriteMaterial(color2, 'Y'));
		posYAxisHelper.userData.type = 'posY';
		var posZAxisHelper = new THREE.Sprite(getSpriteMaterial(color3, 'Z'));
		posZAxisHelper.userData.type = 'posZ';
		var negXAxisHelper = new THREE.Sprite(getSpriteMaterial(color1));
		negXAxisHelper.userData.type = 'negX';
		var negYAxisHelper = new THREE.Sprite(getSpriteMaterial(color2));
		negYAxisHelper.userData.type = 'negY';
		var negZAxisHelper = new THREE.Sprite(getSpriteMaterial(color3));
		negZAxisHelper.userData.type = 'negZ';

		posXAxisHelper.position.x = 1;
		posYAxisHelper.position.y = 1;
		posZAxisHelper.position.z = 1;
		negXAxisHelper.position.x = -1;
		negXAxisHelper.scale.setScalar(0.8);
		negYAxisHelper.position.y = -1;
		negYAxisHelper.scale.setScalar(0.8);
		negZAxisHelper.position.z = -1;
		negZAxisHelper.scale.setScalar(0.8);

		this.add(posXAxisHelper);
		this.add(posYAxisHelper);
		this.add(posZAxisHelper);
		this.add(negXAxisHelper);
		this.add(negYAxisHelper);
		this.add(negZAxisHelper);

		interactiveObjects.push(posXAxisHelper);
		interactiveObjects.push(posYAxisHelper);
		interactiveObjects.push(posZAxisHelper);
		interactiveObjects.push(negXAxisHelper);
		interactiveObjects.push(negYAxisHelper);
		interactiveObjects.push(negZAxisHelper);

		var point = new THREE.Vector3();
		var dim = 128;
		var turnRate = 2 * Math.PI; // turn rate in angles per second

		this.render = function (renderer) {

			this.quaternion.copy(this.camera.quaternion).invert();
			this.updateMatrixWorld();

			point.set(0, 0, 1);
			point.applyQuaternion(this.camera.quaternion);

			if (point.x >= 0) {

				posXAxisHelper.material.opacity = 1;
				negXAxisHelper.material.opacity = 0.5;

			} else {

				posXAxisHelper.material.opacity = 0.5;
				negXAxisHelper.material.opacity = 1;

			}

			if (point.y >= 0) {

				posYAxisHelper.material.opacity = 1;
				negYAxisHelper.material.opacity = 0.5;

			} else {

				posYAxisHelper.material.opacity = 0.5;
				negYAxisHelper.material.opacity = 1;

			}

			if (point.z >= 0) {

				posZAxisHelper.material.opacity = 1;
				negZAxisHelper.material.opacity = 0.5;

			} else {

				posZAxisHelper.material.opacity = 0.5;
				negZAxisHelper.material.opacity = 1;

			}

			//
			var y = container.dom.offsetHeight - dim;

			renderer.clearDepth();
			renderer.setViewport(0, y, dim, dim);
			renderer.render(this, camera);

		};

		var targetPosition = new THREE.Vector3();
		var targetQuaternion = new THREE.Quaternion();

		var q1 = new THREE.Quaternion();
		var q2 = new THREE.Quaternion();
		var radius = 0;

		this.handleClick = function (event) {

			if (this.animating === true)
				return false;

			mouse.x = (event.clientX / dim) * 2 - 1;
			mouse.y = -(event.clientY / dim) * 2 + 1;

			raycaster.setFromCamera(mouse, camera);

			var intersects = raycaster.intersectObjects(interactiveObjects);

			if (intersects.length > 0) {

				var intersection = intersects[0];
				var object = intersection.object;

				prepareAnimationData(object, this.controls.center);

				this.animating = true;

				return true;

			} else {

				return false;

			}

		};

		this.update = function (delta) {

			var step = delta * turnRate;
			var focusPoint = this.controls.center;

			// animate position by doing a slerp and then scaling the position on the unit sphere
			q1.rotateTowards(q2, step);
			this.camera.position.set(0, 0, 1).applyQuaternion(q1).multiplyScalar(radius).add(focusPoint);

			// animate orientation
			this.camera.quaternion.rotateTowards(targetQuaternion, step);

			if (q1.angleTo(q2) === 0) {

				this.animating = false;

			}

		};

		function prepareAnimationData(object, focusPoint) {

			switch (object.userData.type) {

				case 'posX':
					targetPosition.set(1, 0, 0);
					targetQuaternion.setFromEuler(new THREE.Euler(0, Math.PI * 0.5, 0));
					break;

				case 'posY':
					targetPosition.set(0, 1, 0);
					targetQuaternion.setFromEuler(new THREE.Euler(-Math.PI * 0.5, 0, 0));
					break;

				case 'posZ':
					targetPosition.set(0, 0, 1);
					targetQuaternion.setFromEuler(new THREE.Euler());
					break;

				case 'negX':
					targetPosition.set(-1, 0, 0);
					targetQuaternion.setFromEuler(new THREE.Euler(0, -Math.PI * 0.5, 0));
					break;

				case 'negY':
					targetPosition.set(0, -1, 0);
					targetQuaternion.setFromEuler(new THREE.Euler(Math.PI * 0.5, 0, 0));
					break;

				case 'negZ':
					targetPosition.set(0, 0, -1);
					targetQuaternion.setFromEuler(new THREE.Euler(0, Math.PI, 0));
					break;

				default:
					console.error('ViewHelper: Invalid axis.');

			}

			//
			radius = scope.camera.position.distanceTo(focusPoint);
			targetPosition.multiplyScalar(radius).add(focusPoint);

			dummy.position.copy(focusPoint);

			dummy.lookAt(scope.camera.position);
			q1.copy(dummy.quaternion);

			dummy.lookAt(targetPosition);
			q2.copy(dummy.quaternion);

		}

		function getAxisMaterial(color) {

			return new THREE.MeshBasicMaterial({ color: color, toneMapped: false });

		}

		function getSpriteMaterial(color, text = null) {

			var canvas = document.createElement('canvas');
			canvas.width = 64;
			canvas.height = 64;

			var context = canvas.getContext('2d');
			context.beginPath();
			context.arc(32, 32, 16, 0, 2 * Math.PI);
			context.closePath();
			context.fillStyle = color.getStyle();
			context.fill();

			if (text !== null) {

				context.font = '24px Arial';
				context.textAlign = 'center';
				context.fillStyle = '#000000';
				context.fillText(text, 32, 41);

			}

			var texture = new THREE.CanvasTexture(canvas);

			return new THREE.SpriteMaterial({ map: texture, toneMapped: false });

		}

	}
}

ViewHelper.isViewHelper= true;
export { ViewHelper };
