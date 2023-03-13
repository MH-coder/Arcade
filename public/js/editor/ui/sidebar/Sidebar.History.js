
import { UIText, UIRow } from '../components/ui.js';
import { UIStyledCheckbox, UIAccordion } from '../components/ui.openstudio.js';
import { UIOutliner } from '../components/ui.three.js';

function SidebarHistory( editor ) {

	var strings = editor.strings;

	var signals = editor.signals;

	var config = editor.config;

	var history = editor.history;

	var container = new UIAccordion().setTitle( strings.getKey( 'sidebar/history' ) ).setId( 'settings-history' );;

	var persistentRow = new UIRow();
	var persistent = new UIStyledCheckbox( config.getKey( 'settings/history' ) ).setIdFor( 'historyPersistent' ).onChange( function () {

		var value = this.getValue();

		config.saveKey( 'settings/history', value );

		if ( value ) {

			alert( 'The history will be preserved across sessions.\nThis can have an impact on performance when working with textures.' );

			var lastUndoCmd = history.undos[ history.undos.length - 1 ];
			var lastUndoId = ( lastUndoCmd !== undefined ) ? lastUndoCmd.id : 0;
			editor.history.enableSerialization( lastUndoId );

		} else {

			signals.historyChanged.dispatch();

		}

	} );

	persistentRow.add( new UIText( strings.getKey( 'sidebar/history/persistent' ) ) );
	persistentRow.add( persistent );

	container.addToBody( persistentRow );

	var ignoreObjectSelectedSignal = false;

	var outliner = new UIOutliner( editor );
	outliner.addClass( 'History' );
	outliner.setMaxHeight( '150px' );
	outliner.onChange( function () {

		ignoreObjectSelectedSignal = true;

		editor.history.goToState( parseInt( outliner.getValue() ) );

		ignoreObjectSelectedSignal = false;

	} );
	container.addToBody( outliner );

	//

	var refreshUI = function () {

		var options = [];

		function buildOption( object ) {

			var option = document.createElement( 'div' );
			option.value = object.id;

			return option;

		}

		( function addObjects( objects ) {

			for ( var i = 0, l = objects.length; i < l; i ++ ) {

				var object = objects[ i ];

				var option = buildOption( object );
				option.innerHTML = object.name;
				option.style.paddingLeft = '15px';

				options.push( option );

			}

		} )( history.undos );


		( function addObjects( objects ) {

			for ( var i = objects.length - 1; i >= 0; i -- ) {

				var object = objects[ i ];
				let needAddOption = true;
				if(object.userData && object.userData.isVoxel){
					needAddOption = false;
				}
				if(needAddOption){
					var option = buildOption( object );
					option.innerHTML = object.name;
					option.style.opacity = 0.3;
					option.style.paddingLeft = '15px';

					options.push( option );
				}

			}

		} )( history.redos );

		outliner.setOptions( options );

	};

	refreshUI();

	// events

	signals.editorCleared.add( refreshUI );

	signals.historyChanged.add( refreshUI );
	signals.historyChanged.add( function ( cmd ) {

		if ( ignoreObjectSelectedSignal === true ) return;

		outliner.setValue( cmd !== undefined ? cmd.id : null );

	} );


	return container;

}

export { SidebarHistory };
