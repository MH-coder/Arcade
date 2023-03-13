/**
 * @author mrdoob / http://mrdoob.com/
 */

import { UIDiv } from './components/ui.js';

var Splash = function ( editor, project ) {

    var assets = editor.assets;
    var config = editor.config;
    var storage = editor.storage;
	var signals = editor.signals;

	var container = new UIDiv();
	container.setId( 'splash' );

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

    var tasks = [];

    if ( project.configUrl ) {

        tasks.push( config.load( project.configUrl, onProgress ) );

    }

    if ( project.stateUrl ) {

        tasks.push( storage.load( project.stateUrl, onProgress, true, project.id ) );
        
    }
    tasks.push( assets.load( 'Geometry', `/asset/my-geometry/${project.id}`, onProgress ) );
    tasks.push( assets.load( 'Material', `/asset/my-material/${project.id}`, onProgress ) );
    tasks.push( assets.load( 'Image', `/asset/my-image/${project.id}`, onProgress ) );
    tasks.push( assets.load( 'Audio', `/asset/my-audio/${project.id}`, onProgress ) );
    tasks.push( assets.load( 'Video', `/asset/my-video/${project.id}`, onProgress ) );
    tasks.push( assets.load( 'Environment', `/asset/my-environment/${project.id}`, onProgress ) );
    tasks.push( assets.load( 'Animation', `/asset/my-animation/${project.id}`, onProgress ) );
    tasks.push( assets.loadFont( editor.projectId, onProgress ) );

    function onProgress( value ) {

        progress += 100 / tasks.length * value;
        
        bar.set( progress );
        
    }

    Promise.all( tasks ).then( results => {

        bar.set( 100 );

        setTimeout( function () {

            signals.loadingFinished.dispatch();

        }, 100 );

    } );

	return container;

};

export { Splash };
