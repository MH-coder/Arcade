import { UIDiv, UIPanel } from "../components/ui.js";
import { UIAccordion } from "../components/ui.openstudio.js";
import { LibraryComponentBannerButton } from './Library.Component.Buttons.js';
import { LibraryAudioItem } from './Library.Audio.Item.js';

function LibraryAudio99Sounds( editor, json ) {

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

	function build99Sounds( json, container ) {

		var accordionChildren = {};
		var gridChildren = {};

		for ( var name in json.children ) {

			json.children[ name ].children ? accordionChildren[ name ] = json.children[ name ] : gridChildren[ name ] = json.children[ name ];
			
		}

		for ( var name in accordionChildren ) {

			var accordion = new UIAccordion().setTitle( name );
			accordion.oneOpen = false;

			container.add( accordion );

			build99Sounds( accordionChildren[ name ], accordion.body );
		}

		if ( Object.keys( gridChildren ).length > 0 ) {

			var audioList = new UIDiv().setClass( 'AudioList' );

			for ( var name in gridChildren ) {

				var item = new LibraryAudioItem( editor, {
					id: gridChildren[ name ].id,
					name: name,
					duration: gridChildren[ name ].duration,
					url: gridChildren[ name ].url
				} );
				items.push( item );
				audioList.add( item.container );
				
			}

			container.add( audioList );
			
		}
		
	}

	build99Sounds( json, panel );

    container.add( new LibraryComponentBannerButton( editor, panel, config.getImage( 'gallery/audio/99sounds.png' ), strings.getKey( 'library/audio/99sounds' ) ) );
    container.add( panel );

	signals.assetRemoved.add( function ( type, audioId ) {

		if ( type == 'Audio' ) {

			var item = items.find( x => x.item.id == audioId );

			if ( item ) {

				var asset = assets.get( type, 'audioId', audioId );

				if ( !asset ) item.updateAddButton( false );

			}

		}

	} );

    return container;
}

export { LibraryAudio99Sounds };