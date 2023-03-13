import { UIDiv, UIPanel } from "../components/ui.js";
import { UIGallery } from "../components/ui.openstudio.js";
import { LibraryComponentBannerButton } from './Library.Component.Buttons.js';
import { LibraryComponentSearchBox } from './Library.Component.SearchBox.js';
import { LibraryVideoItem } from "./Library.Video.Item.js";

function LibraryVideoPixabay( editor ) {

    var config = editor.config;
    var strings = editor.strings;
    var signals = editor.signals;

	var container = new UIDiv();

	var panel = new UIPanel();
	panel.addClass( 'LibraryPanel' );
	panel.setDisplay( 'none' );
	
	var serachBox =  new LibraryComponentSearchBox( editor ); 

	var galleryWrapper = new UIDiv().setClass( 'GalleryWrapper' );
	var gallery = new UIGallery( 1 );
	
	galleryWrapper.add( gallery );

	panel.add( serachBox );
	panel.add( galleryWrapper );

	var query = '';
	var pixabayKey = config.getSetting( 'api/pixabay' );

	var infScroll = new InfiniteScroll( galleryWrapper.dom, {
		path: function() {
			return `https://pixabay.com/api/videos/?key=${pixabayKey}&q=${query}&page=${this.pageIndex}`;
		},
		// load response as flat text
		responseType: 'text',
		history: false,
		elementScroll: true
	});

	infScroll.on( 'load', function( response ) {

		var data = JSON.parse( response );
		data.hits.map( hit => {
			var item = new LibraryVideoItem( editor, {
				name: hit.user + "_" + hit.id + "." + hit.videos.tiny.url.match(/.([^.]+)\?/)[1],
				thumbnail: `https://i.vimeocdn.com/video/${hit.picture_id}_295x166.jpg`,
				url: hit.videos.tiny.url
			} );

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

    container.add( new LibraryComponentBannerButton( editor, panel, config.getImage( 'gallery/video/pixabay.png' ), strings.getKey( 'library/videos/pixabay' ) ) );
	container.add( panel );

    return container;

}

export { LibraryVideoPixabay };
