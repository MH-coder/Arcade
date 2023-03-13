import { UISpan, UIRow, UIButton, UIText } from '../components/ui.js';
import { UIAccordion } from '../components/ui.openstudio.js';

import { SidebarGeometryModifiers } from './Sidebar.Geometry.Modifiers.js';

import { SidebarGeometryBoxGeometry } from './Sidebar.Geometry.BoxGeometry.js';
import { SidebarGeometryCircleGeometry } from './Sidebar.Geometry.CircleGeometry.js';
import { SidebarGeometryCylinderGeometry } from './Sidebar.Geometry.CylinderGeometry.js';
import { SidebarGeometryDodecahedronGeometry } from './Sidebar.Geometry.DodecahedronGeometry.js';
import { SidebarGeometryExtrudeGeometry } from './Sidebar.Geometry.ExtrudeGeometry.js';
import { SidebarGeometryIcosahedronGeometry } from './Sidebar.Geometry.IcosahedronGeometry.js';
import { SidebarGeometryLatheGeometry } from './Sidebar.Geometry.LatheGeometry.js';
import { SidebarGeometryOctahedronGeometry } from './Sidebar.Geometry.OctahedronGeometry.js';
import { SidebarGeometryPlaneGeometry } from './Sidebar.Geometry.PlaneGeometry.js';
import { SidebarGeometryRingGeometry } from './Sidebar.Geometry.RingGeometry.js';
import { SidebarGeometryShapeGeometry } from './Sidebar.Geometry.ShapeGeometry.js';
import { SidebarGeometrySphereGeometry } from './Sidebar.Geometry.SphereGeometry.js';
import { SidebarGeometryTeapotBufferGeometry } from './Sidebar.Geometry.TeapotBufferGeometry.js';
import { SidebarGeometryTextMesh } from './Sidebar.Geometry.TextMesh.js';
import { SidebarGeometryTetrahedronGeometry } from './Sidebar.Geometry.TetrahedronGeometry.js';
import { SidebarGeometryTorusGeometry } from './Sidebar.Geometry.TorusGeometry.js';
import { SidebarGeometryTorusKnotGeometry } from './Sidebar.Geometry.TorusKnotGeometry.js';
import { SidebarGeometryTubeGeometry } from './Sidebar.Geometry.TubeGeometry.js';

import { VertexNormalsHelper } from '../../core/helpers/VertexNormalsHelper.js';

var geometryUIClasses = {
	'BoxGeometry': SidebarGeometryBoxGeometry,
	'CircleGeometry': SidebarGeometryCircleGeometry,
	'CylinderGeometry': SidebarGeometryCylinderGeometry,
	'DodecahedronGeometry': SidebarGeometryDodecahedronGeometry,
	'ExtrudeGeometry': SidebarGeometryExtrudeGeometry,
	'IcosahedronGeometry': SidebarGeometryIcosahedronGeometry,
	'LatheGeometry': SidebarGeometryLatheGeometry,
	'OctahedronGeometry': SidebarGeometryOctahedronGeometry,
	'PlaneGeometry': SidebarGeometryPlaneGeometry,
	'RingGeometry': SidebarGeometryRingGeometry,
	'ShapeGeometry': SidebarGeometryShapeGeometry,
	'SphereGeometry': SidebarGeometrySphereGeometry,
	'TeapotBufferGeometry': SidebarGeometryTeapotBufferGeometry,
	'TetrahedronGeometry': SidebarGeometryTetrahedronGeometry,
	'TorusGeometry': SidebarGeometryTorusGeometry,
	'TorusKnotGeometry': SidebarGeometryTorusKnotGeometry,
	'TubeGeometry': SidebarGeometryTubeGeometry
};

function SidebarGeometry( editor ) {

	var strings = editor.strings;

	var signals = editor.signals;

	var container = new UIAccordion().setTitle( strings.getKey( 'sidebar/geometry' ) ).setId( 'geometry' );
	container.setDisplay( 'none' );

	var currentGeometryType = null;

	// parameters

	var parameters = new UISpan();
	container.addToBody( parameters );

	// geometry

	// container.add( new SidebarGeometryGeometry( editor ) );

	// buffergeometry

	// container.add( new SidebarGeometryBufferGeometry( editor ) );

	// size

	var geometryBoundingSphereRow = new UIRow();
	var geometryBoundingSphere = new UIText();

	geometryBoundingSphereRow.add( new UIText( strings.getKey( 'sidebar/geometry/bounds' ) ).setWidth( '90px' ) );
	geometryBoundingSphereRow.add( geometryBoundingSphere );

	var object = editor.selected;

	if ( object && object.type !== 'TextMesh' ) {

		container.addToBody( geometryBoundingSphereRow );

		// Helpers

		var helpersRow = new UIRow().setMarginTop( '16px' ).setPaddingLeft( '90px' );
		container.addToBody( helpersRow );

		var vertexNormalsButton = new UIButton( strings.getKey( 'sidebar/geometry/show_vertex_normals' ) );
		vertexNormalsButton.onClick( function () {

			if ( editor.helpers[ object.id ] === undefined ) {

				var helper = new VertexNormalsHelper( object );
				editor.addHelper( object, object, helper );

			} else {

				editor.removeHelper( object );

			}

			signals.sceneGraphChanged.dispatch();

		} );
		helpersRow.add( vertexNormalsButton );

	}

	function build() {

		var object = editor.selected;

		if ( object && object.type != 'Particle' && object.geometry ) {

			var geometry = object.geometry;

			container.setDisplay( 'block' );

			if(object.userData && object.userData.isVoxel){
				container.setDisplay( 'none' );
			}
			//

			if ( object.type === 'TextMesh' ) {

				parameters.clear();
				parameters.add( new SidebarGeometryTextMesh( editor, object ) );

			} else {

				if ( currentGeometryType !== geometry.type ) {
					parameters.clear();

					if ( geometry.type === 'BufferGeometry' || geometry.type === 'Geometry' ) {
						parameters.add( new SidebarGeometryModifiers( editor, object ) );
					} else if(geometry.type) { 
						// Types were renamed from XYZBufferGeometry to XYZGeometry in ThreeJS r125
						var geometryLookupKey = geometry.type.replace(/BufferGeometry$/, 'Geometry');
						if ( geometryUIClasses[ geometryLookupKey ] !== undefined ) {
							parameters.add( new geometryUIClasses[ geometryLookupKey ]( editor, object ) );
						}
					}
					currentGeometryType = geometry.type;

				}

				if ( geometry.boundingSphere === null ) geometry.computeBoundingSphere();

				geometryBoundingSphere.setValue( Math.floor( geometry.boundingSphere.radius * 1000 ) / 1000 );

			}

		} else {

			container.setDisplay( 'none' );

		}

	}

	signals.objectSelected.add( function () {

		currentGeometryType = null;

		build();

	} );

	signals.geometryChanged.add( build );

	return container;

}

export { SidebarGeometry };
