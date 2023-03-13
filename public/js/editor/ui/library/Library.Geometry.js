/**
 * @author codelegend620
 */

import { UIAccordion } from '../components/ui.openstudio.js';
import { LibraryGeometryFolder } from './Library.Geometry.Folder.js';
import { LibraryGeometryPrimitives } from './Library.Geometry.Primitives.js';
import { LibraryGeometryFree3D } from './Library.Geometry.Free3D.js';
import { LibraryGeometryTheBaseMesh } from './Library.Geometry.TheBaseMesh.js';

function LibraryGeometry( editor ) {

	var api = editor.api;
	var strings = editor.strings;

	var container = new UIAccordion().setTitle( strings.getKey( 'library/geometry' ) );
	var folder = new LibraryGeometryFolder( editor );
	container.addToBody( folder.container );
	
	api.get( '/asset/geometry/list' ).then( geometries => {
		container.addToBody( new LibraryGeometryPrimitives( editor, geometries.Primitives ) );
		container.addToBody( new LibraryGeometryFree3D( editor, geometries.Free3D ) );
		container.addToBody( new LibraryGeometryTheBaseMesh( editor, geometries.TheBaseMesh ) );

	} ).catch( err => {

		console.log( err );

	} );

	return container;

}

export { LibraryGeometry };
