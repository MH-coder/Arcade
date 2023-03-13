import * as THREE from '../../libs/three.module.js';

import { UIRow, UIText, UIInteger, UIButton, UIDiv } from '../components/ui.js';

import { SetGeometryCommand } from '../../commands/SetGeometryCommand.js';

function SidebarGeometryShapeGeometry( editor, object ) {

	var strings = editor.strings;

	var container = new UIDiv();

	var geometry = object.geometry;
	var parameters = geometry.parameters;

	// curveSegments

	var curveSegmentsRow = new UIRow();
	var curveSegments = new UIInteger( parameters.curveSegments || 12 ).onChange( changeShape ).setRange( 1, Infinity );

	curveSegmentsRow.add( new UIText( strings.getKey( 'sidebar/geometry/shape_geometry/curveSegments' ) ) );
	curveSegmentsRow.add( curveSegments );

	container.add( curveSegmentsRow );

	// to extrude
	var button = new UIButton( strings.getKey( 'sidebar/geometry/shape_geometry/extrude' ) ).onClick( toExtrude ).setMarginLeft( '90px' );
	container.add( button );

	//

	function changeShape() {

		editor.execute( new SetGeometryCommand( editor, object, new THREE.ShapeBufferGeometry(
			parameters.shapes,
			curveSegments.getValue()
		) ) );

	}

	function toExtrude() {

		editor.execute( new SetGeometryCommand( editor, object, new THREE.ExtrudeBufferGeometry(
			parameters.shapes, {
				curveSegments: curveSegments.getValue()
			}
		) ) );

	}

	return container;

}

export { SidebarGeometryShapeGeometry };
