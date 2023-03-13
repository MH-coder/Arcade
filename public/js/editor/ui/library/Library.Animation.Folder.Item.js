import { UILottieBox } from "../components/ui.js";
import { LibraryBaseFolderItem } from './Library.Base.Folder.Item.js';

function LibraryAnimationFolderItem( editor, folderId, asset ) {

	LibraryBaseFolderItem.call( this, folderId, asset );

	var scope = this;
	var api = editor.api;
	var config = editor.config;

	scope.container.addClass( 'LibraryItem' );

	scope.thumbnail = new UILottieBox( asset );

	scope.container.add( scope.thumbnail );

	scope.menu.onDelete( function () {

		scope.setLoading( true );

		api.post( '/asset/my-animation/delete', { id: asset.id } ).then( function ( animation ) {

			editor.removeAsset( 'Animation', asset.id );

			scope.container.delete();

		} ).catch( (err) => {

			alert( err );

		} );

	} );

	scope.menu.onDuplicate( function () {

		scope.setLoading( false );

		api.post( '/asset/my-animation/add', { id: asset.animationId, projectId: editor.projectId, folderId } ).then( function ( animation ) {

			editor.addAsset( 'Animation', 0, animation ).then( function ( asset ) {

				scope.setLoading( false );

				signals.animationAssetAdded.dispatch( asset, folderId );

			} );

		} ).catch( (err) => {

			alert( err );

		} );
		
	} );

	return this;

}

LibraryAnimationFolderItem.prototype = Object.create( LibraryBaseFolderItem.prototype );
LibraryAnimationFolderItem.prototype.constructor = LibraryAnimationFolderItem;

export { LibraryAnimationFolderItem };
