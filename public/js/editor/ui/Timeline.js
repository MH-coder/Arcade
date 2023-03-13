import * as THREE from '../libs/three.module.js';

import { TimelinerControls } from '../controls/TimelinerControls.js';
import { UITimelineDropdown, UITrackDropdown } from './components/ui.openstudio.js';

var Timeline = function ( editor ) {

	var signals = editor.signals;
	var controller = new TimelinerControls( editor, editor.scene, editor.getCurrentTimeline() );
	var dom = Timeliner( controller );

	dom.style.display = 'none';

	var dropdown = new UITimelineDropdown();
	dropdown.setOptions( editor.getTimelineNames() ).setValue( editor.timelineIndex );

	dropdown.onChange( function () {

		editor.changeTimeline( dropdown.getValue() );
		controller._timeline = editor.getCurrentTimeline();
		controller.reset();

	} );

	dropdown.onAddTimeline( function () {

		editor.addTimeline();
		controller._timeline = editor.getCurrentTimeline();
		controller.reset();
		dropdown.setOptions( editor.getTimelineNames() ).setValue( editor.timelineIndex );

	} );

	dropdown.onAddTrack( function () {

		var tracks = document.getElementById( 'timeline-tracks' );
		var trackDropdown = new UITrackDropdown().setOptions( Object.assign( { 'audio': 'Audio clip' }, editor.objects ) );
		trackDropdown.selected.setText( 'new track' );

		trackDropdown.onChange( function () {

			var properties = {
				Mesh: [ 'position', 'quaternion', 'scale', 'visible', 'material.color', 'material.roughness', 'material.metalness', 'material.emissive', 'material.opacity' ],
				Group: [ 'position', 'quaternion', 'scale', 'visible', 'material.color', 'material.roughness', 'material.metalness', 'material.emissive', 'material.opacity' ],
				AmbientLight: [ 'position', 'intensity', 'color', 'visible' ],
				DirectionalLight: [ 'position', 'intensity', 'color', 'visible' ],
				HemisphereLight: [ 'position', 'intensity', 'color', 'groundColor', 'visible' ],
				PointLight: [ 'position', 'intensity', 'color', 'distance', 'decay', 'visible' ],
				SpotLight: [ 'position', 'intensity', 'color', 'distance', 'angle', 'penumbra', 'decay', 'visible' ],
				OrthographicCamera: [ 'position', 'quaternion', 'scale', 'left', 'right', 'top', 'bottom', 'near', 'far', 'visible' ],
				PerspectiveCamera: [ 'position', 'quaternion', 'scale', 'fov', 'near', 'far', 'visible' ],
			};
			var attributes = {
				position: [ 'x', 'y', 'z' ],
				quaternion: [ 'x', 'y', 'z' ],
				scale: [ 'x', 'y', 'z' ]
			};
			var state = trackDropdown.state;

			if ( state == 'property' ) {

				var options = {};
				if ( trackDropdown.object != 'audio' ) {

					var object = editor.objectByUuid( trackDropdown.object );
					var type = object.type == 'TextMesh' ? 'Mesh' : object.type;

					if ( object ) {

						for ( var prop of properties[ type ] ) {

							options[ prop ] = prop;

						}

					}

				} else {

					var audios = editor.assets.getItems( 'audios' );

					for ( var audio of audios ) {

						options[ audio.id ] = audio.name;

					}

				}

				trackDropdown.setOptions( options );

			} else {

				var uuid = trackDropdown.object;
				var property = trackDropdown.property;
				var attribute = trackDropdown.attribute;

				if ( uuid == 'audio' ) {

					var spec = {
						audio: true,
						id: parseInt( property ),
						delayTime: 0,
					};

					controller.addTrack( spec );

				} else {

					if ( ( state == 'attribute' && Object.keys( attributes ).indexOf( property ) < 0 ) || state == 'value' ) {

						var object = editor.objectByUuid( uuid );
						var newTrack = {
							label: object.name + '.' + property + ( attribute ? '.' + attribute : '' ),
							propertyPath: uuid + '.' + property + ( attribute ? '[' + attribute + ']' : '' ),
							interpolation: THREE.InterpolateLinear,
						};

						var getTrackInfo = function ( obj, prop, track ) {

							switch ( prop ) {

								// case 'position': case 'scale':
								// 	track.type = 'VectorKeyframeTrack';
								// 	track.initialValue = [ obj[ property ].x, obj[ property ].y, obj[ property ].z ];
								// 	break;

								// case 'quaternion':
								// 	track.type = 'QuaternionKeyframeTrack';
								// 	track.initialValue = [ obj[ property ].x, obj[ property ].y, obj[ property ].z, obj[ property ].w ];
								// 	break;

								case 'color': case 'groundColor': case 'emissive':
									track.type = 'ColorKeyframeTrack';
									track.initialValue = [ obj[ property ].r, obj[ property ].g, obj[ property ].b ];
									break;

								case 'visible':
									track.type = 'BooleanKeyframeTrack';
									track.initialValue = [ obj[ property ] ];
									break;

								default:
									track.type = 'KeyframeTrack';
									track.initialValue = attribute ? [ obj[ property ] ] : [ obj[ property ] ];
									break;

							}

							return track;

						};

						if ( property.includes( '.' ) ) {

							object = object[ property.substring( 0, property.indexOf( '.' ) ) ];
							property = property.substring( property.indexOf( '.' ) + 1, property.length );

						}

						if ( attribute ) {

							object = object[ property ];
							property = attribute;

						}

						controller.addTrack( getTrackInfo( object, property, newTrack ) );

					} else {

						var options = {};

						for ( var prop of attributes[ property ] ) {

							options[ prop ] = prop;

						}

						trackDropdown.setOptions( options );

					}

				}

				//trackDropdown.dom.parentElement.removeChild( trackDropdown.dom );
				//trackDropdown = null;
				signals.timelineChanged.dispatch();

			}

		} );

		tracks.appendChild( trackDropdown.dom );

	} );

	dropdown.onRenameTimeline( function ( newName ) {

		controller._timeline.name = newName;
		dropdown.setOptions( editor.getTimelineNames() ).setValue( editor.timelineIndex );
		signals.timelineChanged.dispatch();

	} );

	dropdown.onDeleteTimeline( function ( index ) {

		var toUpdate = editor.timelineIndex == index;

		editor.deleteTimeline( index );
		signals.timelineChanged.dispatch();

		dropdown.setOptions( editor.getTimelineNames() ).setValue( editor.timelineIndex );

		if ( toUpdate ) {

			controller._timeline = editor.getCurrentTimeline();
			controller.reset();

		}

	} );

	var top = controller.timeliner.layer_panel.top;
	top.insertBefore( dropdown.dom, top.childNodes[ 0 ] );

	document.addEventListener( 'mousedown', function ( e ) {

		if ( ! dropdown.dom.contains( e.target ) && dropdown.isOpen() ) {

			dropdown.close();

		}

	} );

	signals.sceneLoaded.add( function () {

		controller._timeline = editor.getCurrentTimeline();
		controller.reset();
		dropdown.setOptions( editor.getTimelineNames() ).setValue( editor.timelineIndex );

	} );

	signals.timelinePlayToggled.add( function () {

		controller.togglePlay();

	} );

	signals.timelineKeyframe.add( function () {

	} );

	signals.objectChanged.add( function ( object ) {

		controller.updateObject( object );

	} );

	dom.addEventListener( 'drop', function ( e ) {

		var assetType = e.dataTransfer.getData( 'assetType' );

		if ( assetType == 'AUDIO' ) {

			var id = event.dataTransfer.getData( 'assetId' );
			var asset = editor.assets.get( 'Audio', 'id', id );
			var spec = {
				audio: true,
				name: asset.name,
				url: asset.url,
				delayTime: 0,
			};

			controller.addTrack( spec );

		}

	}, false );

	return dom;

};

export { Timeline };
