/**
 * @author mrdoob / http://mrdoob.com/
 */

import { UIDiv, UIImage } from '../components/ui.js';

var SidebarActionBar = function ( editor ) {

	var api = editor.api;
	var config = editor.config;
	var signals = editor.signals;

	var iconButtons = {};
	var container = new UIDiv();
	container.setClass( 'title-bar' );
	
	var titleDiv = new UIDiv();
	titleDiv.setClass( 'title-icon-block' );

	var playIcon = new UIDiv();
	playIcon.setClass( 'icon-link play-icon' );
	playIcon.add( new UIImage( config.getImage( 'engine-ui/play-btn.svg' ) ) );
	playIcon.onClick( function () {
		
		signals.startPlayer.dispatch();

	} );

	var title = new UIDiv();
	title.setClass( 'title' );
	title.setTextContent( config.getKey( 'project/name' ) );
	title.onDblClick( function () {

		this.dom.contentEditable = true;
		this.dom.spellcheck = false;
		this.dom.focus();
		document.execCommand( 'selectAll', false, null );

	} );

	title.dom.addEventListener( 'blur', function () {
			
		this.contentEditable = false;
		this.scrollLeft = 0;
		
		var name = this.textContent;

		api.post( '/asset/project/update', { id: editor.projectId, data: { name } }).then( function () {

			signals.titleChanged.dispatch( { id: editor.projectId, name } );

		});

	} );

	title.dom.addEventListener( 'keydown', function (e) {

		e.stopPropagation();

		if ( e.keyCode == 13 ) {

			e.preventDefault();
			this.contentEditable = false;
			
		}

	} );

	titleDiv.add( playIcon, title );

	var menuIcons = new UIDiv();
	menuIcons.setClass( 'menu-icons' );

	var icons = [ 'scene', 'prefab', 'settings', 'publish' ];
	icons.map( icon => {

		var iconButton = new UIDiv();
		iconButton.setClass( 'icon-link' );
		iconButton.add( new UIImage( config.getImage( `engine-ui/${icon}.svg` ) ).setWidth( '16px' ) );
		iconButton.onClick( function () {

			signals.sidebarTabChanged.dispatch( icon );
			updateIconButton( icon );
	
		} );

		menuIcons.add( iconButton );
		iconButtons[ icon ] = iconButton;

	} );

	container.add( titleDiv, menuIcons );

	updateIconButton( 'scene' );

	function updateIconButton( selected ) {

		for ( var id in iconButtons ) {

			iconButtons[id].removeClass( 'selected' );
			
		}

		iconButtons[ selected ].addClass( 'selected' );

	}

	return container;

};

export { SidebarActionBar };
