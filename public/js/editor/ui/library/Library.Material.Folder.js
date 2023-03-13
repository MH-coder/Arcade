import { UIGrid } from "../components/ui.openstudio.js";
import { LibraryBaseFolder } from './Library.Base.Folder.js';
import { LibraryBaseFolderPanel } from './Library.Base.Folder.Panel.js';
import { LibraryMaterialFolderItem } from './Library.Material.Folder.Item.js';

function LibraryMaterialFolder( editor ) {

	var scope = this;
    var assets = editor.assets;
    var strings = editor.strings;
    var signals = editor.signals;

	LibraryBaseFolder.call( this, editor, { bannerText: strings.getKey( 'library/materials/folder' ) } );

	assets.materials.map( function ( folder ) {

		var dom = scope.createFolder( editor, folder.id, folder.name );

		folder.items.map( function ( material ) {

			var item = new LibraryMaterialFolderItem( editor, folder.id, material );
			scope.items.push( item );
			dom.add( item.container );

		} );

	} );

	signals.materialAssetAdded.add( function ( material, folderId ) {

		var item = new LibraryMaterialFolderItem( editor, folderId, material );
		scope.items.push( item );

		var folder = scope.folders.find(x => x.id == folderId);
		folder.add( item.container );

	} );

	signals.materialFolderShow.add( function () {

		signals.libraryBackEnabled.dispatch( panel );
		panel.setDisplay( '' );
		window.dispatchEvent( new Event('resize') );
		
	} );

	signals.moveAsset.add( function ( assetType, assetId, from, to, altKey ) {

		if ( assetType == 'Material' && from != to ) {

			if ( altKey ) {

				var asset = editor.assets.get( assetType, 'id', assetId );
				var assetItem = scope.items.find( x => x.asset.id == assetId );

				assetItem.setLoading( true );

				api.post( '/asset/my-material/add', { id: asset.materialId, projectId: editor.projectId } ).then( function ( material ) {

					editor.addAsset( 'Material', to, material ).then( function ( asset ) {

						assetItem.setLoading( false );
						signals.materialAssetAdded.dispatch( asset, to );

					} );

				} ).catch( (err) => {

					alert( err );

				} );

			} else {

				editor.api.post( `/asset/my-material/update/${assetId}`, { folderId: to } ).then( function () {

					editor.assets.move( assetType, assetId, from, to );

					var item = scope.items.find( x => x.asset.id == assetId );
					var index = scope.items.indexOf( item );
					item.container.delete();
					scope.items.splice( index, 1 );

					var asset = editor.assets.get( assetType, 'id', assetId );
					var newItem = new LibraryMaterialFolderItem( editor, to, asset );
					scope.items.push( newItem );
					scope.folders.find( x => x.id == to ).add( newItem.container );

				} );

			}

		}

	} );

	return this;

}

LibraryMaterialFolder.prototype = Object.create( LibraryBaseFolder.prototype );
LibraryMaterialFolder.prototype.constructor = LibraryMaterialFolder;

LibraryMaterialFolder.prototype = {

	createFolder: function ( editor, id, name ) {

		var folder = new LibraryBaseFolderPanel( editor, 'Material', id, name );
		var grid = new UIGrid().addClass( 'Folder');
	
		folder.setPanel( grid );
		this.folders.push( folder )
		this.foldersList.add( folder.container );

		editor.assets.addFolder( 'Material', id, name );

		return folder;

	},

	createNewFolder: function ( editor ) {

		var scope = this;

		editor.api.post( '/folder/create', { type: 'material', name: 'Untitled' } ).then( function ( folder ) {

			scope.createFolder( editor, folder.id, folder.name );

		} );

	}

};

export { LibraryMaterialFolder };