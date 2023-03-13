import { UIDiv, UIImage, UIText } from "../components/ui.js";

function LibraryComponentBannerButton( editor, panel, image, text ) {

	var signals = editor.signals;

	var container = new UIDiv();
	container.setClass( 'SourceButton' );
	container.setMarginBottom( '10px' );
	container.add( new UIImage( image ) );
	container.add( new UIText( text ) );

	container.onClick( function () {

		signals.libraryBackEnabled.dispatch( panel );
		panel.setDisplay( '' );
		window.dispatchEvent( new Event('resize') );

	} );

    return container;

}

function LibraryComponentActionButton( text, icon ) {

	var container = new UIDiv();

	container.add( new UIText( text ) );

	if ( icon )	container.add( new UIImage( icon ).setWidth( '12px' ) );

    return container;

}

function LibraryComponentAddToProjectButton() {

    var container = new UIDiv();
    container.addClass( 'AddToProjectButton' );
	container.add( new UIImage( 'https://arcadestudio-assets.s3.us-east-2.amazonaws.com/engine-ui/heart-unfilled.svg' ).setWidth( '30px' ) );

    return container;

}

function LibraryComponentAddedToProjectIcon() {

    var container = new UIDiv();
    container.addClass( 'AddToProjectButton' );
    container.addClass( 'Fill' );
    container.add( new UIImage( 'https://arcadestudio-assets.s3.us-east-2.amazonaws.com/engine-ui/heart-filled.svg' ).setWidth( '30px' ) );

    return container;

}

export { LibraryComponentBannerButton, LibraryComponentActionButton, LibraryComponentAddToProjectButton, LibraryComponentAddedToProjectIcon };