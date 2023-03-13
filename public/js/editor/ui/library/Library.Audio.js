/**
 * @author codelegend620
 */

import { UIAccordion } from '../components/ui.openstudio.js';
import { LibraryAudioFolder } from './Library.Audio.Folder.js';
import { LibraryAudio99Sounds } from './Library.Audio.99Sounds.js';

function LibraryAudio( editor ) {

	var active = null;
	var callback = null;

	var api = editor.api;
	var strings = editor.strings;
	var signals = editor.signals;

	var container = new UIAccordion().setTitle( strings.getKey( 'library/audio' ) );
	var folder = new LibraryAudioFolder( editor );
	container.addToBody( folder.container );
	
	api.get( '/asset/audio/list' ).then( audios => {

		container.addToBody( new LibraryAudio99Sounds( editor, audios['99sounds'] ) );

	} ).catch( err => {

		console.log( err );

	} );

	signals.audioPlay.add( function ( audio, cb ) {

		if ( active && active != audio ) {

			active instanceof Audio ? active.pause() : active.stop();
			callback( false );

		}

		active = audio;
		callback = cb;
		
	} );

	signals.audioStop.add( function () {

		active = callback = null;

	} );

	return container;

}

export { LibraryAudio };
