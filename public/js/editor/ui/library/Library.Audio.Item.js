import { UIDiv, UIImage, UIText } from "../components/ui.js";
import { LibraryBaseItem } from "./Library.Base.Item.js";

function LibraryAudioItem( editor, item ) {

    LibraryBaseItem.call( this, item );

    var scope = this;
	var api = editor.api;
	var config = editor.config;
    var signals = editor.signals;
    var assets = editor.assets;
    var audio = null;

    scope.container.setClass( 'Row' );

    scope.audioName = new UIDiv().setClass( 'AudioName' );
    scope.container.add( scope.audioName );

    scope.loadingSpinner.removeClass( 'w-lightbox-spinner' );
    scope.loadingSpinner.addClass( 'spinner' );
    scope.loadingSpinner.setMarginRight( '15px' );
    scope.loadingSpinner.delete();

    scope.playIcon = new UIDiv();
    scope.playIcon.add( new UIImage( config.getImage( 'engine-ui/play-btn.svg' ) ).setWidth( '9px' ) );
    scope.playIcon.setMarginRight( '15px' );
    scope.playIcon.onClick( function ( e ) {

		e.preventDefault();
        e.stopPropagation();

        audio = new Audio( item.url );
        audio.addEventListener( 'canplaythrough', function () {

            audio.play();

        } );
        audio.addEventListener( 'ended', function () {

            scope.updateButtons( false );

        } );

        scope.updateButtons( true );

		signals.audioPlay.dispatch( audio, scope.updateButtons );

    } );

    scope.stopIcon = new UIDiv();
    scope.stopIcon.setClass( 'StopButton' );
    scope.stopIcon.setMarginRight( '15px' );
    scope.stopIcon.onClick( function ( e ) {

		e.preventDefault();
        e.stopPropagation();

        audio.pause();

        scope.updateButtons( false );

        signals.audioStop.dispatch( audio, scope.updateButtons );

    } );

    scope.updateButtons = function ( play ) {

        scope.playIcon.setDisplay( play ? 'none' : '' );
        scope.stopIcon.setDisplay( play ? '' : 'none' );

    };

    scope.audioName.add( scope.loadingSpinner );
    scope.audioName.add( scope.playIcon );
    scope.audioName.add( scope.stopIcon );
    scope.audioName.add( new UIText( item.name ) );

    scope.audioDuration = new UIText( UtilsHelper.getDurationString( item.duration ) ).setClass( 'Duration' );
 
	scope.addedToProjectIcon.addClass( 'Audio' );
    scope.addToProjectButton.addClass( 'Audio' );

    scope.container.add( scope.audioDuration );
    scope.container.onClick( function ( e ) {

        if ( !scope.status ) {

            scope.setLoading( true );

            api.post( '/asset/my-audio/add', { id: item.id, projectId: editor.projectId, folderId: 0 } ).then( function ( audio ) {

                editor.addAsset( 'Audio', 0, audio ).then( function ( asset ) {

                    scope.setLoading( false );
                    scope.updateAddButton( true );

                    signals.audioAssetAdded.dispatch( asset, 0 );

                } );

            } ).catch( (err) => {

                alert( err );
                scope.setLoading( false );

            } );
        }

    } );

    scope.updateAddButton( assets.get( 'Audio', 'audioId', item.id ) != null );

    // if ( assets.get( 'Audio', 'id', item.id ) ) scope.container.addClass( 'Fill' );

    scope.updateButtons( false );

    scope.setLoading = function ( loading ) {

        scope.playIcon.setDisplay( loading ? 'none' : '' );
        scope.stopIcon.setDisplay( 'none' );
		scope.loadingSpinner.setDisplay( loading ? 'flex' : 'none' );

    };

	return this;

}

LibraryAudioItem.prototype = Object.create( LibraryBaseItem.prototype );
LibraryAudioItem.prototype.constructor = LibraryAudioItem;

export { LibraryAudioItem };
