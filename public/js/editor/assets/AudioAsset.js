import * as THREE from '../libs/three.module.js';
import { Asset } from './Asset.js';

var AudioAsset = function ( editor, id, audioId, name, duration, url ) {

    Asset.call( this, editor, 'Audio', id, name );

    this.audioId = audioId;
    this.duration = duration;
    this.url = url;
    this.audio = new THREE.Audio( editor.listener );

};

AudioAsset.prototype.load = function ( onLoad ) {

    var scope = this;
    var audioLoader = new THREE.AudioLoader();

    audioLoader.load( this.url, function( buffer ) {

        scope.audio.setBuffer( buffer );
        onLoad();

    });

}

AudioAsset.prototype.play = function () {

    return this.audio.play();

}

AudioAsset.prototype.stop = function () {

    return this.audio.stop();

}

export { AudioAsset };
