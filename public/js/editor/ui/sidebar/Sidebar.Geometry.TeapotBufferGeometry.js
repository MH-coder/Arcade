import { UIRow, UIText, UIInteger, UINumber } from '../components/ui.js';

import { TeapotBufferGeometry } from '../../core/geometries/TeapotBufferGeometry.js';

function SidebarGeometryTeapotBufferGeometry( signals, object ) {

	var container = new UIDiv();

	var parameters = object.geometry.parameters;

	// size

	var sizeRow = new UIRow();
	var size = new UINumber( parameters.size ).onChange( update );

	sizeRow.add( new UIText( 'Size' ) );
	sizeRow.add( size );

	container.add( sizeRow );

	// segments

	var segmentsRow = new UIRow();
	var segments = new UIInteger( parameters.segments ).setRange( 1, Infinity ).onChange( update );

	segmentsRow.add( new UIText( 'Segments' ) );
	segmentsRow.add( segments );

	container.add( segmentsRow );

	// bottom

	var bottomRow = new UIRow();
	var bottom = new UIStyledCheckbox( parameters.bottom ).setIdFor( 'teapotBufferGeometryBottom' ).onChange( update );

	bottomRow.add( new UIText( 'Bottom' ) );
	bottomRow.add( bottom );

	container.add( bottomRow );

	// lid

	var lidRow = new UIRow();
	var lid = new UIStyledCheckbox( parameters.lid ).setIdFor( 'teapotBufferGeometryLid' ).onChange( update );

	lidRow.add( new UIText( 'Lid' ) );
	lidRow.add( lid );

	container.add( lidRow );

	// body

	var bodyRow = new UIRow();
	var body = new UIStyledCheckbox( parameters.body ).setIdFor( 'teapotBufferGeometryBody' ).onChange( update );

	bodyRow.add( new UIText( 'Body' ) );
	bodyRow.add( body );

	container.add( bodyRow );

	// fitted lid

	var fitLidRow = new UIRow();
	var fitLid = new UIStyledCheckbox( parameters.fitLid ).setIdFor( 'teapotBufferGeometryFitLid' ).onChange( update );

	fitLidRow.add( new UIText( 'Fitted Lid' ) );
	fitLidRow.add( fitLid );

	container.add( fitLidRow );

	// blinn-sized

	var blinnRow = new UIRow();
	var blinn = new UIStyledCheckbox( parameters.blinn ).setIdFor( 'teapotBufferGeometryBlinn' ).onChange( update );

	blinnRow.add( new UIText( 'Blinn-scaled' ) );
	blinnRow.add( blinn );

	container.add( blinnRow );

	function update() {

		object.geometry.dispose();

		object.geometry = new TeapotBufferGeometry(
			size.getValue(),
			segments.getValue(),
			bottom.getValue(),
			lid.getValue(),
			body.getValue(),
			fitLid.getValue(),
			blinn.getValue()
		);

		object.geometry.computeBoundingSphere();

		signals.geometryChanged.dispatch( object );

	}

	return container;

}

export { SidebarGeometryTeapotBufferGeometry };
