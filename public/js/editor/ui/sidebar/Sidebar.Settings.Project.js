import * as THREE from '../../libs/three.module.js';

import { UIRow, UIText, UIPanel, UINumber, UIDiv, UIImage } from '../components/ui.js';
import { UIAccordion, UIStyledCheckbox, UIDropdown } from '../components/ui.openstudio.js';
import { ViewportInfo } from '../Viewport.Info.js';

var SidebarSettingsProject = function ( editor ) {

	var api = editor.api;
	var config = editor.config;
	var signals = editor.signals;
	var strings = editor.strings;

	var currentRenderer = null;

	var container = new UIAccordion().setTitle( strings.getKey( 'sidebar/project' ) );

	// Title

	var titleRow = new UIRow();
	var title = new UIText( config.getKey( 'project/name' ) );
	titleRow.add( new UIText( strings.getKey( 'sidebar/project/name' ) ) );
	titleRow.add( title );

	container.addToBody( titleRow );

	// var imageRow = new UIRow().addClass( 'image-select' );
	// var image = new UIDiv().setClass( 'ProjectImage' );
	// var mark = new UIImage( config.getImage( 'misc/questionmark.png' ) ).setWidth( '15px' );

	// if ( config.getKey( 'project/thumbnail' ) ) {
	
	// 	updateProjectImage( config.getKey( 'project/thumbnail' ) );

	// }

	// image.add( mark );
	// imageRow.add( new UIText( strings.getKey( 'sidebar/project/thumbnail' ) ) );
	// imageRow.add( image );

	// image.onClick( function () {

	// 	UtilsHelper.chooseFile( function ( files ) {

	// 		var formData = new FormData();
	// 		formData.append( 'id', editor.projectId );
	// 		formData.append( 'thumbnail', files[0] );

	// 		api.post( '/asset/project/thumbnail', formData ).then( res => {

	// 			updateProjectImage( res.url );

	// 		} );

	// 	} );

	// } );

	// container.addToBody( imageRow );

	// Editable

	var editableRow = new UIRow();
	var editable = new UIStyledCheckbox( config.getKey( 'project/editable' ) ).setIdFor( 'projectEditable' ).onChange( function () {

		config.saveKey( 'project/editable', this.getValue() );

	} );

	editableRow.add( new UIText( strings.getKey( 'sidebar/project/editable' ) ) );
	editableRow.add( editable );

	container.addToBody( editableRow );

	// WebVR

	var vrRow = new UIRow();
	var vr = new UIStyledCheckbox( config.getKey( 'project/vr' ) ).setIdFor( 'project-vr' ).onChange( function () {

		config.saveKey( 'project/vr', this.getValue() );

	} );

	vrRow.add( new UIText( strings.getKey( 'sidebar/project/vr' ) ) );
	vrRow.add( vr );

	container.addToBody( vrRow );

	// Renderer / Antialias

	var rendererAntialiasRow = new UIRow();
	var antialiasBoolean = new UIStyledCheckbox( config.getKey( 'project/renderer/antialias' ) ).setIdFor('rendererAntialias').onChange( function () {

		createRenderer();
		if (!editor.scene.userData.backgroundTexture) {
			if (editor.scene.userData.background){
				var id = editor.scene.userData.background.id;
				var assetEnvironment = editor.assets.get('Image', 'id', id);
				if (assetEnvironment) {
					var texture = assetEnvironment.texture;
				
					editor.signals.sceneBackgroundTypeChanged.dispatch('Equirectangular', id, texture);
				}
			}
		}

	} );
	
	rendererAntialiasRow.add( new UIText( strings.getKey( 'sidebar/project/antialias' ) ) );
	rendererAntialiasRow.add( antialiasBoolean );

	container.addToBody( rendererAntialiasRow );

	// Renderer / Shadows

	var rendererShadowsRow = new UIRow();
	var shadowsBoolean = new UIStyledCheckbox( config.getKey( 'project/renderer/shadows' ) ).setIdFor('rendererShadows').onChange( function () {

		currentRenderer.shadowMap.enabled = this.getValue();
		signals.rendererUpdated.dispatch();

	} );

	rendererShadowsRow.add( new UIText( strings.getKey( 'sidebar/project/shadows' ) ) );
	rendererShadowsRow.add( shadowsBoolean );

	container.addToBody( rendererShadowsRow );

	// Renderer / Shadow Type

	var shadowTypeRow = new UIRow();
	var shadowTypeSelect = new UIDropdown().setOptions( {
		0: 'Basic',
		1: 'PCF',
		2: 'PCF (Soft)',
		//	3: 'VSM'
	} ).onChange( function () {

		currentRenderer.shadowMap.type = parseFloat( this.getValue() );
		signals.rendererUpdated.dispatch();

	} );
	shadowTypeSelect.setValue( config.getKey( 'project/renderer/shadowType' ) );

	shadowTypeRow.add( new UIText( strings.getKey( 'sidebar/project/shadowType' ) ) );
	shadowTypeRow.add( shadowTypeSelect );

	container.addToBody( shadowTypeRow );

	// Renderer / Physically Correct lights

	var physicallyCorrectLightsRow = new UIRow();
	var physicallyCorrectLightsBoolean = new UIStyledCheckbox( config.getKey( 'project/renderer/physicallyCorrectLights' ) ).setIdFor( 'physicallyCorrectLightsBoolean' ).onChange( function () {

		currentRenderer.physicallyCorrectLights = this.getValue();
		signals.rendererUpdated.dispatch();

	} );

	physicallyCorrectLightsRow.add( new UIText( strings.getKey( 'sidebar/project/physicallyCorrectLights' ) ) );
	physicallyCorrectLightsRow.add( physicallyCorrectLightsBoolean );

	container.addToBody( physicallyCorrectLightsRow );

	// Renderer / Tonemapping

	var toneMapping = new UIPanel();

	// Tonemapping / Type

	var toneMappingTypeRow = new UIRow();
	var rendererToneMappingTypeLabel = new UIText( strings.getKey( 'sidebar/project/toneMapping' ) );

	var toneMappingSelect = new UIDropdown().setOptions( {
		0: 'None',
		1: 'Linear',
		2: 'Reinhard',
		3: 'Uncharted2',
		4: 'Cineon',
		5: 'ACESFilmic',
	} ).onChange( function () {

		currentRenderer.toneMapping = parseFloat( this.getValue() );
		toneMappingExposure.setDisplay( currentRenderer.toneMapping === 0 ? 'none' : '' );
		signals.rendererUpdated.dispatch();

	} );
	toneMappingSelect.setValue( config.getKey( 'project/renderer/toneMapping' ) );
	toneMappingTypeRow.add( rendererToneMappingTypeLabel, toneMappingSelect );
	toneMapping.add( toneMappingTypeRow );

	// Tonemapping / Exposure

	var toneMappingExposureRow = new UIRow();
	var rendererToneMappingExposureLabel = new UIText( strings.getKey( 'sidebar/project/toneMappingExposure' ) );
	var toneMappingExposure = new UINumber( config.getKey( 'project/renderer/toneMappingExposure' ) ).setRange( 0, 10 ).onChange( function () {

		currentRenderer.toneMappingExposure = this.getValue();
		signals.rendererUpdated.dispatch();

	} );
	toneMappingExposure.setDisplay( toneMappingSelect.getValue() === '0' ? 'none' : '' );
	toneMappingExposureRow.add( rendererToneMappingExposureLabel, toneMappingExposure );
	toneMapping.add( toneMappingExposureRow );

	container.addToBody( new ViewportInfo( editor ) );
	
	var autoSaveRow = new UIRow();
	var autoSave = new UIStyledCheckbox( config.getKey( 'autosave' ) ).setIdFor('autoSave').onChange( function () {

		var value = this.getValue();

		config.saveKey( 'autosave', value );

		if ( value === true ) {

			signals.sceneGraphChanged.dispatch();

		}


	} );

	autoSaveRow.add( new UIText( strings.getKey( 'sidebar/project/autosave' ) ) );
	autoSaveRow.add( autoSave );

	container.addToBody( autoSaveRow );

	var sizeRow = new UIRow();
	sizeRow.add( new UIText( strings.getKey( 'sidebar/project/size' ) ) );
	sizeRow.add( new UIText( editor.storage.size ? filesize( editor.storage.size ) : '0 B' ) );

	container.addToBody( sizeRow );
	
	//

	function createRenderer() {

		currentRenderer = new THREE.WebGLRenderer( { antialias: antialiasBoolean.getValue() } );
		currentRenderer.outputEncoding = THREE.sRGBEncoding;
		currentRenderer.physicallyCorrectLights = physicallyCorrectLightsBoolean.getValue();
		currentRenderer.shadowMap.enabled = shadowsBoolean.getValue();
		currentRenderer.shadowMap.type = parseFloat( shadowTypeSelect.getValue() );	
		currentRenderer.toneMapping = parseFloat( toneMappingSelect.getValue() );
		currentRenderer.toneMappingExposure = toneMappingExposure.getValue();

		signals.rendererChanged.dispatch( currentRenderer );

	}

	function refreshRendererUI() {

		physicallyCorrectLightsBoolean.setValue( currentRenderer.physicallyCorrectLights );
		shadowsBoolean.setValue( currentRenderer.shadowMap.enabled );
		shadowTypeSelect.setValue( currentRenderer.shadowMap.type );
		toneMappingSelect.setValue( currentRenderer.toneMapping );
		toneMappingExposure.setValue( currentRenderer.toneMappingExposure );
		toneMappingExposure.setDisplay( currentRenderer.toneMapping === 0 ? 'none' : '' );

	}

	// function updateProjectImage( url ) {

	// 	mark.setSrc( url );
	// 	mark.setHeight( '100%' );
	// 	mark.setWidth( 'auto' );
		
	// }

	createRenderer();

	// signals

	signals.editorCleared.add( function () {

		currentRenderer.physicallyCorrectLights = false;
		currentRenderer.shadowMap.enabled = true;
		currentRenderer.shadowMap.type = 1;
		currentRenderer.toneMapping = 0;
		currentRenderer.toneMappingExposure = 1;

		refreshRendererUI();

		signals.rendererUpdated.dispatch();

	} );

	signals.titleChanged.add( function ( value ) {

		title.setValue( value.name );

	});

	signals.rendererUpdated.add( function () {

		config.saveKey(
			'project/renderer/antialias', antialiasBoolean.getValue(),
			'project/renderer/physicallyCorrectLights', physicallyCorrectLightsBoolean.getValue(),
			'project/renderer/shadows', shadowsBoolean.getValue(),
			'project/renderer/shadowType', parseFloat( shadowTypeSelect.getValue() ),
			'project/renderer/toneMapping', parseFloat( toneMappingSelect.getValue() ),
			'project/renderer/toneMappingExposure', toneMappingExposure.getValue()
		);

	} );

	return container;

};

export { SidebarSettingsProject };
