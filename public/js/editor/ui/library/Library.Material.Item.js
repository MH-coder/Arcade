import { UILazyImage, UIText } from "../components/ui.js";
import { LibraryBaseItem } from "./Library.Base.Item.js";

function LibraryMaterialItem( editor, item ) {

	LibraryBaseItem.call( this, item );

	var scope = this;
	var api = editor.api;
	var signals = editor.signals;
	var assets = editor.assets;

	scope.container.addClass( 'Geometry' );

	scope.thumbnail = new UILazyImage( item.thumbUrl ).addClass( 'Thumbnail' );
	scope.text = new UIText( item.name );

	scope.container.add( scope.thumbnail, scope.text );

	scope.addedToProjectIcon.addClass( 'GeometryMaterial' );
	scope.addToProjectButton.addClass( 'GeometryMaterial' );

	scope.container.dom.draggable = true;

	scope.container.dom.addEventListener( 'dragstart', function ( e ) {

		var asset = editor.assets.get( 'Material', 'materialId', item.id );
		
		e.dataTransfer.setData( 'assetType', 'Material' );

		var assetId;

		if ( typeof asset == "undefined" ) {

			assetId = item.id;

			e.dataTransfer.setData( 'assetType', 'Material' );

		} else {

			assetId = asset.id;

		}

		e.dataTransfer.setData( 'assetId', assetId );

	}, false);

	scope.container.dom.addEventListener( 'dragend', function ( e ) {

		var asset = editor.assets.get( 'Material', 'materialId', item.id );

		if (typeof asset == 'undefined') {

			scope.setLoading( true );

			setTimeout(() => {
				
				var asset = editor.assets.get( 'Material', 'materialId', item.id );

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

			api.post( '/asset/my-material/add', { id: item.id, projectId: editor.projectId, folderId: 0 } ).then( function ( material ) {

				editor.addAsset( 'Material', 0, material ).then( function ( asset ) {

					scope.setLoading( false );
					scope.updateAddButton( true );

					signals.materialAssetAdded.dispatch( asset, 0 );

				} );

			} ).catch( (err) => {

				alert( err );
				scope.setLoading( false );

			} );

		}

	} );
	scope.updateAddButton( assets.get( 'Material', 'materialId', item.id ) != null );

	return this;

}

LibraryMaterialItem.prototype = Object.create( LibraryBaseItem.prototype );
LibraryMaterialItem.prototype.constructor = LibraryMaterialItem;

export { LibraryMaterialItem };
