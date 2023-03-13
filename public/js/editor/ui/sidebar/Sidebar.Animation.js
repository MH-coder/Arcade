import { UIDiv, UIRow, UIButton, UIText, UISpan, UINumber, UIImage } from '../components/ui.js';
import { UIAccordion } from '../components/ui.openstudio.js';
import * as THREE from '../../libs/three.module.js';

function SidebarAnimation( editor ) {

	var signals = editor.signals;
	var strings = editor.strings;
	var config = editor.config;
	var mixer = editor.mixer;

	var container = new UIAccordion().setTitle( strings.getKey( 'sidebar/animations' ) ).setId( 'animations' );
	container.setDisplay( 'none' );

	var labelRow = new UIRow();
	labelRow.add( new UISpan().setWidth( '80px' ) );
	labelRow.add( new UIText( strings.getKey( 'sidebar/animations/loop' ) ) );
	labelRow.add( new UIText( strings.getKey( 'sidebar/animations/speed' ) ) );
	labelRow.add( new UIText( strings.getKey( 'sidebar/animations/blend' ) ) );

	var animationFuncs = [];
	var animaitionsDiv = new UIDiv();

	container.addToBody( labelRow );
	container.addToBody( animaitionsDiv );

	signals.objectSelected.add( function ( object ) {

		animationFuncs = [];

		if ( object !== null && object.animations.length > 0 ) {

			var animations = object.animations;

			container.setDisplay( '' );
			animaitionsDiv.clear();

			for ( var animation of animations ) {

				animationFuncs.push( ( function ( animation ) {

					var action = mixer.clipAction( animation, object );
					var row = new UIRow();

					var animationNameSpan = new UISpan().setClass( 'AnimationName' );
					var animationPlay = new UIImage( config.getImage( 'engine-ui/play-btn.svg' ) ).setClass( 'AnimationPlayButton' );
					animationPlay.onClick( function () {

						animation.playing = true;
						action.paused = false;
						action.play();
						updateAnimationButtons( true );

					} );
					var animationPause = new UIImage( config.getImage( 'engine-ui/pause-btn.svg' ) ).setClass( 'AnimationPauseButton' );
					animationPause.onClick( function () {

						animation.playing = false;
						action.paused = true;
						updateAnimationButtons( false );

					} );
					var animationStop = new UIDiv().setClass( 'StopButton' );
					animationStop.setMargin( '0px 6px' );
					animationStop.onClick( function () {

						animation.playing = false;
						action.paused = false;
						action.stop();
						updateAnimationButtons( false );

					} );
					animationNameSpan.add( animationPlay, animationPause, animationStop );
					animationNameSpan.add( new UIText( animation.name ) );

					var animationLoopSpan = new UISpan();
					var animationLoopForever = new UIImage( config.getImage( 'engine-ui/animation-loop-forever.svg' ) ).setWidth( '18px' );
					animationLoopForever.onClick( function () {

						action.reset();
						action.setLoop( THREE.LoopOnce );
						updateAnimationLoops( true );

					} );
					var animationLoopOnce = new UIImage( config.getImage( 'engine-ui/animation-loop-once.svg' ) ).setWidth( '18px' );
					animationLoopOnce.onClick( function () {

						action.reset();
						action.setLoop( THREE.LoopRepeat, Infinity );
						updateAnimationLoops( false );

					} );
					animationLoopSpan.add( animationLoopForever, animationLoopOnce );

					var animationSpeed = new UINumber( action.timeScale );
					animationSpeed.onChange( function () {

						action.setEffectiveTimeScale( this.getValue() );

					} );

					var animationBlend = new UINumber( action.getEffectiveWeight() );
					animationBlend.onChange( function () {

						action.setEffectiveWeight( this.getValue() );

					} );

					row.add( animationNameSpan, animationLoopSpan, animationSpeed, animationBlend );

					animaitionsDiv.add( row );

					updateAnimationButtons( action.isRunning() );
					updateAnimationLoops( action.loop == THREE.LoopOnce );

					function updateAnimationButtons ( play ) {

						animationPlay.setDisplay( play ? 'none' : '' );
						animationPause.setDisplay( play ? '' : 'none' );

					}

					function updateAnimationLoops ( forever ) {

						animationLoopForever.setDisplay( forever ? 'none' : '' );
						animationLoopOnce.setDisplay( forever ? '' : 'none' );

					}

					var AnimationFunc = function () {

					};

					Object.assign( AnimationFunc.prototype, {

						updateUI: function ( e ) {

							if ( e.action == action ) {

								action.stop();
								updateAnimationButtons( false );

							}

						}

					} );

					return new AnimationFunc();

				} ) ( animation ) );

			}

		} else {

			container.setDisplay( 'none' );

		}

	} );

	signals.objectRemoved.add( function ( object ) {

		if ( object !== null && object.animations.length > 0 ) {

			mixer.uncacheRoot( object );

		}

	} );

	mixer.addEventListener( 'finished', function ( e ) {

		for ( var func of animationFuncs ) {

			func.updateUI( e );

		}

	} );

	return container;

}

export { SidebarAnimation };
