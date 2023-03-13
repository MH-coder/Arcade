
import * as THREE from '../libs/three.module.js';
import { Asset } from './Asset.js';
import { SetMaterialMapCommand } from '../commands/SetMaterialMapCommand.js';
import {RGBELoader} from '../core/loaders/RGBELoader.js';
import isDefined from '../utils/index';

var ImageAsset = function ( editor, id, imageId, url, isHDR, texture ) {

    Asset.call(this, editor, 'Image', id, '');

    this.imageId = imageId;
    this.url = url;

    // neeeds to be imporved and/ or place somewhere else
    this.isHDR= isDefined(isHDR) ? isHDR : this.url && this.url.includes(".hdr");
    if (texture){
        this.texture = texture;
    }

};

ImageAsset.prototype.load = function (onLoad, onError) {

    

    var scope = this;
	var manager = new THREE.LoadingManager();
    var loader = scope.isHDR ? new RGBELoader(manager): new THREE.TextureLoader( manager );

    function loaderOnLoad(texture){

        // TODO: add support for RBGEncoding only following version r139

        texture.encoding = texture.isHDRTexture ? THREE.sRGBEncoding : THREE.sRGBEncoding;

        if (texture.isCubeTexture && texture.isHDRTexture) {

            texture.format = THREE.RGBAFormat;
            texture.minFilter = THREE.NearestFilter;
            texture.magFilter = THREE.NearestFilter;
            texture.generateMipmaps = false;

        }

        scope.texture = texture;

        onLoad();
    }

    if (!this.texture){
        loader.load( scope.url, loaderOnLoad);
    }else{
        loaderOnLoad(this.texture)
    }
    

};

ImageAsset.prototype.apply = function (object, _toUpdateSelection = true) {

    var scope = this;

    console.log("image asset apply called");
    //if image was dropped on an object
    if (object) {
        if (scope.texture) {

            scope.editor.execute(new SetMaterialMapCommand(scope.editor, object, 'map', scope.texture));

        } else {

            scope.editor.signals.imageAssetDownloading.dispatch(scope.id, true);

            scope.load(function () {

                scope.editor.signals.imageAssetDownloading.dispatch(scope.id, false);
                scope.editor.execute(new SetMaterialMapCommand(scope.editor, object, 'map', scope.texture));
                
            });

        }
    }
    //if image was not dropped on an object
    else {
        if ( scope.texture ) {

            scope.editor.signals.sceneBackgroundTypeChanged.dispatch( 'Texture', scope.id, scope.texture, _toUpdateSelection );
    
        } else {
    
            scope.load( function () {
    
                scope.editor.signals.sceneBackgroundTypeChanged.dispatch( 'Texture', scope.id, scope.texture, _toUpdateSelection );
    
            } );
            
        }
    }


}

export { ImageAsset };
