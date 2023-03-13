import * as THREE from '../libs/three.module.js';
import { Asset } from './Asset.js';
import { SetMaterialMapCommand } from '../commands/SetMaterialMapCommand.js';
import { SetMaterialCommand } from '../commands/SetMaterialCommand.js';
import { SetMaterialValueCommand } from '../commands/SetMaterialValueCommand.js';

var MaterialAsset = function ( editor, id, materialId, name, thumbUrl, urls ) {

    Asset.call( this, editor, 'Material', id, name );

    this.materialId = materialId;
    this.thumbUrl = thumbUrl;
    this.urls = urls;
    this.textures = {};
};

MaterialAsset.prototype.load = function ( onLoad ) {

    var scope = this;

    function textureLoader( name ) {

        return new Promise( function ( resolve ) {

            var loader = new THREE.TextureLoader();

            loader.load( scope.urls[ name ], function ( texture ) {
            // TODO: add support for RBGEncoding only following version r139
                texture.encoding = texture.isHDRTexture ? THREE.sRGBEncoding : THREE.sRGBEncoding;

                if ( texture.isCubeTexture && texture.isHDRTexture ) {

                    texture.format = THREE.RGBAFormat;
                    texture.minFilter = THREE.NearestFilter;
                    texture.magFilter = THREE.NearestFilter;
                    texture.generateMipmaps = false;

                }

                scope.textures[ name ] = texture;

                resolve();

            } );

        } );
        
    }

    var promises = [];

    for ( var name in this.urls ) {

        promises.push( textureLoader( name ) );     

    }

    Promise.all( promises ).then( results => {

        onLoad();

    } );

};

MaterialAsset.prototype.apply = function ( object ) {

    var scope = this;

    var applyToObject = function () {

        var editor = scope.editor;
        var geometry = object.geometry;
        var currentMaterialSlot = 0;
        var material = editor.getObjectMaterial( object, currentMaterialSlot );
    
        var textureWarning = false;
        var objectHasUvs = false;
    
        if ( object.isSprite ) objectHasUvs = true;
        if ( geometry.isGeometry && geometry.faceVertexUvs[ 0 ].length > 0 ) objectHasUvs = true;
        if ( geometry.isBufferGeometry && geometry.attributes.uv !== undefined ) objectHasUvs = true;
    
        if ( material ) {
    
            var materialKeys = {
                'aoMap': 'aoMap',
                'bumpMap': 'bumpMap',
                'colorMap': 'map',
                'displaceMap': 'displacementMap',
                'normalMap': 'normalMap',
                'roughMap': 'roughnessMap',
            };
            var keys = Object.keys( scope.textures );
    
            if ( keys.length > 0 ) {
        
                keys.map( key => {
        
                    if ( material[ materialKeys[ key ] ] !== undefined && objectHasUvs ) {
    
                        editor.execute( new SetMaterialMapCommand( editor, object, materialKeys[ key ], scope.textures[ key ], currentMaterialSlot ) );
    
                    }
        
                } );
    
                if ( material.displacementScale !== 0 ) {
    
                    editor.execute( new SetMaterialValueCommand( editor, object, 'displacementScale', 0, currentMaterialSlot ) );
    
                }
                
            } else {
    
                var materialClasses = {
                    'line basic': THREE.LineBasicMaterial,
                    'line dashed': THREE.LineDashedMaterial,
                    'mesh basic': THREE.MeshBasicMaterial,
                    'mesh depth': THREE.MeshDepthMaterial,
                    'mesh lambert': THREE.MeshNormalMaterial,
                    'mesh metcap': THREE.MeshLambertMaterial,
                    'mesh normal': THREE.MeshMatcapMaterial,
                    'mesh phong': THREE.MeshPhongMaterial,
                    'mesh physical': THREE.MeshToonMaterial,
                    'mesh standard': THREE.MeshStandardMaterial,
                    'mesh toon': THREE.MeshPhysicalMaterial,
                    'raw shader': THREE.RawShaderMaterial,
                    'shader': THREE.ShaderMaterial,
                    'shadow': THREE.ShadowMaterial,
                    'sprite': THREE.SpriteMaterial
                };
    
                material = new materialClasses[ scope.name ]();
    
                if ( material.type === "RawShaderMaterial" ) {
    
                    material.vertexShader = vertexShaderVariables + material.vertexShader;
    
                }
    
                if ( Array.isArray( object.material ) ) {
    
                    // don't remove the entire multi-material. just the material of the selected slot
    
                    editor.removeMaterial( object.material[ currentMaterialSlot ] );
    
                } else {
    
                    editor.removeMaterial( object.material );
    
                }
    
                editor.execute( new SetMaterialCommand( editor, object, material, currentMaterialSlot ), 'New Material: ' + scope.name );
                editor.addMaterial( material );
    
            }
    
        }

    }

    if ( Object.keys( scope.textures ).length > 0 ) {

        applyToObject();
        
    } else {

		scope.editor.signals.materialAssetDownloading.dispatch( scope.id, true );
        scope.load( function () {

            scope.editor.signals.materialAssetDownloading.dispatch( scope.id, false );
            applyToObject();

        } );
        
    }

};

export { MaterialAsset };
