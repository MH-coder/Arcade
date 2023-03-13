/**
 * @author codelegend620
 */

import { UIDiv, UIRow } from '../components/ui.js';
import { UIGrid } from '../components/ui.openstudio.js';
import { AddObjectCommand } from '../../commands/AddObjectCommand.js';

function LibraryToolLight( editor ) {

	var config = editor.config;
	var signals = editor.signals;
	var strings = editor.strings;

	var container = new UIDiv();

	var category = new UIRow();
	category.setTextContent( strings.getKey( 'library/tools/lights' ) );
	category.setBackgroundColor( 'rgba(49, 55, 75, 0.26)' );

	var grid = new UIGrid();
	var lights = strings.getKey( 'library/tools/lights/objects' );
	var gridItems = [];

	lights.map( light => {

		gridItems.push( {
			image: config.getImage( `gallery/lights/lights-${light}.png` ),
			name: light,
			value: light
		} );

	} );

	grid.setItems( gridItems );
	grid.setItemClickedHandler( handleClick );

	function handleClick ( id ) {

		if ( id == 'ambient' ) {

			var color = 0xdddddd;
	
			var light = new THREE.AmbientLight( color );
			light.name = 'AmbientLight';
	
			editor.execute( new AddObjectCommand( editor, light ) );

		} else if ( id == 'directional' ) {

			var color = 0xffffff;
			var intensity = 1;
	
			var light = new THREE.DirectionalLight( color, intensity );
			light.name = 'DirectionalLight';
			light.target.name = 'DirectionalLight Target';
	
			light.position.set( 5, 10, 7.5 );
			light.castShadow = true;
	
			editor.execute( new AddObjectCommand( editor, light ) );
	
		} else if ( id == 'hemisphere' ) {

			var skyColor = 0x00aaff;
			var groundColor = 0xffaa00;
			var intensity = 1;
	
			var light = new THREE.HemisphereLight( skyColor, groundColor, intensity );
			light.name = 'HemisphereLight';
	
			light.position.set( 0, 10, 0 );
	
			editor.execute( new AddObjectCommand( editor, light ) );
	
		} else if ( id == 'point' ) {

			var color = 0xffffff;
			var intensity = 1;
			var distance = 0;
	
			var light = new THREE.PointLight( color, intensity, distance );
			light.name = 'PointLight';
	
			editor.execute( new AddObjectCommand( editor, light ) );
	
		} else if ( id == 'spot' ) {

			var color = 0xffffff;
			var intensity = 1;
			var distance = 200;
			var angle = Math.PI * 0.1;
			var penumbra = 0.5;
			var decay = 2;
	
			var light = new THREE.SpotLight( color, intensity, distance, angle, penumbra, decay );
			light.name = 'SpotLight';
			light.target.name = 'SpotLight Target';
	
			light.position.set( 5, 10, 7.5 );
			light.castShadow = true;
			light.shadow.mapSize.width = 512;
			light.shadow.mapSize.width = 512;
			light.shadow.camera.near = 10;
			light.shadow.mapSize.far = 200;
			light.shadow.focus = 1;

			light.userData = {
				target: {
					uuid: 'none',
					position: light.target.position.toArray()
				}
			};

			editor.execute( new AddObjectCommand( editor, light ) );
	
		} else if ( id == 'rect-light' ) {

			var color = 0xffffff;
			var intensity = 1;
			var width = 10;
			var height = 10;
			
			var light = new THREE.RectAreaLight( color, intensity, width, height );
			light.name = 'RectAreaLight';

			light.position.set( 5, 5, 0 );

			editor.execute( new AddObjectCommand( editor, light ) );

		}

	}

	container.add( category );
	container.add( grid );

	return container;

}

export { LibraryToolLight };
