import { UIDiv } from "../components/ui.js";
import { LibraryBaseFolder } from './Library.Base.Folder.js';
import { LibraryBaseFolderPanel } from './Library.Base.Folder.Panel.js';
import { LibraryEnvironmentWrapFolderItem } from './Library.EnvironmentWrap.Folder.Item.js';

function LibraryEnvironmentWrapFolder( editor ) {

	var scope = this;
    var assets = editor.assets;
    var strings = editor.strings;
    var signals = editor.signals;

	LibraryBaseFolder.call( this, editor, { bannerText: strings.getKey( 'library/environment_wraps/folder' ) } );

	assets.environments.map( function ( folder ) {

		var dom = scope.createFolder( editor, folder.id, folder.name );

		folder.items.map( function ( environment ) {

			var item = new LibraryEnvironmentWrapFolderItem( editor, folder.id, environment );
			scope.items.push( item );
			dom.add( item.container );

		} );

	} );

	signals.environmentAssetAdded.add( function ( asset, folderId ) {

		var item = new LibraryEnvironmentWrapFolderItem( editor, folderId, asset );
		scope.items.push( item );

		var folder = scope.folders.find(x => x.id == folderId);
		folder.add( item.container );

	} );

	signals.moveAsset.add( function ( assetType, assetId, from, to, altKey ) {

		if ( assetType == 'Environment' && from != to ) {

			if ( altKey ) {

				var asset = editor.assets.get( assetType, 'id', assetId );
				var assetItem = scope.items.find( x => x.asset.id == assetId );

				assetItem.setLoading( true );

				api.post( '/asset/my-environment/add', { id: asset.environmentId, projectId: editor.projectId } ).then( function ( environment ) {

					editor.addAsset( 'Environment', to, environment ).then( function ( asset ) {

						assetItem.setLoading( false );
						signals.environmentAssetAdded.dispatch( asset, to );

					} );

				} ).catch( (err) => {

					alert( err );

				} );

			} else {

				editor.api.post( `/asset/my-environment/update/${assetId}`, { folderId: to } ).then( function () {

					editor.assets.move( assetType, assetId, from, to );

					var item = scope.items.find( x => x.asset.id == assetId );
					var index = scope.items.indexOf( item );
					item.container.delete();
					scope.items.splice( index, 1 );

					var asset = editor.assets.get( assetType, 'id', assetId );
					var newItem = new LibraryEnvironmentWrapFolderItem( editor, to, asset );
					scope.items.push( newItem );
					scope.folders.find( x => x.id == to ).add( newItem.container );

				} );

			}

		}

	} );

	return this;

}

LibraryEnvironmentWrapFolder.prototype = Object.create( LibraryBaseFolder.prototype );
LibraryEnvironmentWrapFolder.prototype.constructor = LibraryEnvironmentWrapFolder;

LibraryEnvironmentWrapFolder.prototype = {

	createFolder: function ( editor, id, name ) {

		var folder = new LibraryBaseFolderPanel( editor, 'Environment', id, name );
		var gallery = new UIDiv();
	
		folder.setPanel( gallery );
		this.folders.push( folder )
		this.foldersList.add( folder.container );

		editor.assets.addFolder( 'Environment', id, name );

		return folder;

	},

	createNewFolder: function ( editor ) {

		var scope = this;

		editor.api.post( '/folder/create', { type: 'environment', name: 'Untitled' } ).then( function ( folder ) {

			scope.createFolder( editor, folder.id, folder.name );

		} );

	}

};

export { LibraryEnvironmentWrapFolder };