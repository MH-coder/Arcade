import { UIRow, UIText, UIInteger, UINumber, UIDiv, UITextArea } from '../components/ui.js';
import { UIDropdown, UIStyledCheckbox } from '../components/ui.openstudio.js';

import { SetTextMeshValueCommand } from '../../commands/SetTextMeshValueCommand.js';
import { SetAttributeTextConnectionCommand } from '../../commands/SetAttributeTextConnectionCommand.js';

function SidebarGeometryTextMesh( editor, object ) {

	var strings = editor.strings;
	var loader = editor.loader;
	var api = editor.api;

	var container = new UIDiv();

	// font

	var fontRow = new UIRow();
	var font = new UIDropdown().setOptions( getFontOptions() ).setValue( object.fontAsset.id ).onChange( updateFont );

	fontRow.add( new UIText( strings.getKey( 'sidebar/geometry/textmesh_geometry/font' ) ) );
	fontRow.add( font );

	container.add( fontRow );

	// text

	var textRow = new UIRow().addClass( "w-TextArea" );
	textRow.add( new UIText( strings.getKey( 'sidebar/geometry/textmesh_geometry/text' ) ).onClick( function () {

		if ( ! editor.getConnectedAttributeName( object ) ) {

			text.setDisplay( 'none' );
			customAttributes.setDisplay( '' );

		}

	} ) );

	var textWrapper = new UIDiv().setClass( 'TextWrapper' );

	var attributeName = editor.getConnectedAttributeName( object );
	var text = new UITextArea( attributeName ? `"${attributeName}"` : object.text ).onChange( function () {

		var attributeName = editor.getConnectedAttributeName( object );

		if ( attributeName ) {

			editor.removeAttributeTextConnection( attributeName );

		}

		update();

	} );
	text.dom.addEventListener( 'keyup', function ( event ) {
		update();
	})
	textWrapper.add( text );

	var customAttributes = new UIDiv().setClass( 'CustomAttributes' );
	customAttributes.setDisplay( 'none' );

	textWrapper.add( customAttributes );

	textRow.add( textWrapper );

	container.add( textRow );

	// size

	var sizeRow = new UIRow();
	var size = new UINumber( object.size ).onChange( update ).setRange( 1, Infinity );

	sizeRow.add( new UIText( strings.getKey( 'sidebar/geometry/textmesh_geometry/size' ) ) );
	sizeRow.add( size );

	container.add( sizeRow );

	// extruded

	var extrudedRow = new UIRow();
	var extruded = new UIStyledCheckbox( object.extruded ).setIdFor( 'textMeshExtruded' ).onChange( update );

	extrudedRow.add( new UIText( strings.getKey( 'sidebar/geometry/textmesh_geometry/extruded' ) ) );
	extrudedRow.add( extruded );

	container.add( extrudedRow );

	// thickness

	var thicknessRow = new UIRow();
	var thickness = new UINumber( object.thickness ).onChange( update ).setRange( 0.1, Infinity );

	thicknessRow.add( new UIText( strings.getKey( 'sidebar/geometry/textmesh_geometry/thickness' ) ) );
	thicknessRow.add( thickness );

	container.add( thicknessRow );

	// curveDetail

	var curveDetailRow = new UIRow();
	var curveDetail = new UIInteger( object.curveSegments ).onChange( update ).setRange( 1, Infinity );

	curveDetailRow.add( new UIText( strings.getKey( 'sidebar/geometry/textmesh_geometry/curveDetail' ) ) );
	curveDetailRow.add( curveDetail );

	container.add( curveDetailRow );

	// bevel

	var bevelEnabledRow = new UIRow();
	var bevelEnabled = new UIStyledCheckbox( object.bevel ).setIdFor( 'textMeshBevelEnabled' ).onChange( update );

	bevelEnabledRow.add( new UIText( strings.getKey( 'sidebar/geometry/textmesh_geometry/bevel' ) ) );
	bevelEnabledRow.add( bevelEnabled );

	container.add( bevelEnabledRow );

	// bevelThickness

	var bevelThicknessRow = new UIRow();
	var bevelThickness = new UINumber( object.bevelThickness ).onChange( update );

	bevelThicknessRow.add( new UIText( strings.getKey( 'sidebar/geometry/textmesh_geometry/bevelThickness' ) ) );
	bevelThicknessRow.add( bevelThickness );

	container.add( bevelThicknessRow );

	// bevelSize

	var bevelSizeRow = new UIRow();
	var bevelSize = new UINumber( object.bevelSize ).onChange( update );

	bevelSizeRow.add( new UIText( strings.getKey( 'sidebar/geometry/textmesh_geometry/bevelSize' ) ) );
	bevelSizeRow.add( bevelSize );

	container.add( bevelSizeRow );

	updateCustomAttributes();

	updateUI();

	//

	function update() {

		if ( object.text != text.getValue() ) {

			editor.execute( new SetTextMeshValueCommand( editor, object, 'text', text.getValue() ) );

		}

		if ( object.extruded !== extruded.getValue() ) {

			editor.execute( new SetTextMeshValueCommand( editor, object, 'extruded', extruded.getValue() ) );

		}

		if ( Math.abs( object.size - size.getValue() ) >= 0.01 ) {

			editor.execute( new SetTextMeshValueCommand( editor, object, 'size', size.getValue() ) );

		}

		if ( Math.abs( object.thickness - thickness.getValue() ) >= 0.01 ) {

			editor.execute( new SetTextMeshValueCommand( editor, object, 'thickness', thickness.getValue() ) );

		}

		if ( Math.abs( object.curveSegments - curveDetail.getValue() ) >= 0.01 ) {

			editor.execute( new SetTextMeshValueCommand( editor, object, 'curveSegments', curveDetail.getValue() ) );

		}

		if ( object.bevel !== bevelEnabled.getValue() ) {

			editor.execute( new SetTextMeshValueCommand( editor, object, 'bevel', bevelEnabled.getValue() ) );

		}

		if ( Math.abs( object.bevelThickness - bevelThickness.getValue() ) >= 0.01 ) {

			editor.execute( new SetTextMeshValueCommand( editor, object, 'bevelThickness', bevelThickness.getValue() ) );

		}

		if ( Math.abs( object.bevelSize - bevelSize.getValue() ) >= 0.01 ) {

			editor.execute( new SetTextMeshValueCommand( editor, object, 'bevelSize', bevelSize.getValue() ) );

		}

		updateUI();

	}

	function updateUI() {

		thicknessRow.setDisplay( object.extruded ? '' : 'none' );
		curveDetailRow.setDisplay( object.extruded ? '' : 'none' );
		bevelEnabledRow.setDisplay( object.extruded ? '' : 'none' );
		bevelThicknessRow.setDisplay( object.extruded && object.bevel ? '' : 'none' );
		bevelSizeRow.setDisplay( object.extruded && object.bevel ? '' : 'none' );

	}

	function updateCustomAttributes() {

		for ( var attribute of editor.attributes ) {

			( function ( attribute) {

				var customAttribute = new UIDiv();
				customAttribute.setTextContent( attribute.name );
				customAttribute.onClick( function () {

					editor.execute( new SetAttributeTextConnectionCommand( editor, object, attribute ) );

					customAttributes.setDisplay( 'none' );
					text.setValue( `"${attribute.name}"` );
					text.setDisplay( '' );

				} );

				customAttributes.add( customAttribute );

			} )( attribute );

		}

	}

	function updateFont() {

		var id = font.getValue();

		if ( id == 'upload' ) {

			font.setValue( object.fontAsset.id );

			UtilsHelper.chooseFile( function ( files ) {

				Promise.all( loader.loadFiles( files, null, 'Font' ) ).then( function ( results ) {

					var assets = {};

					for ( var result of results ) {

						var name = result.filename.split('.').slice(0, -1).join('.');
						assets[ result.filename ] = editor.assets.uploadFont( name, result.font );

					}

					var formData = new FormData();
					formData.append( 'type', 'Image' );
					formData.append( 'projectId', editor.projectId );

					for ( let i = 0; i < files.length; i ++ ) {

						formData.append( 'file', files[ i ] );

					}

					api.post( '/asset/my-font/upload', formData ).then( res => {

						for ( var file of res.files ) {

							assets[ file.name ].id = file.id;

						}

						font.setOptions( getFontOptions() ).setValue( object.fontAsset.id );

					} );

				} );

			}, ".json" );

		} else {

			editor.execute( new SetTextMeshValueCommand( editor, object, 'fontAsset', editor.assets.getFont( id ) ) );

		}

	}

	function getFontOptions() {

		var options = {};

		editor.assets.fonts.filter( font => font.id !== 'defaultFont' ).map( font => {

			options[ font.id ] = font.name;

		} );

		options[ 'defaultFont' ] = 'Default';
		options[ 'upload' ] = 'Upload';

		return options;

	}

	return container;

}

export { SidebarGeometryTextMesh };
