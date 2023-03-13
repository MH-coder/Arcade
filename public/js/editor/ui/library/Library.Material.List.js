/**
 * @author codelegend620
 */

import { UIDiv, UIPanel } from '../components/ui.js';
import { UIGrid } from '../components/ui.openstudio.js';
import { LibraryComponentBannerButton } from './Library.Component.Buttons.js';
import { LibraryMaterialItem } from './Library.Material.Item.js';
import { DeploymentConfig } from './../DeploymentConfig';

function LibraryMaterialList( editor ) {

	var api = editor.api;
	var signals = editor.signals;
	var assets = editor.assets;

	var items = [];
	var container = new UIDiv();

	api.get( '/asset/material/list' ).then( materials => {
		if(!DeploymentConfig.loadLibraryAssets) {
			return;
		}
		for ( var type in materials ) {

			( function ( type, thumbnail, children ) {

				var panel = new UIPanel();
				panel.setClass( 'LibraryPanel' );
				panel.setDisplay( 'none' );

				var grid = new UIGrid();

				for ( var name in children ) {

					var item = new LibraryMaterialItem( editor, {
						id: children[ name ].id,
						name: name,
						thumbUrl: children[ name ].thumbUrl
					} );
					items.push( item );
					grid.add( item.container );

				}

				panel.add( grid );

				container.add( new LibraryComponentBannerButton( editor, panel, thumbnail, type ) );
				container.add( panel );

			} )( type, materials[ type ].thumbUrl, materials[ type ].children );
			
		}
		
	} ).catch( err => {

		console.log( err );

	} );

	signals.assetRemoved.add( function ( type, materialId ) {

		if ( type == 'Material' ) {

			var item = items.find( x => x.item.id == materialId );

			if ( item ) {

				var asset = assets.get( type, 'materialId', materialId );

				if ( !asset ) item.updateAddButton( false );

			}

		}

	} );

	return container;

}

export { LibraryMaterialList };
