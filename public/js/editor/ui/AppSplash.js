/**
 * @author mrdoob / http://mrdoob.com/
 */

import isDefined from '../utils/index';
import { UIDiv } from './components/ui.js';

var AppSplash = function ( editor, app ) {

    var assets = editor.assets;
    var storage = editor.storage;
	var signals = editor.signals;

	var container = new UIDiv();
	container.setId( 'splash' );

    if ( app ) {

        var loadingBar = new UIDiv();
        loadingBar.setClass( 'ldBar' );
        loadingBar.addClass( 'label-center' );
        loadingBar.setWidth( '20%' );
        loadingBar.setHeight( '100%' );
        loadingBar.setMargin( '0 auto' );
    
        var progress = 0;
        
        var bar = new ldBar( loadingBar.dom, {
            'preset': 'circle',
            'stroke': '#6c8db8',
            'stroke-width': 1,
            'stroke-trail': '#6c8db8',
            'stroke-trail-width': 0.5,
            'value': progress,
        });
        
        container.add( loadingBar );
    
        storage.load( app, onStateProgress ).then( () => {
    
            var tasks = [];
            var types = [ 'Image', 'Environment', 'Audio', 'Video', 'Font', 'Animation' ];
    
            for ( var type of types ) {
    
                var lower = type.toLowerCase();
                var ids = storage.state.assets[ lower + 's' ];
                var url = '/app_asset/' + lower;

                if (ids && ids.filter){
                    ids = ids.filter(id=>{
                        return isDefined(id) && id !== "undefined";
                    })
                }

                if ( ids && ids.length > 0 ) {
                    for ( let i = 0; i < ids.length; i++ ) {

                        url = url + ( i == 0 ? '?' : '&' ) + 'id=' + ids[ i ];
    
                    }

                    if ( type == 'Font' ) {

                        tasks.push( assets.loadFont( type, url, onAssetProgress ) );

                    } else {
                        tasks.push( assets.load( type, url, onAssetProgress ) );

                    }
    
                }
    
            }

            // const onProgress = onAssetProgress;
			// new tasks
			// tasks.push(assets.load('Geometry', '/asset/my-geometry', onProgress));
			// tasks.push(assets.load('Material', '/asset/my-material', onProgress));
			// tasks.push(assets.load('Image', '/asset/my-image', onProgress));
			// tasks.push(assets.load('Audio', '/asset/my-audio', onProgress));
			// tasks.push(assets.load('Video', '/asset/my-video', onProgress));
			// tasks.push(assets.load('Environment', '/asset/my-environment', onProgress));
			// tasks.push(assets.load('Animation', '/asset/my-animation/', onProgress));
			// tasks.push(assets.loadFont(editor.projectId, onProgress));
    
            Promise.all( tasks ).then( results => {
    
                bar.set( 100 );
        
                setTimeout( function () {
        
                    signals.loadingFinished.dispatch();
        
                }, 1000 );
        
            } );
        
            function onAssetProgress( value ) {
        
                progress += 80 / tasks.length * value;
                
                bar.set( progress );
                
            }

        } );
    
        function onStateProgress( value ) {
    
            progress += 20 * value;
            
            bar.set( progress );
            
        }
    
    }

	return container;

};

export { AppSplash };
