/**
 * Controller class for the Timeliner GUI.
 *
 * Timeliner GUI library (required to use this class):
 *
 * 		../libs/timeliner_gui.min.js
 *
 * Source code:
 *
 * 		https://github.com/tschw/timeliner_gui
 * 		https://github.com/zz85/timeliner (fork's origin)
 *
 * @author tschw
 *
 */

import * as THREE from "../libs/three.module.js";

var TimelinerControls = function ( editor, scene, timeline ) {

	this._signals = editor.signals;
	this._scene = scene;
	this._timeline = timeline;

	this._init();

};

TimelinerControls.prototype = {

	constructor: TimelinerControls,

	_init: function () {

		this._mixer = new THREE.AnimationMixer( this._scene );
		this._clip = null;
		this._action = null;
	
		this._tracks = {};
		this._propRefs = {};
		this._channelNames = {};
		this._audioData = {};

	},

	init: function () {

		var tracks = [],
			trackInfo = this._timeline.tracks;

		for ( var i = 0, n = trackInfo.length; i !== n; ++ i ) {

			var spec = trackInfo[ i ];

			if ( spec.audio == true) {

				this._addAudio( spec );

			} else {

				tracks.push( this._addTrack( spec.type, spec.label, spec.propertyPath, spec.initialValue, spec.interpolation ) );

			}

		
		}

		this._clip = new THREE.AnimationClip( 'editclip', this._timeline.duration, tracks );
		this._action = this._mixer.clipAction( this._clip ).play();

	},

	reset: function () {

		this._init();
		this.init();
		this.deserialize(this._timeline);
		this.timeliner.updateState();

	},

	addTrack: function ( spec ) {

		this._timeline.tracks.push( spec );

		if ( spec.audio ) {

			this._addAudio( spec );
			this.timeliner.updateState();
			
		} else {

			var tracks = Object.values(this._tracks).filter(x => !(x instanceof THREE.Audio));
			tracks.push( this._addTrack( spec.type, spec.label, spec.propertyPath, spec.initialValue, spec.interpolation ) );
			
			this._mixer = new THREE.AnimationMixer( this._scene );
			this._clip = new THREE.AnimationClip( 'editclip', this._timeline.duration, tracks );
			this._action = this._mixer.clipAction( this._clip ).play();
	
			this._timeline.channels = this.serialize().channels;
			this.timeliner.updateState();

		}

	},

	setDisplayTime: function ( time, playing, seek ) {

		if ( this._action ) {

			this._action.time = time;
			this._mixer.update( 0 );
			
		}

		this.controlAudio( time, playing, seek );
		this._signals.timelineUpdated.dispatch();

	},

	setDuration: function ( duration ) {

		this._clip.duration = duration;
		this._timeline.duration = duration;

		this.timeliner.updateTotalTime( duration );
		this._signals.timelineChanged.dispatch();

	},

	getDuration: function () {

		return this._timeline.duration;

	},

	getChannelNames: function () {

		return this._channelNames;

	},

	getChannelKeyTimes: function ( channelName ) {

		return this._tracks[ channelName ].times;

	},

	getAudioDuration: function ( audioName ) {

		return this._tracks[ audioName ].buffer.duration;

	},

	getAudioOffset: function ( audioName ) {

		return this._tracks[ audioName ].delayTime;

	},

	getAudioData: function ( audioName ) {

		return this._audioData[ audioName ];

	},

	setKeyframe: function ( channelName, time ) {

		var track = this._tracks[ channelName ],
			times = track.times,
			index = Timeliner.binarySearch( times, time ),
			values = track.values,
			stride = track.getValueSize(),
			offset = index * stride;

		if ( index < 0 ) {

			// insert new keyframe

			index = ~ index;
			offset = index * stride;

			var nTimes = times.length + 1,
				nValues = values.length + stride;

			for ( var i = nTimes - 1; i !== index; -- i ) {

				times[ i ] = times[ i - 1 ];

			}

			for ( var i = nValues - 1, e = offset + stride - 1; i !== e; -- i ) {

				values[ i ] = values[ i - stride ];

			}

		}

		times[ index ] = time;
		this._propRefs[ channelName ].getValue( values, offset );

		this._timeline.channels = this.serialize().channels;
		this._signals.timelineChanged.dispatch();

	},

	pasteKeyFrame: function ( channelName, copyTime, pasteTime ) {

		var track = this._tracks[ channelName ],
			times = track.times,
			values = track.values,
			stride = track.getValueSize(),
			pasteIndex = Timeliner.binarySearch( times, pasteTime ),
			pasteOffset = pasteIndex * stride,
			copyIndex = Timeliner.binarySearch( times, copyTime ),
			copyOffset = copyIndex * stride;

		if ( copyIndex >= 0 ) {

			if ( pasteIndex < 0 ) {

				// insert new keyframe
	
				pasteIndex = ~ pasteIndex;
				pasteOffset = pasteIndex * stride;
	
				var nTimes = times.length + 1,
					nValues = values.length + stride;
	
				for ( var i = nTimes - 1; i !== pasteIndex; -- i ) {
	
					times[ i ] = times[ i - 1 ];
	
				}
	
				for ( var i = nValues - 1, e = pasteOffset + stride - 1; i !== e; -- i ) {
	
					values[ i ] = values[ i - stride ];
	
				}
	
			}
	
			times[ pasteIndex ] = pasteTime;

			for ( var i = copyOffset; i < copyOffset + stride; i++ ) {

				values[ pasteOffset + ( i - copyOffset ) ] = values[ i ];

			}

			this._propRefs[ channelName ].setValue( values, pasteOffset );
	
			this._timeline.channels = this.serialize().channels;
			this._signals.timelineChanged.dispatch();

		}

	},

	delKeyframe: function ( channelName, time ) {

		var track = this._tracks[ channelName ],
			times = track.times,
			index = Timeliner.binarySearch( times, time );

		// we disallow to remove the keyframe when it is the last one we have,
		// since the animation system is designed to always produce a defined
		// state

		if ( times.length > 1 && index >= 0 ) {

			var nTimes = times.length - 1,
				values = track.values,
				stride = track.getValueSize(),
				nValues = values.length - stride;

			// note: no track.getValueSize when array sizes are out of sync

			for ( var i = index; i !== nTimes; ++ i ) {

				times[ i ] = times[ i + 1 ];

			}

			times.pop();

			for ( var offset = index * stride; offset !== nValues; ++ offset ) {

				values[ offset ] = values[ offset + stride ];

			}

			values.length = nValues;

		}

		this._timeline.channels = this.serialize().channels;
		this._signals.timelineChanged.dispatch();

	},

	moveKeyframe: function ( channelName, time, delta, moveRemaining ) {

		var track = this._tracks[ channelName ],
			times = track.times,
			index = Timeliner.binarySearch( times, time );

		if ( index >= 0 ) {

			var endAt = moveRemaining ? times.length : index + 1,
				needsSort = times[ index - 1 ] <= time ||
					! moveRemaining && time >= times[ index + 1 ];

			while ( index !== endAt ) times[ index ++ ] += delta;

			if ( needsSort ) this._sort( track );

		}

		this._timeline.channels = this.serialize().channels;
		this._signals.timelineChanged.dispatch();

	},

	delChannel: function ( channelName ) {

		delete this._tracks[ channelName ];
		delete this._channelNames[ channelName ];
		delete this._propRefs[ channelName ];

		var tracks = Object.values(this._tracks).filter(x => !(x instanceof THREE.Audio));
		this._mixer = new THREE.AnimationMixer( this._scene );
		this._clip = new THREE.AnimationClip( 'editclip', this._timeline.duration, tracks );
		this._action = this._mixer.clipAction( this._clip ).play();

		var trackInfo = this._timeline.tracks.find(t => t.id == channelName || t.propertyPath == channelName);
		var index = this._timeline.tracks.indexOf(trackInfo);
		this._timeline.tracks.splice(index, 1);
		this._timeline.channels = this.serialize().channels;

		this.timeliner.updateState();
		this._signals.timelineChanged.dispatch();

	},

	moveAudio: function ( channelName, time ) {

		var id = channelName.split( '_' )[ 0 ];

		this._tracks[ channelName ].delayTime = time;
		this._timeline.tracks.find(x => x.id == id).delayTime = time;		
		this._signals.timelineChanged.dispatch();

	},

	controlAudio: function ( t, playing, seek ) {

		for ( var key in this._tracks ) {

			if ( this._tracks[key] instanceof THREE.Audio ) {

				var audio = this._tracks[key];

				if ( seek && t >= audio.delayTime ) {

					audio.stop();
					audio.offset = t - audio.delayTime;
					audio.status = 'stopped';

				}

				if ( t == 0 ) {

					audio.stop();
					audio.offset = 0;
					audio.status = 'stopped';

				}

				if ( t >= audio.delayTime && playing && audio.status != 'playing' ) {

					audio.play();
					audio.status = 'playing';

				}

			}
		}

	},
	
	pauseAudio: function () {

		for ( var key in this._tracks ) {

			if ( this._tracks[key] instanceof THREE.Audio ) {

				this._tracks[key].pause();
				this._tracks[key].status = 'paused';

			}
		}

	},

	togglePlay: function () {

		this.timeliner.togglePlay();
		
	},

	updateObject: function ( object ) {

		var selected = this.timeliner.getSelectedKeyframe();
		
		if ( selected ) {

			var track = this._tracks[ selected.channelName ],
				times = track.times,
				index = Timeliner.binarySearch( times, selected.time ),
				values = track.values,
				stride = track.getValueSize(),
				offset = index * stride;

			this._propRefs[ selected.channelName ].getValue( values, offset );

			this._timeline.channels = this.serialize().channels;
			this._signals.timelineChanged.dispatch();
			
		}

	},

	serialize: function () {

		var result = {
				duration: this._clip.duration,
				channels: {}
			},

			names = Object.keys(this._channelNames),
			tracks = this._tracks,

			channels = result.channels;

		for ( var i = 0, n = names.length; i !== n; ++ i ) {

			var name = names[ i ],
				track = tracks[ name ];

			if ( !(track instanceof THREE.Audio) ) {

				channels[ name ] = {
	
					times: track.times,
					values: track.values
	
				};

			}

		}

		return result;

	},

	deserialize: function ( structs ) {

		var names = Object.keys(this._channelNames),
			tracks = this._tracks,
			channels = structs.channels,
			duration = structs.duration;

		this._clip.duration = duration;
		this._timeline.duration = duration;

		for ( var i = 0, n = names.length; i !== n; ++ i ) {

			var name = names[ i ],
				track = tracks[ name ],
				data = channels[ name ];

			if ( data ) {
				
				this._setArray( track.times, data.times );
				this._setArray( track.values, data.values );

			}

		}

		// update display
		this.timeliner.updateTotalTime( duration );
		this.setDisplayTime( this._mixer.time, false );

	},

	_sort: function ( track ) {

		var times = track.times, order = THREE.AnimationUtils.getKeyframeOrder( times );

		this._setArray( times, THREE.AnimationUtils.sortedArray( times, 1, order ) );

		var values = track.values,
			stride = track.getValueSize();

		this._setArray( values, THREE.AnimationUtils.sortedArray( values, stride, order ) );

	},

	_setArray: function ( dst, src ) {

		dst.length = 0;
		dst.push.apply( dst, src );

	},

	_addTrack: function ( type, label, prop, initialValue, interpolation ) {

		var track = new THREE[type]( prop, [ 0 ], initialValue, interpolation );

		// data must be in JS arrays so it can be resized
		track.times = Array.prototype.slice.call( track.times );
		track.values = Array.prototype.slice.call( track.values );

		this._channelNames[prop] = label;
		this._tracks[ prop ] = track;

		// for recording the state:
		this._propRefs[ prop ] =
				new THREE.PropertyBinding( this._scene, prop );

		return track;

	},

	_addAudio: function ( spec ) {

		var asset = editor.assets.get( 'Audio', 'id', spec.id );
		var audio = MediaHelper.cloneAudio( asset.audio );
		audio.delayTime = spec.delayTime;
		audio.status = 'stopped';
		audio.play();
		audio.stop();

		var audioId = spec.id + '_' + Date.now();
		this._channelNames[audioId] = asset.name;
		this._tracks[audioId] = audio;

		var filterData = function ( audioBuffer ) {

			const rawData = audioBuffer.getChannelData(0);
			const samples = 70;
			const blockSize = Math.floor(rawData.length / samples); // the number of samples in each subdivision
			const filteredData = [];

			for ( let i = 0; i < samples; i++ ) {

				let blockStart = blockSize * i; // the location of the first sample in the block
				let sum = 0;

				for ( let j = 0; j < blockSize; j++ ) {

					sum = sum + Math.abs(rawData[blockStart + j]); // find the sum of all the samples in the block

				}

				filteredData.push(sum / blockSize); // divide the sum by the block size to get the average

			}

			return filteredData;
			
		};

		var normalizeData = function ( filteredData ) {

			const multiplier = Math.pow( Math.max( ...filteredData ), -1 );
			return filteredData.map( n => n * multiplier );

		};

		this._audioData[audioId] = normalizeData( filterData( audio.buffer ) );
		
	}

};

export { TimelinerControls };
