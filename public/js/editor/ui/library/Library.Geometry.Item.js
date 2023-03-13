import { UILazyImage, UIText } from "../components/ui.js";
import { LibraryBaseItem } from "./Library.Base.Item.js";

function LibraryGeometryItem( editor, item ) {

	LibraryBaseItem.call( this, item );

	var scope = this;
	var api = editor.api;
	var assets = editor.assets;
	var signals = editor.signals;

	scope.container.addClass( 'Geometry' );

	scope.thumbnail = new UILazyImage( item.thumbUrl ).addClass( 'Thumbnail' );
	scope.text = new UIText( item.name );

	scope.container.add( scope.thumbnail, scope.text );

	scope.addedToProjectIcon.addClass( 'GeometryMaterial' );
	scope.addToProjectButton.addClass( 'GeometryMaterial' );

	scope.container.dom.draggable = true;
	scope.container.dom.addEventListener( 'dragstart', function ( e ) {
		var asset = editor.assets.get( 'Geometry', 'geometryId', item.id );
		e.dataTransfer.setData( 'assetType', 'Geometry');
		var assetId;
		if (typeof asset == "undefined") {
			assetId = item.id;
			e.dataTransfer.setData('assetType', 'Geometry');
		} else {
			assetId = asset.id;
		}
		e.dataTransfer.setData( 'assetId', assetId );
	}, false );
	scope.container.dom.addEventListener( 'dragend', function ( e ) {

		var asset = editor.assets.get( 'Geometry', 'geometryId', item.id );

		if (typeof asset == 'undefined') {

			scope.setLoading( true );

			setTimeout(() => {
				
				var asset = editor.assets.get( 'Geometry', 'geometryId', item.id );

				if ( typeof asset != 'undefined' ) {

					scope.setLoading( false );

					scope.updateAddButton( true );

				} else {
					console.log('not fine');
				}

				scope.setLoading( false );

			}, 3500);
		}
	}, false );

	scope.container.onClick( function ( e ) {

		if ( !scope.status ) {

			scope.setLoading( true );

			api.post( '/asset/my-geometry/add', { id: item.id, projectId: editor.projectId, folderId: 0 } ).then( function ( geometry ) {

				editor.addAsset( 'Geometry', 0, geometry ).then( function ( asset ) {

					scope.setLoading( false );
					scope.updateAddButton( true );

					signals.geometryAssetAdded.dispatch( asset, 0 );

					if ( !e.shiftKey ) asset.render();

				} );

			} ).catch( (err) => {

				alert( err );
				scope.setLoading( false );

			} );

		} else {

			var asset = editor.assets.get( 'Geometry', 'geometryId', item.id );
			console.log("ELSE===", asset);
			asset.render();

		}

	} );
	scope.updateAddButton( assets.get( 'Geometry', 'geometryId', item.id ) != null );

	return this;

}

LibraryGeometryItem.prototype = Object.create( LibraryBaseItem.prototype );
LibraryGeometryItem.prototype.constructor = LibraryGeometryItem;

export { LibraryGeometryItem };