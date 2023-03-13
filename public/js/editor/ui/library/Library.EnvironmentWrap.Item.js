import { UILazyImage, UIText } from "../components/ui.js";
import { LibraryBaseItem } from "./Library.Base.Item.js";

function LibraryEnvironmentWrapItem( editor, item ) {

	LibraryBaseItem.call( this, item );

	var scope = this;
	var api = editor.api;
	var assets = editor.assets;
	var signals = editor.signals;

	scope.container.dom.draggable = true;
	scope.container.addClass( 'EnvironmentWrap' );
	scope.container.setMarginBottom( '10px' );

	scope.thumbnail = new UILazyImage( item.thumbUrl ).addClass( 'Thumbnail' );
	scope.text = new UIText( item.name );

	scope.container.add( scope.thumbnail, scope.text );

	scope.addedToProjectIcon.addClass( 'VideoImageEnv' );
	scope.addToProjectButton.addClass( 'VideoImageEnv' );

	
	scope.container.dom.draggable = true;
	scope.container.dom.addEventListener( 'dragstart', function ( e ) {

		var asset = editor.assets.get( 'Environment', 'environmentId', item.id );
		
		e.dataTransfer.setData( 'assetType', 'Environment' );
		e.dataTransfer.setData( 'assetUrl', item.url );

		var assetId;

		if ( typeof asset == "undefined" ) {

			assetId = item.id;

			e.dataTransfer.setData( 'assetType', 'Environment' );

		} else {

			assetId = asset.id;

		}

		e.dataTransfer.setData( 'assetId', assetId );

	}, false);
//TODO: could come up with better solution for this
	scope.container.dom.addEventListener( 'dragend', function ( e ) {

		var asset = editor.assets.get( 'Environment', 'environmentId', item.id );

		if (typeof asset == 'undefined') {

			scope.setLoading( true );

			setTimeout(() => {
				
				var asset = editor.assets.get( 'Environment', 'environmentId', item.id );

				if ( typeof asset != 'undefined' ) {

					scope.setLoading( false );

					scope.updateAddButton( true );

				} else {
					console.log('not fine');
				}

				scope.setLoading( false );

			}, 10000);
		}
	}, false );
 
	scope.container.onClick( function () {

		if ( !scope.status ) {

			scope.setLoading( true );

			api.post( '/asset/my-environment/add', { id: item.id, projectId: editor.projectId, folderId: 0 } ).then( function ( environment ) {

				editor.addAsset( 'Environment', 0, environment ).then( function ( asset ) {

					scope.setLoading( false );
					scope.updateAddButton( true );

					signals.environmentAssetAdded.dispatch( asset, 0 );

				} );

			} ).catch( (err) => {

				alert( err );
				scope.setLoading( false );

			} );

		}

	} );
	scope.updateAddButton( assets.get( 'Environment', 'environmentId', item.id ) != null );

	return this;

}

LibraryEnvironmentWrapItem.prototype = Object.create( LibraryBaseItem.prototype );
LibraryEnvironmentWrapItem.prototype.constructor = LibraryEnvironmentWrapItem;

export { LibraryEnvironmentWrapItem };