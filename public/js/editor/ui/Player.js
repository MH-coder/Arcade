import { UIPanel } from './components/ui.js';
import { APP } from '../libs/app.js';

function Player( editor ) {

	var assets = editor.assets;
	var signals = editor.signals;

	var container = new UIPanel();
	container.setId( 'player' );
	container.setPosition( 'absolute' );
	container.setDisplay( 'none' );
	container.setWidth('100%');
	container.setHeight('100%');

	//

	var player = new APP.Player( assets );
	container.dom.appendChild( player.dom );

	window.addEventListener( 'resize', function () {

		player.setSize( container.dom.clientWidth, container.dom.clientHeight );

	} );

	signals.startPlayer.add( function () {
		if ( editor.isScripting ) {

			signals.saveScript.dispatch();

		}

		editor.isPlaying = true;
		container.setDisplay( '' );

		var editor_toJSON = editor.toJSON();
		player.load( editor_toJSON );
		player.autostart = editor_toJSON.autostart;
		player.setSize( container.dom.clientWidth, container.dom.clientHeight );
		player.play();

		window.myplayer = player;


		//try to start animation here;

		for(var i in player.actions){
			for(var j in player.actions[i]){
				if(player.autostart && player.autostart[i]){
					if(player.autostart[i][j]){
						player.actions[ i ][ j ].play();
					}
				}
			}
		}

	} );

	signals.stopPlayer.add( function () {

		editor.isPlaying = false;
		container.setDisplay( 'none' );

		player.stop();
		player.dispose();

		if(player.stopAudioOnExit){
			for(var id in player.stopAudioOnExit){
				if(player.stopAudioOnExit[id].isPlaying){
					player.stopAudioOnExit[id].stop();
				}
			}
		}
	} );

	return container;

}

export { Player };
