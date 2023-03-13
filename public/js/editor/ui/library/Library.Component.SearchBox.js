import { UIDiv, UILink, UIImage, UIInput } from '../components/ui.js';

var LibraryComponentSearchBox = function ( editor ) {

    var scope = this;
    var config = editor.config;

    var container = new UIDiv();
    container.setClass( 'SearchBox' );

    var input = new UIInput( '' );
    input.addClass( 'SearchInput' );
    input.onChange( function () {

        if ( scope.onChangeHandler ) {

            scope.onChangeHandler( this.getValue() );

        }

    });

    container.add( input );
    container.add( new UIImage( config.getImage( 'engine-ui/search.svg' ) ).setWidth( '17px' ) );
    container.onKeywordChange = function ( handler ) {

        scope.onChangeHandler = handler;
    
    }
    
    container.setPlaceholder = function ( placeholder ) {

        input.dom.placeholder = placeholder;

    }

    return container;

}

export { LibraryComponentSearchBox };


