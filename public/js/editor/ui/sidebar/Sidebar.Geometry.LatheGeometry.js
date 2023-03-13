import * as THREE from '../../libs/three.module.js';

import { UIRow, UIText, UIInteger, UINumber, UIDiv } from '../components/ui.js';
import { UIPoints2 } from '../components/ui.three.js';

import { SetGeometryCommand } from '../../commands/SetGeometryCommand.js';

function SidebarGeometryLatheGeometry( editor, object ) {

	var strings = editor.strings;

	var container = new UIDiv();

	var geometry = object.geometry;
	var parameters = geometry.parameters;

	// segments

	var segmentsRow = new UIRow();
	var segments = new UIInteger( parameters.segments ).onChange( update );

	segmentsRow.add( new UIText( strings.getKey( 'sidebar/geometry/lathe_geometry/segments' ) ) );
	segmentsRow.add( segments );

	container.add( segmentsRow );

	// phiStart

	var phiStartRow = new UIRow();
	var phiStart = new UINumber( parameters.phiStart * 180 / Math.PI ).onChange( update );

	phiStartRow.add( new UIText( strings.getKey( 'sidebar/geometry/lathe_geometry/phistart' ) ) );
	phiStartRow.add( phiStart );

	container.add( phiStartRow );

	// phiLength

	var phiLengthRow = new UIRow();
	var phiLength = new UINumber( parameters.phiLength * 180 / Math.PI ).onChange( update );

	phiLengthRow.add( new UIText( strings.getKey( 'sidebar/geometry/lathe_geometry/philength' ) ) );
	phiLengthRow.add( phiLength );

	container.add( phiLengthRow );

	// points
	/*
	var pointsRow = new UIRow();
	pointsRow.add( new UIText( strings.getKey( 'sidebar/geometry/lathe_geometry/points' ) ) );

	var points = new UIPoints2().setValue( parameters.points ).onChange( update );
	pointsRow.add( points );

	container.add( pointsRow );
	*/
	function update() {

		editor.execute( new SetGeometryCommand( editor, object, new THREE.LatheBufferGeometry(
			points.getValue(),
			segments.getValue(),
			phiStart.getValue() / 180 * Math.PI,
			phiLength.getValue() / 180 * Math.PI
		) ) );

	}

	return container;

}

export { SidebarGeometryLatheGeometry };
