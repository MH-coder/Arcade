import { UIDiv } from '../components/ui.js';
import { LibraryBaseFolderItemMenu } from './Library.Base.Folder.Item.Menu.js';

function LibraryBaseFolderItem( folderId, asset ) {

	var scope = this;

	this.asset = asset;
	this.thumbnail = null;
	this.container = new UIDiv();
	this.container.addClass( 'LibraryItem' );
	this.menu = new LibraryBaseFolderItemMenu();

	this.loadingSpinner = new UIDiv().setClass( 'w-lightbox-spinner' );
	this.loadingSpinner.setDisplay( 'none' );

	this.container.add( this.loadingSpinner );
	this.container.add( this.menu.container );

	this.container.onContextMenu( function ( e ) {

		e.preventDefault();
		e.stopPropagation();

		$( '.FolderItemMenu' ).hide();

		var { top, left } = scope.container.dom.getBoundingClientRect();
		scope.menu.container.setLeft( ( e.clientX - left ) + 'px' );
		scope.menu.container.setTop( ( e.clientY - top ) + 'px' );
		scope.menu.container.setDisplay( 'block' );

		return false;

	} );

	this.container.dom.draggable = true;
	let draggedImage = null;
	this.container.dom.addEventListener( 'dragstart', function ( e ) {

		// here we need to handke 2 cases 
		// case 1 : dragging an image from my images folder / recent 
		// case 2 : dragging a video from my videos folder / recent
		if(this.classList.contains("Image")) {
			draggedImage = document.createElement("div");
			var dragIcon = document.createElement("img");
			dragIcon.src = this.children[2].src;
			dragIcon.style.width = "40px";
			dragIcon.style.height = "40px";
			draggedImage.appendChild(dragIcon);
			draggedImage.style.position = "absolute";
			draggedImage.style.top = "0px";
			draggedImage.style.left= "-1000px";
			document.querySelector('body').appendChild(draggedImage);
			e.dataTransfer.setDragImage(draggedImage,0,0);
		}

		if(this.classList.contains("Video")) {
			let video = this.children[2].children[0];
			draggedImage = document.createElement("div");
			var dragIcon = document.createElement("video");
			dragIcon.src = video.src;
			dragIcon.style.width = "40px";
			dragIcon.style.height = "40px";
			draggedImage.appendChild(dragIcon);
			draggedImage.style.position = "absolute";
			draggedImage.style.top = "0px";
			draggedImage.style.left= "-1000px";
			document.querySelector('body').appendChild(draggedImage);
			e.dataTransfer.setDragImage(draggedImage,0,0);
		}

		e.dataTransfer.effectAllowed = 'all';
		e.dataTransfer.setData( 'assetType', asset.type );
		e.dataTransfer.setData( 'assetId', asset.id );
		e.dataTransfer.setData( 'folderId', folderId );

	}, false );

	this.container.dom.addEventListener( 'dragend', function ( e ) {
		// if draggedImage element is still present remove it 
		if(draggedImage) {
			document.querySelector('body').removeChild(draggedImage);
			draggedImage = null;
		}
	});

}

LibraryBaseFolderItem.prototype = {

	setLoading: function ( loading ) {

		this.thumbnail.setVisibility( loading ? 'hidden' : 'visible' );
		this.loadingSpinner.setDisplay( loading ? '' : 'none' );

	}

};

export { LibraryBaseFolderItem }