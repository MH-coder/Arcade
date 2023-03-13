import { UILazyVideo } from "../components/ui.js";
import { LibraryBaseItem } from "./Library.Base.Item.js";

function LibraryVideoItem( editor, item ) {

	LibraryBaseItem.call( this, item );

	var scope = this;
	var api = editor.api;
	var assets = editor.assets;
	var signals = editor.signals;

	scope.container.addClass( 'Video' );

	scope.thumbnail = new UILazyVideo( item.thumbnail, item.url ).addClass( 'Thumbnail' );
	scope.container.add( scope.thumbnail );

	scope.addedToProjectIcon.addClass( 'VideoImageEnv' );
	scope.addToProjectButton.addClass( 'VideoImageEnv' );

	scope.container.onClick( function () {

		scope.setLoading( true );

		fetch( item.url )
			.then( res => res.blob() )
			.then( blob => {

				//var asset = assets.uploadVideo( item.thumbnail, item.url  );

				var modifiedName = item.name.split(".").slice(0, -1).join(".");

				var asset = assets.uploadVideo( item.name, item.url, modifiedName );
				var file = new File( [ blob ], item.name, { type: blob.type } );
				var formData = new FormData();
				formData.append( 'type', 'Video' );
				formData.append( 'projectId', editor.projectId );
				formData.append( 'file', file );

				api.post( '/asset/my-video/upload', formData ).then( res => {

					scope.setLoading( false );

					asset.id = res.files[ 0 ].id;
					asset.videoId = res.files[ 0 ].videoId;

					signals.videoAssetAdded.dispatch( asset, 0 );

				} );

			});

	} );

	let draggedImage = null;

	scope.container.dom.addEventListener( 'dragstart', function ( e ) {
		console.log("video dragged", item);
		draggedImage = document.createElement("div");

		var dragIcon = document.createElement("img");
		dragIcon.src = item.thumbnail;
		dragIcon.style.width = "40px";
		dragIcon.style.height = "40px";
		draggedImage.appendChild(dragIcon);
		draggedImage.style.position = "absolute";
		draggedImage.style.top = "0px";
		draggedImage.style.left= "-1000px";
		document.querySelector('body').appendChild(draggedImage);
		e.dataTransfer.setDragImage(draggedImage,0,0);
	});

	scope.container.dom.addEventListener( 'dragend', function ( e ) {
		// if draggedImage element is still present remove it 
		if(draggedImage) {
			document.querySelector('body').removeChild(draggedImage);
			draggedImage = null;
		}
	});
	scope.updateAddButton( false );

	return this;

}

LibraryVideoItem.prototype = Object.create( LibraryBaseItem.prototype );
LibraryVideoItem.prototype.constructor = LibraryVideoItem;

export { LibraryVideoItem };
