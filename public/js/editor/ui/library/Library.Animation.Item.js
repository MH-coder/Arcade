import { UILottieBox } from '../components/ui.js';
import { LibraryBaseItem } from "./Library.Base.Item.js";

function LibraryAnimationItem( editor, item ) {

	LibraryBaseItem.call( this, item );

	var scope = this;
	var api = editor.api;
	var assets = editor.assets;
	var signals = editor.signals;

	scope.thumbnail = new UILottieBox( item );
	scope.container.add( scope.thumbnail );
	scope.container.onClick( function () {

		if ( !scope.status ) {

			scope.setLoading( true );

			api.post( '/asset/my-animation/add', { id: item.id, projectId: editor.projectId, folderId: 0 } ).then( function ( animation ) {

				editor.addAsset( 'Animation', 0, animation ).then( function ( asset ) {

					scope.setLoading( false );
					scope.updateAddButton( true );

					signals.animationAssetAdded.dispatch( asset, 0 );

				} );

			} ).catch( (err) => {

				alert( err );
				scope.setLoading( false );

			} );

		}

	} );
	scope.updateAddButton( assets.get( 'Animation', 'animationId', item.id ) != null );

	return this;

}

LibraryAnimationItem.prototype = Object.create( LibraryBaseItem.prototype );
LibraryAnimationItem.prototype.constructor = LibraryAnimationItem;

export { LibraryAnimationItem };