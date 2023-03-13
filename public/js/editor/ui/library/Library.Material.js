/**
 * @author codelegend620
 */

import { UIAccordion } from '../components/ui.openstudio.js';
import { LibraryMaterialFolder } from './Library.Material.Folder.js';
import { LibraryMaterialList } from './Library.Material.List.js';

function LibraryMaterial( editor ) {

	var signals = editor.signals;
	var strings = editor.strings;

	var container = new UIAccordion().setTitle( strings.getKey( 'library/materials' ) );
	var folder = new LibraryMaterialFolder( editor );

	container.addToBody( folder.container );
	container.addToBody( new LibraryMaterialList( editor ) );

	signals.materialFolderShow.add( function () {

		container.body.setDisplay( '' );
		
	} );

	return container;

}

export { LibraryMaterial };
