import * as THREE from '../libs/three.module.js';
import { Asset } from './Asset.js';
import { FontLoader } from '../core/loaders/FontLoader.js';

var FontAsset = function ( editor, id, name, url ) {

    Asset.call( this, editor, 'Font', id, name );

    this.url = url;
    this.font = null;

};

FontAsset.prototype.load = function ( onLoad ) {

    var scope = this;
    var fontLoader = new FontLoader();

    fontLoader.load( this.url, function( font ) {

        scope.font = font;
        onLoad();

    });

}

export { FontAsset };
