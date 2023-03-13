import { UIGallery } from "../components/ui.openstudio.js";
import { LibraryBaseFolder } from './Library.Base.Folder.js';
import { LibraryBaseFolderPanel } from './Library.Base.Folder.Panel.js';
import { LibraryImageFolderItem } from './Library.Image.Folder.Item.js';

function LibraryImageFolder( editor ) {

	var scope = this;
	var api = editor.api;
    var assets = editor.assets;
    var strings = editor.strings;
    var signals = editor.signals;
	var loader = editor.loader;

	LibraryBaseFolder.call( this, editor, {
		bannerText: strings.getKey( 'library/images/folder' ),
		buttons: [ 'add' ]
	} );

	scope.buttons[ 'add' ].onClick( function ( e ) {

		UtilsHelper.chooseFile( function ( files ) {

			Promise.all( loader.loadFiles( files, null, 'Image') ).then( function ( results ) {

				var assets = {};
				var items = {};

				for ( var result of results ) {

					var asset = editor.assets.uploadImage( result.texture );
					assets[result.filename] = asset;

					var item = new LibraryImageFolderItem( editor, 0, asset );
					item.setLoading( true );
					items[result.filename] = item;

					scope.items.push( item );
					scope.folders[ 0 ].add( item.container );
					
				}

				var formData = new FormData();
				formData.append( 'type', 'Image' );
				formData.append( 'projectId', editor.projectId );

				for ( let i = 0; i < files.length; i++ ) {
	
					formData.append( 'file', files[i] );
	
				}
	
				api.post( '/asset/my-image/upload', formData ).then( res => {
	
					for ( var file of res.files ) {

						assets[ file.name ].id = file.id;
						assets[ file.name ].imageId = file.imageId;
						items[ file.name ].setLoading( false );
						
					}
	
				} );

			} );

		}, "image/*, .tga" );

	} );

	// scope.buttons[ 'record' ].onClick( function ( e ) {

	// 	console.log( 'record image' );

	// } );
	
	assets.images.map( function ( folder ) {

		var dom = scope.createFolder( editor, folder.id, folder.name );

		folder.items.map( function ( image ) {

			if ( image.id != 'defaultParticleTexture' ) {

				var item = new LibraryImageFolderItem( editor, folder.id, image );
				scope.items.push( item );
				dom.add( item.container );

			}

		} );

	} );

	signals.imageAssetAdded.add( function ( asset, folderId ) {

		var item = new LibraryImageFolderItem( editor, folderId, asset );
		scope.items.push( item );

		var folder = scope.folders.find(x => x.id == folderId);
		folder.add( item.container );

	} );

	signals.imageFolderShow.add( function () {

		signals.libraryBackEnabled.dispatch( panel );
		panel.setDisplay( '' );
		window.dispatchEvent( new Event('resize') );
		
	} );

	signals.moveAsset.add( function ( assetType, assetId, from, to, altKey ) {

		if ( assetType == 'Image' && from != to ) {

			if ( altKey ) {

				var asset = editor.assets.get( assetType, 'id', assetId );
				var assetItem = scope.items.find( x => x.asset.id == assetId );

				assetItem.setLoading( true );

				api.post( '/asset/my-image/add', { id: asset.imageId, projectId: editor.projectId } ).then( function ( image ) {

					editor.addAsset( 'Image', to, image ).then( function ( asset ) {

						assetItem.setLoading( false );
						signals.imageAssetAdded.dispatch( asset, to );

					} );

				} ).catch( (err) => {

					alert( err );

				} );

			} else {

				editor.api.post( `/asset/my-image/update/${assetId}`, { folderId: to } ).then( function () {

					editor.assets.move( assetType, assetId, from, to );

					var item = scope.items.find( x => x.asset.id == assetId );
					var index = scope.items.indexOf( item );
					item.container.delete();
					scope.items.splice( index, 1 );

					var asset = editor.assets.get( assetType, 'id', assetId );
					var newItem = new LibraryImageFolderItem( editor, to, asset );
					scope.items.push( newItem );
					scope.folders.find( x => x.id == to ).add( newItem.container );

				} );

			}

		}

	} );

	return this;

}

LibraryImageFolder.prototype = Object.create( LibraryBaseFolder.prototype );
LibraryImageFolder.prototype.constructor = LibraryImageFolder;

LibraryImageFolder.prototype = {

	createFolder: function ( editor, id, name ) {

		var folder = new LibraryBaseFolderPanel( editor, 'Image', id, name );
		var gallery = new UIGallery();
		gallery.addClass( 'ImageVideoGallery' );
		
		folder.setPanel( gallery );
		this.folders.push( folder )
		this.foldersList.add( folder.container );

		editor.assets.addFolder( 'Image', id, name );

		return folder;

	},

	createNewFolder: function ( editor ) {

		var scope = this;

		editor.api.post( '/folder/create', { type: 'image', name: 'Untitled' } ).then( function ( folder ) {

			scope.createFolder( editor, folder.id, folder.name );

		} );

	}

};

export { LibraryImageFolder };