/**
 * @author codelegend620
 */

import { UIAccordion } from '../components/ui.openstudio.js';
import { LibraryAnimationFolder } from './Library.Animation.Folder.js';
import { LibraryAnimationLottie } from './Library.Animation.Lottie.js';

function LibraryAnimation( editor ) {

	var api = editor.api;
	var strings = editor.strings;

	var container = new UIAccordion().setTitle( strings.getKey( 'library/animations' ) );
	var folder = new LibraryAnimationFolder( editor );
	container.addToBody( folder.container );

	api.get( '/asset/animation/list' ).then( animations => {

		container.addToBody( new LibraryAnimationLottie( editor, animations.Lottie ) );

	} ).catch( err => {

		console.log( err );

	} );

	return container;

}

export { LibraryAnimation };
