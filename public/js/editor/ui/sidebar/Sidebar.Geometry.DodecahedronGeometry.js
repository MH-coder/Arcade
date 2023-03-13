import * as THREE from '../../libs/three.module.js';

import { UIRow, UIText, UIInteger, UINumber, UIDiv } from '../components/ui.js';

import { SetGeometryCommand } from '../../commands/SetGeometryCommand.js';

function SidebarGeometryDodecahedronGeometry( editor, object ) {

	var strings = editor.strings;

	var container = new UIDiv();

	var geometry = object.geometry;
	var parameters = geometry.parameters;

	// radius

	var radiusRow = new UIRow();
	var radius = new UINumber( parameters.radius ).onChange( update );

	radiusRow.add( new UIText( strings.getKey( 'sidebar/geometry/dodecahedron_geometry/radius' ) ) );
	radiusRow.add( radius );

	container.add( radiusRow );

	// detail

	var detailRow = new UIRow();
	var detail = new UIInteger( parameters.detail ).setRange( 0, Infinity ).onChange( update );

	detailRow.add( new UIText( strings.getKey( 'sidebar/geometry/dodecahedron_geometry/detail' ) ) );
	detailRow.add( detail );

	container.add( detailRow );

	//

	function update() {

		editor.execute( new SetGeometryCommand( editor, object, new THREE.DodecahedronBufferGeometry(
			radius.getValue(),
			detail.getValue()
		) ) );

	}

	return container;

}

export { SidebarGeometryDodecahedronGeometry };
