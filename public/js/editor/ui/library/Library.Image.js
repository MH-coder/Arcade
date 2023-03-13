/**
 * @author codelegend620
 */

import { UIAccordion } from '../components/ui.openstudio.js';
import { LibraryImageFolder } from './Library.Image.Folder.js';
import { LibraryImageUnsplash } from './Library.Image.Unsplash.js';
import { LibraryImageKane } from './Library.Image.Kane.js';
import { DeploymentConfig } from './../DeploymentConfig';

function LibraryImage( editor ) {

	var api = editor.api;
	var strings = editor.strings;
	var signals = editor.signals;

	var container = new UIAccordion().setTitle( strings.getKey( 'library/images' ) );
	var folder = new LibraryImageFolder( editor );

	container.addToBody( folder.container );
	container.addToBody( new LibraryImageUnsplash( editor ) );

	api.get( '/asset/image/list' ).then( images => {
		if(!DeploymentConfig.loadLibraryAssets) {
			return;
		}
		container.addToBody( new LibraryImageKane( editor, images.Kane ) );
	} ).catch( err => {
		console.log( err );
	} );

	signals.imageFolderShow.add( function () {

		container.body.setDisplay( '' );
		
	} );

	return container;

}

export { LibraryImage };
