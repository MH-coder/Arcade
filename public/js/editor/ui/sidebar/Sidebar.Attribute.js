/**
 * @author mrdoob / http://mrdoob.com/
 */

import { UIRow, UIText, UIInput, UIInteger, UIDiv, UIImage } from '../components/ui.js';
import { UIAccordion } from '../components/ui.openstudio.js';

import { AddAttributeCommand } from '../../commands/AddAttributeCommand.js';
import { SetAttributeValueCommand } from '../../commands/SetAttributeValueCommand.js';
import { RemoveAttributeCommand } from '../../commands/RemoveAttributeCommand.js';

var SidebarAttribute = function ( editor ) {

	var strings = editor.strings;
	var config = editor.config;
	var signals = editor.signals;

	var container = new UIAccordion().setTitle( strings.getKey( 'sidebar/attributes' ) ).setId( 'attributes' );
	container.setDisplay( 'none' );
	
	var newAttribute = new UIRow(  ).onClick( function () {

		var attribute = { name: 'name', value: 0 };
		editor.execute( new AddAttributeCommand( editor, attribute ) );

	} );
	newAttribute.add( new UIText( strings.getKey( 'sidebar/script/new' ) ) );
	newAttribute.add( new UIText( '+' ) );

	container.addToBody( newAttribute );

	var attributesContainer = new UIDiv();
	container.addToBody( attributesContainer );

	//

	function update() {

		attributesContainer.clear();
		attributesContainer.setDisplay( 'none' );

		var attributes = editor.attributes;

		if ( attributes !== undefined && attributes.length > 0 ) {

			attributesContainer.setDisplay( 'block' );

			for ( var i = 0; i < attributes.length; i ++ ) {

				( function ( attribute ) {

					var attributeRow = new UIRow();

					var name = new UIInput( attribute.name ).setWidth( '100px' ).setTextAlign( 'left' ).setPaddingLeft( '0' );
					name.onChange( function () {

						editor.execute( new SetAttributeValueCommand( editor, attribute, 'name', this.getValue() ) );

					} );

					var value = new UIInteger( attribute.value ).setTextAlign( 'left' );
					value.onChange( function () {

						editor.execute( new SetAttributeValueCommand( editor, attribute, 'value', this.getValue() ) );

					} );
					
					var remove = new UIImage( config.getImage( 'engine-ui/close-delete-btn.svg' ) );
					remove.setWidth( '10px' );
					remove.onClick( function () {

						if ( confirm( 'Are you sure?' ) ) {

							editor.execute( new RemoveAttributeCommand( editor, attribute ) );

						}

					} );

					attributeRow.add( name, value, remove );
					attributesContainer.add( attributeRow );

				} )( attributes[ i ] )

			}

		}

	}

	// signals
	
	signals.attributeAdded.add( update );

	signals.attributeRemoved.add( function ( attribute ) {

		update();
		editor.removeAttributeTextConnection( attribute.name );

	} );

	signals.attributeChanged.add( function ( attribute ) {
		
		update();
		editor.updateAttributeTextConnection( attribute );

	} );

	signals.objectSelected.add( function ( object ) {

		if ( object !== null && object.isScene ) {

			container.setDisplay( 'block' );
			update();

		} else {

			container.setDisplay( 'none' );

		}

	} );

	return container;

};

export { SidebarAttribute };