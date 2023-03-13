import * as THREE from '../libs/three.module.js';

import { TransformControls } from '../core/controls/TransformControls.js';

import { UIPanel } from './components/ui.js';

import { EditorControls } from './EditorControls.js';

import { ViewHelper } from './Viewport.ViewHelper.js';

import { SetPositionCommand } from '../commands/SetPositionCommand.js';
import { SetPositionsMultyCommand } from '../commands/SetPositionsMultyCommand.js';
import { SetSpotLightTargetCommand } from '../commands/SetSpotLightTargetCommand.js';
import { SetRotationCommand } from '../commands/SetRotationCommand.js';
import { SetScaleCommand } from '../commands/SetScaleCommand.js';
import { AddVoxelsCommand } from '../commands/AddVoxelsCommand.js';
import { RemoveVoxelsCommand } from '../commands/RemoveVoxelsCommand.js';
import { SetMaterialColorCommand } from '../commands/SetMaterialColorCommand.js';
import { SetMaterialMapCommand } from '../commands/SetMaterialMapCommand.js';
import { SetValueCommand } from '../commands/SetValueCommand.js';
import { SetSceneCommand } from '../commands/SetSceneCommand.js';

function Viewport(editor) {

	var assets = editor.assets;
	var signals = editor.signals;
	var config = editor.config;

	var container = new UIPanel();
	container.setId('viewport');

	//

	var composer = null;
	var renderer = null;
	var pmremGenerator = null;
	var pmremTexture = null;

	var camera = editor.viewportCamera;
	var scene = editor.scene;

	var objects = [];
	var filters = {};

	// helpers

	var grid = new THREE.GridHelper(30, 30, 0x444444, 0x888888);

	var lightHelpers = editor.lightHelpers;
	var cameraHelpers = editor.cameraHelpers;
	var viewHelper = new ViewHelper(camera, container);
	var transformHelpers = new THREE.Scene();
	var showHelpers = true;
	var helpers = {
		grid: true,
		lights: true,
		cameras: true,
		compass: true
	}

	//

	var box = new THREE.Box3();

	//var selectionBox = new THREE.BoxHelper(undefined, 0x00ff00);
	var selectionBox = new THREE.BoxHelper();
	selectionBox.material.depthTest = false;
	selectionBox.material.transparent = true;
	selectionBox.visible = false;
	transformHelpers.add(selectionBox);

	var objectPositionOnDown = null;
	var objectRotationOnDown = null;
	var objectScaleOnDown = null;

	var transformControlsClicked = false;
	var transformControls = new TransformControls(camera, container.dom);
	var spotTargetControls = new TransformControls(camera, container.dom);

	// voxel

	var voxelHelpers = new THREE.Scene();
	var selectedVoxels = [];
	//var voxelSelectionBox = selectionBox.clone();
	var voxelSelectionBox = new THREE.Mesh(new THREE.BoxBufferGeometry(1, 1, 1, 1, 1, 1), new THREE.MeshBasicMaterial());
	transformHelpers.add(voxelSelectionBox);

	voxelSelectionBox.visible = false;

	var prevOffset = new THREE.Vector3();

	var beforeMoveSelection = {};
	var beforeMoveState = {};
	var currentMoveSelection = {};
	var currentMoveState = {};

	var mytimer = 0;

	function makeVoxHelper_old3(object) {

		//var mat = new THREE.MeshStandardMaterial();
		var obj = new THREE.Object3D();

		var mat = new THREE.MeshBasicMaterial({
			depthTest: false,
			depthWrite: false,
			transparent: false,
			side: THREE.DoubleSide,
			fog: false,
			toneMapped: false,
			color: 0xff0000,
			opacity: 1,
		});

		var mesh = new THREE.Mesh(new THREE.BoxBufferGeometry(1, 1, 1, 1, 1, 1), mat);
		mesh.name = 'voxelHelper';


		mesh.applyMatrix4(object.matrixWorld);



		var bh = new THREE.BoxHelper(object, 0x111111);
		const position = bh.geometry.attributes.position;
		const array = position.array;

		array[0] = 0.5; array[1] = 0.5; array[2] = 0.5;
		array[3] = -0.5; array[4] = 0.5; array[5] = 0.5;
		array[6] = -0.5; array[7] = -0.5; array[8] = 0.5;
		array[9] = 0.5; array[10] = -0.5; array[11] = 0.5;
		array[12] = 0.5; array[13] = 0.5; array[14] = -0.5;
		array[15] = -0.5; array[16] = 0.5; array[17] = -0.5;
		array[18] = -0.5; array[19] = -0.5; array[20] = -0.5;
		array[21] = 0.5; array[22] = -0.5; array[23] = -0.5;

		position.needsUpdate = true;

		bh.geometry.computeBoundingSphere();

		bh.applyMatrix4(object.matrixWorld);

		obj.add(mesh);
		obj.add(bh);

		obj.myMesh = mesh;
		obj.myBoxHelper = bh;
		//obj.applyMatrix4(object.matrixWorld);
		return obj;
	}



	function makeVoxHelper(object) {

		//var mat = new THREE.MeshStandardMaterial();

		var mat = new THREE.MeshBasicMaterial({
			depthTest: true,
			depthWrite: true,
			transparent: true,
			side: THREE.DoubleSide,
			fog: false,
			toneMapped: false,
			color: 0xb8cae0,
			opacity: 1,
		});

		var mesh = new THREE.Mesh(new THREE.BoxBufferGeometry(1, 1, 1, 1, 1, 1), mat);
		mesh.name = 'voxelHelper';

		mesh.applyMatrix4(object.matrixWorld);



		/*
		
				var bh = new THREE.BoxHelper( object, 0x111111 );
				const position = bh.geometry.attributes.position;
				const array = position.array;
		
				array[ 0 ] = 0.5; array[ 1 ] = 0.5; array[ 2 ] = 0.5;
				array[ 3 ] = -0.5; array[ 4 ] = 0.5; array[ 5 ] = 0.5;
				array[ 6 ] = -0.5; array[ 7 ] = -0.5; array[ 8 ] = 0.5;
				array[ 9 ] = 0.5; array[ 10 ] = -0.5; array[ 11 ] = 0.5;
				array[ 12 ] = 0.5; array[ 13 ] = 0.5; array[ 14 ] = -0.5;
				array[ 15 ] = -0.5; array[ 16 ] = 0.5; array[ 17 ] = -0.5;
				array[ 18 ] = -0.5; array[ 19 ] = -0.5; array[ 20 ] = -0.5;
				array[ 21 ] = 0.5; array[ 22 ] = -0.5; array[ 23 ] = -0.5;
		
				position.needsUpdate = true;
		
				bh.geometry.computeBoundingSphere();
				//console.log(bh);
		
				bh.material.depthTest = true;
				bh.material.depthWrite = true;
		
				mesh.add(bh);
		*/



		return mesh;
	}





	function makeVoxHelper_old1(object) {
		var bh = new THREE.BoxHelper(object, 0x111111);
		window.bh = bh;
		bh.material.linewidth = 5;
		const position = bh.geometry.attributes.position;
		const array = position.array;

		array[0] = 0.5; array[1] = 0.5; array[2] = 0.5;
		array[3] = -0.5; array[4] = 0.5; array[5] = 0.5;
		array[6] = -0.5; array[7] = -0.5; array[8] = 0.5;
		array[9] = 0.5; array[10] = -0.5; array[11] = 0.5;
		array[12] = 0.5; array[13] = 0.5; array[14] = -0.5;
		array[15] = -0.5; array[16] = 0.5; array[17] = -0.5;
		array[18] = -0.5; array[19] = -0.5; array[20] = -0.5;
		array[21] = 0.5; array[22] = -0.5; array[23] = -0.5;

		position.needsUpdate = true;

		bh.geometry.computeBoundingSphere();

		bh.applyMatrix4(object.matrixWorld);
		return bh;
	}
	transformControls.addEventListener('change', function (e) {
		//var startTime = performance.now()

		if (e.mode == 'voxel') {

			changeVoxels(e.offset, e.axis);
			return;

		}

		var object = transformControls.object;

		if (object !== undefined) {

			selectionBox.setFromObject(object);

			var helper = editor.helpers[object.id];

			if (helper !== undefined && helper.isSkeletonHelper !== true) {

				helper.update();

			}

			// signals.refreshSidebarObject3D.dispatch( object );

		}

	});

	function changeVoxels(offset, axis, options) {
		var vec2 = offset.clone();
		vec2.round();
		var vec = vec2.clone().sub(prevOffset);

		var zero1 = new THREE.Vector3();
		if (!zero1.equals(vec)) {
			//axis = String(axis).toLowerCase();
			var key = String(axis).toLowerCase();
			//var key = ( ( axis == 'X' ) ? 'x' : ( ( axis == 'Y' ) ? 'y' : 'z' ) );
			var value = vec[key];

			if (value != 0) {
				var dir = value < 0 ? -1 : 1;

				var positiveVector = new THREE.Vector3();
				positiveVector[key] = dir;

				var negativeVector = new THREE.Vector3();
				negativeVector[key] = -1 * dir;

				var count = Math.abs(value);

				var voxelsToRemove = [];
				var positionsToAdd = [];
				//var group = editor.selected.parent;
				var group = selectedVoxels[0].parent;

				var currentVoxelGroup = {};
				var originalVoxelGroup = {};
				var sourceVoxels = {};

				for (var voxel of group.children) {
					if (voxel.userData && voxel.userData.isVoxel) {
						var key = makeKey(voxel.position);
						currentVoxelGroup[key] = 1;
						originalVoxelGroup[key] = 1;
						sourceVoxels[key] = voxel;
					}
				}
				var indexedGroup = {};
				for (var voxel of selectedVoxels) {

					voxel.moveInfo = {};
					voxel.moveInfo.currentCheck = true;
					let k = makeKey(voxel.position);

					currentVoxelGroup[key] = 1;
					originalVoxelGroup[key] = 1;

					indexedGroup[k] = voxel;

					voxel.moveInfo.backElem = null;
					voxel.moveInfo.forwardElem = null;
					voxel.moveInfo.position = getCopyOfVector3(voxel.position);
				}
				for (var voxel of selectedVoxels) {
					var backPosition = getCopyOfVector3(voxel.position).add(negativeVector);
					let b = makeKey(backPosition);
					if (indexedGroup[b]) {
						indexedGroup[b].moveInfo.forwardElem = voxel;
						voxel.moveInfo.backElem = indexedGroup[b];
					}
					var forwardPosition = getCopyOfVector3(voxel.position).add(positiveVector);
					let f = makeKey(forwardPosition);
					if (indexedGroup[f]) {
						indexedGroup[f].moveInfo.backElem = voxel;
						voxel.moveInfo.forwardElem = indexedGroup[f];
					}
				}
				//var endTime = performance.now()

				//console.log(`Call part 1 took ${endTime - startTime} milliseconds`)

				for (let i = 0; i < count; i++) {
					for (var voxel of selectedVoxels) {
						voxel.moveInfo.moveThisTurn = true;
					}
					for (var voxel of selectedVoxels) {
						if (voxel.moveInfo.moveThisTurn) {

							var topVoxel = voxel;
							while (topVoxel.moveInfo.forwardElem) {
								topVoxel = topVoxel.moveInfo.forwardElem;
							}
							var backVoxel = voxel;
							while (backVoxel.moveInfo.backElem) {
								backVoxel = backVoxel.moveInfo.backElem;
							}

							var currentBlock = topVoxel;

							var position = getCopyOfVector3(currentBlock.moveInfo.position).add(positiveVector);
							var voxelOnPosition = currentVoxelGroup[makeKey(position)];
							if (sourceVoxels[makeKey(position)]) {
								voxelsToRemove.push(sourceVoxels[makeKey(position)]);
							}
							currentVoxelGroup[makeKey(currentBlock.moveInfo.position)] = -1;
							currentVoxelGroup[makeKey(position)] = 1;
							currentBlock.moveInfo.position.copy(position);
							currentBlock.moveInfo.moveThisTurn = false;

							while (currentBlock.moveInfo.backElem) {
								currentBlock = currentBlock.moveInfo.backElem;
								var position = getCopyOfVector3(currentBlock.moveInfo.position).add(positiveVector);
								currentVoxelGroup[makeKey(currentBlock.moveInfo.position)] = -1;
								currentVoxelGroup[makeKey(position)] = 1;
								currentBlock.moveInfo.position.copy(position);
								currentBlock.moveInfo.moveThisTurn = false;
							}


							if (voxelOnPosition != 1) {
								var position2 = getCopyOfVector3(backVoxel.moveInfo.position).add(negativeVector);
								currentVoxelGroup[makeKey(position2)] = 2;
								sourceVoxels[makeKey(position2)] = backVoxel;
							}
						}

					}

				}
				//var endTime = performance.now()
				//console.log(`Call part 2 took ${endTime - startTime} milliseconds`)

				var keysToAdd = [];
				var keysToRemove = [];
				for (var key in currentVoxelGroup) {
					var orig = originalVoxelGroup[key];
					if (currentVoxelGroup[key] == 2) {
						keysToAdd.push(key);
					}
				}

				var objectNewPositionArray = [];
				for (var voxel of selectedVoxels) {
					objectNewPositionArray.push({ object: voxel, newPosition: getCopyOfVector3(voxel.moveInfo.position) })
				}

				var positionsToAdd = [];
				for (let i = 0; i < keysToAdd.length; i++) {
					positionsToAdd.push({ position: makePosition(keysToAdd[i]), voxel: sourceVoxels[keysToAdd[i]] })
				}


				if (objectNewPositionArray.length > 0) {
					var modifyCommand = new SetPositionsMultyCommand(editor, group, objectNewPositionArray, positionsToAdd, voxelsToRemove, mytimer);
					//modifyCommand.execute();
					editor.execute(modifyCommand);
				}

				for (var voxel of selectedVoxels) {
					voxel.moveInfo = null;
				}


				prevOffset.copy(vec2);

				clearVoxelHelpers();
				for (var voxel of selectedVoxels) {
					if (options && options.unselect) {

					} else {
						voxelHelpers.add(makeVoxHelper(voxel));
					}

				}
			}
			//vec[key] -= ( start + dir * (count-1) );
		}
	}
	function makeKey(position) {
		return "x;" + position.x + ";y;" + position.y + ";z;" + position.z;
	}
	function makePosition(key) {
		var t = key.split(";");
		var res = new THREE.Vector3(Number(t[1]), Number(t[3]), Number(t[5]));
		return res;
	}
	function getCopyOfVector3(v3) {
		var res = new THREE.Vector3();
		res.copy(v3);
		return res;
	}
	transformControls.addEventListener('mouseDown', function (e) {

		var object = transformControls.object;

		objectPositionOnDown = object.position.clone();
		objectRotationOnDown = object.rotation.clone();
		objectScaleOnDown = object.scale.clone();

		controls.enabled = false;

		mytimer = new Date();
		mytimer = mytimer.getTime();

	});
	transformControls.addEventListener('mouseUp', function (e) {

		prevOffset.set(0, 0, 0);
		transformControlsClicked = true;

		var object = transformControls.object;

		if (object !== undefined) {

			var mode = transformControls.getMode();

			if (mode == 'translate' || mode == 'translateVoxel' || mode == 'universal') {

				if (!objectPositionOnDown.equals(object.position)) {

					let needRunSetPositionCommand = true;
					if (object.userData && object.userData.isVoxel) {
						needRunSetPositionCommand = false;
					}
					if (needRunSetPositionCommand) {
						editor.execute(new SetPositionCommand(editor, object, object.position, objectPositionOnDown));
					}
				}

			}

			if (mode == 'rotate' || mode == 'universal') {

				if (!objectRotationOnDown.equals(object.rotation)) {

					editor.execute(new SetRotationCommand(editor, object, object.rotation, objectRotationOnDown));

				}

			}

			if (mode == 'scale' || mode == 'universal') {

				if (!objectScaleOnDown.equals(object.scale)) {

					editor.execute(new SetScaleCommand(editor, object, object.scale, objectScaleOnDown));

				}

			}

		}

		controls.enabled = (!controls.camera.userData.locked);

	});
	transformControls.addEventListener('objectChange', function () {

		signals.objectChanged.dispatch(this.object);

	});

	spotTargetControls.addEventListener('mouseDown', function (e) {

		var object = spotTargetControls.object;

		objectPositionOnDown = object.position.clone();

		controls.enabled = false;

	});
	spotTargetControls.addEventListener('mouseUp', function (e) {

		var object = spotTargetControls.object;
		var light = editor.spotLights[object.id];

		if (light) {

			editor.execute(new SetSpotLightTargetCommand(editor, light, object.position, objectPositionOnDown));

		}

		controls.enabled = (!controls.camera.userData.locked);

	});
	spotTargetControls.addEventListener('objectChange', function () {

		signals.objectChanged.dispatch(this.object);

	});
	transformHelpers.add(transformControls);
	transformHelpers.add(spotTargetControls);

	// object picking

	var raycaster = new THREE.Raycaster();
	var mouse = new THREE.Vector2();

	function isVoxelOnPosition(group, position) {
		for (var child of group.children) {
			var isMoveable = false;
			if (child.moveInfo && child.moveInfo.currentCheck) {
				isMoveable = true;
			}
			if ((!isMoveable) && child.position.equals(position)) {
				return child;
			}
		}
		return null;
	}

	// events

	function updateAspectRatio() {

		camera.aspect = container.dom.offsetWidth / container.dom.offsetHeight;
		camera.updateProjectionMatrix();

	}

	function getIntersects(point, objects) {

		var visibleObjects = [];
		for (let i = 0; i < objects.length; i++) {
			if (objects[i].visible) {
				visibleObjects.push(objects[i]);
			}
		}

		mouse.set((point.x * 2) - 1, - (point.y * 2) + 1);

		raycaster.setFromCamera(mouse, camera);

		return raycaster.intersectObjects(visibleObjects);

	}

	var onDownPosition = new THREE.Vector2();
	var onMovePosition = new THREE.Vector2();
	var onUpPosition = new THREE.Vector2();

	function getMousePosition(dom, x, y) {

		var rect = dom.getBoundingClientRect();
		return [(x - rect.left) / rect.width, (y - rect.top) / rect.height];

	}
	function clearVoxelHelpers() {

		while (voxelHelpers.children.length > 0) {

			voxelHelpers.remove(voxelHelpers.children[0]);

		}

	}

	function clearVoxelSelection() {

		while (voxelHelpers.children.length > 0) {

			voxelHelpers.remove(voxelHelpers.children[0]);

		}

		selectedVoxels = [];

	}

	function selectVoxelRegion(group, root, face) {

		var axis = ['x', 'y', 'z'].find(axis => Math.abs(face[axis]) != 0);
		var voxels = [];
		var queue = [root];
		var position = new THREE.Vector3();
		var selVoxels = {}
		var unit = {
			px: new THREE.Vector3(1, 0, 0),
			py: new THREE.Vector3(0, 1, 0),
			pz: new THREE.Vector3(0, 0, 1),
			nx: new THREE.Vector3(-1, 0, 0),
			ny: new THREE.Vector3(0, -1, 0),
			nz: new THREE.Vector3(0, 0, -1),
		};

		clearVoxelSelection();

		group.traverse(function (voxel) {

			if (voxel.userData && voxel.userData.isVoxel) {
				voxel.test1 = true;
				voxels.push(voxel);
			}

		});

		while (queue.length) {

			let object = queue.shift();

			voxels.splice(voxels.indexOf(object), 1);
			var key = "x" + object.position.x + "y" + object.position.y + "z" + object.position.z;
			selVoxels[key] = object;
			//selectedVoxels.push( object );
			//voxelHelpers.add( new THREE.BoxHelper( object ) );

			['x', 'y', 'z'].map(x => {

				if (x != axis) {

					['p', 'n'].map(d => {

						var voxel = null;
						position.copy(object.position).add(unit[d + x]);
						voxel = voxels.find(v => v.position.equals(position));
						position.add(face);

						if (voxel && voxel.test1) {
							var onFace = voxels.find(v => v.position.equals(position));
							if (onFace) {
								//do nothing
							} else {
								voxel.test1 = false;
								queue.push(voxel);
							}
						}

					});

				}

			});

		}
		for (var i in selVoxels) {
			selectedVoxels.push(selVoxels[i]);
			voxelHelpers.add(makeVoxHelper(selVoxels[i]));
		}

	}

	function handleClick(event) {

		if (onDownPosition.distanceTo(onUpPosition) === 0) {

			var intersectsAll = getIntersects(onUpPosition, objects);
			var intersects = [];
			//exclude invisible objects
			for (var i = 0; i < intersectsAll.length; i++) {
				if (intersectsAll[i].object) {
					if (intersectsAll[i].object.visible) {
						intersects.push(intersectsAll[i]);
					}
				}
			}

			if (intersects.length > 0) {

				var object = intersects[0].object;

				if (object.userData.isVoxel) {

					// voxel

					if (event.button == 2) {

						/*var position = new THREE.Vector3();
						position.copy( object.position ).add( intersects[ 0 ].face.normal );

						editor.execute( new AddVoxelsCommand( editor, object.parent, [ position ] ) );

						transformControls.detach();*/

					} else {

						if (!event.shiftKey) {

							clearVoxelSelection();

						}

						voxelHelpers.add(makeVoxHelper(object));
						selectedVoxels.push(object);

						editor.select(object);

					}

				} else if (object.userData.object !== undefined) {

					// helper

					editor.select(object.userData.object);

				} else {

					editor.select(object);

				}

			} else {

				editor.select(null);

			}

		}

	}

	function onMouseDown(event) {

		var array = getMousePosition(container.dom, event.clientX, event.clientY);
		onDownPosition.fromArray(array);
		if (event.button == 2) {

			var intersects = getIntersects(onDownPosition, objects);
			if (intersects.length > 0) {
				var object = intersects[0].object;
				if (object.userData.isVoxel && object.visible) {
					prevOffset.set(0, 0, 0);
					var axis = ['x', 'y', 'z'].find(axis => Math.abs(intersects[0].face.normal[axis]) != 0);
					clearVoxelSelection();
					selectedVoxels.push(object);
					voxelHelpers.add(makeVoxHelper(object));
					changeVoxels(intersects[0].face.normal, axis, { unselect: true });
					editor.select(null);
				}

			}
		} else {
			document.addEventListener('mouseup', onMouseUp, false);
		}

	}

	function onDblClick(event) {

		var array = getMousePosition(container.dom, event.clientX, event.clientY);
		onUpPosition.fromArray(array);

		var intersects = getIntersects(onUpPosition, objects);

		if (intersects.length > 0) {

			var object = intersects[0].object;

			if (object.userData.isVoxel && object.visible) {

				selectVoxelRegion(object.parent, object, intersects[0].face.normal);

			}

		}

	}

	function onMouseMove(event) {

		var array = getMousePosition(container.dom, event.clientX, event.clientY);
		onMovePosition.fromArray(array);

		var intersects = getIntersects(onMovePosition, objects);

		if (intersects.length > 0) {

			var object = intersects[0].object;
			if (object.userData.isVoxel && object.parent.visible) {

				box.setFromObject(object);

				if (box.isEmpty() === false) {

					if (event.shiftKey) {
						var exists = selectedVoxels.filter(voxel => voxel.position.equals(object.position));
						if (exists.length == 0) {
							selectedVoxels.push(object);
							voxelHelpers.add(makeVoxHelper(object));
							editor.select(object);
						}
					} else {
						if (!voxelSelectionBox.visible || !object.position.equals(voxelSelectionBox.position)) {
							let tt = makeVoxHelper(object);

							while (voxelSelectionBox.children.length > 0) {
								voxelSelectionBox.children.pop();
							}
							voxelSelectionBox.copy(tt);

							//voxelSelectionBox.children[0].material.depthTest = false;
							//voxelSelectionBox.children[0].material.depthWrite = true;

							//voxelSelectionBox.material.depthTest = false;
							//voxelSelectionBox.material.transparent = true;
							//voxelSelectionBox.material.opacity = 0.2;
							voxelSelectionBox.visible = true;
						}
					}
				}

			}

			if (event.ctrlKey) {

				var paint = editor.paint;
				var currentMaterialSlot = 0;

				if (paint.colorEnabled) {

					editor.execute(new SetMaterialColorCommand(editor, object, 'color', parseInt(paint.color.substr(1), 16), currentMaterialSlot));

				}

				if (paint.materialEnabled && paint.material) {

					editor.assets.get('Material', 'id', paint.material).apply(object);

				}

				if (paint.textureEnabled && paint.texture) {

					editor.execute(new SetMaterialMapCommand(editor, object, 'map', paint.texture, currentMaterialSlot));

				}

			}

		} else {

			voxelSelectionBox.visible = false;

		}

	}

	function onMouseUp(event) {

		var array = getMousePosition(container.dom, event.clientX, event.clientY);
		onUpPosition.fromArray(array);

		transformControlsClicked ? transformControlsClicked = false : handleClick(event);

		document.removeEventListener('mouseup', onMouseUp, false);

	}

	function onTouchStart(event) {

		var touch = event.changedTouches[0];

		var array = getMousePosition(container.dom, touch.clientX, touch.clientY);
		onDownPosition.fromArray(array);

		document.addEventListener('touchend', onTouchEnd, false);

	}

	function onKeyDown(event) {

		document.addEventListener('keyup', onKeyUp, false);

	}

	function onKeyUp(event) {

		var key = event.keyCode;
		var selected = editor.selected;

		if (key == 38 && selected && !selected.parent.isScene && selected.parent) {

			editor.select(selected.parent);

		} else if (key == 77 && selected && !selected.isScene && !(selected.parent.isScene && selected.children.length == 0)) {

			signals.groupCollapseToggled.dispatch(selected.children.length > 0 ? selected.id : selected.parent.id, event.shiftKey);

		}

		document.removeEventListener('keyup', onKeyUp, false);

	}

	function onTouchEnd(event) {

		var touch = event.changedTouches[0];

		var array = getMousePosition(container.dom, touch.clientX, touch.clientY);
		onUpPosition.fromArray(array);

		transformControlsClicked ? transformControlsClicked = false : handleClick(event);

		document.removeEventListener('touchend', onTouchEnd, false);

	}

	function onDrop(event) {

		var position = new THREE.Vector2();
		position.fromArray(getMousePosition(container.dom, event.clientX, event.clientY));
		var intersects = getIntersects(position, objects);

		var assetType = event.dataTransfer.getData('assetType');
		var assetId = event.dataTransfer.getData('assetId');

		switch (assetType) {

			case 'Image':
				console.log("viewport file image case");
				//if image is dropped on an object
				if (intersects.length > 0) {

					var asset = assets.get('Image', 'id', assetId);
					var itemUrl = event.dataTransfer.getData('assetUrl');
					if (typeof asset == "undefined") {

						if (assetId == -1) {

							// console.error(item.downloadLocation, item)

							if (itemUrl) {
								fetch(itemUrl)
									.catch((err) => {
										console.error(err)
									});
							}

							fetch(itemUrl)
								.then(res => res.blob())
								.then(blob => {

									var ext = itemUrl.match(/fm=([^&]*)&/)[1];
									var file = new File([blob], 'file.' + ext, { type: blob.type });

									Promise.all(editor.loader.loadFiles([file], null, 'Image')).then(function (results) {

										var texture = results[0].texture;
										var formData = new FormData();
										formData.append('type', 'Image');
										formData.append('projectId', editor.projectId);
										formData.append('file', file);

										editor.api.post('/asset/my-image/upload', formData).then(res => {

											var assetImg = assets.uploadImage(texture);
											assetImg.id = res.files[0].id;
											assetImg.imageId = res.files[0].imageId;

											editor.signals.imageAssetAdded.dispatch(assetImg, 0);
											assetImg.apply(intersects[0].object);

										});

									});

								});

						} else {

							editor.api.post('/asset/my-image/add', { id: assetId, projectId: editor.projectId, folderId: 0 }).then(function (image) {

								editor.addAsset('Image', 0, image).then(function (asset) {

									editor.signals.imageAssetAdded.dispatch(asset, 0);
									asset.apply(intersects[0].object);

								});

							}).catch((err) => {

								alert(err);

							});

						}
					} else {

						asset.apply(intersects[0].object);

					}
				}
				//if image is not dropped on an object
				else {
					var asset = assets.get('Image', 'id', assetId);

					if (typeof asset == 'undefined') {

						editor.api.post('/asset/my-image/add', { id: assetId, projectId: editor.projectId, folderId: 0 }).then(function (image) {

							editor.addAsset('Image', 0, image).then(function (asset) {

								editor.signals.imageAssetAdded.dispatch(asset, 0);
								asset.apply();

							});

						}).catch((err) => {

							alert(err);

						});
					} else {

						asset.apply();
					}
				}

				break;

			case 'Geometry':

				var asset = assets.get('Geometry', 'id', assetId);
				if (typeof asset == 'undefined') {

					editor.api.post('/asset/my-geometry/add', { id: assetId, projectId: editor.projectId, folderId: 0 }).then(function (geometry) {

						editor.addAsset('Geometry', 0, geometry).then(function (asset) {

							editor.signals.geometryAssetAdded.dispatch(asset, 0);

							if (!event.shiftKey) asset.render();

						});
					}).catch((err) => {

						alert(err);

					});

				}
				else if (asset.object === undefined) {

					asset.render();
				}
				else {

					asset.render();

				}

				break;

			case 'Material':

				if (intersects.length > 0) {

					var asset = assets.get('Material', 'id', assetId);

					if (typeof asset == "undefined") {
						editor.api.post('/asset/my-material/add', { id: assetId, projectId: editor.projectId, folderId: 0 }).then(function (material) {

							editor.addAsset('Material', 0, material).then(function (asset) {

								editor.signals.materialAssetAdded.dispatch(asset, 0);
								asset.apply(intersects[0].object);
							});


						}).catch((err) => {

							alert(err);
						});
					} else {
						asset.apply(intersects[0].object);
					}
				}

				break;

			case 'Environment':
				console.log("viewport file environment case");
				var asset = assets.get('Environment', 'id', assetId);

				if (typeof asset == 'undefined') {

					editor.api.post('/asset/my-environment/add', { id: assetId, projectId: editor.projectId, folderId: 0 }).then(function (environment) {

						editor.addAsset('Environment', 0, environment).then(function (asset) {

							editor.signals.environmentAssetAdded.dispatch(asset, 0);
							asset.apply();

						});

					}).catch((err) => {

						alert(err);

					});
				} else {

					asset.apply();
				}
				break;

		}

	}

	container.dom.addEventListener('mousedown', onMouseDown, false);
	container.dom.addEventListener('dblclick', onDblClick, false);
	container.dom.addEventListener('mousemove', onMouseMove, false);
	container.dom.addEventListener('touchstart', onTouchStart, false);
	container.dom.addEventListener('keydown', onKeyDown, false);
	container.dom.addEventListener('drop', onDrop, false);

	// controls need to be added *after* main logic,
	// otherwise controls.enabled doesn't work.

	var controls = new EditorControls(camera, container.dom);
	controls.movementSpeed = config.getKey('project/navigation/WASDRF/movement');
	controls.lookSpeed = config.getKey('project/navigation/WASDRF/pointer') / 1000;
	controls.zoomSpeed = config.getKey('project/zoomSpeed') / 100;
	controls.addEventListener('change', function () {

		signals.cameraChanged.dispatch(camera);
		signals.refreshSidebarObject3D.dispatch(camera);

	});
	viewHelper.controls = controls;

	// signals

	signals.editorCleared.add(function () {

		controls.center.set(0, 0, 0);

	});

	signals.snapChanged.add(function (enabled) {

		transformControls.setTranslationSnap(enabled ? config.getKey('project/snap/translate') : null);
		transformControls.setRotationSnap(enabled ? THREE.Math.degToRad(config.getKey('project/snap/rotate')) : null);
		transformControls.setScaleSnap(enabled ? config.getKey('project/snap/scale') : null);

	});

	signals.spaceChanged.add(function (space) {

		transformControls.setSpace(space);

	});

	signals.rendererUpdated.add(function () {

		scene.traverse(function (child) {

			if (child.material !== undefined) {

				child.material.needsUpdate = true;

			}

		});

	});

	signals.rendererChanged.add(function (newRenderer) {

		if (renderer !== null) {

			renderer.dispose();
			pmremGenerator.dispose();
			pmremTexture = null;

			container.dom.removeChild(renderer.domElement);

		}

		if (composer !== null) {

			composer = null;

		}

		renderer = newRenderer;

		if (renderer.domElement.tabIndex === - 1) {

			renderer.domElement.tabIndex = 0;

		}

		renderer.setClearColor(0xaaaaaa);

		if (window.matchMedia) {

			var mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
			mediaQuery.addListener(function (event) {

				renderer.setClearColor(event.matches ? 0x333333 : 0xaaaaaa);
				updateGridColors(grid, event.matches ? [0x888888, 0x222222] : [0x282828, 0x888888]);

			});

			renderer.setClearColor(mediaQuery.matches ? 0x333333 : 0xaaaaaa);
			updateGridColors(grid, mediaQuery.matches ? [0x888888, 0x222222] : [0x282828, 0x888888]);

		}

		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setSize(container.dom.offsetWidth, container.dom.offsetHeight);

		pmremGenerator = new THREE.PMREMGenerator(renderer);
		pmremGenerator.compileEquirectangularShader();

		container.dom.appendChild(renderer.domElement);

		composer = new EffectComposer(renderer, undefined, camera);
		composer.setSize(container.dom.offsetWidth, container.dom.offsetHeight);
		composer.addPass(new RenderPass(scene, editor.viewportCamera));

	});



	signals.cameraAdded.add(changeCameraForComposer);

	signals.cameraRemoved.add(changeCameraForComposer);

	signals.viewportCameraChanged.add(changeCameraForComposer);


	function changeCameraForComposer() {
		if (composer !== null) {
			composer = null;
		}
		composer = new EffectComposer(renderer);
		composer.setSize(container.dom.offsetWidth, container.dom.offsetHeight);
		composer.addPass(new RenderPass(scene, editor.viewportCamera));



		//update filters for new camera
		filters = [];
		if (scene.userData.filter && scene.userData.filter.length > 0) {

			scene.userData.filter.map(f => {

				var filtertype = f.type.toLowerCase();
				var filterToUpdate = filters[filtertype];

				if (f.enabled) {

					if (filterToUpdate) {

						filterToUpdate.Update(f);

					}
					else {
						filters[filtertype] = new FilterHelper[f.name](composer, f, renderer, scene, camera);

					}

				} else if (filterToUpdate) {

					filterToUpdate.Disable();

				}

			})

		}
	}


	signals.objectSelected.add(function (object) {

		if (!object) clearVoxelSelection();

		if (camera != editor.viewportCamera && object == editor.viewportCamera) return;

		//prevent make gizmo for locked camera
		if (object && object.userData && object.userData.locked) return;


		selectionBox.visible = false;
		transformControls.detach();
		spotTargetControls.detach();

		if (object && !object.visible) return;

		if (object !== null && object !== scene && object !== camera) {

			box.setFromObject(object);

			if (box.isEmpty() === false) {

				if (object.userData && object.userData.isVoxel) {

				} else {
					//remove voxel selection
					voxelSelectionBox.visible = false;
					clearVoxelSelection();

					//select new object
					selectionBox.setFromObject(object);
					selectionBox.visible = true;
				}


			}

			transformControls.setMode(object.userData.isVoxel ? 'translateVoxel' : 'universal');
			//transformControls.setMode( object.userData.isVoxel ? 'translate' : 'universal' );
			transformControls.attach(object);
			if (object.type === "DirectionalLight") {
				transformControls.setMode('translate');
			}
			if (object.isSpotLight && editor.spotLights[object.target.id]) {

				spotTargetControls.setMode('translate');
				spotTargetControls.attach(object.target);

			}

		}

	});

	signals.objectFocused.add(function (object) {

		controls.focus(object);

	});

	signals.geometryChanged.add(function (object) {

		if (object !== undefined) {

			if (object.userData && object.userData.isVoxel) {

			} else {
				//remove voxel selection
				voxelSelectionBox.visible = false;
				clearVoxelSelection();

				//select new object
				selectionBox.setFromObject(object);
			}

		}

	});

	signals.objectAdded.add(function (object) {

		object.traverse(function (child) {

			objects.push(child);

		});

	});

	signals.objectsAdded.add(function (addedObjects) {

		addedObjects.forEach((object) => {
			if (object) {

				object.traverse(function (child) {

					objects.push(child);

				});
			}
		});

	});

	signals.objectChanged.add(function (object) {

		if (editor.selected === object) {

			if (object.userData && object.userData.isVoxel) {

			} else {
				//remove voxel selection
				voxelSelectionBox.visible = false;
				clearVoxelSelection();

				//select new object

				selectionBox.setFromObject(object);
			}

		}

		if (object.isCamera) {

			object.updateProjectionMatrix();

		}

		if (editor.helpers[object.id] !== undefined) {

			editor.helpers[object.id].update();

			if (object.isSpotLight) {

				editor.helpers[object.shadow.camera.id].update();

			}

		}

		if (editor.spotLights[object.id] && editor.helpers[editor.spotLights[object.id].id]) {

			editor.helpers[editor.spotLights[object.id].id].update();

		}

		if (object.isSpotLightShadow) {

			editor.helpers[object.camera.id].update();

		}

		if (object.isSpotLight) {

			if (object.userData.target.uuid != 'none') {

				spotTargetControls.detach();

			}

		}

	});

	signals.objectRemoved.add(function (object) {

		controls.enabled = true; // see #14180
		if (object === transformControls.object) {

			transformControls.detach();

		}

		object.traverse(function (child) {

			objects.splice(objects.indexOf(child), 1);

		});

	});

	signals.objectsRemoved.add(function (deletedObjects) {

		controls.enabled = true; // see #14180

		deletedObjects.forEach((object) => {

			object.traverse(function (child) {

				objects.splice(objects.indexOf(child), 1);

			});

		});


	});

	signals.voxelsUnselect.add(function () {

		transformControls.detach();
		clearVoxelSelection();
		voxelSelectionBox.visible = false;

	});

	signals.voxelsRemoved.add(function () {

		editor.execute(new RemoveVoxelsCommand(editor, selectedVoxels, selectedVoxels[0].parent));
		transformControls.detach();
		clearVoxelSelection();
		voxelSelectionBox.visible = false;

	});

	signals.helperAdded.add(function (object) {

		var picker = object.getObjectByName('picker');

		if (picker !== undefined) {

			objects.push(picker);

		}

	});

	signals.helperRemoved.add(function (object) {

		var picker = object.getObjectByName('picker');

		if (picker !== undefined) {

			objects.splice(objects.indexOf(picker), 1);

		}

	});

	// background

	signals.sceneBackgroundChanged.add(function (backgroundType, backgroundColor, backgroundTexture, backgroundEquirectangularTexture, imageId) {
		console.log("sceneBackgroundChanged called");
		switch (backgroundType) {

			case 'None':
				scene.background = null;
				scene.userData.selectedBackground = 'None';
				break;

			case 'Color':
				scene.background = new THREE.Color(backgroundColor);
				scene.userData.selectedBackground = 'Color';
				scene.userData.backgroundColor = backgroundColor;
				break;

			case 'Texture':



				if (backgroundTexture) {
					scene.background = backgroundTexture;
					// if ( !scene.userData.backgroundTexture ) {
					// 	console.log("setting value for background texture to {}");
					// 	scene.userData['backgroundTexture'] = {};
					// 	console.log("scene.userData texture: ",scene.userData);
					// };

					// if ( !scene.userData.backgroundTexture.id) scene.userData.backgroundTexture['id'] = imageId;
					// else scene.userData.backgroundTexture.id = imageId;
					if (imageId) {
						scene.userData.backgroundTexture = {
							id: imageId,
						};
					}

				}
				// else 
				// 	scene.background = null;

				scene.userData.selectedBackground = 'Texture';

				break;

			case 'Equirectangular':

				if (backgroundEquirectangularTexture) {

					backgroundEquirectangularTexture.mapping = THREE.EquirectangularReflectionMapping;
					scene.background = backgroundEquirectangularTexture;
					// if ( !scene.userData.background ) scene.userData['background'] = {};

					// if( !scene.userData.background.type ) scene.userData.background['type'] = backgroundType;

					// else scene.userData.background.type = backgroundType;

					// scene.userData.background.id = imageId;
					if (imageId !== undefined) {
						scene.userData.background = {
							type: backgroundType ? backgroundType : 'Equirectangular',
							id: imageId,
						};
						scene.equirectBackground = backgroundEquirectangularTexture;
						// if(imageId !== -1){

						// }
						// else {
						// 	scene.userData.background = {
						// 		type: backgroundType ? backgroundType : 'Equirectangular',
						// 		id: imageId,
						// 	};
						// }

					}


				} else {

					// scene.background = null;

				}

				// if ( scene.userData.backgroundTexture ) delete scene.userData.backgroundTexture;
				scene.userData.selectedBackground = 'Equirectangular';

				break;

		}

		render();

	});

	// environment

	signals.sceneEnvironmentChanged.add(function (environmentType, environmentEquirectangularTexture, imageId) {
		switch (environmentType) {

			case 'None':
				scene.environment = null;
				break;
			case 'Equirectangular':
				scene.environment = null;

				if (environmentEquirectangularTexture) {
					let environmentTexture = environmentEquirectangularTexture.clone();
					environmentTexture.mapping = THREE.EquirectangularReflectionMapping;
					scene.environment = environmentTexture;

					// scene.userData.environment = {
					// 	id: imageId
					// };
				}
				break;

		}
		render();
	});

	// fog

	signals.sceneFogChanged.add(function (fogType, fogColor, fogNear, fogFar, fogDensity) {

		switch (fogType) {

			case 'None':
				scene.fog = null;
				break;
			case 'Fog':
				scene.fog = new THREE.Fog(fogColor, fogNear, fogFar);
				break;
			case 'FogExp2':
				scene.fog = new THREE.FogExp2(fogColor, fogDensity);
				break;

		}

	});

	signals.sceneFogSettingsChanged.add(function (fogType, fogColor, fogNear, fogFar, fogDensity) {

		switch (fogType) {

			case 'Fog':
				scene.fog.color.setHex(fogColor);
				scene.fog.near = fogNear;
				scene.fog.far = fogFar;
				break;
			case 'FogExp2':
				scene.fog.color.setHex(fogColor);
				scene.fog.density = fogDensity;
				break;

		}

	});

	signals.viewportCameraChanged.add(function () {

		var viewportCamera = editor.viewportCamera;

		if (viewportCamera.isPerspectiveCamera) {

			viewportCamera.aspect = container.dom.offsetWidth / container.dom.offsetHeight;
			viewportCamera.updateProjectionMatrix();

		} else if (viewportCamera.isOrthographicCamera) {

			// TODO

		}

		camera = viewportCamera;
		controls.camera = camera;
		controls.enabled = camera.userData.locked ? false : true;
		transformControls.camera = camera;
		viewHelper.camera = camera;

	});

	signals.cameraLocked.add(function (camera) {

		camera.userData.locked = true;

		if (controls.camera == camera) controls.enabled = false;


		//hide gizmo for the camera if it is locked now
		if (editor.selected === camera) {

			editor.deselect();
			editor.selectByUuid(camera.uuid);
		}


	});

	signals.cameraUnlocked.add(function (camera) {

		camera.userData.locked = false;

		if (controls.camera == camera) controls.enabled = true;
		//show gizmo for the camera if it is unlocked now
		if (editor.selected === camera) {

			editor.deselect();
			editor.selectByUuid(camera.uuid);
		}

	});

	//

	signals.windowResize.add(function () {

		updateAspectRatio();

		renderer.setSize(container.dom.offsetWidth, container.dom.offsetHeight);

	});

	signals.showGridHelperChanged.add(function (showGridHelper) {

		helpers.grid = showGridHelper;

	});

	signals.showLightHelpersChanged.add(function (showLightHelpers) {

		helpers.lights = showLightHelpers;

	});

	signals.showCameraHelpersChanged.add(function (showCameraHelpers) {

		helpers.cameras = showCameraHelpers;

	});

	signals.showCompassChanged.add(function (showCompass) {

		helpers.compass = showCompass;

	});

	signals.showHelpersChanged.add(function (showHelpersEnabled) {

		showHelpers = showHelpersEnabled;

	});

	signals.cameraResetted.add(updateAspectRatio);

	signals.filterChanged.add(function () {

		if (scene.userData.filter && scene.userData.filter.length > 0) {

			scene.userData.filter.map(f => {

				var filtertype = f.type.toLowerCase();
				var filterToUpdate = filters[filtertype];

				if (f.enabled) {

					if (filterToUpdate) {

						let filter = f;
						filterToUpdate.Enable && filterToUpdate.Enable();
						for (let prop in filter){
							filterToUpdate.Update( {isAbout:prop, ...filter} );
						}
						// filterToUpdate.Update( f );

					}
					else {
						filters[filtertype] = new FilterHelper[f.name](composer, f, renderer, scene, camera);

					}

				} else if (filterToUpdate) {

					filterToUpdate.Disable();

				}

			})

		}

	});

	signals.filterRemoved.add(function (type) {

		var filtertype = type.toLowerCase();

		delete filters[filtertype];

		for (var i = composer.passes.length - 1; i >= 0; i--) {

			if (composer.passes[i].name == filtertype) {

				composer.passes.splice(i, 1);

			}
		}

	});

	signals.startPlayer.add(function () {

		controls.enabled = false;

	});

	signals.stopPlayer.add(function () {

		controls.enabled = (!controls.camera.userData.locked);

	});

	signals.viewportWASDRFSpeedChanged.add(function (movementSpeed, pointerSpeed) {
		controls.movementSpeed = movementSpeed;
		controls.lookSpeed = pointerSpeed / 1000;
	});

	signals.viewportZoomSpeedChanged.add(function (zoomSpeed) {
		controls.zoomSpeed = zoomSpeed / 100;
	});

	// animations

	var clock = new THREE.Clock(); // only used for animations

	function animate() {
		requestAnimationFrame(animate);

		var mixer = editor.mixer;
		var delta = clock.getDelta();

		if (mixer.stats.actions.inUse > 0) {

			mixer.update(delta);

		}

		if (viewHelper.animating === true) {

			viewHelper.update(delta);

		}

		controls.update(delta);
		render();

	}

	requestAnimationFrame(animate);

	//

	var startTime = 0;
	var endTime = 0;

	function render() {

		startTime = performance.now();

		// Adding/removing grid to scene so materials with depthWrite false
		// don't render under the grid.

		grid.visible = (!helpers.grid || (helpers.grid && showHelpers));

		scene.add(grid);
		renderer.setViewport(0, 0, container.dom.offsetWidth, container.dom.offsetHeight);

		if (config.getKey('project/filter/workspace')) {

			composer.render();

		}
		else {

			renderer.render(scene, editor.viewportCamera);

		}

		scene.remove(grid);

		renderer.autoClear = false;

		renderer.render(voxelHelpers, camera);

		renderer.render(transformHelpers, camera);
		/*for(let i=0; i<cameraHelpers.children.length; i++){
			if(cameraHelpers.children[i].sourceObject && cameraHelpers.children[i].sourceObject.isDirectionalLight){
				if(!cameraHelpers.children[i].sourceObject.userData.advancedHelper){
					cameraHelpers.children[i].visible = false;
				}else{
					cameraHelpers.children[i].visible = true;
				}

			}
		}*/

		for (var i = 0; i < cameraHelpers.children.length; i++) {
			if ((cameraHelpers.children[i].camera.uuid === editor.scene.userData.activeCamera)) {
				cameraHelpers.children[i].visible = false;
				break;
			}
		}


		if (!helpers.lights || (helpers.lights && showHelpers)) renderer.render(lightHelpers, camera);
		if (!helpers.cameras || (helpers.cameras && showHelpers)) renderer.render(cameraHelpers, camera);
		if (!helpers.compass || (helpers.compass && showHelpers)) viewHelper.render(renderer);

		for (var i = 0; i < cameraHelpers.children.length; i++) {
			if ((cameraHelpers.children[i].camera.uuid === editor.scene.userData.activeCamera)) {
				cameraHelpers.children[i].visible = true;
				break;
			}
		}

		renderer.autoClear = true;

		endTime = performance.now();
		editor.signals.sceneRendered.dispatch(endTime - startTime);

	}

	return container;

}

function updateGridColors(grid, colors) {

	const color1 = new THREE.Color(colors[0]);
	const color2 = new THREE.Color(colors[1]);

	const attribute = grid.geometry.attributes.color;
	const array = attribute.array;

	for (var i = 0; i < array.length; i += 12) {

		const color = (i % (12 * 5) === 0) ? color1 : color2;

		for (var j = 0; j < 12; j += 3) {

			color.toArray(array, i + j);

		}

	}
}

export { Viewport };
