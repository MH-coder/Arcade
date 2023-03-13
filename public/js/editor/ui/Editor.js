import * as THREE from '../libs/three.module.js';

import { Config } from './Config.js';
import { Loader } from './Loader.js';
import { History as _History } from './History.js';
import { Strings } from './Strings.js';
import { Api } from './Api.js';
import { Storage } from './Storage.js';
import { Assets } from './Assets.js';
import { RectAreaLightHelper } from '../core/helpers/RectAreaLightHelper.js';

import { ObjectLoader } from '../utils/ObjectLoader.js';
import { AddObjectCommand } from '../commands/AddObjectCommand.js';
import isDefined from '../utils/index';

var _DEFAULT_CAMERA = new THREE.PerspectiveCamera(50, 1, 0.01, 1000);
_DEFAULT_CAMERA.name = 'PerspectiveCamera';
_DEFAULT_CAMERA.position.set(0, 5, 10);
_DEFAULT_CAMERA.lookAt(new THREE.Vector3());

function Editor(project) {

	if (project) {

		this.projectId = project.id;

	}

	var Signal = signals.Signal;

	this.signals = {

		// loading
		loadingFinished: new Signal(),

		// workspace

		updateWorkspace: new Signal(),

		// script

		editScript: new Signal(),
		saveScript: new Signal(),

		// sidebar

		sidebarTabChanged: new Signal(),

		// libary

		libraryBackEnabled: new Signal(),

		// timeliner

		timelineChanged: new Signal(),
		timelineUpdated: new Signal(),
		timelinePlayToggled: new Signal(),
		timelineKeyframe: new Signal(),

		// fullscreen

		toggleFullscreen: new Signal(),

		// player

		startPlayer: new Signal(),
		stopPlayer: new Signal(),

		// notifications

		editorCleared: new Signal(),

		savingStarted: new Signal(),
		savingFinished: new Signal(),

		snapChanged: new Signal(),
		spaceChanged: new Signal(),
		rendererChanged: new Signal(),
		rendererUpdated: new Signal(),

		activeCameraChanged: new Signal(),

		sceneBackgroundTypeChanged: new Signal(),
		sceneBackgroundChanged: new Signal(),
		sceneEnvironmentChanged: new Signal(),
		sceneFogChanged: new Signal(),
		sceneFogSettingsChanged: new Signal(),
		sceneGraphChanged: new Signal(),
		sceneUserDataChanged: new Signal(),
		sceneRendered: new Signal(),
		sceneLoaded: new Signal(),

		filterChanged: new Signal(),
		filterRemoved: new Signal(),

		cameraChanged: new Signal(),
		cameraResetted: new Signal(),

		geometryChanged: new Signal(),

		objectSelected: new Signal(),
		objectFocused: new Signal(),

		objectAdded: new Signal(),
		objectsAdded: new Signal(),
		objectChanged: new Signal(),
		objectRemoved: new Signal(),
		objectsRemoved: new Signal(),
		objectRenamed: new Signal(),

		voxelsRemoved: new Signal(),
		voxelsAdded: new Signal(),
		voxelsUnselect: new Signal(),

		cameraAdded: new Signal(),
		cameraRemoved: new Signal(),
		cameraLocked: new Signal(),
		cameraUnlocked: new Signal(),

		helperAdded: new Signal(),
		helperRemoved: new Signal(),

		materialAdded: new Signal(),
		materialChanged: new Signal(),
		materialRemoved: new Signal(),

		scriptAdded: new Signal(),
		scriptChanged: new Signal(),
		scriptRemoved: new Signal(),

		attributeAdded: new Signal(),
		attributeChanged: new Signal(),
		attributeRemoved: new Signal(),

		tagAdded: new Signal(),
		tagSet: new Signal(),
		tagChanged: new Signal(),
		tagRemoved: new Signal(),

		projectAssetAdded: new Signal(),
		geometryAssetAdded: new Signal(),
		materialAssetAdded: new Signal(),
		imageAssetAdded: new Signal(),
		audioAssetAdded: new Signal(),
		videoAssetAdded: new Signal(),
		environmentAssetAdded: new Signal(),
		animationAssetAdded: new Signal(),
		assetRemoved: new Signal(),
		geometryAssetDownloading: new Signal(),
		imageAssetDownloading: new Signal(),
		materialAssetDownloading: new Signal(),
		environmentAssetDownloading: new Signal(),
		moveAsset: new Signal(),

		windowResize: new Signal(),

		showHelpersChanged: new Signal(),
		showGridHelperChanged: new Signal(),
		showLightHelpersChanged: new Signal(),
		showCameraHelpersChanged: new Signal(),
		showCompassChanged: new Signal(),
		refreshSidebarObject3D: new Signal(),
		historyChanged: new Signal(),
		titleChanged: new Signal(),
		viewportCameraChanged: new Signal(),
		viewportWASDRFSpeedChanged: new Signal(),
		viewportZoomSpeedChanged: new Signal(),
		groupCollapseToggled: new Signal(),
		showColorPickerChanged: new Signal(),
		materialFolderShow: new Signal(),
		imageFolderShow: new Signal(),
		projectItemUpdated: new Signal(),
		audioPlay: new Signal(),
		audioStop: new Signal(),

		addRecentProject: new Signal(),
		projectsSubFolderAdded: new Signal(),
		projectsSubFolderRemoved: new Signal(),

	};

	this.api = new Api(this);
	this.config = new Config(this);
	this.history = new _History(this);
	this.storage = new Storage(this);
	this.strings = new Strings(this.config);

	this.loader = new Loader(this);
	this.assets = new Assets(this);

	this.listener = new THREE.AudioListener();

	this.scene = new THREE.Scene();
	this.defaultCameraWhenNoneIsPresent = _DEFAULT_CAMERA.clone();

	this.viewportCamera = this.defaultCameraWhenNoneIsPresent;

	this.scene.name = 'Scene';
	this.scene.background = new THREE.Color(0x14151b);

	this.lightHelpers = new THREE.Scene();
	this.cameraHelpers = new THREE.Scene();

	this.objects = {};
	this.objectsWithoutVoxels = {};
	this.geometries = {};
	this.materials = {};
	this.textures = {};
	this.scripts = [
		{
			name: 'untitled',
			json: [],
			source: ''
		}
	];
	this.attributes = [];
	this.attributeTextMap = {};
	this.timelines = [
		{
			name: 'untitled',
			duration: 20,
			channels: [],
			tracks: []
		}
	];
	this.timelineIndex = 0;
	this.tags = {};


	this.materialsRefCounter = new Map(); // tracks how often is a material used by a 3D object

	this.mixer = new THREE.AnimationMixer(this.scene);

	this.selected = null;
	this.helpers = {};
	this.spotLights = {};

	this.paint = {
		color: '#ffffff',
		material: null,
		texture: null,
		colorEnabled: true,
		materialEnabled: true,
		textureEnabled: true,
	};

	this.isPlaying = false;
	this.isScripting = false;
	this.isFullscreen = false;
	this.showHelpers = true;
	this.showColorPicker = false;
	this.snapEnabled = false;

	this.cameras = {};
	this.isInClearMode = false;
}

