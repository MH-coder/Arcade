import { UIDiv, UIPanel } from "../components/ui.js";
import { UIAccordion, UIGallery } from "../components/ui.openstudio.js";
import { LibraryComponentBannerButton } from './Library.Component.Buttons.js';
import { LibraryImageItem } from "./Library.Image.Item.js";

function LibraryImageKane( editor, json ) {

    var config = editor.config;
    var strings = editor.strings;
    var signals = editor.signals;
    var assets = editor.assets;

	var container = new UIDiv();
	var items = [];
	var panel = new UIPanel();
	panel.addClass( 'AccordionList' );
	panel.addClass( 'LibraryPanel' );
	panel.setDisplay( 'none' );

	function buildKane( json, container ) {

		var accordionChildren = {};
		var gridChildren = {};

		for ( var name in json.children ) {

			json.children[ name ].children ? accordionChildren[ name ] = json.children[ name ] : gridChildren[ name ] = json.children[ name ];
			
		}

		for ( var name in accordionChildren ) {

			var accordion = new UIAccordion().setTitle( name );
			accordion.oneOpen = false;
			accordion.body.setPadding( '15px' );
			accordion.onTitleClick( function () {

				window.dispatchEvent(new Event('resize'));

			} );

			container.add( accordion );

			buildKane( accordionChildren[ name ], accordion.body );
		}

		if ( Object.keys( gridChildren ).length > 0 ) {

			var gallery = new UIGallery();
			container.add( gallery );

			for ( var name in gridChildren ) {

				var item = new LibraryImageItem( editor, {
					id: gridChildren[ name ].id,
					url: gridChildren[ name ].url,
				} );
				items.push( item );
				gallery.addItem( item.container );
				
			}


		}
		
	}

	buildKane( json, panel );

	container.add( new LibraryComponentBannerButton( editor, panel, config.getImage( 'gallery/images/kane-gallery.png' ), strings.getKey( 'library/images/kane' ) ) );
	container.add( panel );

	signals.assetRemoved.add( function ( type, imageId ) {

		if ( type == 'Image' ) {

			var item = items.find( x => x.item.id == imageId );

			if ( item ) {

				var asset = assets.get( 'Image', 'imageId', imageId );

				if ( !asset ) item.updateAddButton( false );

			}

		}

	} );

	return container;
}

export { LibraryImageKane };