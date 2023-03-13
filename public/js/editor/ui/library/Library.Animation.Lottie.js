import { UIDiv, UIPanel } from "../components/ui.js";
import { LibraryAnimationItem } from './Library.Animation.Item.js';
import { LibraryComponentBannerButton } from './Library.Component.Buttons.js';
import {UIAccordion, UIGrid} from "../components/ui.openstudio";
import {LibraryGeometryItem} from "./Library.Geometry.Item";

function LibraryAnimationLottie( editor, json ) {

    var config = editor.config;
    var strings = editor.strings;
    var signals = editor.signals;
    var assets = editor.assets;

	var container = new UIDiv();
	var items = [];
	var panel = new UIPanel();
	panel.addClass( 'LibraryPanel' );
	panel.setDisplay( 'none' );

	function buildLottie( json, container ) {

		var accordionChildren = {};
		var gridChildren = {};

		for ( var name in json.children ) {

			json.children[ name ].children ? accordionChildren[ name ] = json.children[ name ] : gridChildren[ name ] = json.children[ name ];

		}

		for ( var name in accordionChildren ) {

			var accordion = new UIAccordion().setTitle( name );
			accordion.oneOpen = false;

			container.add( accordion );

			buildLottie( accordionChildren[ name ], accordion.body );
		}

		if ( Object.keys( gridChildren ).length > 0 ) {

			var subPanel = new UIPanel();
			subPanel.addClass( 'AnimationGallery' );

			for ( var name in gridChildren ) {

				var item = new LibraryAnimationItem( editor,  { name, ...json.children[ name ] } );
				items.push( item );
				subPanel.add( item.container );

			}

			container.add( subPanel );

		}

	}

	buildLottie( json, panel );

	container.add( new LibraryComponentBannerButton( editor, panel, config.getImage( 'gallery/animations/lottie.png' ), strings.getKey( 'library/animations/lottie' ) ) );
	container.add( panel );

	signals.assetRemoved.add( function ( type, animationId ) {

		if ( type == 'Animation' ) {

			var item = items.find( x => x.item.id == animationId );

			if ( item ) {

				var asset = assets.get( type, 'animationId', animationId );

				if ( !asset ) item.updateAddButton( false );

			}
		}

	} );

	return container;
}

export { LibraryAnimationLottie };
