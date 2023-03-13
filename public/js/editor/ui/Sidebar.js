import { UIDiv } from './components/ui.js';

import { SidebarActionBar } from './sidebar/Sidebar.ActionBar.js';
import { SidebarScene } from './sidebar/Sidebar.Scene.js';
import { SidebarSettings } from './sidebar/Sidebar.Settings.js';
import { SidebarPublish } from './sidebar/Sidebar.Publish.js';
import { SidebarPrefab } from './sidebar/Sidebar.Prefab.js';

function Sidebar( editor ) {

	var strings = editor.strings;
	var signals = editor.signals;

	var container = new UIDiv();
	container.setId( 'sidebar' );

	var titleBar = new SidebarActionBar( editor );
	var scene = new SidebarScene( editor );
	var prefab = new SidebarPrefab( editor ).setDisplay( 'none' );
	var settings = new SidebarSettings( editor ).setDisplay( 'none' );
	var publish = new SidebarPublish( editor ).setDisplay( 'none' );
	var logo = new UIDiv().setClass('AppLogo');
	logo.setTextContent( strings.getKey( 'app' ) );
	logo.onClick( function () {

		window.location.href = '/create';				

	} );

	container.add( titleBar, scene, prefab, settings, publish, logo );
	
	signals.sidebarTabChanged.add( function ( tab ) {
		
		scene.setDisplay( tab == 'scene' ? '' : 'none' );
		settings.setDisplay( tab == 'settings' ? '' : 'none' );
		publish.setDisplay( tab == 'publish' ? '' : 'none' );
		prefab.setDisplay( tab == 'prefab' ? '' : 'none' );

	} );

	return container;

}

export { Sidebar };
