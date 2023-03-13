import { UIMyLazyVideo } from "../components/ui.js";
import { LibraryBaseFolderItem } from "./Library.Base.Folder.Item.js";

function LibraryVideoFolderItem( editor, folderId, asset ) {

	LibraryBaseFolderItem.call( this, folderId, asset );

	var scope = this;
	var api = editor.api;

	scope.container.addClass( 'Video' );

	scope.thumbnail = new UIMyLazyVideo( asset.name, asset.url ).addClass( 'Thumbnail' );

	scope.container.add( scope.thumbnail );

	scope.menu.onDelete( function () {

		scope.setLoading( true );

		api.post( '/asset/my-video/delete', { id: asset.id } ).then( function ( image ) {

			editor.removeAsset( 'Video', asset.id );

			scope.container.delete();

		} ).catch( (err) => {

			alert( err );

		} );

	} );

	scope.menu.onDuplicate( function () {

		api.post( '/asset/my-video/add', { id: asset.videoId, projectId: editor.projectId } ).then( function () {

		} ).catch( (err) => {

			alert( err );

		} );

	} );

	return this;

}

LibraryVideoFolderItem.prototype = Object.create( LibraryBaseFolderItem.prototype );
LibraryVideoFolderItem.prototype.constructor = LibraryVideoFolderItem;

export { LibraryVideoFolderItem };
