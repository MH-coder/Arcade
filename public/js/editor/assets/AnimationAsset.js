
import * as THREE from '../libs/three.module.js';
import { Asset } from './Asset.js';
import { LottieLoader } from '../core/loaders/LottieLoader.js';

var AnimationAsset = function ( editor, id, animationId, name, url ) {

	Asset.call( this, editor, 'Animation', id, name );

	this.animationId = animationId;
	this.url = url;

};

AnimationAsset.prototype.load = function ( onLoad, onError ) {

	var scope = this;
	var manager = new THREE.LoadingManager();
	var loader = new LottieLoader( manager );

	loader.load( scope.url, function ( texture ) {

		scope.texture = texture;

		onLoad();

	} );

};

export { AnimationAsset };
