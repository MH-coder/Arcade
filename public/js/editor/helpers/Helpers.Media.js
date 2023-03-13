/**
 * Utils Helper
 * @author codelegend620
 */

window.MediaHelper = { };

MediaHelper.playAudio = function ( player, params ) {

	var id = params.audioId;

	if ( id ) {

		var media = player.assets.get( 'Audio', 'id', id ).audio;
		media.setLoop( false );
		media.play();
		player.stopAudioOnExit = player.stopAudioOnExit?player.stopAudioOnExit:{};
		player.stopAudioOnExit[id] = media;
	}

};

MediaHelper.pauseAudio = function ( player, params ) {

	var id = params.audioId;

	if ( id ) {

		var media = player.assets.get( 'Audio', 'id', id ).audio;
		media.pause();

	}

};

MediaHelper.stopAudio = function ( player, params ) {

	var id = params.audioId;

	if ( id ) {

		var media = player.assets.get( 'Audio', 'id', id ).audio;
		media.stop();

	}

};

MediaHelper.loopAudio = function ( player, params ) {

	var id = params.audioId;

	if ( id ) {

		var media = player.assets.get( 'Audio', 'id', id ).audio;
		media.setLoop( true );
		media.play();
		player.stopAudioOnExit = player.stopAudioOnExit?player.stopAudioOnExit:{};
		player.stopAudioOnExit[id] = media;

	}

};

MediaHelper.cloneAudio = function ( from ) {

	var context = new AudioContext();
	var buffer = context.createBuffer( from.buffer.numberOfChannels, from.buffer.length, from.buffer.sampleRate );

	for ( var channel = 0, l = Math.min( from.buffer.numberOfChannels, buffer.numberOfChannels ); channel < l; channel ++ ) {

		buffer.getChannelData( channel ).set( from.buffer.getChannelData( channel ), 0 );

	}

	var clone = new THREE.Audio( from.listener );
	clone.setBuffer( buffer );

	return clone;

};

MediaHelper.playVideo = function ( player, params, scene ) {

	var id = params.videoId;

	if ( id ) {

		var texture = player.assets.get( 'Video', 'id', id ).texture;
		texture.image.play();

		if ( params.objectType == 'Scene' ) {

			scene.background = texture;
			scene.environment = null;

		} else if ( params.objectType == 'SpotLight' ) {

			var object = scene.getObjectByProperty( 'uuid', params.objectUuid );

		} else if ( params.map ) {

			var object = scene.getObjectByProperty( 'uuid', params.objectUuid );
			MaterialHelper.setMap( object, UtilsHelper.toCamelCase( params.map ), texture, 0 );

		}

	}

};

MediaHelper.pauseVideo = function ( player, params ) {

	var id = params.videoId;

	if ( id ) {

		var texture = player.assets.get( 'Video', 'id', id ).texture;
		texture.image.pause();

	}

};

MediaHelper.stopVideo = function ( player, params ) {

	var id = params.videoId;

	if ( id ) {

		var texture = player.assets.get( 'Video', 'id', id ).texture;
		texture.image.pause();
		texture.image.currentTime = 0;

	}

};

MediaHelper.loopVideo = function ( player, params, scene ) {

	var id = params.videoId;

	if ( id ) {

		var texture = player.assets.get( 'Video', 'id', id ).texture;
		texture.image.loop = true;
		texture.image.play();

		if ( params.objectType == 'Scene' ) {

			scene.background = texture;
			scene.environment = null;

		} else if ( params.map ) {

			var object = scene.getObjectByProperty( 'uuid', params.objectUuid );
			MaterialHelper.setMap( object, UtilsHelper.toCamelCase( params.map ), texture, 0 );

		}

	}

};

MediaHelper.playAnimation = function ( player, params, scene ) {

	var id = params.animationId;
	const animationAsset = player.assets.get('Animation', 'id', id);
	if (id && animationAsset) {

		var texture = player.assets.get( 'Animation', 'id', id ).texture;
		var animation = texture.animation;

		animation.removeEventListener( 'loopComplete' );
		animation.removeEventListener( 'complete' );
		animation.loop = false;
		if ( ! Number.isNaN( parseInt( params.frameRate ) ) ) {
			animation.setSpeed( params.frameRate / parseInt( animation.frameRate ) );
		}
		animation.setDirection( 1 );
		if ( animation.isPaused && animation.totalFrames - animation.currentFrame <= 1 ) {

			texture.animation.goToAndPlay(0, true);

		} else {

			texture.animation.play();

		}

		if ( params.objectType == 'Scene' ) {

			scene.background = texture;
			scene.environment = null;

		} else if ( params.map ) {

			var object = scene.getObjectByProperty( 'uuid', params.objectUuid );
			MaterialHelper.setMap( object, UtilsHelper.toCamelCase( params.map ), texture, 0 );

		}
		if (params.iterationType === "forever" || params.iterationCount > 1){
			animation.addEventListener("complete", ()=>{
				MediaHelper.playAnimation(player, params, scene);
			})
			params.iterationCount-=1;
		}

	}

};

