/**
 * 
 * @author codelegend620
 *
 */

var AnimationControls = function ( mixer, animation, audios ) {

    var scope = this;

    this.mixer = mixer;
    this.animation = animation;
    this.audios = audios;

    mixer.addEventListener( 'loop', function( e ) {

        for ( var audio of scope.audios ) {
        
            audio.play( audio.delayTime );

        }

    } );

    mixer.addEventListener( 'finished', function( e ) {

        scope.animation.stop();

        for ( var audio of scope.audios ) {
        
            audio.stop();

        }

    } );

};

AnimationControls.prototype = {

    constructor: AnimationControls,
    
    play: function ( times, condition ) {

        this.animation.paused = false;

        if ( condition == 'forever' ) {

            this.animation.play();

        } else {

            this.animation.setLoop(THREE.LoopRepeat, times);
            this.animation.play();

        }

        for ( var audio of this.audios ) {
        
            audio.play( audio.delayTime );

        }

    },

    stop: function () {

        this.animation.stop();

        for ( var audio of this.audios ) {
        
            audio.stop();

        }


    },

    pause: function () {

        this.animation.paused = true;

        for ( var audio of this.audios ) {
        
            audio.pause();

        }

    },

    goTo: function ( time, action ) {

        if ( action == 'and play') {

            this.animation.play();
            this.animation.time = time;

            for ( var audio of this.audios ) {
            
                audio.play( audio.delayTime - time );

            }
            
        } else {

            this.animation.play();
            this.animation.time = time;

            for ( var audio of this.audios ) {
            
                audio.play( audio.delayTime - time );
                audio.pause();

            }

            this.pause();
        }

    },

    bounce: function ( times, condition ) {

        this.animation.paused = false;

        if ( condition == 'forever' ) {

            this.animation.play();
            this.animation.setLoop(THREE.LoopPingPong);

        } else {

            this.animation.setLoop(THREE.LoopPingPong, times);
            this.animation.play();

        }

        for ( var audio of this.audios ) {
        
            audio.play( audio.delayTime );

        }

    },

    connect: function ( delta ) {

        this.animation.play();
        this.animation.time = delta;
        this.animation.time = Math.min( this.animation._clip.duration, this.animation.time );
        this.animation.paused = true;

    },

    connectScroll: function ( delta ) {

        this.animation.play();
        this.animation.time += delta;
        this.animation.time = Math.min( this.animation._clip.duration, this.animation.time );
        this.animation.time = Math.max( 0, this.animation.time );
        this.animation.paused = true;

    },

    dispose: function () {

        this.stop();
        cancelAnimationFrame( this.id );

    }

};

export { AnimationControls };
