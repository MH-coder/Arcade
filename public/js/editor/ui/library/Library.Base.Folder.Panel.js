import { UIAccordion } from "../components/ui.openstudio.js";
import { LibraryBaseFolderItemMenu } from "./Library.Base.Folder.Item.Menu.js";

function LibraryBaseFolderPanel( editor, type, id, name ) {

	var scope = this;

	this.id = id;

	this.container = new UIAccordion();
	this.container.setTitle( name );

	this.menu = new LibraryBaseFolderItemMenu();
	this.menu.duplicate.setDisplay( 'none' );
	this.container.title.add( this.menu.container );

	this.panel = null;

	if ( id != 0) {

		this.container.title.onContextMenu( function ( e ) {

			e.preventDefault();
			e.stopPropagation();

			$( '.FolderItemMenu' ).hide();

			var { top, left } = scope.container.dom.getBoundingClientRect();
			scope.menu.container.setLeft( ( e.clientX - left ) + 'px' );
			scope.menu.container.setTop( ( e.clientY - top ) + 'px' );
			scope.menu.container.setDisplay( 'block' );

			return false;

		} );

		this.container.title.text.onDblClick( function () {

			this.dom.contentEditable = true;
			this.dom.spellcheck = false;
			this.dom.focus();
			document.execCommand( 'selectAll', false, null );

		} );

		this.container.title.text.dom.addEventListener( 'blur', function () {

			this.contentEditable = false;

			editor.api.post( `/folder/update/${id}`, { name: this.textContent });

		} );

		this.container.title.text.dom.addEventListener( 'keydown', function (e) {

			e.stopPropagation();

			if ( e.keyCode == 13 ) {

				e.preventDefault();
				this.contentEditable = false;

			}

		} );

		this.menu.onDelete( function () {

			editor.api.post( `/folder/delete/${id}` ).then( function () {

				scope.container.delete();
				editor.assets.removeFolder( type, id );

			} );

		} );

		this.menu.onDuplicate( function () {

			editor.api.post( `/folder/duplicate/${id}`, { type, name } ).then( function ( folder ) {

				console.log( folder.id );

			} );

		} );
	
	}

	var onDrop = function ( e ) {

		var assetType = event.dataTransfer.getData( 'assetType' );
		var assetId = event.dataTransfer.getData( 'assetId' );
		var folderId = event.dataTransfer.getData( 'folderId' );

		editor.signals.moveAsset.dispatch( assetType, assetId, folderId, scope.id, e.altKey );

	}

	this.container.dom.addEventListener( 'drop', onDrop, false );

    return this;

}

LibraryBaseFolderPanel.prototype = {

	setPanel: function ( panel ) {

		this.panel = panel;
		this.container.addToBody( this.panel );
		
	},

	add: function ( item ) {

		if ( this.panel.addItem ) {

			this.panel.addItem( item );
			
		} else {

			this.panel.add( item );
			
		}

	}
	
}

export { LibraryBaseFolderPanel };