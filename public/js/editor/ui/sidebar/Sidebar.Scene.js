import { UIPanel, UIRow, UIDiv, UIText, UINumber, UIImage } from '../components/ui.js';
import { UIColorPicker, UIAccordion, UIStyledCheckbox, UIDropdown } from '../components/ui.openstudio.js';
import { UIOutliner, UITexture, UINewTexture, UIEnvTexture} from '../components/ui.three.js';

import { SidebarObject } from './Sidebar.Object.js';
import { SidebarGeometry } from './Sidebar.Geometry.js';
import { SidebarMaterial } from './Sidebar.Material.js';
import { SidebarAnimation } from './Sidebar.Animation.js';
import { SidebarAttribute } from './Sidebar.Attribute.js';
import { SidebarTag } from './Sidebar.Tag.js';
import { SidebarColorPicker } from './Sidebar.ColorPicker.js';
import { SetVisibleCommand } from '../../commands/SetVisibleCommand.js';

import { Assets } from '../Assets.js';
import { Asset } from '../../assets/Asset.js';
import { ImageAsset } from '../../assets/ImageAsset.js';

function SidebarScene ( editor ) {

	var scope = this;

	this.backgroundValueInitiated = false;
	this.equirectValueInitiated = false;
	var signals = editor.signals;
	var strings = editor.strings;
	var config = editor.config;

	var container = new UIPanel().setId('scene-panel');

	var cameraCheckboxes = {};

	// outliner

	var nodeStates = new WeakMap();

	var scope = this;

	function buildOption( object, draggable ) {

		var option = document.createElement( 'div' );
		option.draggable = draggable;
		option.innerHTML = buildHTML( object );
		option.value = object.id;
		option.style.paddingLeft = '20px';

		if ( object.isCamera ) {
			var uuid = object.uuid;

			if ( cameraCheckboxes[uuid] == undefined ) {
				cameraCheckboxes[uuid] = new UIStyledCheckbox( false ).setIdFor( uuid );
				setCameraCheckboxValueAndClass(uuid);
				cameraCheckboxes[uuid].onChange(function () {
					editor.setActiveCamera(uuid);
				});

			}

			option.appendChild( cameraCheckboxes[uuid].dom );

			var lockButton = new UIImage( config.getImage( 'engine-ui/unlock-btn.svg' ) );
			lockButton.setClass( 'VisibleButton' );
			var unlockButton = new UIImage( config.getImage( 'engine-ui/lock-btn.svg' ) );
			unlockButton.setClass( 'VisibleButton' );

			if ( object.userData.locked ) {

				unlockButton.setDisplay( 'block' );
				lockButton.setDisplay( 'none' );

			} else {

				unlockButton.setDisplay( 'none' );
				lockButton.setDisplay( 'none' );
				lockButton.addClass( 'HoverVisible' );

			}

			lockButton.onClick( function ( e ) {

				e.stopPropagation();
				this.setDisplay( 'none' );
				this.removeClass( 'HoverVisible' );
				unlockButton.setDisplay( 'block' );

				signals.cameraLocked.dispatch( object );

			} );

			unlockButton.onClick( function ( e ) {

				e.stopPropagation();
				this.setDisplay( 'none' );
				lockButton.addClass( 'HoverVisible' );

				signals.cameraUnlocked.dispatch( object );

			} );

			option.appendChild( lockButton.dom );
			option.appendChild( unlockButton.dom );

		} else if ( draggable ) {

			var visibleButton = new UIImage( config.getImage( 'engine-ui/not-visible-btn.svg' ) );
			visibleButton.setClass( 'VisibleButton' );
			visibleButton.setOpacity( 0.45 );
			var notVisibleButton = new UIImage( config.getImage( 'engine-ui/visible-btn.svg' ) );
			notVisibleButton.setClass( 'VisibleButton' );

			if ( object.visible ) {

				visibleButton.setDisplay( 'none' );
				notVisibleButton.setDisplay( 'none' );
				notVisibleButton.addClass( 'HoverVisible' );

			} else {

				visibleButton.setDisplay( 'block' );
				notVisibleButton.setDisplay( 'none' );
				let t = option.getElementsByClassName( 'name' );
				for(let i=0; i<t.length; i++){
					t[i].classList.add("text-decoration-line-through");
				}
				//option.classList.add("text-decoration-line-through");
				//console.log('add text-decoration-line-through');
			}

			visibleButton.onClick( function ( e ) {

				e.stopPropagation();
				//object.visible = true;
				editor.execute(new SetVisibleCommand(editor, object, true));
				//option.classList.remove("text-decoration-line-through");
				//this.setDisplay( 'none' );
				//notVisibleButton.addClass( 'HoverVisible' );


			} );

			notVisibleButton.onClick( function ( e ) {

				e.stopPropagation();
				//object.visible = false;
				editor.execute(new SetVisibleCommand(editor, object, false));
				//option.classList.add("text-decoration-line-through");
				//this.setDisplay( 'none' );
				//this.removeClass( 'HoverVisible' );
				//visibleButton.setDisplay( 'block' );

				if(editor.selected === object){
					editor.select(null);
				}
			} );

			option.appendChild( visibleButton.dom );
			option.appendChild( notVisibleButton.dom );

		}

		// opener

		if ( nodeStates.has( object ) ) {

			var state = nodeStates.get( object );

			var opener = document.createElement( 'img' );
			opener.src = config.getImage( 'engine-ui/play-btn.svg' );
			opener.classList.add( 'opener' );

			if ( object.children.length > 0 ) {
				if(object.children.length == 1 && (object.children[0].type != "AxesHelper" && object.children[0].name != 'AxesHelperEngineTool'))
					opener.classList.add( state ? 'open' : 'closed' );
				else if(object.children.length > 1) 
					opener.classList.add( state ? 'open' : 'closed' );
			}

			opener.addEventListener( 'click', function () {

				nodeStates.set( object, nodeStates.get( object ) === false ); // toggle
				refreshUI();

			}, false );

			option.insertBefore( opener, option.firstChild );

		}

		return option;

	}

	function getMaterialName( material ) {

		if ( Array.isArray( material ) ) {

			var array = [];

			for ( var i = 0; i < material.length; i ++ ) {

				array.push( material[ i ].name );

			}

			return array.join( ',' );

		}

		return material.name;

	}

	function escapeHTML( html ) {

		return html
			.replace( /&/g, '&amp;' )
			.replace( /"/g, '&quot;' )
			.replace( /'/g, '&#39;' )
			.replace( /</g, '&lt;' )
			.replace( />/g, '&gt;' );

	}

	function buildHTML( object ) {

		var html = '<span class="line"></span>';
		html += '<span class="name">' + escapeHTML( object.name ) + '</span>';

		return html;

	}

	var ignoreObjectSelectedSignal = false;

	function selectOption( value ) {

		ignoreObjectSelectedSignal = true;

		editor.selectById( value );

		ignoreObjectSelectedSignal = false;

	}

	var outliner = new UIOutliner( editor );
	outliner.renameEnabled = true;
	outliner.setId( 'outliner' );
	outliner.onChange( function () {

		selectOption( parseInt( outliner.getValue() ) );

	} );
	outliner.onRename( function ( newName ) {

		editor.nameObject( editor.selected, newName );
		signals.objectRenamed.dispatch( editor.selected );

	} );
	outliner.onGroupCollapse( function ( groupId, all ) {

		signals.groupCollapseToggled.dispatch( groupId, all );

	} );
	container.add( outliner );

	var accordions = new UIPanel().setId( 'accordions' );
	accordions.addClass( 'AccordionList' );

	// Environment

	var environment = new UIAccordion().setTitle( strings.getKey( 'sidebar/scene/environment' ) ).setId( 'environment' );
	environment.setDisplay('none');

	function onBackgroundChanged( imageId ) {

		signals.sceneBackgroundChanged.dispatch(
			backgroundType.getValue(),
			backgroundColor.getHexValue(),
			backgroundTexture.getValue(),
			backgroundEquirectangularTexture.getValue(),
			imageId
		);

	}

	var backgroundRow = new UIRow();

	var backgroundDiv = new UIDiv().setClass( 'BackgroundContainer' );

	var backgroundType = new UIDropdown().setOptions( {

		'None': 'None',
		'Color': 'Color',
		'Texture': 'Texture',
		'Equirectangular': 'Equirect'

	} );
	backgroundType.onChange( function () {
		//backgroundTexture.setValue( null );
		//backgroundEquirectangularTexture.setValue( null );
		onBackgroundChanged();
		refreshBackgroundUI();

	} );
	backgroundType.setValue( 'Color' );
	backgroundDiv.add( backgroundType );

	var backgroundColor = new UIColorPicker( editor ).setValue( '#14151b' ).setMarginLeft( '15px' ).onChange( onBackgroundChanged );
	backgroundDiv.add( backgroundColor );

	//var backgroundTexture = new UITexture( editor ).setMarginLeft( '15px' ).onChange( onBackgroundChanged );
	var backgroundTexture = new UINewTexture( editor ).setMarginLeft( '15px' ).onChange( onBackgroundChanged );


	//var object = $(`<div class="image-picker ${className}" style="position:relative"><div class="w-lightbox-spinner" style="display: none;width: 20px;height: 20px;margin-top: -10px;margin-left: -10px;"></div></div>`);
	//var canvas = $('<canvas class="block-file"></canvas>');
	//object.append(canvas);

	backgroundTexture.setDisplay( 'none' );
	backgroundDiv.add( backgroundTexture );

	//var backgroundEquirectangularTexture = new UITexture( editor ).setMarginLeft( '15px' ).onChange( onBackgroundChanged );
	//var backgroundEquirectangularTexture = new UINewTexture( editor ).setMarginLeft( '15px' ).onChange( onBackgroundChanged );
	var backgroundEquirectangularTexture = new UIEnvTexture( editor ).setMarginLeft( '15px' ).onChange( onBackgroundChanged );
	backgroundEquirectangularTexture.setDisplay( 'none' );
	backgroundDiv.add( backgroundEquirectangularTexture );

	backgroundRow.add( new UIText( strings.getKey( 'sidebar/scene/background' ) ) );
	backgroundRow.add( backgroundDiv );

	environment.addToBody( backgroundRow );

	//
	function setCameraCheckboxValueAndClass(uuid) {
		var checkbox = cameraCheckboxes[uuid];
		var isActive = (editor.cameras[uuid] == editor.viewportCamera);

		checkbox.setValue( isActive );
		checkbox.removeClass('checked'); // Removing class first to ensure we don't add multiple times

		if(isActive) {
			checkbox.addClass('checked');
		}
	}

	function refreshCameraCheckboxes() {
		for ( var uuid in cameraCheckboxes ) {
			setCameraCheckboxValueAndClass(uuid);
		}
	}

	//

	function refreshBackgroundUI() {
		var type = backgroundType.getValue();
		backgroundColor.setDisplay( type === 'Color' ? '' : 'none' );
		backgroundTexture.setDisplay( type === 'Texture' ? '' : 'none' );
		backgroundEquirectangularTexture.setDisplay( type === 'Equirectangular' ? '' : 'none' );
		// backgroundBlurrinessRow.setDisplay(type === 'Equirectangular' ? '' : 'none');
	}

	// background blurriness

	// var backgroundBlurrinessRow = new UIRow();
	// var backgroundBlurriness = new UINumber( 0.0 ).setRange( 0, 1 ).onChange( onBackgroundChanged );

	// backgroundBlurrinessRow.add( new UIText( strings.getKey( 'sidebar/scene/background/blurriness' ) ) );
	// backgroundBlurrinessRow.add( backgroundBlurriness );
	// environment.addToBody( backgroundBlurrinessRow );
	// backgroundBlurrinessRow.setDisplay('none');

	// environment

	var environmentRow = new UIRow();

	var environmentType = new UIDropdown().setOptions( {

		'None': 'None',
		'Equirectangular': 'Equirect',

	} );
	environmentType.setValue( 'None' );
	environmentType.onChange( function () {

		onEnvironmentChanged();
		refreshEnvironmentUI();

	} );

	environmentRow.add( new UIText( strings.getKey( 'sidebar/scene/background/environment' ) ) );
	environmentRow.add( environmentType );

	// var environmentEquirectangularTexture = new UITexture().setMarginLeft( '8px' ).onChange( onEnvironmentChanged );
	//var environmentEquirectangularTexture = new UINewTexture( editor ).setMarginLeft( '15px' ).onChange( onEnvironmentChanged );
	var environmentEquirectangularTexture = new UIEnvTexture( editor ).setMarginLeft( '15px' ).onChange( onEnvironmentChanged );
	environmentEquirectangularTexture.setDisplay( 'none' );
	environmentRow.add( environmentEquirectangularTexture );

	environment.addToBody( environmentRow );

	function onEnvironmentChanged(imageId) {
		signals.sceneEnvironmentChanged.dispatch(
			environmentType.getValue(),
			environmentEquirectangularTexture.getValue(),
			imageId
		);

	}

	function refreshEnvironmentUI() {

		var type = environmentType.getValue();

		environmentType.setWidth( type !== 'Equirectangular' ? '150px' : '110px' );
		environmentEquirectangularTexture.setDisplay( type === 'Equirectangular' ? '' : 'none' );

	}

	// fog

	function onFogChanged() {

		signals.sceneFogChanged.dispatch(
			fogType.getValue(),
			fogColor.getHexValue(),
			fogNear.getValue(),
			fogFar.getValue(),
			fogDensity.getValue()
		);

	}

	function onFogSettingsChanged() {

		signals.sceneFogSettingsChanged.dispatch(
			fogType.getValue(),
			fogColor.getHexValue(),
			fogNear.getValue(),
			fogFar.getValue(),
			fogDensity.getValue()
		);

	}

	var fogTypeRow = new UIRow();
	var fogType = new UIDropdown().setOptions( {

		'None': 'None',
		'Fog': 'Linear',
		'FogExp2': 'Exponential'

	} );

	fogType.onChange( function () {

		onFogChanged();
		refreshFogUI();

	} );

	fogTypeRow.add( new UIText( strings.getKey( 'sidebar/scene/fog' ) ) );
	fogTypeRow.add( fogType );

	environment.addToBody( fogTypeRow );

	// fog color

	var fogPropertiesRow = new UIRow();
	fogPropertiesRow.setDisplay( 'none' );

	var fogColor = new UIColorPicker( editor ).setValue( '#aaaaaa' );
	fogColor.onChange( onFogSettingsChanged );
	fogPropertiesRow.add( fogColor );

	// fog near

	var fogNear = new UINumber( 0.1 ).setRange( 0, Infinity ).onChange( onFogSettingsChanged );
	fogPropertiesRow.add( fogNear );

	// fog far

	var fogFar = new UINumber( 50 ).setRange( 0, Infinity ).onChange( onFogSettingsChanged );
	fogPropertiesRow.add( fogFar );

	// fog density

	var fogDensity = new UINumber( 0.05 ).setRange( 0, 0.1 ).setStep( 0.001 ).setPrecision( 3 ).onChange( onFogSettingsChanged );
	fogPropertiesRow.add( fogDensity );

	environment.addToBody( fogPropertiesRow );

	// filter

	function onFilterTypeChanged() {

		var newFilter = { enabled: true, name: filterType.getValue(), type: filterType.getLabel() };

		switch ( newFilter.name ) {

			case 'Color':
				newFilter.hue = 0;
				newFilter.saturation = 1;
				newFilter.vibrance = 0;
				newFilter.brightness = 0;
				newFilter.contrast = 1;
				break;

			case 'Fade':
				newFilter.color = 0xffffff;
				newFilter.amount = 0.5;
				break;

			case 'Invert':
				newFilter.amount = 1;
				break;

			case 'Blur':
				newFilter.x = 1;
				newFilter.y = 1;
				break;

			case 'Refraction':
				newFilter.map = '';
				newFilter.scale = 0.5;
				newFilter.invert = false;
				break;

			case 'Mosaic':
				newFilter.scale = 128;
				newFilter.fade = 1;
				break;

			case 'Comic':
				newFilter.scale = 4;
				break;

			case 'Bloom':
				newFilter.exposure = 1;
				newFilter.threshold = 0.85;
				newFilter.strength = 1.5;
				newFilter.radius = 0.4;
				break;

			case 'Trails':
				newFilter.strength = 0.96;
				break;

			case 'Shadows':
				newFilter.radius = 16;
				newFilter.min = 0.005;
				newFilter.max = 0.1;
				break;

			case 'DepthOfField':
				newFilter.focus = 500;
				newFilter.aperture = 5;
				newFilter.maxblur = 1;
				break;
		}

		var scene = editor.scene;

		if ( scene.userData.filter == undefined )
			scene.userData.filter = [];

		if ( scene.userData.filter.find(x => x.name == newFilter.name) == undefined )
			scene.userData.filter.push( newFilter );

		signals.filterChanged.dispatch();
	}

	function createFilterElement(type, name, value, callback) {

		var row = new UIRow();
		var elem;

		if ( type === 'Color' ) {

			elem = new UIColorPicker( editor ).setHexValue(value);

		}
		else if ( type === 'Texture' ) {

			elem = new UITexture( editor );

		}
		else if ( type === 'Checkbox' ) {

			elem = new UIStyledCheckbox().setValue( value ).setIdFor( 'filter' + name );

		}
		else if ( type === 'Number' ) {

			elem = new UINumber().setValue(value);

		}

		if ( callback ) {

			elem.onChange(function () {

				callback( name, elem.getValue() );

			} );

		}

		row.add( new UIText( strings.getKey( 'sidebar/scene/filter/' + name ) ).setMarginLeft( '20px' ) );
		row.add( elem );

		return row;
	}

	function createFilterUI (filter) {

		var onFilterEnabledChanged = function () {

			var filterName = filter.name;
			var scene = editor.scene;

			scene.userData.filter.map(function (f) {
				if (f.name == filterName)
					f.enabled = !f.enabled;
			});

			signals.filterChanged.dispatch();

		}

		var onFilterDelete = function () {

			var filterName = filter.name;
			var scene = editor.scene;

			filtersRow.remove(filters[filterName]);

			var index = scene.userData.filter.map(function (x) { return x.name; }).indexOf(filterName);
			scene.userData.filter.splice(index, 1);

			delete filters[filterName];

			signals.filterRemoved.dispatch( filter.type );

		}


		var filterRow = new UIDiv();

		var filterTitleRow = new UIRow();
		filterTitleRow.add( new UIText( strings.getKey( 'sidebar/scene/filter/' + filter.name ) ).setMarginLeft( '10px' ) );
		filterTitleRow.add( new UIStyledCheckbox( filter.enabled ).setIdFor( filter.name + 'Enabled' ).onChange( onFilterEnabledChanged ) );
		filterTitleRow.add( new UIText( 'Delete' ).setMarginLeft( '10px' ).onClick( onFilterDelete ) );
		filterRow.add(filterTitleRow);

		var onFilterAttrChange = function ( attr, newValue ) {

			editor.scene.userData.filter.find(x => x.name == filter.name)[attr] = newValue;
			signals.filterChanged.dispatch();

		}

		switch ( filter.name ) {

			case 'Color':
				var attrs = ['hue', 'saturation', 'vibrance', 'brightness', 'contrast'];
				attrs.map(function (attr) {
					filterRow.add( createFilterElement( 'Number', attr, filter[attr], onFilterAttrChange ) );
				});
				break;

			case 'Fade':
				filterRow.add( createFilterElement( "Color", 'color', filter.color, onFilterAttrChange ) );
				filterRow.add( createFilterElement( 'Number', 'amount', filter.amount, onFilterAttrChange ) );
				break;

			case 'Invert':
				filterRow.add( createFilterElement( 'Number', 'amount', filter.amount, onFilterAttrChange ) );
				break;

			case 'Blur':
				filterRow.add( createFilterElement( 'Number', 'x', filter.x, onFilterAttrChange ) );
				filterRow.add( createFilterElement( 'Number', 'y', filter.y, onFilterAttrChange ) );
				break;

			case 'Refraction':
				filterRow.add( createFilterElement( "Texture", 'map', filter.map, onFilterAttrChange ) );
				filterRow.add( createFilterElement( 'Number', 'scale', filter.scale, onFilterAttrChange ) );
				filterRow.add( createFilterElement( "Checkbox", 'invert', filter.invert, onFilterAttrChange ) );
				break;

			case 'Mosaic':
				filterRow.add( createFilterElement( 'Number', 'scale', filter.scale, onFilterAttrChange ) );
				filterRow.add( createFilterElement( 'Number', 'fade', filter.fade, onFilterAttrChange ) );
				break;

			case 'Comic':
				filterRow.add( createFilterElement( 'Number', 'scale', filter.scale, onFilterAttrChange ) );
				break;

			case 'Bloom':
				filterRow.add( createFilterElement( 'Number', 'exposure', filter.exposure, onFilterAttrChange ) );
				filterRow.add( createFilterElement( 'Number', 'threshold', filter.threshold, onFilterAttrChange ) );
				filterRow.add( createFilterElement( 'Number', 'strength', filter.strength, onFilterAttrChange ) );
				filterRow.add( createFilterElement( 'Number', 'radius', filter.radius, onFilterAttrChange ) );
				break;

			case 'Trails':
				filterRow.add( createFilterElement( 'Number', 'strength', filter.strength, onFilterAttrChange ) );
				break;

			case 'Shadows':
				filterRow.add( createFilterElement( 'Number', 'radius', filter.radius, onFilterAttrChange ) );
				filterRow.add( createFilterElement( 'Number', 'min', filter.min, onFilterAttrChange ) );
				filterRow.add( createFilterElement( 'Number', 'max', filter.max, onFilterAttrChange ) );
				break;

			case 'DepthOfField':
				filterRow.add( createFilterElement( 'Number', 'focus', filter.focus, onFilterAttrChange ) );
				filterRow.add( createFilterElement( 'Number', 'aperture', filter.aperture, onFilterAttrChange ) );
				filterRow.add( createFilterElement( 'Number', 'maxblur', filter.maxblur, onFilterAttrChange ) );
				break;

		}

		return filterRow;
	}

	var filterEnabledRow = new UIRow();

	var filterWorkspaceEnabledDiv = new UIDiv();
	var filterWorkspaceEnabled = new UIStyledCheckbox( config.getKey('project/filter/workspace') ).setIdFor( 'filterWorkspaceEnabled' ).setMarginLeft( '5px' );
	filterWorkspaceEnabled.onChange( function () {

		config.saveKey( 'project/filter/workspace', this.getValue() );

	} );

	filterWorkspaceEnabledDiv.add( new UIText( strings.getKey( 'sidebar/scene/filter/workspace' ) ) );
	filterWorkspaceEnabledDiv.add( filterWorkspaceEnabled );

	var filterLiveEnabledDiv = new UIDiv();
	var filterLiveEnabled = new UIStyledCheckbox( config.getKey('project/filter/live') ).setIdFor( 'filterLiveEnabled' ).setMarginLeft( '5px' );
	filterLiveEnabled.onChange( function () {

		config.saveKey( 'project/filter/live', this.getValue() );

	} );

	filterLiveEnabledDiv.add( new UIText( strings.getKey( 'sidebar/scene/filter/play' ) ) );
	filterLiveEnabledDiv.add( filterLiveEnabled );

	filterEnabledRow.add( new UIText( strings.getKey( 'sidebar/scene/filter' ) ) );
	filterEnabledRow.add( filterWorkspaceEnabledDiv );
	filterEnabledRow.add( filterLiveEnabledDiv );

	environment.addToBody( filterEnabledRow );

	var filterTypeRow = new UIRow().addClass( 'FilterType' );
	var filterType = new UIDropdown().setOptions( {

		//'Color': 'Color Adjust',
		//'Fade': 'Fade',
		//'Invert': 'Invert',
		//// 'Refraction': 'Refraction',
		//'Mosaic': 'Mosaic',
		'Comic': 'Comic',
		'Glitch': 'Glitch',
		'Bloom': 'Bloom',
		'Outline': 'Outline',
		'Trails': 'Trails',
		// 'Shadows': 'Shadows',
		'DepthOfField': 'Depth-Of-Field'

	} );

	filterType.onChange( function () {

		onFilterTypeChanged();
		refreshFilterUI();

		filterType.setLabel( 'Select to add' );

	} );

	filterTypeRow.add( filterType );

	environment.addToBody( filterEnabledRow );
	environment.addToBody( filterTypeRow );

	var filters = { };

	var filtersRow = new UIDiv();

	environment.addToBody( filtersRow );

	accordions.add( environment );

	//

	accordions.add( new SidebarObject( editor ) );
	accordions.add( new SidebarGeometry( editor ) );
	accordions.add( new SidebarMaterial( editor ) );

	var attribute = new SidebarAttribute( editor );
	accordions.add( attribute );

	accordions.add( new SidebarAnimation( editor ) );
	accordions.add( new SidebarTag( editor ) );

	container.add( accordions );
	container.add( new SidebarColorPicker( editor ) );

	//

	function refreshUI() {

		var scene = editor.scene;

		var options = [];

		options.push( buildOption( scene, false ) );

		( function addObjects( objects, pad ) {

			for ( var i = 0, l = objects.length; i < l; i ++ ) {

				var object = objects[ i ];

				if ( nodeStates.has( object ) === false ) {

					nodeStates.set( object, false );

				}
				let needAddOption = true;
				if((object.userData && object.userData.isVoxel) || object.type === 'AxesHelper' || object.name === "AxesHelperEngineTool"){
					needAddOption = false;
				}
				if(needAddOption){
					var option = buildOption( object, true, pad );
					option.style.paddingLeft = ( 20 + pad * 10 ) + 'px';
					options.push( option );
				}

				if ( nodeStates.get( object ) === true ) {

					addObjects( object.children, pad + 1 );

				}

			}

		} )( scene.children, 1 );

		outliner.setOptions( options );

		if ( editor.selected !== null ) {

			outliner.setValue( editor.selected.id );

		}
		// console.log("scene.userData: ",scene.userData);
		// if ( scene.background ) {
		// 	console.log("scene.background: ",scene.background);
		// 	if ( scene.background.isColor ) {
		// 		console.log("scene.background is color");
		// 		backgroundType.setValue( "Color" );
		// 		backgroundColor.setHexValue( scene.background.getHex() );
		// 		backgroundTexture.setValue( null );
		// 		backgroundEquirectangularTexture.setValue( null );

		// 	}

		// 	// TODO: Add Texture/EquirectangularTexture support

		// } else {

		// 	backgroundType.setValue( "None" );
		// 	backgroundTexture.setValue( null );
		// 	backgroundEquirectangularTexture.setValue( null );

		// }

		setBackgroundValues(scene);

		setBackgroundType(scene);

		if ( scene.environment ) {

			if ( scene.environment.mapping === THREE.EquirectangularReflectionMapping ) {

				
				scope.environmentAvailable = true;
				environmentType.setValue( 'Equirectangular' );
				environmentEquirectangularTexture.setValue( scene.environment );
				environmentEquirectangularTexture.setDisplay('');
			}

		} else if(!scope.environmentImageLoading) {
			scope.environmentImageLoading = true;
			let imageAsset = new ImageAsset(editor,null,null,"https://arcadestudio-assets.s3.us-east-2.amazonaws.com/misc/scene-enviro-map-default.jpg");
			
			imageAsset.load(function(){
				if(scope.environmentAvailable)
					return;
				environmentType.setValue( 'Equirectangular' );
				environmentEquirectangularTexture.setValue(imageAsset.texture);
				onEnvironmentChanged();
				environmentEquirectangularTexture.setDisplay('');
			});
			// environmentType.setValue( 'None' );

		}

		if ( scene.fog ) {

			fogColor.setHexValue( scene.fog.color.getHex() );

			if ( scene.fog.isFog ) {

				fogType.setValue( "Fog" );
				fogNear.setValue( scene.fog.near );
				fogFar.setValue( scene.fog.far );

			} else if ( scene.fog.isFogExp2 ) {

				fogType.setValue( "FogExp2" );
				fogDensity.setValue( scene.fog.density );

			}

		} else {

			fogType.setValue( "None" );

		}

		refreshBackgroundUI();
		refreshFogUI();

		filterType.setLabel( 'Select to add' );
		refreshFilterUI();

	}

	//this function will be used to set the values for each background
	function setBackgroundValues(scene){
		console.log("setBackgroundValues: ",scope.backgroundValueInitiated);
		//if user had selected any value for the background color
		if(scene.userData.backgroundColor)
			backgroundColor.setHexValue( scene.userData.backgroundColor );
		else 
			backgroundColor.setValue( '#14151b' );
		//if user had uploaded any texture for background
		if(scene.userData.backgroundTexture){
			if(scene.userData.backgroundTexture.id != -1){
				let assetTexture = editor.assets.get('Image', 'id', scene.userData.backgroundTexture.id);
				if(assetTexture){
					if(assetTexture.texture)
						backgroundTexture.setValue( assetTexture.texture );
					else if(!scope.backgroundValueInitiated){
						assetTexture.apply(null, false);
						scope.backgroundValueInitiated = true;
					}
					else
						assetTexture.apply();
				}
				else 
					backgroundTexture.setValue( null );
			}
			else if(scene.background && scene.background.isTexture && scene.background.mapping != THREE.EquirectangularReflectionMapping)
				backgroundTexture.setValue( scene.background );
			else 
				backgroundTexture.setValue( null );
		}
		else
			backgroundTexture.setValue( null );
		//if user had uploaded any equirect for background
		if(scene.userData.background){
			if(scene.userData.background.id != -1){
				let assetTexture =  editor.assets.get('Environment', 'id', scene.userData.background.id);
				if(assetTexture) {
					if(assetTexture.texture)
						backgroundEquirectangularTexture.setValue( assetTexture.texture )
					else if(!scope.equirectValueInitiated){
						assetTexture.apply(false);
						scope.equirectValueInitiated = true;
					}
						
					else 
						assetTexture.apply();
				}
				else
					backgroundEquirectangularTexture.setValue( null );
			}
			else if(scene.background && scene.background.isTexture && scene.background.mapping == THREE.EquirectangularReflectionMapping)
				backgroundEquirectangularTexture.setValue( scene.background );
			else 
				backgroundEquirectangularTexture.setValue( null );
		}
		else
			backgroundEquirectangularTexture.setValue( null );

		
	}

	//this function will be used to set the background type based on the previous selectede type by the user
	function setBackgroundType(scene){
		switch(scene.userData.selectedBackground){
			case 'None':
				backgroundType.setValue( 'None' );
				break;
			case 'Color':
				backgroundType.setValue( 'Color' );
				break;
			case 'Texture':
				backgroundType.setValue( 'Texture' );
				break;
			case 'Equirectangular':
				backgroundType.setValue( 'Equirectangular' );
				break;
			default: 
				backgroundType.setValue( 'None' );
				break;
		}
	}

	function refreshFogUI() {

		var type = fogType.getValue();

		fogPropertiesRow.setDisplay( type === 'None' ? 'none' : '' );
		fogNear.setDisplay( type === 'Fog' ? '' : 'none' );
		fogFar.setDisplay( type === 'Fog' ? '' : 'none' );
		fogDensity.setDisplay( type === 'FogExp2' ? '' : 'none' );

	}

	function refreshFilterUI() {

		var scene = editor.scene;

		scene.userData.filter !== undefined && scene.userData.filter.map(function (f) {

			if ( filters[f.name] == undefined ) {

				filters[f.name] = createFilterUI(f);
				filtersRow.add( filters[f.name] );

			}
		});

	}

	refreshUI();

	// events

	signals.editorCleared.add( refreshUI );

	signals.sceneGraphChanged.add( refreshUI );

	signals.objectSelected.add( function ( object ) {

		environment.setDisplay( object && object.isScene ? '' : 'none' );

		if ( ignoreObjectSelectedSignal === true ) return;

		if ( object !== null ) {

			let needsRefresh = false;
			let parent = object.parent;

			while ( parent !== editor.scene ) {

				if ( nodeStates.get( parent ) !== true ) {

					nodeStates.set( parent, true );
					needsRefresh = true;

				}

				parent = parent.parent;

			}

			if ( needsRefresh ) refreshUI();

			outliner.setValue( object.id );

		} else {

			outliner.setValue( null );

		}

	} );

	signals.activeCameraChanged.add( function (uuid) {

		editor.setViewportCamera( uuid );
		refreshCameraCheckboxes();

	} );

	signals.sceneBackgroundTypeChanged.add( function ( type, id, texture, toUpdateType = true ) {
		if(toUpdateType)
			backgroundType.setValue( type );
		type == 'Texture' ? backgroundTexture.setValue( texture ) : backgroundEquirectangularTexture.setValue( texture );

		onBackgroundChanged( id );
		refreshBackgroundUI();

	} );

	signals.groupCollapseToggled.add( function ( groupId, all ) {

		if ( !all ) {

			var object = editor.scene.getObjectById( groupId );
			nodeStates.set( object, nodeStates.get( object ) === false ); // toggle

		} else {

			editor.scene.traverse( function ( object ) {

				if ( object && !object.isScene && object.children.length != 0 ) {

					nodeStates.set( object, nodeStates.get( object ) === false ); // toggle

				}

			} );

		}

		refreshUI();

		outliner.setValue( groupId );
		selectOption( groupId );

	} );

	return container;

}

export { SidebarScene };
