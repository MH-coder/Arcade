import { UIDiv, UIPanel } from "../components/ui.js";
import { UIGrid, UIAccordion } from "../components/ui.openstudio.js";
import { LibraryComponentBannerButton } from './Library.Component.Buttons.js';
import { LibraryGeometryItem } from "./Library.Geometry.Item.js";

function LibraryGeometryTheBaseMesh( editor, json ) {

    var config = editor.config;
    var strings = editor.strings;
    var signals = editor.signals;
    var assets = editor.assets;

	var container = new UIDiv();

	var panel = new UIPanel();
	panel.addClass( 'AccordionList' );
	panel.setClass( 'LibraryPanel' );
	panel.setDisplay( 'none' );

	var items = [];

	function buildTheBaseMesh( json, container ) {

		var accordionChildren = {};
		var gridChildren = {};

		for ( var name in json.children ) {

			json.children[ name ].children ? accordionChildren[ name ] = json.children[ name ] : gridChildren[ name ] = json.children[ name ];
			
		}

		for ( var name in accordionChildren ) {

			var accordion = new UIAccordion().setTitle( name );
			accordion.oneOpen = false;

			container.add( accordion );

			buildTheBaseMesh( accordionChildren[ name ], accordion.body );
		}

		if ( Object.keys( gridChildren ).length > 0 ) {

			var grid = new UIGrid();

			for ( var name in gridChildren ) {

				var item =  new LibraryGeometryItem( editor, {
					id: gridChildren[ name ].id,
					name: name,
					thumbUrl: gridChildren[ name ].thumbUrl
				} );
				items.push( item );
				grid.add( item.container );
				
			}

			container.add( grid );
			
		}
		
	}

	buildTheBaseMesh( json, panel );

	container.add( new LibraryComponentBannerButton( editor, panel, json.thumbUrl, strings.getKey( 'library/geometry/theBaseMesh' ) ) );
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

export { LibraryGeometryTheBaseMesh };
