/**
 * @author mrdoob / http://mrdoob.com/
 */

import { UIDiv } from '../components/ui.js';

import { SidebarSettingsProject } from './Sidebar.Settings.Project.js';
import { SidebarSettingsWorkspace } from './Sidebar.Settings.Workspace.js';
import { SidebarHistory } from './Sidebar.History.js';
import { SidebarSettingsShortcuts } from './Sidebar.Settings.Shortcuts.js';

var SidebarSettings = function ( editor ) {

	var container = new UIDiv();
	container.setId( "settings-panel" );
	container.addClass( 'AccordionList' );

	container.add( new SidebarSettingsProject( editor ) );
	container.add( new SidebarSettingsWorkspace( editor ) );
	container.add( new SidebarHistory( editor ) );
	container.add( new SidebarSettingsShortcuts( editor ) );
	
	return container;

};

export { SidebarSettings };
