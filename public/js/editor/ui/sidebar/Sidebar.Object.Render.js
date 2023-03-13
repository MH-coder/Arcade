import * as THREE from '../../libs/three.module.js';

import { UIPanel, UIRow, UIInput, UIText, UINumber, UIDiv, UISpan, UIImage } from '../components/ui.js';
import { UIColorPicker, UIAccordion, UIStyledCheckbox, UIDropdown, UIGraph, UIColorGradientChooser } from '../components/ui.openstudio.js';
import { UITexture } from '../components/ui.three.js';

import { SetParticleValueCommand } from '../../commands/SetParticleValueCommand.js';
import { SetValueCommand } from '../../commands/SetValueCommand.js';
import { SetPositionCommand } from '../../commands/SetPositionCommand.js';
import { SetRotationCommand } from '../../commands/SetRotationCommand.js';
import { SetScaleCommand } from '../../commands/SetScaleCommand.js';
import { SetColorCommand } from '../../commands/SetColorCommand.js';
import { SidebarObjectConnection } from './Sidebar.Object.Connection.js';

// TODO:: This file seems to be unused. Clean this!

function SidebarObject(editor) {

	var strings = editor.strings;
	var config = editor.config;
	var signals = editor.signals;

	var container = new UIPanel();
	container.setDisplay( 'none' );

	// Movement

	var objectMovement = { controller: { } };
	var objectMovementRows = { controller: { } };

	var objectMovementRow = new UIAccordion().setTitle( strings.getKey( 'sidebar/object/movement' ) ).setId( 'movement' );

	[ 'direction', 'rotation', 'grow' ].map( t => {

		objectMovement[ t ] = {};
		objectMovementRows[ t ] = new UIRow();
		objectMovementRows[ t ].add( new UIText( strings.getKey( 'sidebar/object/movement/' + t ) ) );

		var span = new UISpan();
		[ 'x', 'y', 'z' ].map( axis => {

			objectMovement[ t ][ axis ] = new UINumber().onChange( updateUserData );
			span.add( new UIText( strings.getKey( 'sidebar/object/movement/' + axis ) ).setMarginLeft( '5px' ) );
			span.add( objectMovement[ t ][ axis ] );

		} );

		objectMovementRows[ t ].add( span );

		if ( t != 'grow' ) {

			objectMovement[ t ][ 'local' ] = new UIStyledCheckbox( false ).setIdFor( `${t}-local` ).onChange( updateUserData );
			objectMovementRows[ t ].add( objectMovement[ t ][ 'local' ] );

		}

		objectMovementRow.addToBody( objectMovementRows[ t ] );

	} );

	[ 'lookAt', 'goTo' ].map( t => {

		objectMovementRows[ t ] = new UIDiv();

		var objectRow = new UIRow();
		objectMovement[ t ] = {};
		objectMovement[ t ][ 'uuid' ] = new UIDropdown().setOptions( {} ).onChange( movementSelectChanged );
		objectMovement[ t ][ 'speed' ] = new UINumber().onChange( updateUserData );
		objectMovement[ t ][ 'label' ] = new UIText( strings.getKey( 'sidebar/object/movement/' + t + '/speed' ) );
		objectRow.add( new UIText( strings.getKey( 'sidebar/object/movement/' + t ) ) );
		objectRow.add( objectMovement[ t ][ 'uuid' ] );
		objectRow.add( objectMovement[ t ][ 'label' ] );
		objectRow.add( objectMovement[ t ][ 'speed' ] );

		var axisRow = new UIRow().setPaddingLeft( '25px' );
		[ 'x', 'y', 'z' ].map( axis => {

			objectMovement[ t ][ axis ] = new UINumber().onChange( updateUserData );
			axisRow.add( new UIText( strings.getKey( 'sidebar/object/movement/' + axis ) ) );
			axisRow.add( objectMovement[ t ][ axis ] );

		} );
		objectMovementRow.addToBody( axisRow );

		var axisEnabledRow = new UIRow().setPaddingLeft( '25px' );
		[ 'x', 'y', 'z' ].map( axis => {

			objectMovement[ t ][ axis + 'Enabled' ] = new UIStyledCheckbox( true ).setIdFor( `${t}-${axis}Enabled` ).onChange( updateUserData );
			axisEnabledRow.add( new UIText( strings.getKey( 'sidebar/object/movement/' + axis ) ) );
			axisEnabledRow.add( objectMovement[ t ][ axis + 'Enabled' ] );

		} );

		objectMovementRows[ t ].add( objectRow );
		objectMovementRows[ t ].add( axisRow );
		objectMovementRows[ t ].add( axisEnabledRow );
		objectMovementRows[ t + 'Axis' ] = axisRow;
		objectMovementRows[ t + 'AxisEnabled' ] = axisEnabledRow;
		objectMovementRow.addToBody( objectMovementRows[ t ] );

	} );

	var objectControlsRow = new UIRow();
	var objectControllerType = new UIDropdown().setOptions( { } ).onChange( movementSelectChanged );

	objectControlsRow.add( new UIText( strings.getKey( 'sidebar/object/movement/controller' ) ) );
	objectControlsRow.add( objectControllerType );
	objectMovementRow.addToBody( objectControlsRow );

	var objectControllerRows = {
		basic: [ 'localMovements', 'movePlusX', 'moveMinusX', 'movePlusY', 'moveMinusY', 'movePlusZ', 'moveMinusZ', 'pitchPlusX', 'pitchMinusX', 'yawPlusY', 'yawMinusY', 'rollPlusZ', 'rollMinusZ',
			'globalMovements', 'globalMovePlusX', 'globalMoveMinusX', 'globalMovePlusY', 'globalMoveMinusY', 'globalMovePlusZ', 'globalMoveMinusZ', 'globalPitchPlusX', 'globalPitchMinusX', 'globalYawPlusY', 'globalYawMinusY', 'globalRollPlusZ', 'globalRollMinusZ' ],
		bounce: [ 'speed', 'x', 'y', 'z' ],
		orbit: [ 'center', 'zoom' ],
		map: [ 'min', 'max' ],
		pointerLock: [ 'localMovements', 'movePlusX', 'moveMinusX', 'movePlusZ', 'moveMinusZ', 'yPosition' ],
		lookAt: [ 'object', 'axis', 'axisEnabled' ],
		follow: [ 'object', 'distance' ],
		wasdrf: [ 'movementSpeed', 'pointerSpeed' ]
	};

	for ( var key in objectControllerRows ) {

		var controller = { };
		objectMovementRows.controller[ key ] = new UIDiv();
		if ( key === 'orbit' ) {

			var centerRow = new UIRow();
			centerRow.add( new UIText( strings.getKey( 'sidebar/object/movement/controller/center' ) ).setMarginLeft( '10px' ) );
			[ 'x', 'y', 'z' ].map( axis => {

				controller[ axis ] = new UINumber().onChange( updateUserData );
				centerRow.add( controller[ axis ] );

			} );

			objectMovementRows.controller[ key ].add( centerRow );

			[ 'zoom', 'horizontal', 'rotational' ].map( ( type, index ) => {

				var row = new UIRow();
				row.add( new UIText( strings.getKey( 'sidebar/object/movement/controller/' + type ) ).setMarginLeft( '10px' ) );
				controller[ type ] = new UIStyledCheckbox( true ).setIdFor( type + 'Enabled' ).onChange( updateUserData );
				row.add( controller[ type ] );

				[ 'min', 'max' ].map( id => {

					var name = ( type == 'zoom' ? 'distanceOrbit' : type );
					var controllerId = id + ( name.charAt( 0 ).toUpperCase() + name.slice( 1 ) );
					row.add( new UIText( strings.getKey( 'sidebar/object/movement/controller/' + id ) ) );
					controller[ controllerId ] = new UINumber().onChange( updateUserData );
					row.add( controller[ controllerId ] );

				} );

				objectMovementRows.controller[ key ].add( row );

				if ( index == 0 ) {

					var zoomSpeedRow = new UIRow();
					controller['zoomSpeed'] = new UINumber( 1 ).onChange( updateUserData );

					zoomSpeedRow.add( new UIText( strings.getKey( 'sidebar/object/movement/controller/zoom_speed' ) ).setMarginLeft( '10px' ) );
					zoomSpeedRow.add( controller['zoomSpeed'] );

					objectMovementRows.controller[ key ].add( zoomSpeedRow );

				}

			} );


		} else if ( key === 'map' ) {

			var zoomRow = new UIRow();
			zoomRow.add( new UIText( strings.getKey( 'sidebar/object/movement/controller/zoom' ) ).setMarginLeft( '10px' ) );
			controller[ 'zoomMap' ] = new UIStyledCheckbox( true ).setIdFor( 'zoomMap' ).onChange( updateUserData );
			zoomRow.add( controller[ 'zoomMap' ] );

			[ 'min', 'max' ].map( id => {

				var controllerId = id + 'DistanceMap';
				zoomRow.add( new UIText( strings.getKey( 'sidebar/object/movement/controller/' + id ) ) );
				controller[ controllerId ] = new UINumber().onChange( updateUserData );
				zoomRow.add( controller[ controllerId ] );

			} );

			var zoomSpeedRow = new UIRow();
			controller['zoomSpeedMap'] = new UINumber( 1 ).onChange( updateUserData );

			zoomSpeedRow.add( new UIText( strings.getKey( 'sidebar/object/movement/controller/zoom_speed' ) ).setMarginLeft( '10px' ) );
			zoomSpeedRow.add( controller['zoomSpeedMap'] );

			objectMovementRows.controller[ key ].add( zoomRow, zoomSpeedRow );

		} else if ( key === 'lookAt' ) {

			var objectRow = new UIRow();
			controller[ 'uuid' ] = new UIDropdown().setOptions( {} ).setMarginLeft( '10px' ).onChange( updateUserData );
			controller[ 'speed' ] = new UINumber().onChange( updateUserData );
			objectRow.add( controller[ 'uuid' ] );
			objectRow.add( new UIText( strings.getKey( 'sidebar/object/movement/lookAt/speed' ) ) );
			objectRow.add( controller[ 'speed' ] );

			var axisEnabledRow = new UIRow().setPaddingLeft( '25px' );
			[ 'x', 'y', 'z' ].map( axis => {

				controller[ axis + 'Enabled' ] = new UIStyledCheckbox( true ).setIdFor( `controller-${key}-${axis}Enabled` ).onChange( updateUserData );
				axisEnabledRow.add( new UIText( strings.getKey( 'sidebar/object/movement/' + axis ) ) );
				axisEnabledRow.add( controller[ axis + 'Enabled' ] );

			} );

			objectMovementRows.controller[ key ].add( objectRow );
			objectMovementRows.controller[ key ].add( axisEnabledRow );

		} else if ( key === 'follow' ) {

			var objectRow = new UIRow();
			controller[ 'uuid' ] = new UIDropdown().setOptions( {} ).setMarginLeft( '10px' ).onChange( updateUserData );
			objectRow.add( new UIText( strings.getKey( 'sidebar/object/movement/controller/object' ) ) );
			objectRow.add( controller[ 'uuid' ] );

			var distanceRow = new UIRow();
			controller[ 'distance' ] = new UINumber().onChange( updateUserData );
			distanceRow.add( new UIText( strings.getKey( 'sidebar/object/movement/controller/distance' ) ) );
			distanceRow.add( controller[ 'distance' ] );

			objectMovementRows.controller[ key ].add( objectRow );
			objectMovementRows.controller[ key ].add( distanceRow );

		} else if ( key === 'wasdrf' ) {

			var movementSpeedRow = new UIRow().setPaddingLeft( '25px' );
			controller[ 'movementSpeed' ] = new UINumber().onChange( updateUserData );
			movementSpeedRow.add( new UIText( strings.getKey( 'sidebar/settings/workspace/navigation/WASDRF/movement' ) ) );
			movementSpeedRow.add( controller[ 'movementSpeed' ] );

			var pointerSpeedRow = new UIRow().setPaddingLeft( '25px' );
			controller[ 'pointerSpeed' ] = new UINumber().onChange( updateUserData );
			pointerSpeedRow.add( new UIText( strings.getKey( 'sidebar/settings/workspace/navigation/WASDRF/pointer' ) ) );
			pointerSpeedRow.add( controller[ 'pointerSpeed' ] );

			objectMovementRows.controller[ key ].add( movementSpeedRow, pointerSpeedRow );

		} else if ( key === 'bounce' ) {

			var speedRow = new UIRow().setPaddingLeft( '25px' );
			controller[ 'speed' ] = new UINumber().onChange( updateUserData );
			speedRow.add( new UIText( strings.getKey( 'sidebar/object/movement/controller/speed' ) ) );
			speedRow.add( controller[ 'speed' ] );

			var startDirectionRow = new UIRow().setPaddingLeft( '25px' );
			var startDirections = new UIDiv().noWrap();
			startDirectionRow.add( new UIText( strings.getKey( 'sidebar/object/movement/controller/startDirection' ) ) );
			startDirectionRow.add( startDirections );

			[ 'x', 'y', 'z' ].map( axis => {

				controller[ axis ] = new UINumber().onChange( updateUserData );
				startDirections.add( new UIText( strings.getKey( 'sidebar/object/movement/' + axis ) ).setPaddingLeft( '3px' ) );
				startDirections.add( controller[ axis ] );

			} );

			objectMovementRows.controller[ key ].add( speedRow );
			objectMovementRows.controller[ key ].add( startDirectionRow );

		} else {

			objectControllerRows[ key ].map( id => {

				var row = new UIRow();
				row.add( new UIText( strings.getKey( 'sidebar/object/movement/controller/' + id ) ).setMarginLeft( '10px' ) );

				if ( id == 'yPosition' ) {

					controller[ id ] = new UINumber().setMarginLeft( '5px' ).onChange( updateUserData );
					row.add( controller[ id ] );

				} else if ( id !== 'localMovements' && id !== 'globalMovements' ) {

					controller[ id ] = new UIInput().onChange( updateUserData );
					row.add( controller[ id ] );
					row.add( new UIText( strings.getKey( 'sidebar/object/movement/controller/speed' ) ) );
					controller[ id + 'Speed' ] = new UINumber().onChange( updateUserData );
					row.add( controller[ id + 'Speed' ] );

				}

				objectMovementRows.controller[ key ].add( row );

			} );

		}

		objectMovement.controller[ key ] = controller;
		objectMovementRow.addToBody( objectMovementRows.controller[ key ] );

	}

	container.add( objectMovementRow );

	// Selectable

	var selectableKeys = [ 'local', 'grid', 'translate', 'rotate', 'scale', 'sizePlus', 'sizeMinus', 'toggleX', 'toggleY', 'toggleZ', 'toggleEnabled' ];
	var objectSelectableRow = new UIAccordion().setTitle( strings.getKey( 'sidebar/object/selectable' ) ).setId( 'selectable' );

	var objectSelectedRow = new UIRow();
	var objectSelected = new UIStyledCheckbox( false ).setIdFor( 'objectSelected' ).onChange( updateUserData );
	objectSelectedRow.add( new UIText( strings.getKey( 'sidebar/object/selectable/selected' ) ) );
	objectSelectedRow.add( objectSelected );

	var objectCanSelectRow = new UIRow();
	var objectCanSelect = new UIStyledCheckbox( true ).setIdFor( 'objectCanSelect' ).onChange( updateUserData );
	var objectCanDeselect = new UIStyledCheckbox( true ).setIdFor( 'objectCanDeselect' ).onChange( updateUserData );
	objectCanSelectRow.add( new UIText( strings.getKey( 'sidebar/object/selectable/canSelect' ) ) );
	objectCanSelectRow.add( objectCanSelect );
	objectCanSelectRow.add( new UIText( strings.getKey( 'sidebar/object/selectable/canDeselect' ) ) );
	objectCanSelectRow.add( objectCanDeselect );

	var objectDragTypeRow = new UIRow();
	var objectDragType = new UIDropdown().setOptions( { 'none': 'None', 'move': 'Move', 'rotate': 'Rotate', 'transform': 'Transform handles' } ).onChange( selectableSelectChanged );
	objectDragTypeRow.add( new UIText( strings.getKey( 'sidebar/object/selectable/drag' ) ) );
	objectDragTypeRow.add( objectDragType );

	var objectSelectableHandleShowRow = new UIRow();
	var objectSelectableHandleShow = new UIDropdown().setOptions( { 'when selected': 'when selected', 'always': 'always' } ).onChange( selectableSelectChanged );
	objectSelectableHandleShowRow.add( new UIText( strings.getKey( 'sidebar/object/selectable/show' ) ).setMarginLeft( '10px' ) );
	objectSelectableHandleShowRow.add( objectSelectableHandleShow );

	var objectSelectableAxisRow = new UIRow();
	var objectSelectableAxis = {};
	objectSelectableAxisRow.add( new UIText( strings.getKey( 'sidebar/object/selectable/axis' ) ).setMarginLeft( '10px' ) );
	[ 'x', 'y', 'z' ].map( axis => {

		objectSelectableAxis[ axis ] = new UIStyledCheckbox( true ).setMarginRight( '5px' ).setIdFor( `objectSelectable-${axis}Enabled` ).onChange( updateUserData );
		objectSelectableAxisRow.add( objectSelectableAxis[ axis ] );
		objectSelectableAxisRow.add( new UIText( strings.getKey( 'sidebar/object/movement/' + axis ) ).setMarginRight( '10px' ) );

	} );

	var objectSelectableTransformRow = new UIDiv();
	var objectSelectableTransform = {};
	selectableKeys.map( key => {

		var row = new UIRow();
		objectSelectableTransform[ key ] = new UIInput().onChange( updateUserData );
		row.add( new UIText( strings.getKey( 'sidebar/object/selectable/transform/' + key ) ).setMarginLeft( '10px' ) );
		row.add( objectSelectableTransform[ key ] );
		objectSelectableTransformRow.add( row );

	} );

	objectSelectableRow.addToBody( objectSelectedRow );
	objectSelectableRow.addToBody( objectCanSelectRow );
	objectSelectableRow.addToBody( objectDragTypeRow );
	objectSelectableRow.addToBody( objectSelectableHandleShowRow );
	objectSelectableRow.addToBody( objectSelectableAxisRow );
	objectSelectableRow.addToBody( objectSelectableTransformRow );

	container.add( objectSelectableRow );

	// Spacial

	var objectSpacialAccordion = new UIAccordion().setTitle( strings.getKey( 'sidebar/spacial' ) ).setId( 'spacial' );
	var objectSpacials = {};
	var objectSpacialRows = {};
	var objectSpacialConnections = {};

	[ 'position', 'rotation', 'scale' ].map( ( spacial ) => {

		objectSpacialRows[ spacial ] = new UIRow();
		objectSpacialRows[ spacial ].add( new UIText( strings.getKey( 'sidebar/object/' + spacial ) ) );
		objectSpacials[ spacial ] = {};

		[ 'x', 'y', 'z' ].map( ( axis ) => {

			objectSpacials[ spacial ][ axis ] = { };
			objectSpacials[ spacial ][ axis ][ 'conn_image' ] = new UIImage( config.getImage( 'engine-ui/cursor.svg' ) ).onDblClick( updateSpacialConnectionRows.bind( this, spacial, axis ) ).setWidth( '16px' ).setDisplay( 'none' );
			objectSpacials[ spacial ][ axis ][ 'conn_label' ] = new UIText( 'x' ).onDblClick( updateSpacialConnectionRows.bind( this, spacial, axis ) ).setDisplay( 'none' );
			objectSpacials[ spacial ][ axis ][ 'label' ] = new UIText( strings.getKey( 'sidebar/object/movement/' + axis ) ).onDblClick( updateSpacialConnectionRows.bind( this, spacial, axis ) );
			objectSpacials[ spacial ][ axis ][ 'value' ] = new UINumber().setPrecision( 3 ).onChange( update );

			objectSpacialRows[ spacial ].add(
				objectSpacials[ spacial ][ axis ][ 'conn_image' ],
				objectSpacials[ spacial ][ axis ][ 'conn_label' ],
				objectSpacials[ spacial ][ axis ][ 'label' ],
				objectSpacials[ spacial ][ axis ][ 'value' ]
			);

		} );

		objectSpacialConnections[ spacial ] = new SidebarObjectConnection( editor, spacial );
		objectSpacialConnections[ spacial ].onChange( function ( e ) {

			var object = editor.selected;

			if ( ! object.userData.connection ) {

				object.userData.connection = {
					position: {},
					rotation: {},
					scale: {},
					direction: {},
					rotation: {},
					grow: {}
				};

			}

			if ( e.enabled ) {

				object.userData.connection[ spacial ][ e.axis ] = {};
				object.userData.connection[ spacial ][ e.axis ][ 'mouse' ] = e.mouse;
				object.userData.connection[ spacial ][ e.axis ][ 'speed' ] = e.speed;

			} else {

				delete object.userData.connection[ spacial ][ e.axis ];

			}

			updateConnectionUI( object );

			editor.execute( new SetValueCommand( editor, object, 'userData', object.userData ) );

		} );

		objectSpacialAccordion.addToBody( objectSpacialRows[ spacial ] );
		objectSpacialAccordion.addToBody( objectSpacialConnections[ spacial ] );

	} );

	// width

	var objectWidthRow = new UIRow();
	var objectWidth = new UINumber().onChange( update );

	objectWidthRow.add( new UIText( strings.getKey( 'sidebar/object/width' ) ).setWidth( '90px' ) );
	objectWidthRow.add( objectWidth );

	objectSpacialAccordion.addToBody( objectWidthRow );

	// height

	var objectHeightRow = new UIRow();
	var objectHeight = new UINumber().onChange( update );

	objectHeightRow.add( new UIText( strings.getKey( 'sidebar/object/height' ) ).setWidth( '90px' ) );
	objectHeightRow.add( objectHeight );

	objectSpacialAccordion.addToBody( objectHeightRow );

	container.add( objectSpacialAccordion );

	var objectLimitRow = new UIAccordion().setTitle( strings.getKey( 'sidebar/object/movement/limit' ) ).setId( 'limit' );

	var newCustomLimitRow = new UIRow().onClick( function () {

		limitDropdownRow.setDisplay( '' );

	} );
	newCustomLimitRow.add( new UIText( strings.getKey( 'sidebar/object/movement/limit/create' ) ) );
	newCustomLimitRow.add( new UIText( '+' ) );
	objectLimitRow.addToBody( newCustomLimitRow );

	var limitDropdownRow = new UIRow();
	var limitDropdown = new UIDropdown();
	limitDropdown.onChange( function ( e ) {

		var object = editor.selected;
		var id = this.getValue();
		var name = this.getLabel();
		var newLimit = {
			type: id.search( 'tag/' ) == - 1 ? 'object' : 'tag',
			uuid: id,
			name: name,
			enabled: true,
		};

		if ( ! object.userData.movement ) object.userData.movement = {};
		if ( ! object.userData.movement.customLimit ) object.userData.movement.customLimit = [];

		object.userData.movement.customLimit.push( newLimit );

		updateCustsomLimitUI( object );
		update();

	} );

	limitDropdownRow.add( new UIText( ' ' ) );
	limitDropdownRow.add( limitDropdown );

	objectLimitRow.addToBody( limitDropdownRow );

	var customLimits = new UIDiv();
	objectLimitRow.addToBody( customLimits );

	[ 'positionLimit', 'rotationLimit', 'scaleLimit' ].map( t => {

		objectMovement[ t ] = {};
		objectMovementRows[ t ] = new UIDiv();

		[ 'X', 'Y', 'Z' ].map( axis => {

			objectMovement[ t ][ axis + 'Enabled' ] = new UIStyledCheckbox( true ).setIdFor( t + axis + 'Enabled' ).onChange( update );
			objectMovement[ t ][ axis + 'Min' ] = new UINumber().onChange( update );
			objectMovement[ t ][ axis + 'Max' ] = new UINumber().onChange( update );

			var row = new UIRow();
			row.add( new UIText( strings.getKey( 'sidebar/object/movement/' + t + axis ) ) );
			row.add( objectMovement[ t ][ axis + 'Enabled' ], objectMovement[ t ][ axis + 'Min' ], objectMovement[ t ][ axis + 'Max' ] );
			objectMovementRows[ t ].add( row );

		} );

		objectLimitRow.addToBody( objectMovementRows[ t ] );

	} );

	container.add( objectLimitRow );

	// Lens

	var objectLensRow = new UIAccordion().setTitle( strings.getKey( 'sidebar/lens' ) ).setId( 'lens' );

	// fov

	var objectFovRow = new UIRow();
	var objectFov = new UINumber().onChange( update );

	objectFovRow.add( new UIText( strings.getKey( 'sidebar/object/fov' ) ) );
	objectFovRow.add( objectFov );

	objectLensRow.addToBody( objectFovRow );

	// left

	var objectLeftRow = new UIRow();
	var objectLeft = new UINumber().onChange( update );

	objectLeftRow.add( new UIText( strings.getKey( 'sidebar/object/left' ) ) );
	objectLeftRow.add( objectLeft );

	objectLensRow.addToBody( objectLeftRow );

	// right

	var objectRightRow = new UIRow();
	var objectRight = new UINumber().onChange( update );

	objectRightRow.add( new UIText( strings.getKey( 'sidebar/object/right' ) ) );
	objectRightRow.add( objectRight );

	objectLensRow.addToBody( objectRightRow );

	// top

	var objectTopRow = new UIRow();
	var objectTop = new UINumber().onChange( update );

	objectTopRow.add( new UIText( strings.getKey( 'sidebar/object/top' ) ) );
	objectTopRow.add( objectTop );

	objectLensRow.addToBody( objectTopRow );

	// bottom

	var objectBottomRow = new UIRow();
	var objectBottom = new UINumber().onChange( update );

	objectBottomRow.add( new UIText( strings.getKey( 'sidebar/object/bottom' ) ) );
	objectBottomRow.add( objectBottom );

	objectLensRow.addToBody( objectBottomRow );

	// near

	var objectNearRow = new UIRow();
	var objectNear = new UINumber().onChange( update );

	objectNearRow.add( new UIText( strings.getKey( 'sidebar/object/near' ) ) );
	objectNearRow.add( objectNear );

	objectLensRow.addToBody( objectNearRow );

	// far

	var objectFarRow = new UIRow();
	var objectFar = new UINumber().onChange( update );

	objectFarRow.add( new UIText( strings.getKey( 'sidebar/object/far' ) ) );
	objectFarRow.add( objectFar );

	objectLensRow.addToBody( objectFarRow );

	container.add( objectLensRow );

	// Styling

	var objectStylingRow = new UIAccordion().setTitle( strings.getKey( 'sidebar/object/styling' ) ).setId( 'styling' );

	// intensity

	var objectIntensityRow = new UIRow();
	var objectIntensity = new UINumber().setRange( 0, Infinity ).onChange( update );

	objectIntensityRow.add( new UIText( strings.getKey( 'sidebar/object/intensity' ) ) );
	objectIntensityRow.add( objectIntensity );

	objectStylingRow.addToBody( objectIntensityRow );

	// color

	var objectColorRow = new UIRow();
	var objectColor = new UIColorPicker( editor ).onChange( update );

	objectColorRow.add( new UIText( strings.getKey( 'sidebar/object/color' ) ) );
	objectColorRow.add( objectColor );

	objectStylingRow.addToBody( objectColorRow );

	// ground color

	var objectGroundColorRow = new UIRow();
	var objectGroundColor = new UIColorPicker( editor ).onChange( update );

	objectGroundColorRow.add( new UIText( strings.getKey( 'sidebar/object/groundcolor' ) ) );
	objectGroundColorRow.add( objectGroundColor );

	objectStylingRow.addToBody( objectGroundColorRow );

	// distance

	var objectDistanceRow = new UIRow();
	var objectDistance = new UINumber().setRange( 0, Infinity ).onChange( update );

	objectDistanceRow.add( new UIText( strings.getKey( 'sidebar/object/distance' ) ) );
	objectDistanceRow.add( objectDistance );

	objectStylingRow.addToBody( objectDistanceRow );

	// angle

	var objectAngleRow = new UIRow();
	var objectAngle = new UINumber().setPrecision( 3 ).setRange( 0, Math.PI / 2 ).onChange( update );

	objectAngleRow.add( new UIText( strings.getKey( 'sidebar/object/angle' ) ) );
	objectAngleRow.add( objectAngle );

	objectStylingRow.addToBody( objectAngleRow );

	// penumbra

	var objectPenumbraRow = new UIRow();
	var objectPenumbra = new UINumber().setRange( 0, 1 ).onChange( update );

	objectPenumbraRow.add( new UIText( strings.getKey( 'sidebar/object/penumbra' ) ) );
	objectPenumbraRow.add( objectPenumbra );

	objectStylingRow.addToBody( objectPenumbraRow );

	// decay

	var objectDecayRow = new UIRow();
	var objectDecay = new UINumber().setRange( 0, Infinity ).onChange( update );

	objectDecayRow.add( new UIText( strings.getKey( 'sidebar/object/decay' ) ) );
	objectDecayRow.add( objectDecay );

	objectStylingRow.addToBody( objectDecayRow );

	// Particle

	var particleStylingDiv = new UIDiv();

	var particleTextureRow = new UIRow();
	var particleTexture = new UITexture( editor ).onChange( function ( textureId ) {

		editor.execute( new SetParticleValueCommand( editor, editor.selected, '', 'textureId', textureId ) );

	} );

	particleTextureRow.add( new UIText( strings.getKey( 'sidebar/particle/texture' ) ) );
	particleTextureRow.add( particleTexture );

	particleStylingDiv.add( particleTextureRow );

	var particleCountRow = new UIRow();
	var particleCount = new UINumber().setRange( 0, Infinity ).onChange( update );

	particleCountRow.add( new UIText( strings.getKey( 'sidebar/particle/count' ) ) );
	particleCountRow.add( particleCount );

	particleStylingDiv.add( particleCountRow );

	var particleBlendModeRow = new UIRow();
	var particleBlendMode = new UIDropdown().setOptions( {
		0 : 'None',
		1 : 'Normal',
		2 : 'Additive',
		3 : 'Subtractive',
		4 : 'Multiply'
	} ).onChange( update );

	particleBlendModeRow.add( new UIText( strings.getKey( 'sidebar/particle/blend_mode' ) ) );
	particleBlendModeRow.add( particleBlendMode );

	particleStylingDiv.add( particleBlendModeRow );

	var particleDirectionRow = new UIRow();
	var particleDirection = new UIDropdown().setOptions( {
		'1': 'Forward',
		'-1': 'Backward'
	} ).onChange( update );

	particleDirectionRow.add( new UIText( strings.getKey( 'sidebar/particle/direction' ) ) );
	particleDirectionRow.add( particleDirection );

	particleStylingDiv.add( particleDirectionRow );

	var particleRateRow = new UIRow();
	var particleRate = new UINumber().setRange( 0, Infinity ).onChange( update );

	particleRateRow.add( new UIText( strings.getKey( 'sidebar/particle/rate' ) ) );
	particleRateRow.add( particleRate );

	particleStylingDiv.add( particleRateRow );

	var particleDurationRow = new UIRow();
	var particleDuration = new UINumber().setRange( 0, Infinity ).onChange( update );

	particleDurationRow.add( new UIText( strings.getKey( 'sidebar/particle/duration' ) ) );
	particleDurationRow.add( particleDuration );

	particleStylingDiv.add( particleDurationRow );

	var particleEmitterTypeRow = new UIRow();
	var particleEmitterType = new UIDropdown().setOptions( {
		1: 'Box',
		2: 'Sphere',
		3: 'Disc'
	} ).onChange( update );

	particleEmitterTypeRow.add( new UIText( strings.getKey( 'sidebar/particle/direction' ) ) );
	particleEmitterTypeRow.add( particleEmitterType );

	particleStylingDiv.add( particleEmitterTypeRow );

	var particleAgeRow = new UIRow();
	var particleAgeFSpan = new UISpan();
	var particleAgeF = new UINumber().setRange( 0, Infinity ).onChange( update );
	var particleAgePlusMinusSpan = new UISpan();
	var particleAgePlusMinus = new UINumber().setRange( 0, Infinity ).onChange( update );

	particleAgeFSpan.add( new UIText( strings.getKey( 'sidebar/particle/f' ) ) );
	particleAgeFSpan.add( particleAgeF );

	particleAgePlusMinusSpan.add( new UIText( strings.getKey( 'sidebar/particle/plus_minus' ) ) );
	particleAgePlusMinusSpan.add( particleAgePlusMinus );

	particleAgeRow.add( new UIText( strings.getKey( 'sidebar/particle/age' ) ), particleAgeFSpan, particleAgePlusMinusSpan );

	particleStylingDiv.add( particleAgeRow );

	var particleSpeed = {};

	[ 'position', 'velocity', 'acceleration' ].map( t => {

		particleSpeed[ t ] = {};

		var row = new UIRow();
		row.add( new UIText( strings.getKey( 'sidebar/particle/' + t ) ) );

		particleStylingDiv.add( row );

		[ 'initial', 'variation' ].map( s => {

			var speedRow = new UIRow();
			speedRow.add( new UIText( strings.getKey( 'sidebar/particle/' + s ) ) );

			particleSpeed[ t ][ s ] = {};

			[ 'x', 'y', 'z' ].map( x => {

				particleSpeed[ t ][ s ][ x ] = new UINumber().setRange( 0, Infinity ).onChange( update );

				speedRow.add( new UIText( strings.getKey( 'sidebar/particle/' + x ) ) );
				speedRow.add( particleSpeed[ t ][ s ][ x ] );

			} );

			particleStylingDiv.add( speedRow );

		} );

	} );

	var particleWiggleRow = new UIRow();
	var particleWiggleFSpan = new UISpan();
	var particleWiggleF = new UINumber().setRange( 0, Infinity ).onChange( update );
	var particleWigglePlusMinusSpan = new UISpan();
	var particleWigglePlusMinus = new UINumber().setRange( 0, Infinity ).onChange( update );

	particleWiggleFSpan.add( new UIText( strings.getKey( 'sidebar/particle/f' ) ) );
	particleWiggleFSpan.add( particleWiggleF );

	particleWigglePlusMinusSpan.add( new UIText( strings.getKey( 'sidebar/particle/plus_minus' ) ) );
	particleWigglePlusMinusSpan.add( particleWigglePlusMinus );

	particleWiggleRow.add( new UIText( strings.getKey( 'sidebar/particle/wiggle' ) ), particleWiggleFSpan, particleWigglePlusMinusSpan );

	particleStylingDiv.add( particleWiggleRow );

	var particleOpacityDiv = new UIDiv();

	var particleOpacity = new UIGraph();
	particleOpacity.setOnChange( function () {

		editor.execute( new SetParticleValueCommand( editor, editor.selected, 'emitter.opacity', 'value', particleOpacity.getValue() ) );

	} );
	particleOpacity.addGraph( 'spread', '#aaaaaa' );
	particleOpacity.setOnChange( function () {

		editor.execute( new SetParticleValueCommand( editor, editor.selected, 'emitter.opacity', 'spread', particleOpacity.getValue( 'spread' ) ) );

	}, 'spread' );

	particleOpacityDiv.add( new UIText( strings.getKey( 'sidebar/particle/opacity' ) ), particleOpacity );

	particleStylingDiv.add( particleOpacityDiv );

	var particleScaleDiv = new UIDiv();

	var particleScaleSizeRow = new UIRow();
	var particleScaleSizeMin = new UISpan();
	var particleScaleSizeMax = new UISpan();
	var particleScaleMin = new UINumber().setRange( 0, Infinity ).onChange( function () {

		particleScale.setRange( particleScaleMin.getValue(), particleScaleMax.getValue() );

	} );
	var particleScaleMax = new UINumber().setRange( 0, Infinity ).onChange( function () {

		particleScale.setRange( particleScaleMin.getValue(), particleScaleMax.getValue() );

	} );

	particleScaleSizeMin.add( new UIText( strings.getKey( 'sidebar/particle/min' ) ), particleScaleMin );
	particleScaleSizeMax.add( new UIText( strings.getKey( 'sidebar/particle/max' ) ), particleScaleMax );

	particleScaleSizeRow.add( new UIText( strings.getKey( 'sidebar/particle/scale' ) ), particleScaleSizeMin, particleScaleSizeMax );

	var particleScale = new UIGraph();
	particleScale.setOnChange( function () {

		// editor.execute( new SetParticleValueCommand( editor, editor.selected, 'emitter.size', 'value', particleScale.getValue() ) );

	} );
	particleScale.addGraph( 'spread', '#aaaaaa' );
	particleScale.setOnChange( function () {

		// editor.execute( new SetParticleValueCommand( editor, editor.selected, 'emitter.size', 'spread', particleScale.getValue( 'spread' ) ) );

	}, 'spread' );

	particleScaleDiv.add( particleScaleSizeRow, particleScale );

	particleStylingDiv.add( particleScaleDiv );

	var particleRotationDiv = new UIDiv();

	var particleRotationAngleRow = new UIRow();
	var particleRotationAngleMin = new UISpan();
	var particleRotationAngleMax = new UISpan();
	var particleRotationMin = new UINumber().setRange( 0, Infinity ).onChange( function () {

		particleRotation.setRange( particleRotationMin.getValue(), particleRotationMax.getValue() );

	} );
	var particleRotationMax = new UINumber().setRange( 0, Infinity ).onChange( function () {

		particleRotation.setRange( particleRotationMin.getValue(), particleRotationMax.getValue() );

	} );

	particleRotationAngleMin.add( new UIText( strings.getKey( 'sidebar/particle/min' ) ), particleRotationMin );
	particleRotationAngleMax.add( new UIText( strings.getKey( 'sidebar/particle/max' ) ), particleRotationMax );

	particleRotationAngleRow.add( new UIText( strings.getKey( 'sidebar/particle/scale' ) ), particleRotationAngleMin, particleRotationAngleMax );

	var particleRotation = new UIGraph();
	particleRotation.setOnChange( function () {

		editor.execute( new SetParticleValueCommand( editor, editor.selected, 'emitter.angle', 'value', particleRotation.getValue() ) );

	} );
	particleRotation.addGraph( 'spread', '#aaaaaa' );
	particleRotation.setOnChange( function () {

		editor.execute( new SetParticleValueCommand( editor, editor.selected, 'emitter.angle', 'spread', particleRotation.getValue( 'spread' ) ) );

	}, 'spread' );

	particleRotationDiv.add( particleRotationAngleRow, particleRotation );

	particleStylingDiv.add( particleRotationDiv );

	var particleColorRow = new UIRow();
	particleColorRow.add( new UIText( strings.getKey( 'sidebar/particle/color' ) ) );

	particleStylingDiv.add( particleColorRow );

	var particleBaseColorRow = new UIRow();
	var particleBaseColor = new UIColorGradientChooser();
	particleBaseColor.setOnChange( function ( color, index ) {

		editor.execute( new SetParticleValueCommand( editor, editor.selected, 'emitter.color.value', index, color ) );

	} );
	particleBaseColorRow.add( new UIText( strings.getKey( 'sidebar/particle/color/base' ) ) );
	particleBaseColorRow.add( particleBaseColor );

	particleStylingDiv.add( particleBaseColorRow );

	var particleSpreadColorRow = new UIRow();
	var particleSpreadColor = new UIColorGradientChooser();
	particleSpreadColor.setOnChange( function ( color, index ) {

		editor.execute( new SetParticleValueCommand( editor, editor.selected, 'emitter.color.spread', index, new THREE.Vector3(color.r, color.g, color.b) ) );

	} );
	particleSpreadColorRow.add( new UIText( strings.getKey( 'sidebar/particle/color/spread' ) ) );
	particleSpreadColorRow.add( particleSpreadColor );

	particleStylingDiv.add( particleSpreadColorRow );

	objectStylingRow.addToBody( particleStylingDiv );

	container.add( objectStylingRow );

	// Text



	// Render

	var objectRenderRow = new UIAccordion().setTitle( strings.getKey( 'sidebar/render' ) ).setId( 'render' );

	// shadow

	var objectCastShadowRow = new UIRow();
	var objectCastShadow = new UIStyledCheckbox().setIdFor( 'objectCastShadow' ).onChange( update );

	objectCastShadowRow.add( new UIText( strings.getKey( 'sidebar/object/cast' ) ) );
	objectCastShadowRow.add( objectCastShadow );

	objectRenderRow.addToBody( objectCastShadowRow );

	// receive shadow

	var objectReceiveShadowRow = new UIRow();
	var objectReceiveShadow = new UIStyledCheckbox().setIdFor( 'objectReceiveShadow' ).onChange( update );

	objectReceiveShadowRow.add( new UIText( strings.getKey( 'sidebar/object/receive' ) ) );
	objectReceiveShadowRow.add( objectReceiveShadow );

	objectRenderRow.addToBody( objectReceiveShadowRow );

	// shadow bias

	var objectShadowBiasRow = new UIRow();

	objectShadowBiasRow.add( new UIText( strings.getKey( 'sidebar/object/shadowBias' ) ).setWidth( '90px' ) );

	var objectShadowBias = new UINumber( 0 ).setPrecision( 6 ).setStep( 0.001 ).setNudge( 0.000001 ).onChange( update );
	objectShadowBiasRow.add( objectShadowBias );

	objectRenderRow.addToBody( objectShadowBiasRow );

	// shadow normal offset

	var objectShadowNormalBiasRow = new UIRow();

	objectShadowNormalBiasRow.add( new UIText( strings.getKey( 'sidebar/object/shadowNormalBias' ) ).setWidth( '90px' ) );

	var objectShadowNormalBias = new UINumber( 0 ).onChange( update );
	objectShadowNormalBiasRow.add( objectShadowNormalBias );

	objectRenderRow.addToBody( objectShadowBiasRow );

	// shadow radius

	var objectShadowRadiusRow = new UIRow();

	objectShadowRadiusRow.add( new UIText( strings.getKey( 'sidebar/object/shadowRadius' ) ).setWidth( '90px' ) );

	var objectShadowRadius = new UINumber( 1 ).onChange( update );
	objectShadowRadiusRow.add( objectShadowRadius );

	objectRenderRow.addToBody( objectShadowRadiusRow );

	// visible

	var objectVisibleRow = new UIRow();
	var objectVisible = new UIStyledCheckbox().setIdFor( 'objectVisible' ).onChange( update );

	objectVisibleRow.add( new UIText( strings.getKey( 'sidebar/object/visible' ) ) );
	objectVisibleRow.add( objectVisible );

	objectRenderRow.addToBody( objectVisibleRow );


	container.add( objectRenderRow );

	//

	function update() {
		console.log("updating: ",updating);
		var object = editor.selected;

		if ( object !== null ) {

			var newPosition = new THREE.Vector3( objectSpacials.position.x.value.getValue(), objectSpacials.position.y.value.getValue(), objectSpacials.position.z.value.getValue() );
			if ( object.position.distanceTo( newPosition ) >= 0.01 ) {

				editor.execute( new SetPositionCommand( editor, object, newPosition ) );

			}

			var newRotation = new THREE.Euler( objectSpacials.rotation.x.value.getValue() * THREE.MathUtils.DEG2RAD, objectSpacials.rotation.y.value.getValue() * THREE.MathUtils.DEG2RAD, objectSpacials.rotation.z.value.getValue() * THREE.MathUtils.DEG2RAD );
			var objectRotation = new THREE.Vector3();
			var objectNewRotation = new THREE.Vector3();
			if ( objectRotation.setFromEuler(object.rotation).distanceTo( objectNewRotation.setFromEuler(newRotation) ) >= 0.01 ) {

				editor.execute( new SetRotationCommand( editor, object, newRotation ) );

			}

			var newScale = new THREE.Vector3( objectSpacials.scale.x.value.getValue(), objectSpacials.scale.y.value.getValue(), objectSpacials.scale.z.value.getValue() );
			if ( object.scale.distanceTo( newScale ) >= 0.01 ) {

				editor.execute( new SetScaleCommand( editor, object, newScale ) );

			}

			if ( object.width !== undefined && Math.abs( object.width - objectWidth.getValue() ) >= 0.01 ) {

				editor.execute( new SetValueCommand( editor, object, 'width', objectWidth.getValue() ) );

			}

			if ( object.height !== undefined && Math.abs( object.height - objectHeight.getValue() ) >= 0.01 ) {

				editor.execute( new SetValueCommand( editor, object, 'height', objectHeight.getValue() ) );

			}

			if ( object.fov !== undefined && Math.abs( object.fov - objectFov.getValue() ) >= 0.01 ) {

				editor.execute( new SetValueCommand( editor, object, 'fov', objectFov.getValue() ) );
				object.updateProjectionMatrix();

			}

			if ( object.left !== undefined && Math.abs( object.left - objectLeft.getValue() ) >= 0.01 ) {

				editor.execute( new SetValueCommand( editor, object, 'left', objectLeft.getValue() ) );
				object.updateProjectionMatrix();

			}

			if ( object.right !== undefined && Math.abs( object.right - objectRight.getValue() ) >= 0.01 ) {

				editor.execute( new SetValueCommand( editor, object, 'right', objectRight.getValue() ) );
				object.updateProjectionMatrix();

			}

			if ( object.top !== undefined && Math.abs( object.top - objectTop.getValue() ) >= 0.01 ) {

				editor.execute( new SetValueCommand( editor, object, 'top', objectTop.getValue() ) );
				object.updateProjectionMatrix();

			}

			if ( object.bottom !== undefined && Math.abs( object.bottom - objectBottom.getValue() ) >= 0.01 ) {

				editor.execute( new SetValueCommand( editor, object, 'bottom', objectBottom.getValue() ) );
				object.updateProjectionMatrix();

			}

			if ( object.near !== undefined && Math.abs( object.near - objectNear.getValue() ) >= 0.01 ) {

				editor.execute( new SetValueCommand( editor, object, 'near', objectNear.getValue() ) );
				if ( object.isOrthographicCamera ) {

					object.updateProjectionMatrix();

				}

			}

			if ( object.far !== undefined && Math.abs( object.far - objectFar.getValue() ) >= 0.01 ) {

				editor.execute( new SetValueCommand( editor, object, 'far', objectFar.getValue() ) );
				if ( object.isOrthographicCamera ) {

					object.updateProjectionMatrix();

				}

			}

			if ( object.intensity !== undefined && Math.abs( object.intensity - objectIntensity.getValue() ) >= 0.01 ) {

				editor.execute( new SetValueCommand( editor, object, 'intensity', objectIntensity.getValue() ) );

			}

			if ( object.color !== undefined && object.color.getHex() !== objectColor.getHexValue() ) {

				editor.execute( new SetColorCommand( editor, object, 'color', objectColor.getHexValue() ) );

			}

			if ( object.groundColor !== undefined && object.groundColor.getHex() !== objectGroundColor.getHexValue() ) {

				editor.execute( new SetColorCommand( editor, object, 'groundColor', objectGroundColor.getHexValue() ) );

			}

			if ( object.distance !== undefined && Math.abs( object.distance - objectDistance.getValue() ) >= 0.01 ) {

				editor.execute( new SetValueCommand( editor, object, 'distance', objectDistance.getValue() ) );

			}

			if ( object.angle !== undefined && Math.abs( object.angle - objectAngle.getValue() ) >= 0.01 ) {

				editor.execute( new SetValueCommand( editor, object, 'angle', objectAngle.getValue() ) );

			}

			if ( object.penumbra !== undefined && Math.abs( object.penumbra - objectPenumbra.getValue() ) >= 0.01 ) {

				editor.execute( new SetValueCommand( editor, object, 'penumbra', objectPenumbra.getValue() ) );

			}

			if ( object.decay !== undefined && Math.abs( object.decay - objectDecay.getValue() ) >= 0.01 ) {

				editor.execute( new SetValueCommand( editor, object, 'decay', objectDecay.getValue() ) );

			}

			if ( object.visible !== objectVisible.getValue() ) {

				editor.execute( new SetValueCommand( editor, object, 'visible', objectVisible.getValue() ) );

			}

			if ( object.receiveShadow !== objectReceiveShadow.getValue() ) {

				editor.execute( new SetValueCommand( editor, object, 'castShadow', objectCastShadow.getValue() ) );

			}

			if ( object.receiveShadow !== undefined && object.receiveShadow !== objectReceiveShadow.getValue() ) {

				if ( object.material !== undefined ) object.material.needsUpdate = true;
				editor.execute( new SetValueCommand( editor, object, 'receiveShadow', objectReceiveShadow.getValue() ) );

			}

			if ( object.shadow !== undefined ) {

				if ( object.shadow.bias !== objectShadowBias.getValue() ) {

					editor.execute( new SetValueCommand( editor, object.shadow, 'bias', objectShadowBias.getValue() ) );

				}

				if ( object.shadow.radius !== objectShadowRadius.getValue() ) {

					editor.execute( new SetValueCommand( editor, object.shadow, 'radius', objectShadowRadius.getValue() ) );

				}

				if ( object.shadow.normalBias !== objectShadowNormalBias.getValue() ) {

					editor.execute( new SetValueCommand( editor, object.shadow, 'normalBias', objectShadowNormalBias.getValue() ) );

				}

			}

			if ( object.type == 'Particle' ) {

				if ( Math.abs( object.group.maxParticleCount - particleCount.getValue() ) >= 0.01 ) {

					editor.execute( new SetParticleValueCommand( editor, object, 'group', 'maxParticleCount', particleCount.getValue() ) );

				}

				if ( Math.abs( object.group.blending - particleBlendMode.getValue() ) >= 0.01 ) {

					editor.execute( new SetParticleValueCommand( editor, object, 'group', 'blending', parseInt( particleBlendMode.getValue() ) ) );

				}

				if ( Math.abs( object.emitter.direction - particleDirection.getValue() ) >= 0.01 ) {

					editor.execute( new SetParticleValueCommand( editor, object, 'emitter', 'direction', parseInt( particleDirection.getValue() ) ) );

				}

				if ( Math.abs( object.emitter.particleCount - particleRate.getValue() ) >= 0.01 ) {

					editor.execute( new SetParticleValueCommand( editor, object, 'emitter', 'particleCount', particleRate.getValue() ) );

				}

				if ( object.emitter.duration && Math.abs( object.emitter.duration - particleDuration.getValue() ) >= 0.01 ) {

					editor.execute( new SetParticleValueCommand( editor, object, 'emitter', 'duration', particleDuration.getValue() ) );

				}

				if ( Math.abs( object.emitter.type - particleEmitterType.getValue() ) >= 0.01 ) {

					editor.execute( new SetParticleValueCommand( editor, object, 'emitter', 'type', parseInt( particleEmitterType.getValue() ) ) );

				}

				if ( Math.abs( object.emitter.maxAge.value - particleAgeF.getValue() ) >= 0.01 ) {

					editor.execute( new SetParticleValueCommand( editor, object, 'emitter.maxAge', 'value', particleAgeF.getValue() ) );

				}

				if ( Math.abs( object.emitter.maxAge.spread - particleAgePlusMinus.getValue() ) >= 0.01 ) {

					editor.execute( new SetParticleValueCommand( editor, object, 'emitter.maxAge', 'spread', particleAgePlusMinus.getValue() ) );

				}

				[ 'position', 'velocity', 'acceleration' ].map( t => {

					var newValue = new THREE.Vector3( particleSpeed[ t ].initial.x.getValue(), particleSpeed[ t ].initial.y.getValue(), particleSpeed[ t ].initial.z.getValue() );
					if ( object.emitter[ t ].value.distanceTo( newValue ) >= 0.01 ) {

						editor.execute( new SetParticleValueCommand( editor, object, 'emitter.' + t, 'value', newValue ) );

					}

					var newSpread = new THREE.Vector3( particleSpeed[ t ].variation.x.getValue(), particleSpeed[ t ].variation.y.getValue(), particleSpeed[ t ].variation.z.getValue() );
					if ( object.emitter[ t ].spread.distanceTo( newSpread ) >= 0.01 ) {

						editor.execute( new SetParticleValueCommand( editor, object, 'emitter.' + t, 'spread', newSpread ) );

					}

				} );

				if ( Math.abs( object.emitter.wiggle.value - particleWiggleF.getValue() ) >= 0.01 ) {

					editor.execute( new SetParticleValueCommand( editor, object, 'emitter.wiggle', 'value', particleWiggleF.getValue() ) );

				}

				if ( Math.abs( object.emitter.wiggle.spread - particleWigglePlusMinus.getValue() ) >= 0.01 ) {

					editor.execute( new SetParticleValueCommand( editor, object, 'emitter.wiggle', 'spread', particleWigglePlusMinus.getValue() ) );

				}

			}

		}

	}

	function updateUserData() {

		var object = editor.selected;

		if ( object ) {

			try {

				var userData = object.userData;

				userData[ 'movement' ] = getMovementData( object );

				if ( object.isMesh ) {

					userData[ 'selectable' ] = getSelectableData();

				}

				editor.execute( new SetValueCommand( editor, object, 'userData', userData ) );

			} catch ( exception ) {

				console.warn( exception );

			}

		}

	}

	function getMovementData( object ) {

		var movement = {};
		var controllerType = objectControllerType.getValue();

		if ( object.userData.movement && object.userData.movement.customLimit ) {

			movement.customLimit = object.userData.movement.customLimit;

		}

		for ( var key in objectMovement ) {

			movement[ key ] = {};

			var object = ( key == 'controller' ? objectMovement.controller[ controllerType ] : objectMovement[ key ] );

			for ( var id in object ) {

				if ( id !== 'rows' ) {

					movement[ key ][ id ] = object[ id ].getValue();

				}

			}

			if ( key == 'controller' )
				movement[ 'controller' ][ 'type' ] = controllerType;

		}

		return movement;

	}

	function getSelectableData() {

		var selectable = { drag: {} };

		selectable.selected = objectSelected.getValue();
		selectable.canSelect = objectCanSelect.getValue();
		selectable.canDeselect = objectCanDeselect.getValue();

		selectable.drag.type = objectDragType.getValue();

		if ( selectable.drag.type != 'none' ) {

			[ 'x', 'y', 'z' ].map( axis => {

				selectable.drag[ axis ] = objectSelectableAxis[ axis ].getValue();

			} );

			selectableKeys.map( key => {

				selectable.drag[ key ] = objectSelectableTransform[ key ].getValue();

			} );

			if ( selectable.drag.type == 'transform' ) {

				selectable.drag.show = objectSelectableHandleShow.getValue();

			}

		}

		return selectable;

	}

	function movementSelectChanged() {

		updateMovementRows( editor.selected );

		var lookAtUuid = objectMovement.lookAt.uuid.getValue();
		var goToUuid = objectMovement.goTo.uuid.getValue();
		updateMovementUI( editor.selected );
		objectMovement.lookAt.uuid.setValue( lookAtUuid );
		objectMovement.goTo.uuid.setValue( goToUuid );

		updateUserData();

	}

	function selectableSelectChanged() {

		updateDragRows();

		var handleShow = objectSelectableHandleShow.getValue();
		updateSelectableUI( editor.selected );
		objectSelectableHandleShow.setValue( handleShow );

		updateUserData();

	}

	function updateDragRows() {

		var dragType = objectDragType.getValue();

		objectSelectableAxisRow.setDisplay( dragType == 'none' ? 'none' : '' );
		objectSelectableHandleShowRow.setDisplay( dragType != 'transform' ? 'none' : '' );
		objectSelectableTransformRow.setDisplay( dragType != 'transform' ? 'none' : '' );

	}

	function updateMovementRows( object ) {

		for ( var key in objectMovementRows ) {

			if ( key != 'controller' )
				objectMovementRows[ key ].setDisplay( '' );

		}

		if ( object.isCamera || object.type == 'Particle' ) {

			[ 'grow', 'scaleLimit', 'lookAt' ].map( t => {

				objectMovementRows[ t ].setDisplay( 'none' );

			} );

		} else if ( object.isLight ) {

			[ 'grow', 'scaleLimit', 'rotationLimit', 'lookAt' ].map( t => {

				objectMovementRows[ t ].setDisplay( 'none' );

			} );

			objectMovementRows[ 'rotation' ].setDisplay( object.isRectAreaLight ? '' : 'none' );

		}

		for ( var key in objectMovementRows.controller ) {

			var controllerType = objectControllerType.getValue();
			objectMovementRows.controller[ key ].setDisplay( key == controllerType ? '' : 'none' );

		}

		[ 'lookAt', 'goTo' ].map( key => {

			var uuid = objectMovement[ key ].uuid.getValue();
			objectMovement[ key ].label.setDisplay( uuid == 'cursor' || uuid == 'none' || uuid == undefined ? 'none' : '' );
			objectMovement[ key ].speed.setDisplay( uuid == 'cursor' || uuid == 'none' || uuid == undefined ? 'none' : '' );
			objectMovementRows[ key + 'Axis' ].setDisplay( uuid == 'location' ? '' : 'none' );
			objectMovementRows[ key + 'AxisEnabled' ].setDisplay( uuid != 'cursor' && uuid != 'location' && uuid != 'none' && uuid != undefined ? '' : 'none' );

		} );

	}

	function updateRows( object ) {

		var properties = {
			'width': objectWidthRow,
			'height': objectHeightRow,
			'fov': objectFovRow,
			'left': objectLeftRow,
			'right': objectRightRow,
			'top': objectTopRow,
			'bottom': objectBottomRow,
			'near': objectNearRow,
			'far': objectFarRow,
			'intensity': objectIntensityRow,
			'color': objectColorRow,
			'groundColor': objectGroundColorRow,
			'distance': objectDistanceRow,
			'angle': objectAngleRow,
			'penumbra': objectPenumbraRow,
			'decay': objectDecayRow,
			'castShadow': objectCastShadowRow,
			'receiveShadow': objectReceiveShadowRow,
			'shadow': [ objectShadowBiasRow, objectShadowNormalBiasRow, objectShadowRadiusRow ]
		};

		for ( var property in properties ) {

			var uiElement = properties[ property ];

			if ( Array.isArray( uiElement ) === true ) {

				for ( var i = 0; i < uiElement.length; i ++ ) {

					uiElement[ i ].setDisplay( object[ property ] !== undefined ? '' : 'none' );

				}

			} else {

				uiElement.setDisplay( object[ property ] !== undefined ? '' : 'none' );

			}

		}

		// Movement

		objectMovementRow.setDisplay( object.isScene ? 'none' : '' );
		objectLimitRow.setDisplay( object.isScene || object.type == 'Particle' ? 'none' : '' );

		var controllerType = object.userData.movement ? object.userData.movement.controller.type : 'none';
		if ( object.isCamera ) {

			objectControllerType.setOptions( {
				'none': 'None',
				'orbit': 'Orbit',
				'map': 'Map',
				'pointerLock': 'Pointer lock',
				'lookAt': 'Look at',
				'follow': 'Follow',
				'wasdrf': 'WASDRF'
			} ).setValue( controllerType );

		} else {

			objectControllerType.setOptions( {
				'none': 'None',
				'basic': 'Keyboard',
				'bounce': 'Bounce'
			} ).setValue( controllerType );

		}

		updateMovementRows( object );

		// Selectable

		objectSelectableRow.setDisplay( object.isMesh ? '' : 'none' );

		var dragType = object.userData.selectable ? object.userData.selectable.drag.type : 'none';
		objectDragType.setValue( dragType );

		updateDragRows();

		// Lens

		objectLensRow.setDisplay( object.isCamera ? '' : 'none' );

		// Styling

		objectStylingRow.setDisplay( object.isLight || object.type == 'Particle' ? '' : 'none' );

		particleStylingDiv.setDisplay( object.type == 'Particle' ? '' : 'none' );

		//

		if ( object.isLight ) {

			objectReceiveShadow.setDisplay( 'none' );

		}

		if ( object.isAmbientLight || object.isHemisphereLight ) {

			objectCastShadowRow.setDisplay( 'none' );

		}

	}

	function updateSpacialRows( object ) {

		if ( object.isLight ||
		   ( object.isObject3D && object.userData.targetInverse ) ) {

			objectSpacialRows.rotation.setDisplay( object.isRectAreaLight ? '' : 'none' );
			objectSpacialRows.scale.setDisplay( 'none' );

		} else {

			objectSpacialRows.rotation.setDisplay( '' );
			objectSpacialRows.scale.setDisplay( '' );

		}

	}

	function updateMovementUI( object ) {

		var movement = object.userData.movement;
		var controllerType = objectControllerType.getValue();

		for ( var key in objectMovement ) {

			var dataObj = key == 'controller' ? objectMovement[ key ][ controllerType ] : objectMovement[ key ];

			for ( var id in dataObj ) {

				if ( id != 'label' ) {

					var value = '';
					var l = id.toLowerCase();

					if ( movement != undefined && movement[ key ][ id ] != undefined ) {

						value = movement[ key ][ id ];

					} else if ( l == 'x' || l == 'y' || l == 'z' || l == 'yposition' || ( l == 'speed' && key == 'lookAt' ) || id.includes( 'min' ) ) {

						value = 0;

					} else if ( l.includes( 'speed' ) ) {

						value = 1;

					} else if ( id.includes( 'max' ) ) {

						value = 100;

					} else if ( l.includes( 'enabled' ) ) {

						value = false;

					} else if ( l == 'uuid' ) {

						value = 'none';

					} else if ( l == 'distance' ) {

						value = 5;

					} else {

						value = '?';

					}

					dataObj[ id ].setValue( value );

				}

			}

		}

	}

	function updateSelectableUI( object ) {

		var selectable = object.userData.selectable;

		objectSelected.setValue( selectable ? selectable.selected : false );
		objectCanSelect.setValue( selectable ? selectable.canSelect : true );
		objectCanDeselect.setValue( selectable ? selectable.canDeselect : true );

		[ 'x', 'y', 'z' ].map( axis => {

			objectSelectableAxis[ axis ].setValue( selectable && selectable.drag.type != 'none' ? selectable.drag[ axis ] : true );

		} );

		objectSelectableHandleShow.setValue( selectable && selectable.drag.type == 'transform' ? selectable.drag.show : 'when selected' );

		selectableKeys.map( key => {

			objectSelectableTransform[ key ].setValue( selectable && selectable.drag.type == 'transform' ? selectable.drag[ key ] : '?' );

		} );

	}

	function updateCustsomLimitUI( object ) {

		customLimits.clear();

		if ( object.userData.movement && object.userData.movement.customLimit ) {

			for ( var limit of object.userData.movement.customLimit ) {

				( function ( limit ) {

					var row = new UIRow();
					row.add( new UIText( limit.name ) );

					var enabled = new UIStyledCheckbox( limit.enabled ).setIdFor( 'custom-limit-' + ( limit.type == 'object' ? limit.uuid : limit.name ) );
					enabled.onChange( function () {

						var index = object.userData.movement.customLimit.indexOf( limit );
						object.userData.movement.customLimit[ index ].enabled = this.getValue();
						updateUserData();

					} );
					row.add( enabled );

					var remove = new UIImage( config.getImage( 'engine-ui/close-delete-btn.svg' ) );
					remove.setWidth( '10px' );
					remove.onClick( function () {

						if ( confirm( 'Are you sure?' ) ) {

							var index = object.userData.movement.customLimit.indexOf( limit );

							if ( index != - 1 ) {

								object.userData.movement.customLimit.splice( index, 1 );
								row.delete();
								updateUserData();

							}

						}

					} );
					row.add( remove );

					customLimits.add( row );

				} )( limit );

			}

		}

		limitDropdownRow.setDisplay( 'none' );

	}

	function updateUI( object ) {

		if ( ! object.isScene ) {

			updateMovementUI( object );
			updateCustsomLimitUI( object );

		}

		if ( object.isMesh ) {

			updateSelectableUI( object );

		}

		[ 'position', 'rotation', 'scale' ].map( ( spacial ) => {

			[ 'x', 'y', 'z' ].map( ( axis ) => {

				objectSpacials[ spacial ][ axis ].value.setValue( spacial == 'rotation' ? object[ spacial ][ axis ] * THREE.MathUtils.RAD2DEG : object[ spacial ][ axis ] );

			} );

		} );

		updateConnectionUI( object );

		if ( object.width !== undefined ) {

			objectWidth.setValue( object.width );

		}

		if ( object.height !== undefined ) {

			objectHeight.setValue( object.height );

		}

		if ( object.fov !== undefined ) {

			objectFov.setValue( object.fov );

		}

		if ( object.left !== undefined ) {

			objectLeft.setValue( object.left );

		}

		if ( object.right !== undefined ) {

			objectRight.setValue( object.right );

		}

		if ( object.top !== undefined ) {

			objectTop.setValue( object.top );

		}

		if ( object.bottom !== undefined ) {

			objectBottom.setValue( object.bottom );

		}

		if ( object.near !== undefined ) {

			objectNear.setValue( object.near );

		}

		if ( object.far !== undefined ) {

			objectFar.setValue( object.far );

		}

		if ( object.intensity !== undefined ) {

			objectIntensity.setValue( object.intensity );

		}

		if ( object.color !== undefined ) {

			objectColor.setHexValue( object.color.getHexString() );

		}

		if ( object.groundColor !== undefined ) {

			objectGroundColor.setHexValue( object.groundColor.getHexString() );

		}

		if ( object.distance !== undefined ) {

			objectDistance.setValue( object.distance );

		}

		if ( object.angle !== undefined ) {

			objectAngle.setValue( object.angle );

		}

		if ( object.penumbra !== undefined ) {

			objectPenumbra.setValue( object.penumbra );

		}

		if ( object.decay !== undefined ) {

			objectDecay.setValue( object.decay );

		}

		if ( object.castShadow !== undefined ) {

			objectCastShadow.setValue( object.castShadow );

		}

		if ( object.receiveShadow !== undefined ) {

			objectReceiveShadow.setValue( object.receiveShadow );

		}

		if ( object.shadow !== undefined ) {

			objectShadowBias.setValue( object.shadow.bias );
			objectShadowNormalBias.setValue( object.shadow.normalBias );
			objectShadowRadius.setValue( object.shadow.radius );

		}

		objectVisible.setValue( object.visible );

		updateSpacialRows( object );

		if ( object.type == 'Particle' ) {

			particleTexture.setValue( object.group.texture );
			particleCount.setValue( object.group.maxParticleCount );
			particleBlendMode.setValue( object.group.blending );
			particleDirection.setValue( object.emitter.direction );
			particleRate.setValue( object.emitter.particleCount );
			particleDuration.setValue( object.emitter.duration ? object.emitter.duration : 0 );
			particleEmitterType.setValue( object.emitter.type );
			particleAgeF.setValue( object.emitter.maxAge.value );
			particleAgePlusMinus.setValue( object.emitter.maxAge.spread );

			[ 'position', 'velocity', 'acceleration' ].map( t => {

				[ 'x', 'y', 'z' ].map( x => {

					particleSpeed[ t ][ 'initial' ][ x ].setValue( object.emitter[ t ].value[ x ] );
					particleSpeed[ t ][ 'variation' ][ x ].setValue( object.emitter[ t ].spread[ x ] );

				} );

			} );

			particleWiggleF.setValue( object.emitter.wiggle.value );
			particleWigglePlusMinus.setValue( object.emitter.wiggle.spread );

			particleOpacity.setValue( object.emitter.opacity.value );
			particleOpacity.setValue( object.emitter.opacity.spread, 'spread' );
			particleOpacity.updateSize();
			particleScale.setValue( object.emitter.size.value );
			particleScale.setValue( object.emitter.size.spread, 'spread' );
			particleScaleMin.setValue( particleScale.min );
			particleScaleMax.setValue( particleScale.max );
			particleScale.updateSize();
			particleRotation.setValue( object.emitter.angle.value );
			particleRotation.setValue( object.emitter.angle.spread, 'spread' );
			particleRotationMin.setValue( particleRotation.min );
			particleRotationMax.setValue( particleRotation.max );
			particleRotation.updateSize();

			particleBaseColor.setValue( object.emitter.color.value );
			particleBaseColor.updateSize();

			var colorSpread = [];
			for ( var i = 0; i < 4; i ++ ) {

				var color = object.emitter.color.spread[ i ];
				colorSpread.push( new THREE.Color( color.x, color.y, color.z ) );

			}

			particleSpreadColor.setValue( colorSpread );
			particleSpreadColor.updateSize();

		}

	}

	function updateLimitDropdown() {

		var options = Object.assign( {}, editor.objects );

		Object.keys( editor.tags ).map( name => {

			options[ 'tag/' + name ] = name;

		} );

		limitDropdown.setOptions( options );

	}

	function updateObjectMovementDropdowns(object) {
		if (object.isCamera || object.isMesh || object.isGroup) {
			objectMovement.goTo.uuid.setOptions(Object.assign({
				none: 'None',
				location: 'Location'
			}, editor.objects));

			objectMovement.lookAt.uuid.setOptions(Object.assign({
				none: 'None',
				location: 'Location',
				cursor: 'Cursor Location'
			}, editor.objects));

			objectMovement.controller.lookAt.uuid.setOptions(Object.assign({
				none: 'None'
			}, editor.objects));

			objectMovement.controller.follow.uuid.setOptions(Object.assign({
				none: 'None'
			}, editor.objects));
		}

	}

	function updateConnectionUI( object ) {

		if ( object.userData.connection ) {

			[ 'position', 'rotation', 'scale' ].map( ( spacial ) => {

				[ 'x', 'y', 'z' ].map( ( axis ) => {

					var connection = object.userData.connection[ spacial ][ axis ];

					objectSpacials[ spacial ][ axis ].conn_image.setDisplay( connection ? '' : 'none' );
					objectSpacials[ spacial ][ axis ].conn_image.setSrc( config.getImage( connection && connection.mouse == 'wheel' ? 'engine-ui/wheel.svg' : 'engine-ui/cursor.svg' ) );
					objectSpacials[ spacial ][ axis ].conn_label.setDisplay( connection && connection.mouse != 'wheel' ? '' : 'none' );
					objectSpacials[ spacial ][ axis ].label.setDisplay( connection ? 'none' : '' );
					objectSpacials[ spacial ][ axis ].value.setDisplay( connection ? 'none' : '' );

					if ( connection && connection.mouse != 'wheel' ) objectSpacials[ spacial ][ axis ].conn_label.setValue( connection.mouse.toUpperCase() );

				} );

			} );

		}

	}

	function updateSpacialConnectionRows( spacial, axis ) {

		[ 'position', 'rotation', 'scale' ].map( ( s ) => {

			var connection = editor.selected.userData.connection;

			if ( s == spacial && connection && connection[ s ][ axis ] ) objectSpacialConnections[ s ].setValues( connection[ s ][ axis ] );

			objectSpacialConnections[ s ].setAxis( axis );
			objectSpacialConnections[ s ].setDisplay( s == spacial ? '' : 'none' );

		} );

	}

	function updateMovementConnection() {

	}

	function updateMovementConnectionUI() {

	}

	// events

	signals.cameraChanged.add( function ( camera ) {

		if ( editor.selected == camera ) {

			[ 'position', 'rotation' ].map( ( spacial ) => {

				[ 'x', 'y', 'z' ].map( ( axis ) => {

					objectSpacials[ spacial ][ axis ].value.setValue( spacial == 'rotation' ? camera[ spacial ][ axis ] * THREE.MathUtils.RAD2DEG : camera[ spacial ][ axis ] );

				} );

			} );

		}

	} );

	signals.objectSelected.add( function ( object ) {

		if ( object !== null ) {

			container.setDisplay( 'block' );

			updateRows( object );
			updateUI( object );

		} else {

			container.setDisplay( 'none' );

		}

	} );

	signals.objectChanged.add( function ( object ) {

		if ( object !== editor.selected ) return;

		updateObjectMovementDropdowns( object );
		updateLimitDropdown();

		updateUI( object );

	} );

	signals.objectAdded.add( function ( object ) {

		updateObjectMovementDropdowns( object );
		updateLimitDropdown();

	} );

	signals.objectRemoved.add( function ( object ) {

		updateObjectMovementDropdowns( object );
		updateLimitDropdown();

	} );

	signals.tagChanged.add( function () {

		updateLimitDropdown( );

	} );

	signals.tagAdded.add( function () {

		updateLimitDropdown();

	} );

	signals.tagRemoved.add( function () {

		updateLimitDropdown();

	} );

	signals.refreshSidebarObject3D.add( function ( object ) {

		if ( object !== editor.selected ) return;

		updateUI( object );

	} );

	return container;

}

export { SidebarObject };
