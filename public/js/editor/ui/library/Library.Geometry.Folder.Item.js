import { UILazyImage, UIText } from "../components/ui.js";
import { LibraryBaseFolderItem } from "./Library.Base.Folder.Item.js";

function LibraryGeometryFolderItem( editor, folderId, asset ) {

	LibraryBaseFolderItem.call( this, folderId, asset );

	var scope = this;
	var api = editor.api;
	var signals = editor.signals;

	scope.container.addClass( 'Geometry' );

	scope.thumbnail = new UILazyImage( asset.thumbUrl ).addClass( 'Thumbnail' );
	scope.text = new UIText( asset.name );

	scope.container.add( scope.thumbnail, scope.text );

	scope.menu.onDelete( function () {

		scope.setLoading( true );

		api.post( '/asset/my-geometry/delete', { id: asset.id } ).then( function () {

			editor.removeAsset( 'Geometry', asset.id );

			scope.container.delete();

		} ).catch( (err) => {

			alert( err );

		} );
		
	} );

	scope.menu.onDuplicate( function () {

		scope.setLoading( true );

		api.post( '/asset/my-geometry/add', { id: asset.geometryId, projectId: editor.projectId, folderId } ).then( function ( geometry ) {

			editor.addAsset( 'Geometry', 0, geometry ).then( function ( asset ) {

				scope.setLoading( false );

				signals.geometryAssetAdded.dispatch( asset, folderId );

			} );

		} ).catch( (err) => {

			alert( err );

		} );
		
	} );

	scope.container.onClick( function ( e ) {

		asset.render();

	} );

	signals.geometryAssetDownloading.add( function ( id, downloading ) {

		if ( asset.id == id ) scope.setLoading( downloading );

	} );

	return this;

}

LibraryGeometryFolderItem.prototype = Object.create( LibraryBaseFolderItem.prototype );
LibraryGeometryFolderItem.prototype.constructor = LibraryGeometryFolderItem;

export { LibraryGeometryFolderItem };
