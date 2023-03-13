import * as THREE from '../libs/three.module.js';
import { RGBELoader } from '../core/loaders/RGBELoader.js';
import { Asset } from './Asset.js';

var EnvironmentAsset = function ( editor, id, environmentId, name, thumbUrl, url ) {

    Asset.call( this, editor, 'Environment', id, name );

    this.environmentId = environmentId;
    this.thumbUrl = thumbUrl;
    this.url = url;

};

EnvironmentAsset.prototype.load = function ( onLoad ) {

    var scope = this;
    var loader = new RGBELoader().setDataType( THREE.UnsignedByteType );

    loader.load( scope.url, function( hdrTexture ) {
        
        hdrTexture.sourceFile = scope.name;
        hdrTexture.isHDRTexture = true;
        hdrTexture.mapping = THREE.EquirectangularReflectionMapping;
        // hdrTexture.encoding = THREE.sRGBEncoding;
        scope.texture = hdrTexture;
        onLoad();

    });

}

EnvironmentAsset.prototype.apply = function (_toUpdateSelection = true) {

    var scope = this;

    console.log("scope: ",scope);
    if ( scope.texture ) {

        scope.editor.signals.sceneBackgroundTypeChanged.dispatch( 'Equirectangular', scope.id, scope.texture, _toUpdateSelection );

    } else {

        scope.load( function () {

            scope.editor.signals.sceneBackgroundTypeChanged.dispatch( 'Equirectangular', scope.id, scope.texture, _toUpdateSelection );

        } );
        
    }

}

export { EnvironmentAsset };
