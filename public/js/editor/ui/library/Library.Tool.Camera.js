/**
 * @author codelegend620
 */

import { UIDiv, UIRow } from '../components/ui.js';
import { UIGrid } from '../components/ui.openstudio.js';
import { AddObjectCommand } from '../../commands/AddObjectCommand.js';

function LibraryToolCamera( editor ) {

	var config = editor.config;
	var signals = editor.signals;
	var strings = editor.strings;

	var container = new UIDiv();

	var category = new UIRow();
	category.setTextContent( strings.getKey( 'library/tools/cameras' ) );
	category.setBackgroundColor( 'rgba(49, 55, 75, 0.26)' );

	var grid = new UIGrid();
	grid.addClass( 'Camera' );

	var cameras = strings.getKey( 'library/tools/cameras/objects' );
	var gridItems = [];
	
	cameras.map( camera => {

		gridItems.push( {
			image: config.getImage( 'gallery/cameras/icon.png' ),
			name: camera,
			value: camera,
		} );

	} );

	grid.setItems( gridItems );
	grid.setItemClickedHandler( handleClick );

	function handleClick ( id ) {

		if ( id == 'perspective' ) {

			var camera = new THREE.PerspectiveCamera();
			camera.name = `PerspectiveCamera${editor.getCameraCount('perspective') + 1}`;
			camera.position.set( 0, 5, 10 );
			camera.lookAt( new THREE.Vector3() );

			editor.execute( new AddObjectCommand( editor, camera ) );

		} else if ( id == 'orthographic' ) {

			var camera = new THREE.OrthographicCamera();
			camera.name = `OrthographicCamera${editor.getCameraCount('orthographic') + 1}`;
			
			editor.execute( new AddObjectCommand( editor, camera ) );
		}

	}

	container.add( category );
	container.add( grid );

	return container;

}

export { LibraryToolCamera };
