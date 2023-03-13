import * as THREE from '../../libs/three.module.js';

import { UIRow, UIText, UIInteger, UINumber, UIDiv } from '../components/ui.js';

import { SetGeometryCommand } from '../../commands/SetGeometryCommand.js';

function SidebarGeometryTorusGeometry( editor, object ) {

	var strings = editor.strings;

	var container = new UIDiv();

	var geometry = object.geometry;
	var parameters = geometry.parameters;

	// radius

	var radiusRow = new UIRow();
	var radius = new UINumber( parameters.radius ).onChange( update );

	radiusRow.add( new UIText( strings.getKey( 'sidebar/geometry/torus_geometry/radius' ) ) );
	radiusRow.add( radius );

	container.add( radiusRow );

	// tube

	var tubeRow = new UIRow();
	var tube = new UINumber( parameters.tube ).onChange( update );

	tubeRow.add( new UIText( strings.getKey( 'sidebar/geometry/torus_geometry/tube' ) ) );
	tubeRow.add( tube );

	container.add( tubeRow );

	// radialSegments

	var radialSegmentsRow = new UIRow();
	var radialSegments = new UIInteger( parameters.radialSegments ).setRange( 1, Infinity ).onChange( update );

	radialSegmentsRow.add( new UIText( strings.getKey( 'sidebar/geometry/torus_geometry/radialsegments' ) ) );
	radialSegmentsRow.add( radialSegments );

	container.add( radialSegmentsRow );

	// tubularSegments

	var tubularSegmentsRow = new UIRow();
	var tubularSegments = new UIInteger( parameters.tubularSegments ).setRange( 1, Infinity ).onChange( update );

	tubularSegmentsRow.add( new UIText( strings.getKey( 'sidebar/geometry/torus_geometry/tubularsegments' ) ) );
	tubularSegmentsRow.add( tubularSegments );

	container.add( tubularSegmentsRow );

	// arc

	var arcRow = new UIRow();
	var arc = new UINumber( parameters.arc * THREE.MathUtils.RAD2DEG ).setStep( 10 ).onChange( update );

	arcRow.add( new UIText( strings.getKey( 'sidebar/geometry/torus_geometry/arc' ) ) );
	arcRow.add( arc );

	container.add( arcRow );


	//

	function update() {

		editor.execute( new SetGeometryCommand( editor, object, new THREE.TorusBufferGeometry(
			radius.getValue(),
			tube.getValue(),
			radialSegments.getValue(),
			tubularSegments.getValue(),
			arc.getValue() * THREE.MathUtils.DEG2RAD
		) ) );

	}

	return container;

}

export { SidebarGeometryTorusGeometry };
