import { Asset } from './Asset.js';

var VideoAsset = function ( editor, id, videoId, name, url ) {

    Asset.call( this, editor, 'Video', id, name );

    this.videoId = videoId;
    this.url = url;

};

VideoAsset.prototype.load = function ( onLoad ) {

    var scope = this;

    this.video = document.createElement( 'video' );
    this.video.setAttribute( 'crossorigin', 'anonymous' );
    this.video.src = this.url;
    this.video.load();

    this.texture = new THREE.VideoTexture( this.video );
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.format = THREE.RGBFormat;

    if ( onLoad ) onLoad();

};

export { VideoAsset };