Editor.prototype = {

	setScene: function (scene) {

		this.scene.uuid = scene.uuid;
		this.scene.name = scene.name;

		this.scene.background = (scene.background !== null) ? scene.background.clone() : null;
		this.scene.environment = (scene.environment !== null) ? scene.environment.clone() : null;
		this.scene.equirectBackground = (scene.equirectBackground) ? scene.equirectBackground.clone() : null;

		if (scene.fog !== null) this.scene.fog = scene.fog.clone();

		this.scene.userData = JSON.parse(JSON.stringify(scene.userData));

		// avoid render per object

		this.signals.sceneGraphChanged.active = false;

		while (scene.children.length > 0) {

			this.addObject(scene.children[0]);

		}

		for (var targetId in this.spotLights) {

			var light = this.spotLights[targetId];
			var target = light.userData.target;

			if (target) {

				if (this.objectByUuid(target.uuid)) {

					delete this.spotLights[targetId];
					light.target = this.objectByUuid(target.uuid);
					light.target.updateMatrixWorld(true);

				} else {

					light.target.position.fromArray(target.position);
					light.target.updateMatrixWorld(true);
					this.signals.objectChanged.dispatch(light);

				}

			}

		}

		this.signals.sceneGraphChanged.active = true;
		this.signals.sceneGraphChanged.dispatch();
		this.signals.filterChanged.dispatch();

		// if (this.scene.userData.background) {

		// 	var type = this.scene.userData.background.type;
		// 	var id = this.scene.userData.background.id;
		// 	var assetTexture = this.assets.get('Image', 'id', id);
		// 	var assetEnvironment = this.assets.get('Environment', 'id', id);
		// 	var asset = null;
		// 	if (type == 'Texture') {
		// 		asset = assetTexture;
		// 	} else {
		// 		if (assetEnvironment) {
		// 			asset = assetEnvironment;
		// 		} else {
		// 			asset = assetTexture;
		// 		}
		// 	}

		// 	if (asset) {
		// 		var texture = asset.texture;

		// 		this.signals.sceneBackgroundTypeChanged.dispatch(type, id, texture);
		// 	}

		// }

		// if (this.scene.userData.backgroundTexture) {
		// 	var id = this.scene.userData.backgroundTexture.id;
		// 	var assetTexture = this.assets.get('Image', 'id', id);

		// 	if (assetTexture) {
		// 		var texture = assetTexture.texture;

		// 		this.signals.sceneBackgroundTypeChanged.dispatch('Texture', id, texture);
		// 	}
		// } else if (this.scene.userData.background){
		// 	var id = this.scene.userData.background.id;
		// 	var assetEnvironment = this.assets.get('Environment', 'id', id);

		// 		if ( !assetEnvironment ) {

		// 			assetEnvironment = this.assets.get( 'Image', 'id', id );

		// 		}
		// 	if (assetEnvironment) {
		// 		var texture = assetEnvironment.texture;

		// 		this.signals.sceneBackgroundTypeChanged.dispatch('Equirectangular', id, texture);
		// 	}
		// }


	},

	//

	addObject: function (object, parent, index) {

		var scope = this;

		object.traverse(function (child) {

			if (child.geometry !== undefined) scope.addGeometry(child.geometry);

			if (child.material !== undefined) {
				scope.addMaterial(child.material)
			};

			if (child.isDirectionalLight) {
				scope.addHelper(child.shadow.camera, child);
				//scope.addHelper( child.shadow.camera, child );

			}
			if (child.isSpotLight) {

				scope.addHelper(child.shadow.camera, child);

			}

			scope.addCamera(child);
			scope.addHelper(child, child);

			scope.objects[child.uuid] = child.name;
			let isVoxelLocal = false;
			if (child.userData && child.userData.isVoxel) {
				isVoxelLocal = true;
			}
			if (!isVoxelLocal) {
				scope.objectsWithoutVoxels[child.uuid] = child.name;
			}

		});

		if (parent === undefined) {

			this.scene.add(object);

		} else {

			parent.children.splice(index, 0, object);
			object.parent = parent;

		}

		this.signals.objectAdded.dispatch(object);
		this.signals.sceneGraphChanged.dispatch();


		if (object.isSpotLight) {

			this.lightHelpers.add(object.target);
			this.spotLights[object.target.id] = object;

		}

	},

	addObjects: function (objectsToAdd, parent) {

		var scope = this;

		objectsToAdd.forEach((object) => {
			if (object) {

				object.traverse(function (child) {

					if (child.geometry !== undefined) scope.addGeometry(child.geometry);
					if (child.material !== undefined) scope.addMaterial(child.material);

					scope.addCamera(child);
					scope.addHelper(child, child);

					scope.objects[child.uuid] = child.name;
					let isVoxelLocal = false;
					if (child.userData && child.userData.isVoxel) {
						isVoxelLocal = true;
					}
					if (!isVoxelLocal) {
						scope.objectsWithoutVoxels[child.uuid] = child.name;
					}
				});

				if (parent === undefined) {

					this.scene.add(object);

				} else {

					parent.children.push(object);
					object.parent = parent;

				}
			}
		});

		this.signals.objectsAdded.dispatch(objectsToAdd);
		this.signals.sceneGraphChanged.dispatch();

	},
	addObjects_voxels: function (objectsToAdd, parent) {

		var scope = this;

		objectsToAdd.forEach((object) => {
			if (object) {

				object.traverse(function (child) {

					if (child.geometry !== undefined) scope.addGeometry(child.geometry);
					if (child.material !== undefined) scope.addMaterial(child.material);

					scope.addCamera(child);
					scope.addHelper(child, child);

					scope.objects[child.uuid] = child.name;
					let isVoxelLocal = false;
					if (child.userData && child.userData.isVoxel) {
						isVoxelLocal = true;
					}
					if (!isVoxelLocal) {
						scope.objectsWithoutVoxels[child.uuid] = child.name;
					}

				});

				if (parent === undefined) {

					this.scene.add(object);

				} else {

					parent.children.push(object);
					object.parent = parent;

				}
			}
		});

		this.signals.objectsAdded.dispatch(objectsToAdd);
		//this.signals.sceneGraphChanged.dispatch();

	},
	moveObject: function (object, parent, before) {

		if (parent === undefined) {

			parent = this.scene;

		}

		parent.add(object);

		// sort children array

		if (before !== undefined) {

			var index = parent.children.indexOf(before);
			parent.children.splice(index, 0, object);
			parent.children.pop();

		}

		this.signals.sceneGraphChanged.dispatch();

	},

	nameObject: function (object, name) {

		object.name = name;
		this.signals.sceneGraphChanged.dispatch();
		this.objects[object.uuid] = name;
		let isVoxelLocal = false;
		if (object.userData && object.userData.isVoxel) {
			isVoxelLocal = true;
		}
		if (!isVoxelLocal) {
			this.objectsWithoutVoxels[object.uuid] = object.name;
		}

	},

	getNumberOfCameras: function () {
		return Object.keys(this.cameras).length;
	},

	removeObject: function (object) {
		// TODO::
		// Prevent deletion of last camera
		// Automatically switch camera if currently active one is deleted
		if (object.isCamera && !this.isInClearMode) {
			if (this.getNumberOfCameras() < 2) {
				alert("You can not delete this camera because a scene must have a least one camera.");
				return;
			}
		}

		if (object.parent === null) return; // avoid deleting the scene
		var scope = this;

		object.traverse(function (child) {
			scope.removeCamera(child);
			scope.removeHelper(child);

			if (child.isDirectionalLight) {

				scope.removeHelper(child.shadow.camera);

			}
			if (child.isSpotLight) {

				scope.removeHelper(child.shadow.camera);

			}

			if (child.isSpotLight) {

				child.target.parent.remove(child.target);
				delete scope.spotLights[child.target.id];

			}

			delete scope.objects[child.uuid];
			delete scope.objectsWithoutVoxels[child.uuid];

			if (child.material !== undefined) {
				scope.removeMaterial(child.material);
			}
		});

		object.parent.remove(object);

		delete scope.objects[object.uuid];
		delete scope.objectsWithoutVoxels[object.uuid];

		for (var tag in scope.tags) {
			var index = scope.tags[tag].indexOf(object.uuid);
			if (index != - 1) {
				scope.tags[tag].splice(index, 1);

			}

		}

		this.signals.objectRemoved.dispatch(object);
		this.signals.sceneGraphChanged.dispatch();

	},

	removeObjects: function (objectsToDelete, parent) {

		var scope = this;

		objectsToDelete.forEach((object) => {

			object.traverse(function (child) {

				scope.removeCamera(child);
				scope.removeHelper(child);

				delete scope.objects[child.uuid];
				delete scope.objectsWithoutVoxels[child.uuid];
				if (child.material !== undefined) scope.removeMaterial(child.material);

			});

			parent.remove(object);

			delete scope.objects[object.uuid];
			delete scope.objectsWithoutVoxels[object.uuid];

			for (var tag in scope.tags) {

				var index = scope.tags[tag].indexOf(object.uuid);

				if (index != - 1) {

					scope.tags[tag].splice(index, 1);

				}

			}

		});

		this.signals.objectsRemoved.dispatch(objectsToDelete);
		this.signals.sceneGraphChanged.dispatch();

	},
	removeObjects_voxel: function (objectsToDelete, parent) {

		var scope = this;

		objectsToDelete.forEach((object) => {

			object.traverse(function (child) {

				scope.removeCamera(child);
				scope.removeHelper(child);

				delete scope.objects[child.uuid];
				delete scope.objectsWithoutVoxels[child.uuid];
				if (child.material !== undefined) scope.removeMaterial(child.material);

			});

			parent.remove(object);

			delete scope.objects[object.uuid];
			delete scope.objectsWithoutVoxels[object.uuid];

		});

	},

	addGeometry: function (geometry) {

		this.geometries[geometry.uuid] = geometry;

	},

	setGeometryName: function (geometry, name) {

		geometry.name = name;
		this.signals.sceneGraphChanged.dispatch();

	},

	addMaterial: function (material) {

		material.transparent = true;

		if (Array.isArray(material)) {

			for (var i = 0, l = material.length; i < l; i++) {

				this.addMaterialToRefCounter(material[i]);

			}

		} else {

			this.addMaterialToRefCounter(material);

		}

		this.signals.materialAdded.dispatch();

	},

	addMaterialToRefCounter: function (material) {

		var materialsRefCounter = this.materialsRefCounter;

		var count = materialsRefCounter.get(material);

		if (count === undefined) {

			materialsRefCounter.set(material, 1);
			this.materials[material.uuid] = material;

		} else {

			count++;
			materialsRefCounter.set(material, count);

		}

	},

	removeMaterial: function (material) {

		if (Array.isArray(material)) {

			for (var i = 0, l = material.length; i < l; i++) {

				this.removeMaterialFromRefCounter(material[i]);

			}

		} else {

			this.removeMaterialFromRefCounter(material);

		}

		this.signals.materialRemoved.dispatch();

	},

	removeMaterialFromRefCounter: function (material) {

		var materialsRefCounter = this.materialsRefCounter;

		var count = materialsRefCounter.get(material);
		count--;

		if (count === 0) {

			materialsRefCounter.delete(material);
			delete this.materials[material.uuid];

		} else {

			materialsRefCounter.set(material, count);

		}

	},

	getMaterialById: function (id) {

		var material;
		var materials = Object.values(this.materials);

		for (var i = 0; i < materials.length; i++) {

			if (materials[i].id === id) {

				material = materials[i];
				break;

			}

		}

		return material;

	},

	setMaterialName: function (material, name) {

		material.name = name;
		this.signals.sceneGraphChanged.dispatch();

	},

	addTexture: function (texture) {

		this.textures[texture.uuid] = texture;

	},

	addTimeline: function () {

		this.timelines.push({
			name: `untitled`,
			duration: 20,
			tracks: [],
			channels: []
		});

		this.timelineIndex = this.timelines.length - 1;

	},

	deleteTimeline: function (index) {

		if (this.timelines.length > 1) {

			this.timelines.splice(index, 1);

			if (this.timelineIndex >= index) {

				this.timelineIndex = Math.max(0, this.timelineIndex - 1);

			}

		}

	},

	changeTimeline: function (index) {

		this.timelineIndex = index;

	},

	addTrack: function (track) {

		this.timelines[this.timelineIndex].tracks.push(track);

	},

	getTimelineNames: function () {

		var names = {};

		for (var timeline of this.timelines) {

			names[this.timelines.indexOf(timeline)] = timeline.name;

		}

		return names;

	},

	getCurrentTimeline: function () {
		return this.timelines[this.timelineIndex];
	},

	addFirstCameraToSceneIfRequired() {
		var scope = this;
		if (scope.getCameraCount() > 0) {
			return;
		}
		var cameraObject = _DEFAULT_CAMERA.clone();
		(new AddObjectCommand(scope, cameraObject)).execute();
		scope.viewportCamera = cameraObject;
		scope.setActiveCamera(cameraObject.uuid);
	},

	setActiveCamera(uuid) {
		var editor = this;
		editor.scene.userData.activeCamera = uuid;
		editor.signals.activeCameraChanged.dispatch(uuid);
		editor.signals.sceneUserDataChanged.dispatch();
	},

	getCameraCount(type) {
		var count = 0;
		for (let uid in this.cameras) {
			var cameraObject = this.cameras[uid];
			if (type) {
				if (type === 'perspective') {
					if (cameraObject.isPerspectiveCamera) {
						count++;
					}
				} else if (type === 'orthographic') {
					if (cameraObject.isOrthographicCamera) {
						count++;
					}
				}
			} else {
				count++;
			}
		}
		return count;
	},

	addCamera: function (camera) {
		if (camera.isCamera) {
			if (camera.uuid === this.scene.userData.activeCamera) {
				this.viewportCamera = camera;
			}
			this.cameras[camera.uuid] = camera;
			this.signals.cameraAdded.dispatch(camera);
		}

	},

	removeCamera: function (camera) {
		var scope = this;
		var isActiveCamera = (scope.viewportCamera.uuid === camera.uuid);

		if (scope.cameras[camera.uuid] !== undefined) {
			delete scope.cameras[camera.uuid];

			if (isActiveCamera) {
				// Assign new active camera
				var remainingCameraUids = Object.keys(scope.cameras);
				if (remainingCameraUids.length > 0) {
					var newActiveCameraUid = remainingCameraUids[0];
					if (workspace && workspace.sidebar && workspace.sidebar.scene) {
						workspace.sidebar.scene.refreshCameraCheckboxes();
					}
					scope.viewportCamera = scope.cameras[newActiveCameraUid];
					scope.scene.userData.activeCamera = newActiveCameraUid;
					scope.signals.activeCameraChanged.dispatch(newActiveCameraUid);
				} else {
					scope.viewportCamera = scope.defaultCameraWhenNoneIsPresent;
				}
			}

			this.signals.cameraRemoved.dispatch(camera);
		}

	},

	//

	addHelper: function () {

		var geometry = new THREE.SphereBufferGeometry(2, 4, 2);
		var material = new THREE.MeshBasicMaterial({ color: 0xff0000, visible: false });

		return function (object, target, helper) {

			if (helper === undefined) {

				if (object.isCamera) {

					helper = new THREE.CameraHelper(object);

				} else if (object.isPointLight) {

					helper = new THREE.PointLightHelper(object, 1);

				} else if (object.isDirectionalLight) {

					helper = new THREE.DirectionalLightHelper(object, 1);

				} else if (object.isSpotLight) {

					helper = new THREE.SpotLightHelper(object, 1);

				} else if (object.isHemisphereLight) {

					helper = new THREE.HemisphereLightHelper(object, 1);

				} else if (object.isRectAreaLight) {

					helper = new RectAreaLightHelper(object);

				} else if (object.isSkinnedMesh) {

					helper = new THREE.SkeletonHelper(object.skeleton.bones[0]);

				} else {

					// no helper for this object type
					return;

				}

				var picker = new THREE.Mesh(geometry, material);
				picker.name = 'picker';
				picker.userData.object = target;
				helper.add(picker);

			}

			if (object.isCamera) {
				this.cameraHelpers.add(helper);
				if (target.isDirectionalLight) {
					target.advancedHelperObject = helper;
					helper.visible = target.userData.advancedHelper ? true : false;
				}
			} else {
				this.lightHelpers.add(helper);
			}
			//object.isCamera ? this.cameraHelpers.add( helper ) : this.lightHelpers.add( helper );
			this.helpers[object.id] = helper;

			this.signals.helperAdded.dispatch(helper);

		};

	}(),

	removeHelper: function (object) {

		if (this.helpers[object.id] !== undefined) {

			var helper = this.helpers[object.id];
			helper.parent.remove(helper);

			delete this.helpers[object.id];

			this.signals.helperRemoved.dispatch(helper);

		}

	},

	//

	addScript: function (script) {
		this.scripts.push(script);

		this.signals.scriptAdded.dispatch(script);

	},

	removeScript: function (index) {

		this.scripts.splice(index, 1);

		this.signals.scriptRemoved.dispatch(script);

	},

	//

	addAsset: function (type, folderId, item, onLoad) {
		return this.assets.add(type, folderId, item, onLoad);

	},

	removeAsset: function (type, id) {

		var asset = this.assets.get(type, 'id', id);
		var assetId = asset[type.toLowerCase() + 'Id'];

		this.assets.remove(type, 'id', id);

		this.signals.assetRemoved.dispatch(type, assetId);

	},

	getObjectMaterial: function (object, slot) {

		var material = object.material;

		if (Array.isArray(material) && slot !== undefined) {

			material = material[slot];

		}

		return material;

	},

	setObjectMaterial: function (object, slot, newMaterial) {

		if (Array.isArray(object.material) && slot !== undefined) {

			object.material[slot] = newMaterial;

		} else {

			object.material = newMaterial;

		}

	},

	setViewportCamera: function (uuid) {
		if (this.cameras[uuid]) {
			this.viewportCamera = this.cameras[uuid];

		}

		this.signals.viewportCameraChanged.dispatch();

	},

	setPaint: function (paint) {

		this.paint = paint;

	},

	getConnectedAttributeName: function (object) {

		for (var attributeName in this.attributeTextMap) {

			if (this.attributeTextMap[attributeName] == object.uuid) {

				return attributeName;

			}

		}

		return null;

	},

	removeAttributeTextConnection: function (attributeName) {

		if (this.attributeTextMap[attributeName]) {

			delete this.attributeTextMap[attributeName];

		}

	},

	updateAttributeTextConnection: function (attribute) {

		var uuid = this.attributeTextMap[attribute.name];

		if (uuid) {

			var object = this.objectByUuid(uuid);
			object.text = attribute.value.toString();
			object.updateGeometry();

			this.signals.objectChanged.dispatch(object);
		}

	},

	//

	select: function (object, anyway) {

		if (this.selected === object && !anyway) return;

		console.log("EDITOR.JS============", object);

		if ($('#prefab-panel').is(':visible')) {
			let prefabDiv = $('#outliner1 .option:first .name').text()
			console.log(prefabDiv);
			if (prefabDiv !== 'Prefab') {
				var option = document.createElement('div');
				option.draggable = false;

				var html = '<span class="line"></span>';
				html += '<span class="name">Prefab</span>';

				option.innerHTML = html;
				// option.value = object.id;
				option.style.paddingLeft = '20px';
				option.className = 'option'

				$('#prefab-panel #outliner1').append(option)

			}

			if (object) {

				const loader = new THREE.ObjectLoader()
				console.log("ppppppp", object);

				let exObj = localStorage.getItem(object.uuid)
				console.log('ex item=======', exObj)
				if (!exObj) {

					// Serialize the object
					const serializedObj = JSON.stringify(object.toJSON());

					// Store the serialized object in LocalStorage
					localStorage.setItem(object.uuid, serializedObj);

					// localStorage.setItem(object.uuid, JSON.stringify({ obj: object }))
					var option = document.createElement('div');
					option.draggable = true;

					var html = '<span class="line"></span>';
					html += '<span class="name">' + object.name + '</span>';

					option.innerHTML = html;
					option.value = object.id;
					option.style.paddingLeft = '43px';
					option.className = 'option'
					option.addEventListener('click', () => {
						console.log("Object ID====", object.uuid);
						// let objToAdd = JSON.parse(localStorage.getItem(object.uuid))

						// Retrieve the serialized object from LocalStorage
					const retrievedObj = JSON.parse(localStorage.getItem(object.uuid));

					// Create a new Three.js object from the retrieved data
					const loader = new THREE.ObjectLoader();
					const newObj = loader.parse(retrievedObj);

						console.log("ORIGINAL OBJECT ===", newObj);
						// var geometry = new THREE.BoxGeometry(20, 20, 20);
						// var material = new THREE.MeshBasicMaterial({ color: "#fff" });

						// console.log("mesh========", mesh);

						// this.scene.add(mesh)
						(new AddObjectCommand(this, newObj)).execute();

					})

					$('#prefab-panel #outliner1').append(option)
				}
			}

		}

		// const prefab = new THREE.Object3D();
		// let obj = {...object};
		// prefab.add(obj)
		// console.log(JSON.stringify({...prefab}))

		//prevent to select unvisible object
		//if(object && !object.visible) return;

		var uuid = null;

		if (object !== null) {

			uuid = object.uuid;

		}

		this.selected = object;

		this.config.setKey('selected', uuid);
		this.signals.objectSelected.dispatch(object);

	},

	getObjectById: function (id) {
		if (id === this.viewportCamera.id) {
			return this.viewportCamera;
		}
		return this.scene.getObjectById(id, true);

	},

	selectById: function (id) {
		var object = this.getObjectById(id);
		//prevent select locked user camera
		//if ( object.visible && (object.userData && !object.userData.locked) ) {
		if (object) {
			this.select(object);
		}
	},

	selectByUuid: function (uuid) {

		var scope = this;

		this.scene.traverse(function (child) {

			if (child.uuid === uuid) {

				scope.select(child);

			}

		});

	},

	deselect: function () {

		this.select(null);

	},

	focus: function (object) {

		if (object !== undefined) {

			this.signals.objectFocused.dispatch(object);

		}

	},

	focusById: function (id) {

		this.focus(this.scene.getObjectById(id, true));

	},

	clear: function () {
		this.isInClearMode = true;

		this.history.clear();

		this.signals.cameraResetted.dispatch();

		this.scene.name = 'Scene';
		this.scene.userData = {};
		this.scene.background = new THREE.Color(0x14151b);
		this.scene.environment = null;
		this.scene.fog = null;

		var objects = this.scene.children;

		while (objects.length > 0) {
			this.removeObject(objects[0]);
		}

		this.geometries = {};
		this.materials = {};
		this.textures = {};
		this.attributes = [];
		this.attributeTextMap = {};
		this.scripts = [
			{
				name: 'untitled',
				json: [],
				source: ''
			}
		];
		this.timelines = [
			{
				name: 'untitled',
				duration: 20,
				channels: [],
				tracks: []
			}
		];
		this.timelineIndex = 0;

		this.materialsRefCounter.clear();

		this.tags = {};
		this.mixer.stopAllAction();

		this.deselect();
		this.signals.editorCleared.dispatch();
		this.isInClearMode = false;
	},

	//

	fromJSON: function (json) {
		var scope = this;
		var loader = new ObjectLoader(this.assets);

		this.signals.cameraResetted.dispatch();

		this.history.fromJSON(json.history);
		this.scripts = json.scripts;
		this.attributes = json.attributes;
		this.attributeTextMap = json.attributeTextMap ? json.attributeTextMap : {};
		this.tags = json.tags;
		this.timelines = json.timelines;


		loader.parse(json.scene, function (scene) {
			scope.setScene(scene);
			scope.addFirstCameraToSceneIfRequired();
			scope.signals.windowResize.dispatch();
			scope.signals.sceneLoaded.dispatch();
			scope.signals.activeCameraChanged.dispatch(scope.scene.userData.activeCamera);
		});

	},

	toJSON: function () {
		var objects = Object.keys(this.objects);

		var playBlocks = [];
		var audioTracks = [];
		var textures = [];
		var assets = {
			images: [],
			environments: [],
			audios: [],
			videos: [],
			fonts: [],
			animations: [],
		};

		if (this.scene.userData.background) {

			if (this.scene.userData.background.type == 'Texture') {

				assets.images.push(this.scene.userData.background.id);

			} else {

				assets.environments.push(this.scene.userData.background.id);

			}

		}

		UtilsHelper.lookUp(editor.scripts, 'type', 'play', playBlocks);

		for (var block of playBlocks) {

			if (block.mode == 'audio' && block.audioId && block.audio) {

				assets.audios.push(block.audioId);

			} else if (block.mode == 'video' && block.videoId && block.video) {

				assets.videos.push(block.videoId);

			} else if (block.mode == "animation" && block.animationId && block.animation) {
				assets.animations.push(block.animationId);
			}

		}

		UtilsHelper.lookUp(editor.scripts, 'type', 'change', textures);

		textures.forEach(texture => {
			if (texture.values.isAbout === "texture" || texture.values.isAbout === "equirect") {
				const { assetId, mapAssetId } = texture.values;
				[assetId, mapAssetId].forEach(asset => {
					if (isDefined(asset) && asset !== -1) {
						assets.images.push(asset);
					}
				})

			}
		})

		for (var font of this.assets.fonts) {

			if (font.id !== 'defaultFont') assets.fonts.push(font.id);

		}

		UtilsHelper.lookUp(editor.timelines, 'audio', true, audioTracks);

		for (var track of audioTracks) {

			assets.audios.push(track.id);

		}



		var autostart = {};



		this.scene.traverse(function (child) {

			if (child.animations.length > 0) {

				autostart[child.uuid] = {};

				child.animations.forEach((animation) => {
					autostart[child.uuid][animation.uuid] = animation.playing;
				});

			}

		});


		return {

			metadata: {
				type: 'arcade.scene'
			},
			project: {
				shadows: this.config.getKey('project/renderer/shadows'),
				shadowType: this.config.getKey('project/renderer/shadowType'),
				vr: this.config.getKey('project/vr'),
				physicallyCorrectLights: this.config.getKey('project/renderer/physicallyCorrectLights'),
				toneMapping: this.config.getKey('project/renderer/toneMapping'),
				toneMappingExposure: this.config.getKey('project/renderer/toneMappingExposure'),
				filter: this.config.getKey('project/filter/live')
			},
			scene: this.scene.toJSON(),
			objects: objects,
			scripts: this.scripts,
			history: this.history.toJSON(),
			assets: assets,
			attributes: this.attributes,
			attributeTextMap: this.attributeTextMap,
			tags: this.tags,
			timelines: this.timelines,
			autostart: autostart,

		};

	},

	objectByUuid: function (uuid) {

		return this.scene.getObjectByProperty('uuid', uuid);

	},

	execute: function (cmd, optionalName) {

		this.history.execute(cmd, optionalName);

	},

	undo: function () {

		this.history.undo();

	},

	redo: function () {

		this.history.redo();

	},

	//

	loadState: function () {
		if (this.storage.state) {
			this.fromJSON(this.storage.state);
		} else {
			// State not available - should come here only for newly created projects
			this.addFirstCameraToSceneIfRequired();
			this.signals.windowResize.dispatch();
			this.signals.sceneLoaded.dispatch();
		}

	},

};

export { Editor };
