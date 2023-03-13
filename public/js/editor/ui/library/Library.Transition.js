/**
 * @author codelegend620
 */

import { UIAccordion } from '../components/ui.openstudio.js';

function LibraryTransition( editor ) {

	var config = editor.config;
	var signals = editor.signals;
	var strings = editor.strings;

	var container = new UIAccordion().setTitle( strings.getKey( 'library/transitions' ) );
	return container;

}

export { LibraryTransition };