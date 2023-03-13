import { UIAccordion } from '../components/ui.openstudio.js';
import { LibraryToolWidget } from './Library.Tool.Widget.js';
import { LibraryToolLight } from './Library.Tool.Light.js';
import { LibraryToolCamera } from './Library.Tool.Camera.js';

function LibraryTool( editor ) {

    var config = editor.config;
    var strings = editor.signals;
	var strings = editor.strings;

    var container = new UIAccordion().setTitle( strings.getKey( 'library/tools' ) );

    container.addToBody( new LibraryToolWidget( editor ) );
    container.addToBody( new LibraryToolLight( editor ) );
    container.addToBody( new LibraryToolCamera( editor ) );
    
    return container;

}

export { LibraryTool };