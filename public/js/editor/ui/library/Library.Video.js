/**
 * @author codelegend620
 */

import { UIAccordion } from '../components/ui.openstudio.js';
import { LibraryVideoFolder } from './Library.Video.Folder.js';
import { LibraryVideoPixabay } from './Library.Video.Pixabay.js';

function LibraryVideo( editor ) {

	var strings = editor.strings;

	var container = new UIAccordion().setTitle( strings.getKey( 'library/videos' ) );
	var folder = new LibraryVideoFolder( editor );

	container.addToBody( folder.container );
	container.addToBody( new LibraryVideoPixabay( editor ) );

	return container;
}

export { LibraryVideo };
