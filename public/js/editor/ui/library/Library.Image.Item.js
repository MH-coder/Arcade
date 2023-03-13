import { UILazyImage, UIUnsplashImage, UILink } from "../components/ui.js";
import { LibraryBaseItem } from "./Library.Base.Item.js";

function LibraryImageItem( editor, item ) {

	LibraryBaseItem.call( this, item );

	var scope = this;
	var api = editor.api;
	var assets = editor.assets;
	var signals = editor.signals;
	var loader = editor.loader;

	scope.container.addClass( 'Image' );

	scope.thumbnail = new UILazyImage( item.url ).addClass( 'Thumbnail' );
	scope.container.add( scope.thumbnail );

	scope.addedToProjectIcon.addClass( 'VideoImageEnv' );
	scope.addToProjectButton.addClass( 'VideoImageEnv' );

	scope.container.dom.draggable = true;

	let draggedImage = null;
	scope.container.dom.addEventListener( 'dragstart', function ( e ) {
		var asset = editor.assets.get( 'Image', 'imageId', item.id );
		
		e.dataTransfer.setData( 'assetType', 'Image' );
		e.dataTransfer.setData( 'assetUrl', item.url );
		draggedImage = document.createElement("div");

		var dragIcon = document.createElement("img");
		dragIcon.src = scope.thumbnail.dom.src;
		dragIcon.style.width = "40px";
		dragIcon.style.height = "40px";
		draggedImage.appendChild(dragIcon);
		draggedImage.style.position = "absolute";
		draggedImage.style.top = "0px";
		draggedImage.style.left= "-1000px";
		document.querySelector('body').appendChild(draggedImage);

		e.dataTransfer.setDragImage(draggedImage,0,0);

		var assetId;

		if ( typeof asset == "undefined" ) {

			assetId = item.id;

			e.dataTransfer.setData( 'assetType', 'Image' );

		} else {

			assetId = asset.id;

		}

		e.dataTransfer.setData( 'assetId', assetId );

	}, false);

	scope.container.dom.addEventListener( 'dragend', function ( e ) {

		// if draggedImage element is still present remove it 
		if(draggedImage) {
			document.querySelector('body').removeChild(draggedImage);
			draggedImage = null;
		}

		var asset = editor.assets.get( 'Image', 'imageId', item.id );

		if (typeof asset == 'undefined') {

			scope.setLoading( true );

			setTimeout(() => {
				
				var asset = editor.assets.get( 'Image', 'imageId', item.id );

				if ( typeof asset != 'undefined' ) {

					scope.setLoading( false );

					scope.updateAddButton( true );

				} else {
					console.log('not fine');
				}

				scope.setLoading( false );

			}, 5000);
		}
	}, false );

	scope.container.onClick( function () {
		if ( item.id == -1 ) {

			scope.setLoading( true );
			//console.error(item.downloadLocation, item)
			
			if (item.downloadLocation) {
				fetch(item.downloadLocation)
					.catch((err) => {
						console.error(err)
					});
			}

			fetch( item.url )
				.then( res => res.blob() )
				.then( blob => {

					var ext = item.url.match(/fm=([^&]*)&/)[1];
					var file = new File( [ blob ], 'file.' + ext, { type: blob.type } );

					Promise.all( loader.loadFiles( [ file ], null, 'Image' ) ).then( function ( results ) {

						var texture = results[ 0 ].texture;
						var formData = new FormData();
						formData.append( 'type', 'Image' );
						formData.append( 'projectId', editor.projectId );
						formData.append( 'file', file );
	
						api.post( '/asset/my-image/upload', formData ).then( res => {
							
							scope.setLoading( false );

							var asset = assets.uploadImage( texture );
							asset.id = res.files[ 0 ].id;
							asset.imageId = res.files[ 0 ].imageId;

							signals.imageAssetAdded.dispatch( asset, 0 );
							scope.updateAddButton( true );
	
						} );

					} );
					
				});

		} else {

			if ( !scope.status ) {

				scope.setLoading( true );

				api.post( '/asset/my-image/add', { id: item.id, projectId: editor.projectId, folderId: 0 } ).then( function ( image ) {

					editor.addAsset( 'Image', 0, image ).then( function ( asset ) {

						scope.setLoading( false );
						scope.updateAddButton( true );

						signals.imageAssetAdded.dispatch( asset, 0 );

					} );

				} ).catch( (err) => {

					alert( err );
					scope.setLoading( false );

				} );

			}

		}

	} );
	scope.updateAddButton( assets.get( 'Image', 'imageId', item.id ) != null );

	return this;

}

LibraryImageItem.prototype = Object.create( LibraryBaseItem.prototype );
LibraryImageItem.prototype.constructor = LibraryImageItem;

export { LibraryImageItem };