MediaHelper.pauseAnimation = function ( player, params, scene ) {

	var id = params.animationId;

	if ( id ) {

		var texture = player.assets.get( 'Animation', 'id', id ).texture;
		var animation = texture.animation;

		animation.removeEventListener( 'loopComplete' );
		animation.removeEventListener( 'complete' );
		animation.pause();

		if ( params.objectType == 'Scene' ) {

			scene.background = texture;
			scene.environment = null;

		} else if ( params.objectType == 'SpotLight' ) {



		} else if ( params.map ) {

			var object = scene.getObjectByProperty( 'uuid', params.objectUuid );
			MaterialHelper.setMap( object, UtilsHelper.toCamelCase( params.map ), texture, 0 );

		}

	}

};

MediaHelper.stopAnimation = function ( player, params, scene ) {

	var id = params.animationId;

	if ( id ) {

		var texture = player.assets.get( 'Animation', 'id', id ).texture;
		var animation = texture.animation;

		animation.removeEventListener( 'loopComplete' );
		animation.removeEventListener( 'complete' );
		animation.stop();

		if ( params.objectType == 'Scene' ) {

			scene.background = texture;
			scene.environment = null;

		} else if ( params.map ) {

			var object = scene.getObjectByProperty( 'uuid', params.objectUuid );
			MaterialHelper.setMap( object, UtilsHelper.toCamelCase( params.map ), texture, 0 );

		}

	}

};

MediaHelper.loopAnimation = function ( player, params, scene ) {

	var id = params.animationId;
	const animationAsset = player.assets.get('Animation', 'id', id);
	if (id && animationAsset) {

		var texture = player.assets.get( 'Animation', 'id', id ).texture;
		var animation = texture.animation;

		animation.removeEventListener( 'loopComplete' );
		animation.removeEventListener( 'complete' );
		animation.loop = true;
		if ( ! Number.isNaN( parseInt( params.frameRate ) ) ) {
			animation.setSpeed( params.frameRate / parseInt( animation.frameRate ) );
		}
		animation.setDirection( 1 );
		animation.play();

		if ( params.objectType == 'Scene' ) {

			scene.background = texture;
			scene.environment = null;

		} else if ( params.map ) {

			var object = scene.getObjectByProperty( 'uuid', params.objectUuid );
			MaterialHelper.setMap( object, UtilsHelper.toCamelCase( params.map ), texture, 0 );

		}

	}

};
MediaHelper.loopBackwardsAnimation = function ( player, params, scene ) {

	var id = params.animationId;

	if ( id ) {

		var texture = player.assets.get( 'Animation', 'id', id ).texture;
		var animation = texture.animation;

		animation.removeEventListener( 'loopComplete' );
		animation.removeEventListener( 'complete' );
		animation.loop = true;
		if ( ! Number.isNaN( parseInt( params.frameRate ) ) ) {
			animation.setSpeed( params.frameRate / parseInt( animation.frameRate ) );
		}
		animation.setDirection( -1 );
		animation.play();

		if ( params.objectType == 'Scene' ) {

			scene.background = texture;
			scene.environment = null;

		} else if ( params.map ) {

			var object = scene.getObjectByProperty( 'uuid', params.objectUuid );
			MaterialHelper.setMap( object, UtilsHelper.toCamelCase( params.map ), texture, 0 );

		}

	}

};

MediaHelper.bounceAnimation = function ( player, params, scene ) {

	var id = params.animationId;

	if ( id ) {

		var texture = player.assets.get( 'Animation', 'id', id ).texture;
		var animation = texture.animation;

		var bounce = function () {

			if ( animation.playDirection > 0 ) {
				animation.goToAndStop(animation.totalFrames, true);
			} else {
				animation.stop();
			}
			animation.setDirection( - animation.playDirection);
			animation.play();
		}

		animation.removeEventListener( 'loopComplete' );
		animation.removeEventListener( 'complete' );
		animation.addEventListener('loopComplete', ()=>{
			if (params.iterationType === "forever" || params.iterationCount >1){
				params.iterationCount-=1;
				bounce();
			}else{
				animation.stop();
				animation.loop = false;
			}
		});
		animation.loop = true;
		if ( ! Number.isNaN( parseInt( params.frameRate ) ) ) {
			animation.setSpeed( params.frameRate / parseInt( animation.frameRate ) );
		}
		animation.play();

		if ( params.objectType == 'Scene' ) {

			scene.background = texture;
			scene.environment = null;

		} else if ( params.map ) {

			var object = scene.getObjectByProperty( 'uuid', params.objectUuid );
			MaterialHelper.setMap( object, UtilsHelper.toCamelCase( params.map ), texture, 0 );

		}

	}

};

