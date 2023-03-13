/**
 * @author mrdoob / http://mrdoob.com/
 */

import { UIText, UIRow, UINumber } from '../components/ui.js';
import { UIStyledCheckbox, UIAccordion  } from '../components/ui.openstudio.js';

var SidebarSettingsWorkspace = function ( editor ) {

	var config = editor.config;
	var signals = editor.signals;
	var strings = editor.strings;

	var container = new UIAccordion();
	container.setTitle( strings.getKey( 'sidebar/settings/workspace' ) );

	var helperHideShowRow = new UIRow();
	helperHideShowRow.setBackground( 'rgba(49, 55, 75, 0.26)' );
	helperHideShowRow.add( new UIText( strings.getKey( 'sidebar/settings/workspace/helper') ) );
	helperHideShowRow.add( new UIText( strings.getKey( 'sidebar/settings/workspace/helper/hotkey') ) );

	var gridRow = new UIRow();
	var show = new UIStyledCheckbox( true ).setIdFor('showGrid').onChange( function () {
    
		signals.showGridHelperChanged.dispatch( show.getValue() );

	} );

	gridRow.add( new UIText( strings.getKey( 'sidebar/settings/workspace/grid' ) ) );
	gridRow.add( show );

	var lightsRow = new UIRow();
	var lights = new UIStyledCheckbox( true ).setIdFor( 'lightsShow' ).onChange( function () {

		signals.showLightHelpersChanged.dispatch( lights.getValue() );

	} );

	lightsRow.add( new UIText( strings.getKey( 'sidebar/settings/workspace/lights' ) ) );
	lightsRow.add( lights );
	
	var camerasRow = new UIRow();
	var cameras = new UIStyledCheckbox( true ).setIdFor( 'camerasShow' ).onChange( function () {

		signals.showCameraHelpersChanged.dispatch( cameras.getValue() );

	} );

	camerasRow.add( new UIText( strings.getKey( 'sidebar/settings/workspace/cameras' ) ) );
	camerasRow.add( cameras );

	var compassRow = new UIRow();
	var compass = new UIStyledCheckbox( true ).setIdFor( 'compassShow' ).onChange( function () {

		signals.showCompassChanged.dispatch( compass.getValue() );

	} );

	compassRow.add( new UIText( strings.getKey( 'sidebar/settings/workspace/compass' ) ) );
	compassRow.add( compass );

	container.addToBody( helperHideShowRow, gridRow, lightsRow, camerasRow, compassRow );

	var snapSettingsRow = new UIRow();
	snapSettingsRow.setBackground( 'rgba(49, 55, 75, 0.26)' );
	snapSettingsRow.add( new UIText( strings.getKey( 'sidebar/settings/workspace/snap' ) ) );

	var snapPositionRow = new UIRow();
	var snapPosition = new UINumber( config.getKey( 'project/snap/translate' ) ).onChange( function () {

		config.saveKey( 'project/snap/translate', this.getValue() );
		signals.snapChanged.dispatch( editor.snapEnabled );

	} );

	snapPositionRow.add( new UIText( strings.getKey( 'sidebar/settings/workspace/snap/translate' ) ) );
	snapPositionRow.add( snapPosition );

	var snapRotationRow = new UIRow();
	var snapRotation = new UINumber( config.getKey( 'project/snap/rotate' ) ).onChange( function () {

		config.saveKey( 'project/snap/rotate', this.getValue() );
		signals.snapChanged.dispatch( editor.snapEnabled );

	} );

	snapRotationRow.add( new UIText( strings.getKey( 'sidebar/settings/workspace/snap/rotate' ) ) );
	snapRotationRow.add( snapRotation );

	var snapScaleRow = new UIRow();
	var snapScale = new UINumber( config.getKey( 'project/snap/scale' ) ).onChange( function () {

		config.saveKey( 'project/snap/scale', this.getValue() );
		signals.snapChanged.dispatch( editor.snapEnabled );

	} );

	snapScaleRow.add( new UIText( strings.getKey( 'sidebar/settings/workspace/snap/scale' ) ) );
	snapScaleRow.add( snapScale );

	container.addToBody( snapSettingsRow, snapPositionRow, snapRotationRow, snapScaleRow );

	var navigationSettingsRow = new UIRow();
	navigationSettingsRow.setBackground( 'rgba(49, 55, 75, 0.26)' );
	navigationSettingsRow.add( new UIText( strings.getKey( 'sidebar/settings/workspace/navigation' ) ) );

	var navigationMovementSpeedRow = new UIRow();
	var navigationMovementSpeed = new UINumber( config.getKey( 'project/navigation/WASDRF/movement' ) ).onChange( function () {

		signals.viewportWASDRFSpeedChanged.dispatch( navigationMovementSpeed.getValue(), navigationPointerSpeed.getValue() );
		config.saveKey( 'project/navigation/WASDRF/movement', this.getValue() );

	} );

	navigationMovementSpeedRow.add( new UIText( strings.getKey( 'sidebar/settings/workspace/navigation/WASDRF/movement' ) ) );
	navigationMovementSpeedRow.add( navigationMovementSpeed );
	
	var navigationPointerSpeedRow = new UIRow();
	var navigationPointerSpeed = new UINumber( config.getKey( 'project/navigation/WASDRF/pointer' ) ).onChange( function () {

		signals.viewportWASDRFSpeedChanged.dispatch( navigationMovementSpeed.getValue(), navigationPointerSpeed.getValue() );
		config.saveKey( 'project/navigation/WASDRF/pointer', this.getValue() );

	} );

	navigationPointerSpeedRow.add( new UIText( strings.getKey( 'sidebar/settings/workspace/navigation/WASDRF/pointer' ) ) );
	navigationPointerSpeedRow.add( navigationPointerSpeed );

	var navigationZoomSpeedRow = new UIRow();
	var navigationZoomSpeed = new UINumber( config.getKey( 'project/zoomSpeed' ) ).onChange( function () {

		signals.viewportZoomSpeedChanged.dispatch( navigationZoomSpeed.getValue() );
		config.saveKey( 'project/zoomSpeed', this.getValue() );

	} );

	navigationZoomSpeedRow.add( new UIText( strings.getKey( 'sidebar/settings/workspace/zoom_speed' ) ) );
	navigationZoomSpeedRow.add( navigationZoomSpeed );

	container.addToBody( navigationSettingsRow, navigationMovementSpeedRow, navigationPointerSpeedRow, navigationZoomSpeedRow );

	return container;

};

export { SidebarSettingsWorkspace };
