import { UIDiv, UIPanel } from './components/ui.js';

import { Script } from "./Script.js";
import { Library } from "./Library.js";
import { Sidebar } from "./Sidebar.js";
import { Timeline } from "./Timeline.js";

var Workspace = function ( editor ) {

	var config = editor.config;
	var signals = editor.signals;

	var container = new UIPanel();
    container.setId( 'workspace' );
    
    var script = new Script( editor );
    container.add( script );

    var library = new Library( editor );
    container.add( library );

    var sidebar = new Sidebar( editor );
    container.add( sidebar );

    var timeline = new Timeline( editor );
    container.dom.appendChild( timeline );

    signals.updateWorkspace.add( function ( element, open ) {

        var libraryDispaly = library.dom.style.display;
        var sidebarDispaly = sidebar.dom.style.display;
        var timelineDispaly = timeline.style.display;

        if ( element == 'library' ) {

            if ( ! ( open && libraryDispaly == '' ) ) {

                library.setDisplay( libraryDispaly == 'none' ? '' : 'none' );
                libraryDispaly = library.dom.style.display;

            }

        } else if ( element == 'sidebar' ) {

            if ( ! ( open && sidebarDispaly == '' ) ) {

                sidebar.setDisplay( sidebarDispaly == 'none' ? '' : 'none' );
                sidebarDispaly = sidebar.dom.style.display;

            }

        } else if ( element == 'timeline' ) {

            timeline.style.display = ( timelineDispaly == 'none' ? '' : 'none' );
            timelineDispaly = timeline.style.display;

        }

        var bottom = timelineDispaly != 'none' ? '270px' : '10px';
        var scriptRight = ( libraryDispaly != 'none' && sidebarDispaly != 'none' ? '580px' :
                            libraryDispaly != 'none' ? '320px' :
                            sidebarDispaly != 'none' ? '270px' : '10px' );
        var librayRight = ( sidebarDispaly != 'none' ? '270px' : '10px' );
        
        script.setRight( scriptRight );
        script.setBottom( bottom );
        library.setRight( librayRight );
        library.setBottom( bottom );
        sidebar.setBottom( bottom );
        
    } );
    
	return container;

};

export { Workspace };
