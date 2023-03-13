import { UIDiv } from "../components/ui.js";
import { LibraryEnvironmentWrapItem } from "./Library.EnvironmentWrap.Item.js";
import { DeploymentConfig } from './../DeploymentConfig';

function LibraryEnvironmentWrapList( editor ) {

	var api = editor.api;
	var signals = editor.signals;
	var assets = editor.assets;

	var container = new UIDiv();
	var items = [];

	api.get( '/asset/environment/list' ).then( environments => {
		if(!DeploymentConfig.loadLibraryAssets) {
			return;
		}
		Object.values(environments).map( environment => {
			const item = new LibraryEnvironmentWrapItem( editor, environment );
			items.push( item );
			container.add( item.container );

		} );

	} ).catch( err => {

		console.log( err );

	} );

	signals.assetRemoved.add( function ( type, environmentId ) {

		if ( type == 'Environment' ) {

			var item = items.find( x => x.item.id == environmentId );

			if ( item ) {

				var asset = assets.get( type, 'environmentId', environmentId);

				if ( !asset ) item.updateAddButton( false );

			}

		}

	} );

	return container;
}

export { LibraryEnvironmentWrapList };
