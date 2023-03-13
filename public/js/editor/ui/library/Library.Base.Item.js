import { UIDiv } from '../components/ui.js';
import { LibraryComponentAddedToProjectIcon, LibraryComponentAddToProjectButton } from './Library.Component.Buttons.js';

function LibraryBaseItem( item ) {

	this.item = item;
	this.thumbnail = null;
	this.container = new UIDiv();
	this.container.addClass( 'LibraryItem' );
	this.status = false;

	this.loadingSpinner = new UIDiv().setClass( 'w-lightbox-spinner' );
	this.loadingSpinner.setDisplay( 'none' );

	this.container.add( this.loadingSpinner );

	this.onAddCallback = null;
	this.addedToProjectIcon = new LibraryComponentAddedToProjectIcon();
	this.addToProjectButton = new LibraryComponentAddToProjectButton();

}

LibraryBaseItem.prototype = {

	updateAddButton: function ( added ) {

		this.status = added;

		if ( this.status ) {

			this.addToProjectButton.delete();
			this.container.add( this.addedToProjectIcon );

		} else {

			this.addedToProjectIcon.delete();
			this.container.add( this.addToProjectButton );

		}

	},

	setLoading( loading ) {

		loading ? this.thumbnail.addClass( 'Loading' ) : this.thumbnail.removeClass( 'Loading' );
		this.thumbnail.setVisibility( loading ? 'hidden' : 'visible' );
		this.loadingSpinner.setDisplay( loading ? '' : 'none' );

	}

};

export { LibraryBaseItem }