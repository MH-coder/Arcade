import { UIDiv } from '../components/ui.js';

function LibraryBaseFolderItemMenu() {

	this.container = new UIDiv().setClass( 'FolderItemMenu' );
	this.delete = new UIDiv();
	this.delete.setTextContent( 'Delete' );
	this.duplicate = new UIDiv();
	this.duplicate.setTextContent( 'Duplicate' );

	this.container.add( this.delete );
	this.container.add( this.duplicate );

	return this;

}

LibraryBaseFolderItemMenu.prototype = {

	onDelete: function ( callback ) {

		this.delete.onClick( function ( e ) {

			e.preventDefault();
			e.stopPropagation();

			callback();

		} );

	},

	onDuplicate: function ( callback ) {

		this.duplicate.onClick( function ( e ) {

			e.preventDefault();
			e.stopPropagation();

			callback();

		} );

	}

};

export { LibraryBaseFolderItemMenu }