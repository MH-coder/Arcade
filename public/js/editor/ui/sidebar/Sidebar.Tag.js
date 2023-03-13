/**
 * @author mrdoob / http://mrdoob.com/
 */

import { UIRow, UIText, UIInput, UIDiv, UIImage } from '../components/ui.js';
import { UIAccordion, UIStyledCheckbox } from '../components/ui.openstudio.js';

import { AddTagCommand } from '../../commands/AddTagCommand.js';
import { ChangeTagCommand } from '../../commands/ChangeTagCommand.js';
import { SetTagCommand } from '../../commands/SetTagCommand.js';
import { RemoveTagCommand } from '../../commands/RemoveTagCommand.js';

var SidebarTag = function ( editor ) {

	var strings = editor.strings;
	var config = editor.config;
	var signals = editor.signals;

	var container = new UIAccordion().setTitle( strings.getKey( 'sidebar/tags' ) ).setId( 'tags' );
	container.setDisplay( 'none' );

	var newTag = new UIRow(  ).onClick( function () {

		var tag = 'new tag';
		editor.execute( new AddTagCommand( editor, tag ) );

	} );
	newTag.add( new UIText( strings.getKey( 'sidebar/script/new' ) ) );
	newTag.add( new UIText( '+' ) );

	container.addToBody( newTag );

	var tagsContainer = new UIDiv();
	container.addToBody( tagsContainer );

	//

	function update() {

		tagsContainer.clear();

		var object = editor.selected;

		if ( object === null ) {

			return;

		}

		for ( var tag in editor.tags ) {

			( function ( object, tag ) {

				var tagRow = new UIRow();

				var name = new UIInput( tag ).setWidth( '100px' ).setTextAlign( 'left' ).setPaddingLeft( '0' );
				name.onChange( function () {

					editor.execute( new ChangeTagCommand( editor, tag, this.getValue() ) );

				} );

				var enabled = new UIStyledCheckbox( editor.tags[tag].includes( object.uuid ) ).setIdFor( 'tag-' + tag );
				enabled.onChange( function () {

					editor.execute( new SetTagCommand( editor, editor.selected, tag, this.getValue() ) );

				} );

				var remove = new UIImage( config.getImage( 'engine-ui/close-delete-btn.svg' ) );
				remove.setWidth( '10px' );
				remove.onClick( function () {

					if ( confirm( 'Are you sure?' ) ) {

						editor.execute( new RemoveTagCommand( editor, tag ) );

					}

				} );

				tagRow.add( name, enabled, remove );
				tagsContainer.add( tagRow );

			} )( object, tag )

		}

	}

	// signals

	signals.tagAdded.add( update );
	signals.tagRemoved.add( update );
	signals.tagChanged.add( update );

	signals.objectSelected.add( function ( object ) {

		if ( object !== null ) {

			if(object.userData && object.userData.isVoxel){
				container.setDisplay( 'none' );
			}else{
				container.setDisplay( 'block' );
			}
			update();

		} else {

			container.setDisplay( 'none' );

		}

	} );

	return container;

};

export { SidebarTag };
