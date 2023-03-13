/**
 * @author codelegend620
 */

import { UIAccordion } from '../components/ui.openstudio.js';
import { LibraryEnvironmentWrapFolder } from './Library.EnvironmentWrap.Folder.js';
import { LibraryEnvironmentWrapList } from './Library.EnvironmentWrap.List.js';

function LibraryEnvironmentWrap( editor ) {

	var strings = editor.strings;

	var container = new UIAccordion().setTitle( strings.getKey( 'library/environment_wraps' ) );
	var folder = new LibraryEnvironmentWrapFolder( editor );

	container.addToBody( folder.container );
	container.addToBody( new LibraryEnvironmentWrapList( editor ) );

	return container;

}

export { LibraryEnvironmentWrap };
