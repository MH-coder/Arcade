import * as THREE from '../../libs/three.module.js';

import { UIRow, UIText, UIInteger, UINumber, UIDiv } from '../components/ui.js';

import { SetGeometryCommand } from '../../commands/SetGeometryCommand.js';

function SidebarGeometryRingGeometry( editor, object ) {

	var strings = editor.strings;

	var container = new UIDiv();

	var geometry = object.geometry;
	var parameters = geometry.parameters;

	// innerRadius

	var innerRadiusRow = new UIRow();
	var innerRadius = new UINumber( parameters.innerRadius ).onChange( update );

	innerRadiusRow.add( new UIText( strings.getKey( 'sidebar/geometry/ring_geometry/innerRadius' ) ) );
	innerRadiusRow.add( innerRadius );

	container.add( innerRadiusRow );

	// outerRadius

	var outerRadiusRow = new UIRow();
	var outerRadius = new UINumber( parameters.outerRadius ).onChange( update );

	outerRadiusRow.add( new UIText( strings.getKey( 'sidebar/geometry/ring_geometry/outerRadius' ) ) );
	outerRadiusRow.add( outerRadius );

	container.add( outerRadiusRow );

	// thetaSegments

	var thetaSegmentsRow = new UIRow();
	var thetaSegments = new UIInteger( parameters.thetaSegments ).setRange( 3, Infinity ).onChange( update );

	thetaSegmentsRow.add( new UIText( strings.getKey( 'sidebar/geometry/ring_geometry/thetaSegments' ) ) );
	thetaSegmentsRow.add( thetaSegments );

	container.add( thetaSegmentsRow );

	// phiSegments

	var phiSegmentsRow = new UIRow();
	var phiSegments = new UIInteger( parameters.phiSegments ).setRange( 3, Infinity ).onChange( update );

	phiSegmentsRow.add( new UIText( strings.getKey( 'sidebar/geometry/ring_geometry/phiSegments' ) ) );
	phiSegmentsRow.add( phiSegments );

	container.add( phiSegmentsRow );

	// thetaStart

	var thetaStartRow = new UIRow();
	var thetaStart = new UINumber( parameters.thetaStart * THREE.MathUtils.RAD2DEG ).setStep( 10 ).onChange( update );

	thetaStartRow.add( new UIText( strings.getKey( 'sidebar/geometry/ring_geometry/thetastart' ) ) );
	thetaStartRow.add( thetaStart );

	container.add( thetaStartRow );

	// thetaLength

	var thetaLengthRow = new UIRow();
	var thetaLength = new UINumber( parameters.thetaLength * THREE.MathUtils.RAD2DEG ).setStep( 10 ).onChange( update );

	thetaLengthRow.add( new UIText( strings.getKey( 'sidebar/geometry/ring_geometry/thetalength' ) ) );
	thetaLengthRow.add( thetaLength );

	container.add( thetaLengthRow );

	//

	function update() {

		editor.execute( new SetGeometryCommand( editor, object, new THREE.RingBufferGeometry(
			innerRadius.getValue(),
			outerRadius.getValue(),
			thetaSegments.getValue(),
			phiSegments.getValue(),
			thetaStart.getValue() * THREE.MathUtils.DEG2RAD,
			thetaLength.getValue() * THREE.MathUtils.DEG2RAD
		) ) );

	}

	return container;

}

export { SidebarGeometryRingGeometry };
