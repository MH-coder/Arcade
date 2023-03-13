import { UIRow, UIText, UIDiv, UIImage } from '../components/ui.js';
import { UITexture } from '../components/ui.three.js';
import { UIStyledCheckbox } from '../components/ui.openstudio.js';

function SidebarColorPicker( editor ) {

    var signals = editor.signals;
    var strings = editor.strings;
    var config = editor.config;
    var assets = editor.assets;

    var container = new UIDiv();
    container.setId( 'color-picker');

    var colorPicker = new ColorPicker( container.dom, '#ffffff' );
    var colorChangeCallback = null;
    var paintColor = '#ffffff';
    var paintMaterial = null;
    var paintTexture = null;

    var colorPickerTitleBar = new UIDiv().setClass( 'color-picker-title-bar' );
    
    var colorPickerTitle = new UIDiv();
    colorPickerTitle.add( new UIText( strings.getKey( 'color-picker/title' ) ) );
    colorPickerTitle.add( new UIText( strings.getKey( 'color-picker/title/info' ) ).setClass( 'info' ) );
    colorPickerTitleBar.add( colorPickerTitle );

    var colorPickerClose = new UIImage( config.getImage( 'engine-ui/close-delete-btn.svg' ) );
    colorPickerClose.setWidth( '12px' );
    colorPickerClose.onClick( function () {

        editor.showColorPicker = false;
        container.setDisplay( 'none' );
        colorChangeCallback = null;

    } );
    colorPickerTitleBar.add( colorPickerClose );

    container.add( colorPickerTitleBar ).setClass( 'color-picker-container' );

    var colorPickerContainer = new UIDiv();
    var colorPickerDom = document.getElementById( 'color_picker' );
    colorPickerDom.style.display = 'block';

    document.getElementsByTagName( 'body' )[0].removeChild( colorPickerDom );
    colorPickerContainer.dom.appendChild( colorPickerDom );

    container.add( colorPickerContainer );

    var paintWithColorRow = new UIRow();
    paintWithColorRow.setPadding( '0 5px' );
    paintWithColorRow.setBorder( '0' );

    var paintWithColorContainer = new UIDiv();
    var paintWithColorPreview = new UIDiv().setClass( 'ColorPreview' ).setBackgroundColor( '#ffffff' );
    paintWithColorPreview.onClick( function () {

        colorChangeCallback = function ( color ) {

            paintColor = color;
            paintWithColorPreview.setBackgroundColor( color );

            update();

        }

    } );
	var paintWithColorEnabled = new UIStyledCheckbox( true ).setIdFor( 'paintWithColorEnabled' ).onChange( update );

    paintWithColorContainer.add( new UIText( '[ctrl]' ).setMarginRight( '20px' ) );
    paintWithColorContainer.add( paintWithColorPreview );
    paintWithColorContainer.add( paintWithColorEnabled );
    paintWithColorRow.add( new UIText( strings.getKey( 'color-picker/paint/color' ) ) );
    paintWithColorRow.add( paintWithColorContainer );

    container.add( paintWithColorRow );

    var paintWithMaterialRow = new UIRow();
    paintWithMaterialRow.setPadding( '0 5px' );
    paintWithMaterialRow.setBorder( '0' );

    var paintWithMaterialContainer = new UIDiv();
    var paintWithMaterialPreview = new UIDiv().setClass( 'MaterialPreview' ).onChange( update );
    
    paintWithMaterialPreview.onClick( function () {

        signals.updateWorkspace.dispatch( 'library', true );
        signals.materialFolderShow.dispatch();

    } );

    paintWithMaterialPreview.dom.addEventListener( 'drop', function ( event ) {

		var assetType = event.dataTransfer.getData( 'assetType' );
		var assetId = event.dataTransfer.getData( 'assetId' );

        if ( assetType == 'Material' ) {

            var asset = assets.get( 'Material', 'id', assetId );
            paintMaterial = assetId;
            paintWithMaterialPreview.setBackground( `url(${asset.thumbUrl})` );
            update();

        }

    } );

    var paintWithMaterialEnabled = new UIStyledCheckbox( true ).setIdFor( 'paintWithMaterialEnabled' ).onChange( update );

    paintWithMaterialContainer.add( new UIText( '[ctrl]' ).setMarginRight( '20px' ) );
    paintWithMaterialContainer.add( paintWithMaterialPreview );
    paintWithMaterialContainer.add( paintWithMaterialEnabled );
    paintWithMaterialRow.add( new UIText( strings.getKey( 'color-picker/paint/material' ) ) );
    paintWithMaterialRow.add( paintWithMaterialContainer );

    container.add( paintWithMaterialRow );

    var paintWithTextureRow = new UIRow();
    paintWithTextureRow.setPadding( '0 5px' );
    paintWithTextureRow.setBorder( '0' );

    var paintWithTextureContainer = new UIDiv();
    var paintWithTexturePreview = new UITexture( editor ).setMarginRight( '25px' );
    paintWithTexturePreview.onChange( function () {
        
        paintTexture = this.getValue();
        update();

    } );
    paintWithTexturePreview.onClick( function () {

        signals.updateWorkspace.dispatch( 'library', true );
        signals.imageFolderShow.dispatch();

    } );

    var paintWithTextureEnabled = new UIStyledCheckbox( true ).setIdFor( 'paintWithTextureEnabled' ).onChange( update );

    paintWithTextureContainer.add( new UIText( '[ctrl]' ).setMarginRight( '20px' ) );
    paintWithTextureContainer.add( paintWithTexturePreview );
    paintWithTextureContainer.add( paintWithTextureEnabled );
    paintWithTextureRow.add( new UIText( strings.getKey( 'color-picker/paint/texture' ) ) );
    paintWithTextureRow.add( paintWithTextureContainer );

    container.add( paintWithTextureRow );

    function update() {

        editor.setPaint({
            color: paintColor,
            material: paintMaterial,
            texture: paintTexture,
            colorEnabled: paintWithColorEnabled.getValue(),
            materialEnabled: paintWithMaterialEnabled.getValue(),
            textureEnabled: paintWithTextureEnabled.getValue(),
        });

    }

	signals.showColorPickerChanged.add( function ( showColorPicker, defaultColor, callback ) {

        container.setDisplay( showColorPicker ? 'block' : 'none' );

        if ( showColorPicker ) {

            if ( defaultColor ) {

                updateColorDisplays( defaultColor );

            }

            if ( callback ) {   

                colorChangeCallback = callback;

            }

        } else {

            colorChangeCallback = null;
            
        }

    } );

    container.dom.addEventListener( 'colorChange', function ( event ) {

        if ( colorChangeCallback ) {

            colorChangeCallback( event.detail.color );

        }

    } );

	return container;

};

export { SidebarColorPicker };