MediaHelper.playThenStopAnimation = function ( player, params, scene ) {

	var id = params.animationId;

	if ( id ) {

		var texture = player.assets.get( 'Animation', 'id', id ).texture;
		var animation = texture.animation;

		animation.removeEventListener( 'loopComplete' );
		animation.removeEventListener( 'complete' );
		animation.loop = false;
		if ( ! Number.isNaN( parseInt( params.frameRate ) ) ) {
			animation.setSpeed( params.frameRate / parseInt( animation.frameRate ) );
		}
		animation.setDirection( 1 );
		animation.play();
		animation.addEventListener( 'complete', function () {
			animation.stop();
		} );

		if ( params.objectType == 'Scene' ) {

			scene.background = texture;
			scene.environment = null;

		} else if ( params.map ) {

			var object = scene.getObjectByProperty( 'uuid', params.objectUuid );
			MaterialHelper.setMap( object, UtilsHelper.toCamelCase( params.map ), texture, 0 );

		}

	}

};

MediaHelper.playBackwardsAnimation = function ( player, params, scene ) {

	var id = params.animationId;

	if ( id ) {

		var texture = player.assets.get( 'Animation', 'id', id ).texture;
		var animation = texture.animation;

		animation.removeEventListener( 'loopComplete' );
		animation.removeEventListener( 'complete' );
		animation.loop = false;
		if ( ! Number.isNaN( parseInt( params.frameRate ) ) ) {
			animation.setSpeed( params.frameRate / parseInt( animation.frameRate ) );
		}
		animation.setDirection( -1 );
		animation.goToAndPlay(animation.totalFrames, true);

		if ( params.objectType == 'Scene' ) {

			scene.background = texture;
			scene.environment = null;

		} else if ( params.map ) {

			var object = scene.getObjectByProperty( 'uuid', params.objectUuid );
			MaterialHelper.setMap( object, UtilsHelper.toCamelCase( params.map ), texture, 0 );

		}

	}

	if (params.iterationType === "forever" || params.iterationCount > 1){
		animation.addEventListener("complete", ()=>{
			MediaHelper.playBackwardsAnimation(player, params, scene);
		})
		params.iterationCount-=1;
	}

};

MediaHelper.jumpToFrameAnimation = function ( player, params, scene ) {

	var id = params.animationId;

	if ( id ) {

		var texture = player.assets.get( 'Animation', 'id', id ).texture;
		var animation = texture.animation;

		animation.removeEventListener( 'loopComplete' );
		animation.removeEventListener( 'complete' );
		animation.loop = false;

		if (params.jumpToAndPlayOrPause === "and pause"){
			animation.goToAndStop( Math.min( parseInt( params.frame ), animation.totalFrames ), true);
		}else {
			animation.goToAndPlay( Math.min( parseInt( params.frame ), animation.totalFrames ), true);
		}
		

		if ( params.objectType == 'Scene' ) {

			scene.background = texture;
			scene.environment = null;

		} else if ( params.map ) {

			var object = scene.getObjectByProperty( 'uuid', params.objectUuid );
			MaterialHelper.setMap( object, UtilsHelper.toCamelCase( params.map ), texture, 0 );

		}

		if (params.iterationType === "forever" || params.iterationCount > 1){
			animation.addEventListener("complete", ()=>{
				MediaHelper.jumpToFrameAnimation(player, params, scene);
			})
			params.iterationCount-=1;
		}

	}

};

MediaHelper.playWithScrollAnimation = function ( player, params, scene ) {

	player.animationConnects.push( params );

	var id = params.animationId;

	if ( id ) {

		var texture = player.assets.get( 'Animation', 'id', id ).texture;
		var animation = texture.animation;
		animation.setDirection( 1 );

		animation.removeEventListener( 'loopComplete' );
		animation.removeEventListener( 'complete' );
		animation.loop = false;
		animation.stop();

		if ( params.objectType == 'Scene' ) {

			scene.background = texture;
			scene.environment = null;

		} else if ( params.map ) {

			var object = scene.getObjectByProperty( 'uuid', params.objectUuid );
			MaterialHelper.setMap( object, UtilsHelper.toCamelCase( params.map ), texture, 0 );

		}

	}

};
