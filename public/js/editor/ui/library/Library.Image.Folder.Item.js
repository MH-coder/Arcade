import { UILazyImage } from "../components/ui.js";
import { LibraryBaseFolderItem } from "./Library.Base.Folder.Item.js";

function LibraryImageFolderItem( editor, folderId, asset ) {

	LibraryBaseFolderItem.call( this, folderId, asset );

	var scope = this;
	var api = editor.api;
	var signals = editor.signals;

	scope.container.addClass( 'Image' );

	scope.thumbnail = new UILazyImage( asset.url ).addClass( 'Thumbnail' );

	scope.container.add( scope.thumbnail );

	scope.menu.onDelete( function () {

		scope.setLoading( true );

		api.post( '/asset/my-image/delete', { id: asset.id } ).then( function ( image ) {

			editor.removeAsset( 'Image', asset.id );

			scope.container.delete();

		} ).catch( (err) => {

			alert( err );

		} );

	} );

	scope.menu.onDuplicate( function () {

		scope.setLoading( true );

		api.post( '/asset/my-image/add', { id: asset.imageId, projectId: editor.projectId, folderId } ).then( function ( image ) {

			editor.addAsset( 'Image', 0, image ).then( function ( asset ) {

				scope.setLoading( false );

				signals.imageAssetAdded.dispatch( asset, folderId );

			} );

		} ).catch( (err) => {

			alert( err );

		} );
		
	} );

	signals.imageAssetDownloading.add( function ( id, downloading ) {

		if ( asset.id == id ) scope.setLoading( downloading );

	} );

	return this;

}

LibraryImageFolderItem.prototype = Object.create( LibraryBaseFolderItem.prototype );
LibraryImageFolderItem.prototype.constructor = LibraryImageFolderItem;

export { LibraryImageFolderItem };
