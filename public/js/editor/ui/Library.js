
import { UIDiv, UIPanel } from './components/ui.js';
import { LibraryComponentActionBar } from './library/Library.Component.ActionBar.js';
import { LibraryProject } from './library/Library.Project.js';
import { LibraryTool } from './library/Library.Tool.js';
import { LibraryGeometry } from './library/Library.Geometry.js';
import { LibraryMaterial } from './library/Library.Material.js';
import { LibraryImage } from './library/Library.Image.js';
import { LibraryAudio } from './library/Library.Audio.js';
import { LibraryVideo } from './library/Library.Video.js';
import { LibraryEnvironmentWrap } from './library/Library.EnvironmentWrap.js';
import { LibraryTransition } from './library/Library.Transition.js';
import { LibraryAnimation } from './library/Library.Animation.js';
import { ExamplesFolder } from './library/Examples/index.ts';

var Library = function ( editor ) {

	var container = new UIPanel();
	container.setId( 'library' );
	
	var actionBar = new LibraryComponentActionBar( editor );
	
	var libraryPanel = new UIPanel();
	libraryPanel.addClass( 'Library' );
	libraryPanel.addClass( 'AccordionList' );
	libraryPanel.add( new LibraryProject( editor ) );
	libraryPanel.add( new LibraryTool( editor ) );
	libraryPanel.add( new LibraryGeometry( editor ) );
	libraryPanel.add( new LibraryMaterial( editor ) );
	libraryPanel.add( new LibraryImage( editor ) );
	libraryPanel.add( new LibraryAudio( editor ) );
	libraryPanel.add( new LibraryVideo( editor ) );
	libraryPanel.add( new LibraryAnimation( editor ) );
	libraryPanel.add( new LibraryEnvironmentWrap( editor ) );
	// libraryPanel.add( new LibraryTransition( editor ) );

	container.add( actionBar );
	container.add( libraryPanel );

	return container;

};

export { Library };
