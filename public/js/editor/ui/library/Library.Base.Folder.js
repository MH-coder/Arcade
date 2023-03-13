import { UIDiv, UIPanel, UIRow } from "../components/ui.js";
import { LibraryComponentBannerButton, LibraryComponentActionButton } from './Library.Component.Buttons.js';

function LibraryBaseFolder( editor, options ) {

	var scope = this;
    var config = editor.config;
    var strings = editor.strings;

    this.buttons = {};
    this.callbacks = {};
    this.folders = [];
    this.items = [];

    this.container = new UIDiv();

	this.panel = new UIPanel();
	this.panel.setClass( 'LibraryPanel' );
    this.panel.setDisplay( 'none' );

    this.actionBar = new UIRow();

	if ( options.buttons ) {

		options.buttons.map( button => {

			scope.buttons[ button ] = new LibraryComponentActionButton(
				strings.getKey( `library/${button}` ),
				config.getImage( `engine-ui/${button}-btn.svg` )
			);
	
			scope.actionBar.add( scope.buttons[ button ] );
	
		} );
		
	}
	
	this.newFolder = new LibraryComponentActionButton( strings.getKey( `library/new_folder` ) );
	this.newFolder.onClick( function () {

		scope.createNewFolder( editor );
		
	} );

	this.actionBar.add( this.newFolder );

	this.foldersList = new UIPanel().setClass( 'AccordionList' );

	this.panel.add( this.actionBar );
	this.panel.add( this.foldersList );

	this.bannerButton = new LibraryComponentBannerButton( editor, this.panel, config.getImage( 'gallery/folder.jpg' ), options.bannerText );

	this.container.add( this.bannerButton );
	this.container.add( this.panel );

    return this;

}

export { LibraryBaseFolder };