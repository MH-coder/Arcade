import { UIDiv, UIPanel } from "../components/ui.js";
import { UIGrid } from "../components/ui.openstudio.js";
import { LibraryComponentBannerButton } from './Library.Component.Buttons.js';
import { LibraryGeometryItem } from "./Library.Geometry.Item.js";

function LibraryGeometryPrimitives( editor, json ) {

    var config = editor.config;
    var strings = editor.strings;
    var signals = editor.signals;
    var assets = editor.assets;

	var container = new UIDiv();

	var panel = new UIPanel();
	panel.setClass( 'LibraryPanel' );
	panel.setDisplay( 'none' );

	var grid = new UIGrid();
	var items = [];

	for ( var name in json.children ) {
		if (name === "lathe" || name === "tube") {
			// Disabling lathe & tube for now - till we cleanup the sidebar controls logic and UI
			continue;
		}
		var item = new LibraryGeometryItem( editor, {
			id: json.children[ name ].id,
			name: name,
			thumbUrl: json.children[ name ].thumbUrl
		} );
		items.push( item );
		grid.add( item.container );
		
	}

	panel.add( grid );

	container.add( new LibraryComponentBannerButton( editor, panel, json.thumbUrl, strings.getKey( 'library/geometry/primitives' ) ) );
	container.add( panel );

	signals.assetRemoved.add( function ( type, geometryId ) {

		if ( type == 'Geometry' ) {

			var item = items.find( x => x.item.id == geometryId );

			if ( item ) {

				var asset = assets.get( type, 'geometryId', geometryId );

				if ( !asset ) item.updateAddButton( false );

			}

		}

	} );

	return container;

}

export { LibraryGeometryPrimitives };