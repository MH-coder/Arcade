import { UIDiv, UIImage, UINumber, UIRow, UIRowShelf, UIText } from "../components/ui";
import { UIStyledRadioButton,UIStyledCheckbox } from "../components/ui.openstudio";

function SidebarObjectConnection( editor, name ) {

	var strings = editor.strings;
	var config = editor.config;
	var signals = editor.signals;

    var axis = null;
    var mouse = null;
    var mouseRadios = {};

	var container = new UIDiv();
	container.addClass("StyledRadioButtons")
	container.setDisplay( 'none' );


    [ 'x', 'y', 'wheel' ].map( ( m ) => {

        //mouseRadios[ m ] = new UIStyledRadioButton( name, false ).setIdFor( name + 'mouse' + m.toUpperCase() );
        mouseRadios[ m ] = new UIStyledCheckbox( name, false ).setIdFor( name + 'mouse' + m.toUpperCase() );
        mouseRadios[ m ].onChange( function () {
					if ( this.getValue() == true ) {
						for(var i in mouseRadios){
							if(mouseRadios[i]!= this){
								mouseRadios[i].setValue(false);
							}
						}
					}
            mouse = m;

            var changeEvent = document.createEvent( 'HTMLEvents' );
            changeEvent.initEvent( 'change', true, true );
            changeEvent.axis = axis;
            changeEvent.mouse = m;
            changeEvent.speed = connectionSpeed.getValue();
            changeEvent.enabled = this.getValue();
            changeEvent.eventType = 'connection';

            container.dom.dispatchEvent( changeEvent );
            //container.setDisplay( 'none' );

        } );
        /*mouseRadios[ m ].onMouseDown( function ( e ) {

            if ( this.getValue() == true ) {

                e.preventDefault();
								e.stopPropagation();
                //var changeEvent = document.createEvent( 'HTMLEvents' );
                //changeEvent.initEvent( 'change', true, true );
                //changeEvent.axis = axis;
                //changeEvent.enabled = false;
                //changeEvent.eventType = 'connection';

                //container.dom.dispatchEvent( changeEvent );

                this.setValue( false );
								mouseRadios[ m ].changeHandler();
                //container.setDisplay( 'none' );

            }

        } );*/

        var row = new UIRowShelf();
        row.add( new UIText( strings.getKey( 'sidebar/object/connection/' + m ) ) );
        row.add( mouseRadios[ m ] );

        container.add( row );

    } );

    var connectionSpeed = new UINumber( 1 ).onChange( function () {

        var enabled = false;

        [ 'x', 'y', 'wheel' ].map( ( m ) => {
					enabled = enabled || mouseRadios[ m ].getValue();
					if(mouseRadios[ m ].getValue()){
						mouse = m;
					}
				} );

        var changeEvent = document.createEvent( 'HTMLEvents' );
        changeEvent.initEvent( 'change', true, true );
        changeEvent.axis = axis;
        changeEvent.mouse = mouse;
        changeEvent.speed = this.getValue();
        changeEvent.enabled = enabled;
        changeEvent.eventType = 'connection';

        container.dom.dispatchEvent( changeEvent );
        //container.setDisplay( 'none' );

    } );

    var speedRow = new UIRowShelf();
    speedRow.add( new UIText( strings.getKey( 'sidebar/object/connection/speed' ) ) );
    speedRow.add( connectionSpeed );

    container.add( speedRow );

    container.setAxis = function ( x ) {

        axis = x;

    }

    container.setValues = function ( conn ) {

        [ 'x', 'y', 'wheel' ].map( ( m ) => {

            mouseRadios[ m ].setValue( conn.mouse == m );

        } );

        connectionSpeed.setValue( conn.speed );

    }

    container.clearValues = function () {

        [ 'x', 'y', 'wheel' ].map( ( m ) => {

            mouseRadios[ m ].setValue( false );

        } );

        connectionSpeed.setValue( 1 );

    }

	return container;

}

export { SidebarObjectConnection };
