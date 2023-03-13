import { UILazyImage, UIText } from "../components/ui.js";
import { LibraryBaseFolderItem } from './Library.Base.Folder.Item.js';

function LibraryEnvironmentWrapFolderItem( editor, folderId, asset ) {

	LibraryBaseFolderItem.call( this, folderId, asset );

	var scope = this;
	var api = editor.api;

	scope.container.addClass( 'EnvironmentWrap' );
	scope.container.setMarginBottom( '10px' );

	scope.thumbnail = new UILazyImage( asset.thumbUrl ).addClass( 'Thumbnail' );
	scope.text = new UIText( asset.name );

	scope.container.add( scope.thumbnail, scope.text );

	scope.menu.onDelete( function () {

		scope.setLoading( true );

		api.post( '/asset/my-environment/delete', { id: asset.id } ).then( function () {

			editor.removeAsset( 'Environment', asset.id );

			scope.container.delete();

		} ).catch( (err) => {

			alert( err );

		} );
		
	} );

	scope.menu.onDuplicate( function () {

		scope.setLoading( true );

		api.post( '/asset/my-environment/add', { id: asset.environmentId, projectId: editor.projectId, folderId } ).then( function ( environment ) {

			editor.addAsset( 'Environment', 0, environment ).then( function ( asset ) {

				scope.setLoading( false );

				signals.environmentAssetAdded.dispatch( asset, folderId );

			} );

		} ).catch( (err) => {

			alert( err );

		} );
		
	} );

	return this;

}

LibraryEnvironmentWrapFolderItem.prototype = Object.create( LibraryBaseFolderItem.prototype );
LibraryEnvironmentWrapFolderItem.prototype.constructor = LibraryEnvironmentWrapFolderItem;

export { LibraryEnvironmentWrapFolderItem };
