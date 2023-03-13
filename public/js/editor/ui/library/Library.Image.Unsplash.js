import { UIDiv, UILink, UIPanel } from "../components/ui.js";
import { UIGallery } from "../components/ui.openstudio.js";
import { LibraryComponentBannerButton } from './Library.Component.Buttons.js';
import { LibraryComponentSearchBoxUnsplash } from './Library.Component.SearchBoxUnsplash.js';
import { LibraryImageItem } from "./Library.Image.Item.js";

function LibraryImageUnsplash( editor ) {

    var config = editor.config;
    var strings = editor.strings;
	var signals = editor.signals;

	var container = new UIDiv();

	var panel = new UIPanel();
	panel.addClass( 'LibraryPanel' );
	panel.setDisplay( 'none' );

	var serachBox =  new LibraryComponentSearchBoxUnsplash( editor );

	var galleryWrapper = new UIDiv().setClass( 'GalleryWrapper' );
	var gallery = new UIGallery();
	
	galleryWrapper.add( gallery );

	panel.add( serachBox );
	panel.add( galleryWrapper );

	var query = '';
	var unsplashID = config.getSetting( 'api/unsplash' );

	var infScroll = new InfiniteScroll( galleryWrapper.dom, {
		path: function() {
			if ( query ) return `https://api.unsplash.com/search/photos?client_id=${unsplashID}&query=${query}&page=${this.pageIndex}&per_page=20`;
			return `https://api.unsplash.com/photos?client_id=${unsplashID}&page=${this.pageIndex}&per_page=20`;
		},
		// load response as flat text
		responseType: 'text',
		history: false,
		elementScroll: true
	});

	infScroll.on( 'load', function( response ) {
		var res = JSON.parse( response );
		var photos = query ? res.results : res;

		photos.map( photo => {
						
			var clientID = "7uvLOvcJobn4kUszQ-ftApVAtjbt1wvq1oJTgKBlbPc";

			var item = new LibraryImageItem( editor, {
				id: -1,
				url:  photo.urls.regular,
				blurHash: photo.blur_hash,
				width: photo.width,
				height: photo.height,
				downloadLocation: photo.links.download_location + "&client_id=" + clientID 
			});
			
			var portfolioURL = "https://unsplash.com/@" + photo.user.username + "?utm_source=arcade.studio&utm_medium=referral"
			var UIlink = new UILink(photo.user.name, portfolioURL)
			item.container.add(UIlink);

			gallery.addItem( item.container );

		} );
	});
	

	infScroll.loadNextPage();

	serachBox.onKeywordChange( function ( keyword ) {

		if ( query != keyword ) {

			query = keyword;
			gallery.clearItems();
			infScroll.pageIndex = 1;	
			infScroll.loadNextPage();

		}

	} );

    container.add( new LibraryComponentBannerButton( editor, panel, config.getImage( 'gallery/images/unsplash.png' ), strings.getKey( 'library/images/unsplash' ) ) );
	container.add( panel );

	return container;
}

export { LibraryImageUnsplash };