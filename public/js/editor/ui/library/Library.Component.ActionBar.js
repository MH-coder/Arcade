import { UIDiv } from '../components/ui.js';

function LibraryComponentActionBar( editor ) {

    var signals = editor.signals;

    var container = new UIDiv();
    container.setClass( 'title-bar' );

    var titleIconBlock = new UIDiv();
    titleIconBlock.setClass( 'icon-link' );

    var currentPanel = null;
    var backIcon = new UIDiv();
    backIcon.setDisplay( 'none' );
    backIcon.setClass( 'back-icon' );
    backIcon.onClick( function () {

        backIcon.setDisplay( 'none' );
        currentPanel.setDisplay( 'none' );

    } );

    titleIconBlock.add( backIcon );

    container.add( titleIconBlock );

	signals.libraryBackEnabled.add( function ( domElement ) {

        backIcon.setDisplay( '' );
        currentPanel = domElement;

    } );

    return container;

}

export { LibraryComponentActionBar };