/**
 * @author codelegend620
 */

import { UIElement, UIColor, UICheckbox, UIRadioButton, UIDiv, UIImage, UIText } from './ui.js';
import { EventManager } from '../../utils/EventManager.js';
import * as THREE from '../../libs/three.module.js';

// UIStyledCheckbox

var UIStyledCheckbox = function ( boolean ) {

	UIElement.call( this );

	var dom = document.createElement( 'div' );
	dom.className = 'StyledCheckbox';

	var input = new UICheckbox( boolean );
	input.setDisplay( 'none' );

	var label = document.createElement( 'label' );

	this.dom = dom;
	this.input = input;
	this.label = label;
	this.changeHandler = undefined;

	var scope = this;

	this.onClick( function ( e ) {

		e.stopPropagation();

	} );

	this.input.onChange( function ( e ) {

		e.stopPropagation();

		if ( scope.changeHandler ) {

			scope.changeHandler();

		}

	} );

	this.add( this.input );
	this.dom.appendChild( label );

	return this;

};

UIStyledCheckbox.prototype = Object.create( UIElement.prototype );
UIStyledCheckbox.prototype.constructor = UIStyledCheckbox;

UIStyledCheckbox.prototype.getValue = function () {

	return this.input.getValue();

};

UIStyledCheckbox.prototype.setValue = function ( value ) {

	this.input.setValue( value );

	return this;

};

UIStyledCheckbox.prototype.onChange = function ( handler ) {

	this.changeHandler = handler;

	return this;

};

UIStyledCheckbox.prototype.setIdFor = function ( id ) {

	this.input.setId( id );
	this.label.setAttribute( 'for', id );

	return this;

};


// UIStyledRadioButton

var UIStyledRadioButton = function ( name, boolean ) {

	UIElement.call( this );

	var dom = document.createElement( 'div' );
	dom.className = 'StyledCheckbox';

	var input = new UIRadioButton( name, boolean );
	input.setDisplay( 'none' );

	var label = document.createElement( 'label' );

	this.dom = dom;
	this.input = input;
	this.label = label;
	this.changeHandler = undefined;

	var scope = this;

	this.onClick( function ( e ) {

		e.stopPropagation();

	} );

	this.input.onChange( function ( e ) {

		e.stopPropagation();

		if ( scope.changeHandler ) {

			scope.changeHandler();

		}

	} );

this.label.addEventListener("click",function(e){
	if(input.dom.checked){
		input.dom.checked = false;
	}
})
	this.add( this.input );
	this.dom.appendChild( label );

	return this;

};

UIStyledRadioButton.prototype = Object.create( UIElement.prototype );
UIStyledRadioButton.prototype.constructor = UIStyledRadioButton;

UIStyledRadioButton.prototype.getValue = function () {

	return this.input.getValue();

};

UIStyledRadioButton.prototype.setValue = function ( value ) {

	this.input.setValue( value );

	return this;

};

UIStyledRadioButton.prototype.onChange = function ( handler ) {

	this.changeHandler = handler;

	return this;

};

UIStyledRadioButton.prototype.setIdFor = function ( id ) {

	this.input.setId( id );
	this.label.setAttribute( 'for', id );

	return this;

};


// UIColorPicker

var UIColorPicker = function ( editor ) {

	UIElement.call( this );

	var dom = document.createElement( 'div' );
	dom.className = 'ColorPicker';

	var input = new UIColor();
	input.setDisplay( 'none' );

	this.editor = editor;
	this.dom = dom;
	this.input = input;
	this.changeHandler = undefined;

	this.add( this.input );

	var scope = this;

	this.onClick( function () {

		scope.editor.showColorPicker = ! scope.editor.showColorPicker;
		scope.editor.signals.showColorPickerChanged.dispatch( true, this.input.getValue(), function ( hex ) {

			scope.setHexValue( hex );

			if ( scope.changeHandler ) {

				scope.changeHandler();

			}

		} );

	} );

	return this;

};

UIColorPicker.prototype = Object.create( UIElement.prototype );
UIColorPicker.prototype.constructor = UIColorPicker;

UIColorPicker.prototype.getValue = function () {

	return this.input.getValue();

};

UIColorPicker.prototype.getHexValue = function () {

	return this.input.getHexValue();

};

UIColorPicker.prototype.setValue = function ( value ) {

	this.input.setValue( value );
	this.setBackgroundColor( this.input.getValue() );

	return this;

};

UIColorPicker.prototype.setHexValue = function ( hex ) {

	this.input.setHexValue( hex );
	this.setBackgroundColor( this.input.getValue() );

	return this;

};

UIColorPicker.prototype.onChange = function ( handler ) {

	this.changeHandler = handler;

	return this;

};

// UIGrid
var UIGrid = function ( ) {

	UIElement.call( this );

	var dom = document.createElement( 'div' );
	dom.className = 'Grid';
	dom.tabIndex = 0;

	this.dom = dom;
	this.items = [];
	this.listitems = [];
	this.itemClickedHandler = undefined;

	return this;

};

UIGrid.prototype = Object.create( UIElement.prototype );
UIGrid.prototype.constructor = UIGrid;

UIGrid.prototype.setItems = function ( items ) {

	if ( Array.isArray( items ) ) {

		this.items = items;

	}

	this.render();

};

UIGrid.prototype.render = function ( ) {

	while ( this.listitems.length ) {

		var item = this.listitems[ 0 ];

		item.dom.remove();

		this.listitems.splice( 0, 1 );

	}

	for ( var i = 0; i < this.items.length; i ++ ) {

		var listitem = new UIGrid.GridItem( this, this.items[ i ] );

		this.add( listitem );

	}

};

// Assuming user passes valid list items
UIGrid.prototype.add = function () {

	var items = Array.from( arguments );

	this.listitems = this.listitems.concat( items );

	UIElement.prototype.add.apply( this, items );

};

UIGrid.prototype.setItemClickedHandler = function ( handler ) {

	if ( handler ) {

		this.itemClickedHandler = handler;

	}

};

// Grid Item
UIGrid.GridItem = function ( parent, item ) {

	UIElement.call( this );

	this.parent = parent;

	var dom = document.createElement( 'div' );
	dom.className = 'GridItem';

	this.dom = dom;

	if ( item.image ) {

		var image = new UIImage();
		image.setClass( 'GridItemImage' );

		this.image = image;
		this.add( this.image );

	} else {

		var icon = new UIDiv();
		icon.setClass( 'GridItemIcon' );

		this.icon = icon;
		this.add( this.icon );

	}

	var text = new UIDiv();
	text.setClass( 'GridItemText' );

	this.text = text;
	this.add( this.text );

	this.value = '';

	var scope = this;

	function onClick() {

		if ( scope.parent && scope.parent.itemClickedHandler ) {

			scope.parent.itemClickedHandler( scope.value );

		}

	}

	dom.addEventListener( 'click', onClick, false );

	this.setValue( item.value );
	this.setText( item.name || item.type );

	if ( item.image ) {

		this.setImage( item.image );

	}

	return this;

};

UIGrid.GridItem.prototype = Object.create( UIElement.prototype );
UIGrid.GridItem.prototype.constructor = UIGrid.GridItem;

UIGrid.GridItem.prototype.setImage = function ( src ) {

	if ( src ) {

		this.image.setSrc( src );

	} else {



	}

	return this;

};

UIGrid.GridItem.prototype.setText = function ( text ) {

	this.text.setTextContent( text );

	return this;

};

UIGrid.GridItem.prototype.setValue = function ( value ) {

	this.value = value;

	return this;

};


// UIGallery
var UIGallery = function ( cols ) {

	UIElement.call( this );

	var dom = document.createElement( 'div' );
	dom.className = 'Gallery';
	dom.tabIndex = 0;

	this.dom = dom;

	this.cols = [];

	var count = cols || 2;
	var width = ( 100 - ( count - 1 ) * 4 ) / count;
	for ( var i = 0; i < count; i ++ ) {

		var col = new UIDiv();
		col.setWidth( `${width}%` );

		this.cols.push( col );
		this.add( col );

	}

	this.items = [];

	return this;

};

UIGallery.prototype = Object.create( UIElement.prototype );
UIGallery.prototype.constructor = UIGallery;

UIGallery.prototype.addItem = function ( item ) {

	var index = this.items.length % this.cols.length;

	this.items.push( item );

	this.cols[ index ].add( item );

};

UIGallery.prototype.clearItems = function () {

	for ( var item of this.items ) {

		item.delete();

	}

	this.items = [];

};


// UIAccordion
var UIAccordion = function (accordionGroup="defaultAccordionGroup" ) {

	UIElement.call( this );

	var dom = document.createElement( 'div' );
	dom.className = 'Accordion';

	var title = new UIAccordion.AccordionTitle( this );
	var body = new UIAccordion.AccordionBody( this );

	body.dom.dataset.accordionGroup= accordionGroup;
	title.dom.dataset.accordionGroup= accordionGroup;
	dom.dataset.accordionGroup=accordionGroup;

	this.dom = dom;
	this.accordionGroup=accordionGroup;
	this.title = title;
	this.body = body;
	this.oneOpen = true;
	this.titleClickHandler = null;

	this.body.setDisplay( 'none' );

	this.add( this.title );
	this.add( this.body );

	var scope = this;

	this.title.onClick( function () {

		if ( scope.titleClickHandler ) {

			scope.titleClickHandler();

		}

		var body = $( scope.body.dom );
		var title = $( scope.title.dom );
		var activeBody = $( scope.dom ).closest( '.AccordionList' ).find( `.AccordionBody.active[data-accordion-group='${scope.accordionGroup}']` )[ 0 ];
		var activeTitle = $( scope.dom ).closest( '.AccordionList' ).find( `.AccordionTitle.active[data-accordion-group='${scope.accordionGroup}']` )[ 0 ];


		if ( scope.oneOpen && activeBody && scope.body.dom != activeBody ) {

			$( activeTitle ).removeClass( 'active' );
			$( activeBody ).removeClass( 'active' );
			$( activeBody ).slideUp();

		}

		title.toggleClass( 'active' );
		body.toggleClass( 'active' );
		body.slideToggle();

	} );

	return this;

};

UIAccordion.prototype = Object.create( UIElement.prototype );
UIAccordion.prototype.constructor = UIAccordion;

UIAccordion.prototype.setTitle = function ( title ) {

	this.title.setText( title );

	return this;

};

// Assuming user passes valid list items
UIAccordion.prototype.addToBody = function ( ) {

	for ( var i = 0; i < arguments.length; i ++ ) {

		var argument = arguments[ i ];

		if ( argument instanceof UIElement ) {

			this.body.add( argument );

		} else {

			console.error( 'UIElement:', argument, 'is not an instance of UIElement.' );

		}

	}

	return this;

};

// Assuming user passes valid list items
UIAccordion.prototype.prependToBody = function ( ) {

	for ( var i = 0; i < arguments.length; i ++ ) {

		var argument = arguments[ i ];

		if ( argument instanceof UIElement ) {

			this.body.prepend( argument );

		} else {

			console.error( 'UIElement:', argument, 'is not an instance of UIElement.' );

		}

	}

	return this;

};

UIAccordion.prototype.addAction = function ( action ) {

	this.title.addAction( action );

};

UIAccordion.prototype.close = function () {

	this.body.removeClass( 'active' );
	this.body.setDisplay( 'none' );

};

UIAccordion.prototype.onTitleClick = function ( cb ) {

	this.titleClickHandler = cb;

};

// Accordion Title
UIAccordion.AccordionTitle = function ( parent ) {

	UIElement.call( this );

	var dom = document.createElement( 'div' );
	dom.className = 'AccordionTitle';

	var text = new UIDiv();
	text.setClass( 'AccordionTitleText' );

	var actions = new UIDiv();
	actions.setClass( 'AccordionActions' );

	this.dom = dom;
	this.text = text;
	this.actions = actions;

	this.add( this.text );
	this.add( this.actions );

	return this;

};

UIAccordion.AccordionTitle.prototype = Object.create( UIElement.prototype );
UIAccordion.AccordionTitle.prototype.constructor = UIAccordion.AccordionTitle;

UIAccordion.AccordionTitle.prototype.setText = function ( text ) {

	this.text.setTextContent( text );

	return this;

};

UIAccordion.AccordionTitle.prototype.addAction = function ( action ) {

	this.actions.add( action );

	return this;

};


// Accordion Body

UIAccordion.AccordionBody = function ( parent ) {

	UIElement.call( this );

	var dom = document.createElement( 'div' );
	dom.className = 'AccordionBody';

	this.dom = dom;

	return this;

};

UIAccordion.AccordionBody.prototype = Object.create( UIElement.prototype );
UIAccordion.AccordionBody.prototype.constructor = UIAccordion.AccordionBody;


// UIDropdown

var UIDropdown = function ( icon ) {

	UIElement.call( this );

	this.icon = icon || 'https://arcadestudio-assets.s3.us-east-2.amazonaws.com/engine-ui/hamburg-drop.svg';
	this.closeIcon = 'https://arcadestudio-assets.s3.us-east-2.amazonaws.com/engine-ui/add-btn.svg';

	var dom = document.createElement( 'div' );
	dom.className = 'Dropdown';

	this.dom = dom;
	this.selected = new UIDropdown.DropdownItem( this, true );
	this.selected.setClass( 'DropdownItemSelected' );
	this.container = new UIDiv();
	this.container.setClass( 'DropdownList' );
	this.custom = new UIDiv();
	this.list = new UIDiv();
	this.options = {};
	this.changeHandler = undefined;

	this.container.add( this.custom, this.list );
	this.add( this.selected, this.container );

	var scope = this;

	this.selected.onClick( function ( e ) {

		if ( ! this.editing ) {

			scope.close();

		}

	} );

	return this;

};

UIDropdown.prototype = Object.create( UIElement.prototype );
UIDropdown.prototype.constructor = UIDropdown;

UIDropdown.prototype.setOptions = function ( options ) {

	var scope = this;
	var selected = this.selected.getValue();

	this.list.clear();
	this.options = options;

	for ( var key in this.options ) {

		var dropdownitem = new UIDropdown.DropdownItem( this ).onClick( function () {

			scope.updateValue( this.value );

		} );

		dropdownitem.setText( this.options[ key ] );
		dropdownitem.setValue( key );

		this.list.add( dropdownitem );

	}

	this.setValue( selected );

	return this;

};

UIDropdown.prototype.getValue = function () {

	return this.selected.getValue();

};

UIDropdown.prototype.setValue = function ( value ) {

	this.selected.setValue( value );
	this.selected.setText( this.options[ value ] );

	return this;

};

UIDropdown.prototype.setLabel = function ( text ) {

	this.selected.setText( text );

	return this;

};

UIDropdown.prototype.getLabel = function ( text ) {

	return this.selected.getText();

};

UIDropdown.prototype.updateValue = function ( newValue ) {

	this.selected.removeClass( 'w--open' );
	this.container.removeClass( 'w--open' );

	this.setValue( newValue );

	if ( this.changeHandler ) {

		this.changeHandler();

	}

};

UIDropdown.prototype.onChange = function ( handler ) {

	this.changeHandler = handler;

	return this;

};

UIDropdown.prototype.close = function () {

	$( this.selected.dom ).toggleClass( 'w--open' );
	$( this.container.dom ).toggleClass( 'w--open' );

};

UIDropdown.prototype.isOpen = function () {

	return this.selected.dom.classList.contains( 'w--open' );

};

// DropdownItem

UIDropdown.DropdownItem = function ( parent, selected ) {

	UIElement.call( this );

	var dom = document.createElement( 'div' );
	dom.className = 'DropdownItem';

	var text = new UIDiv().setClass( 'DropdownItemText' );

	this.value = undefined;
	this.dom = dom;
	this.text = text;
	this.add( this.text );

	if ( selected ) {

		var image = new UIImage( parent.icon ).setWidth( '10px' );
		this.add( image );

	}

	if ( parent.itemDelete ) {

		var scope = this;
		var image = new UIImage( parent.closeIcon ).setClass( 'delete' );
		image.onClick( function ( e ) {

			e.stopPropagation();
			parent.deleteItemHandler( scope.value );

		} );

		this.text.addClass( 'delete' );
		this.add( image );

	}

	return this;

};

UIDropdown.DropdownItem.prototype = Object.create( UIElement.prototype );
UIDropdown.DropdownItem.prototype.constructor = UIDropdown.DropdownItem;

UIDropdown.DropdownItem.prototype.setText = function ( text ) {

	this.text.setTextContent( text );

	return this;

};

UIDropdown.DropdownItem.prototype.getText = function ( text ) {

	return this.text.dom.textContent;

};

UIDropdown.DropdownItem.prototype.setValue = function ( value ) {

	this.value = value;

	return this;

};

UIDropdown.DropdownItem.prototype.getValue = function () {

	return this.value;

};


// UITimelineDropdown

var UITimelineDropdown = function () {

	UIDropdown.call( this, 'https://arcadestudio-assets.s3.us-east-2.amazonaws.com/engine-ui/play-btn.svg' );

	var scope = this;
	var timelineName = this.selected.dom.childNodes[ 0 ];

	var rename = function ( dom ) {

		dom.contentEditable = false;
		scope.selected.editing = false;

		setCaret(scope.selected.text.dom)

		if ( scope.nameChangeHandler ) {

			scope.nameChangeHandler( dom.textContent );

		}

	};

	function setCaret(element) {

		element.scrollLeft = 0;

	}

	timelineName.addEventListener( 'keydown', function ( e ) {

		e.stopPropagation();

		if ( e.keyCode == 13 ) {

			e.preventDefault();
			rename( this );

		}

	} );

	timelineName.addEventListener( 'blur', function () {

		rename( this );

	} );

	timelineName.addEventListener( 'dblclick', function () {

		scope.selected.editing = true;
		this.contentEditable = true;
		this.spellcheck = false;
		this.focus();
		document.execCommand( 'selectAll', false, null );

	} );

	var addTimelineButton = new UIDiv().setClass( 'active' );
	addTimelineButton.dom.innerHTML = '&#43; timeline';
	addTimelineButton.onClick( function () {

		scope.selected.removeClass( 'w--open' );
		scope.container.removeClass( 'w--open' );

		if ( scope.addTimelineHandler ) {

			scope.addTimelineHandler();

		}

	} );

	var addTrackButton = new UIDiv();
	addTrackButton.dom.innerHTML = '&#43; track';
	addTrackButton.onClick( function () {

		scope.selected.removeClass( 'w--open' );
		scope.container.removeClass( 'w--open' );

		if ( scope.addTrackHandler ) {

			scope.addTrackHandler();

		}

	} );

	this.custom.setClass( 'Buttons' );
	this.custom.add( addTrackButton, addTimelineButton );

	this.itemDelete = false;
	this.deleteItemHandler = null;

};

UITimelineDropdown.prototype = Object.create( UIDropdown.prototype );
UITimelineDropdown.prototype.constructor = UITimelineDropdown;

UITimelineDropdown.prototype.onAddTimeline = function ( handler ) {

	this.addTimelineHandler = handler;

	return this;

};

UITimelineDropdown.prototype.onAddTrack = function ( handler ) {

	this.addTrackHandler = handler;

	return this;

};

UITimelineDropdown.prototype.onRenameTimeline = function ( handler ) {

	this.nameChangeHandler = handler;

	return this;

};

UITimelineDropdown.prototype.onDeleteTimeline = function ( handler ) {

	this.itemDelete = true;
	this.deleteItemHandler = handler;

};

// UITrackDropdown

var UITrackDropdown = function () {

	UIDropdown.call( this, 'https://arcadestudio-assets.s3.us-east-2.amazonaws.com/engine-ui/play-btn.svg' );

	this.state = 'object';

};

UITrackDropdown.prototype = Object.create( UIDropdown.prototype );
UITrackDropdown.prototype.constructor = UITimelineDropdown;

UITrackDropdown.prototype.setOptions = function ( options ) {

	var scope = this;

	this.list.clear();
	this.options = options;

	for ( var key in this.options ) {

		var dropdownitem = new UIDropdown.DropdownItem( this ).onClick( function () {

			scope.updateValue( this.value );

		} );

		dropdownitem.setText( this.options[ key ] );
		dropdownitem.setValue( key );

		this.list.add( dropdownitem );

	}

	return this;

};

UITrackDropdown.prototype.updateValue = function ( newValue ) {

	this[ this.state ] = newValue;

	if ( this.state == 'object' ) {

		this.state = 'property';

	} else if ( this.state == 'property' ) {

		this.state = 'attribute';

	} else if ( this.state == 'attribute' ) {

		this.state = 'value';
		this.selected.removeClass( 'w--open' );
		this.container.removeClass( 'w--open' );

	}

	this.setValue( newValue );

	if ( this.changeHandler ) {

		this.changeHandler();

	}

};


// UIStyledTabs

var UIStyledTabs = function () {

	UIElement.call( this );

	var dom = document.createElement( 'div' );
	dom.className = 'StyledTabs';

	this.dom = dom;
	this.tabs = [];
	this.index = - 1;

	this.nameChangeHandler = null;
	this.changeHandler = null;

	return this;

};

UIStyledTabs.prototype = Object.create( UIElement.prototype );
UIStyledTabs.prototype.constructor = UIStyledTabs;

UIStyledTabs.prototype.addTab = function ( label, src ) {

	var tab = new UIStyledTabs.Tab( label, src, this );
	var scope = this;

	tab.onChange( function () {

		var newName = this.getTitle();
		var index = scope.tabs.indexOf( this );

		if ( scope.nameChangeHandler ) {

			scope.nameChangeHandler( index, newName );

		}

	} );
	tab.onClick( function () {

		var index = scope.tabs.indexOf( this );

		if ( scope.changeHandler ) {

			scope.changeHandler( index );

		}

	} );
	tab.onDelete( function () {

		var index = scope.tabs.indexOf( this );

		if ( scope.deleteHandler ) {

			scope.deleteHandler( index );

		}

	} );

	this.tabs.push( tab );
	this.add( tab );

};

UIStyledTabs.prototype.removeAllTabs = function () {

	for ( var tab of this.tabs ) {

		tab.delete();

	}

	this.tabs = [];

};

UIStyledTabs.prototype.removeTab = function ( index ) {

	this.tabs[ index ].delete();
	this.tabs.splice( index, 1 );

};

UIStyledTabs.prototype.onNameChange = function ( handler ) {

	this.nameChangeHandler = handler;

};

UIStyledTabs.prototype.onChange = function ( handler ) {

	this.changeHandler = handler;

};

UIStyledTabs.prototype.onDelete = function ( handler ) {

	this.deleteHandler = handler;

};

UIStyledTabs.Tab = function ( text, image, parent ) {

	UIElement.call( this );

	var dom = document.createElement( 'div' );
	dom.className = 'StyledTab';

	this.parent = parent;
	this.dom = dom;
	this.label = new UIText( text );
	this.close = new UIImage( image );
	this.close.setClass( 'delete' );

	this.deleteHandler = null;

	var scope = this;

	this.label.onDblClick( function ( e ) {

		this.dom.contentEditable = true;
		this.dom.spellcheck = false;
		this.dom.focus();
		document.execCommand( 'selectAll', false, null );

	} );

	this.label.onKeyDown( function ( e ) {

		e.stopPropagation();

		if ( e.keyCode == 13 ) {

			e.preventDefault();
			this.dom.contentEditable = false;

			var changeEvent = document.createEvent( 'HTMLEvents' );
			changeEvent.initEvent( 'change', true, true );
			scope.dom.dispatchEvent( changeEvent );

		}


	} );

	this.close.onClick( function ( e ) {

		e.stopPropagation();
		if ( scope.deleteHandler ) {

			scope.deleteHandler();

		}

	} );


	this.add( this.label );
	this.add( this.close );

	return this;

};

UIStyledTabs.Tab.prototype = Object.create( UIText.prototype );
UIStyledTabs.Tab.prototype.constructor = UIStyledTabs.Tab;

UIStyledTabs.Tab.prototype.getTitle = function () {

	return this.label.getValue();

};

UIStyledTabs.Tab.prototype.onDelete = function ( handler ) {

	return this.deleteHandler = handler;

};

// UISkybox

var UISkybox = function ( editor ) {

	UIElement.call( this );

	var container = new UIDiv().setClass( 'Skybox' );

	this.onChangeCallback = null;
	this.dom = container.dom;

	this.dom.draggable = true;

	this.canvas = document.createElement( 'canvas' );
	this.canvas.width = 200;
	this.canvas.height = 150;

	this.images = [ null, null, null, null, null, null ];

	this.dom.appendChild( this.canvas );

};

UISkybox.prototype = Object.create( UIElement.prototype );
UISkybox.prototype.constructor = UISkybox;

UISkybox.prototype.drawImage = function ( name, url ) {

	var info = {
		px: { index: 0, dx: 0, dy: 50 },
		nx: { index: 1, dx: 100, dy: 50 },
		py: { index: 2, dx: 50, dy: 0 },
		ny: { index: 3, dx: 50, dy: 100 },
		pz: { index: 4, dx: 50, dy: 50 },
		nz: { index: 5, dx: 150, dy: 50 }
	};
	var scope = this;
	var image = new Image();

	this.images[ info[ name ].index ] = url;

	image.onload = function () {

		var context = scope.canvas.getContext( '2d' );
		context.drawImage( image, info[ name ].dx, info[ name ].dy, 50, 50 );

	};

	image.src = url;

};

// UIImageButton

var UIImageButton = function ( url, text ) {

	UIElement.call( this );

	this.dom = document.createElement( 'div' );
	this.dom.className = 'ImageButton';

	var wrapper = new UIDiv().setClass( 'CircleIcon' );
	var image = new UIImage( url );
	var label = new UIText( text );

	wrapper.add( image );
	this.add( wrapper );
	this.add( label );

};

UIImageButton.prototype = Object.create( UIElement.prototype );
UIImageButton.prototype.constructor = UIImageButton;


var SubGraph = function ( canvas, name, color ) {

	if ( canvas === undefined ) {

		canvas = document.createElement( 'canvas' );
		canvas.style.position = 'absolute';

	}

	this.canvas = canvas;
	this.name = name !== undefined ? name : 'default';
	this.color = color !== undefined ? color : '#ffffff';
	this.values = [];
	this.buttons = [];
	this.onChange = null;

};

var UIGraph = function ( name, color ) {

	UIElement.call( this );

	this.size = { x: 200, y: 120 };

	var dom = document.createElement( 'div' );
	dom.className = 'Graph';

	this.dom = dom;
	this.dom.style.overflow = 'visible';

	this.setWidth( this.size.x + 'px' );
	this.setHeight( this.size.y + 'px' );

	this.scaleMargin = 22;
	this.buttonRadius = 10;
	this.max = 1.0;
	this.min = 0.0;

	this.grid = document.createElement( 'canvas' );
	this.grid.style.position = 'absolute';
	this.grid.style.marginLeft = this.scaleMargin + 'px';

	this.dom.appendChild( this.grid );

	this.graph = [];
	this.addGraph( name, color );

	this.scale = [];
	this.createScale( 3 );

};

UIGraph.prototype = Object.create( UIElement.prototype );
UIGraph.prototype.constructor = UIGraph;

UIGraph.prototype.createScale = function ( size ) {

	for ( var i = 0; i < this.scale; i ++ ) {

		this.dom.removeChild( this.scale[ i ] );

	}

	var step = ( this.max - this.min ) / ( size - 1 );

	for ( var i = 0; i < size; i ++ ) {

		var scale = document.createElement( 'div' );
		scale.style.position = 'absolute';
		scale.style.pointerEvents = 'none';

		var text = document.createTextNode( this.max - step * i );
		scale.text = text;
		scale.appendChild( text );

		this.scale.push( scale );
		this.dom.appendChild( scale );

	}

};

UIGraph.prototype.updateScale = function () {

	var step = ( this.max - this.min ) / ( this.scale.length - 1 );

	for ( var i = 0; i < this.scale.length; i ++ ) {

		this.scale[ this.scale.length - 1 - i ].text.data = this.min + step * i;

	}

};

UIGraph.prototype.addGraph = function ( name, color ) {

	var canvas = document.createElement( 'canvas' );
	canvas.style.position = 'absolute';
	canvas.style.marginLeft = this.scaleMargin + 'px';
	this.dom.appendChild( canvas );

	this.graph.push( new SubGraph( canvas, name, color ) );

};

UIGraph.prototype.setOnChange = function ( onChange, name ) {

	var graph = this.getGraph( name );
	graph.onChange = onChange;

};

UIGraph.prototype.setRange = function ( min, max ) {

	this.min = min;
	this.max = max;

	// Limit graphs values
	for ( var i in this.graph ) {

		var graph = this.graph[ i ];

		for ( var j = 0; j < graph.values.length; j ++ ) {

			if ( graph.values[ j ] < min ) {

				graph.values[ j ] = min;

				if ( graph.onChange !== null ) {

					graph.onChange( graph.values );

				}

			} else if ( graph.values[ j ] > max ) {

				graph.values[ j ] = max;

				if ( graph.onChange !== null ) {

					graph.onChange( graph.values );

				}

			}

		}

	}

	this.updateScale();

	// Update grid to fit new scale
	for ( var i = 0; i < this.graph.length; i ++ ) {

		this.updateGraph( this.graph[ i ] );

	}

};

UIGraph.prototype.setValue = function ( values, name ) {

	var self = this;
	var graph = this.getGraph( name );

	// Set values
	graph.values = values;

	// Add buttons if necessary
	while ( graph.buttons.length < graph.values.length ) {

		var button = document.createElement( 'div' );
		button.style.borderRadius = '5px';
		button.style.backgroundColor = graph.color;
		button.style.cursor = 'pointer';
		button.style.position = 'absolute';
		button.style.marginTop = '-' + this.buttonRadius / 2 + 'px';
		button.style.marginLeft = this.scaleMargin - this.buttonRadius / 2 + 'px';
		button.style.width = this.buttonRadius + 'px';
		button.style.height = this.buttonRadius + 'px';
		button.index = graph.buttons.length;
		button.graph = graph;

		button.onmousedown = function ( event ) {

			var index = this.index;
			var graph = this.graph;
			var manager = new EventManager();

			manager.add( window, "mousemove", function ( event ) {

				var delta = event.movementY;

				graph.values[ index ] -= delta * ( ( self.max - self.min ) / self.size.y );

				if ( graph.values[ index ] > self.max ) {

					graph.values[ index ] = self.max;

				} else if ( graph.values[ index ] < self.min ) {

					graph.values[ index ] = self.min;

				}

				if ( graph.onChange !== null ) {

					graph.onChange( graph.values );

				}

				self.updateGraph( graph );

			} );

			manager.add( window, "mouseup", function ( event ) {

				manager.destroy();

			} );
			manager.create();

			event.stopPropagation();

		};

		this.dom.appendChild( button );
		graph.buttons.push( button );

	}

	// Remove buttons if necessary
	while ( graph.buttons.length > graph.values.length ) {

		this.dom.removeChild( graph.buttons.pop() );

	}

	// Check if new values are in range
	var update = false;
	for ( var i = 0; i < values.length; i ++ ) {

		if ( values[ i ] < this.min ) {

			this.min = Math.ceil( values[ i ] );
			update = true;
			break;

		} else if ( values[ i ] > this.max ) {

			this.max = Math.ceil( values[ i ] + 1.0 );
			update = true;
			break;

		}

	}

	// If some value not in range update range
	if ( update ) {

		this.setRange( this.min, this.max );

	}

	// Update graph
	this.updateGraph( graph );

};

UIGraph.prototype.getValue = function ( name ) {

	var graph = this.getGraph( name );

	if ( graph !== null ) {

		return graph.values;

	}

	return null;

};

UIGraph.prototype.getGraph = function ( name ) {

	if ( name !== undefined ) {

		for ( var i = 0; i < this.graph.length; i ++ ) {

			if ( this.graph[ i ].name === name ) {

				return this.graph[ i ];

			}

		}

	}

	if ( this.graph.length > 0 ) {

		return this.graph[ 0 ];

	}

	return null;

};

UIGraph.prototype.updateGraph = function ( graph ) {

	var width = this.size.x - this.scaleMargin;

	// Get canvas context
	var context = graph.canvas.getContext( '2d' );
	context.clearRect( 0, 0, width, this.size.y );
	context.strokeStyle = '#111';
	context.lineWidth = '2';

	// Draw graph and set button positions
	var step = width / ( graph.values.length - 1 );
	var delta = this.max - this.min;

	context.moveTo( 0, graph.values[ 0 ] * this.size.y );
	context.beginPath();

	for ( var i = 0; i < graph.values.length; i ++ ) {

		var x = i * step;
		var y = ( 1 - ( graph.values[ i ] - this.min ) / delta ) * this.size.y;

		context.lineTo( x, y );

		var button = graph.buttons[ i ];
		button.style.left = x + 'px';
		button.style.top = y + 'px';

	}

	context.stroke();

};

UIGraph.prototype.updateGrid = function () {

	var width = this.size.x - this.scaleMargin;

	var context = this.grid.getContext( '2d' );
	context.clearRect( 0, 0, width, this.size.y );
	context.strokeStyle = '#111';
	context.lineWidth = '1';

	// Border
	context.beginPath();
	context.rect( 0, 0, width - 1, this.size.y );
	context.stroke();
	context.moveTo( 0, 0 );

	var step = width / 10;
	if ( step <= 0 ) {

		return;

	}

	// Vertical lines
	for ( var i = 0; i < width - 1; i += step ) {

		context.beginPath();
		context.moveTo( i, 0 );
		context.lineTo( i, this.size.y );
		context.stroke();

	}

	// Horizontal lines
	for ( var i = 0; i < this.size.y; i += step ) {

		context.beginPath();
		context.moveTo( 0, i );
		context.lineTo( width, i );
		context.stroke();

	}

};

UIGraph.prototype.updateSize = function () {

	var width = this.size.x - this.scaleMargin;

	// Grid
	this.grid.width = width;
	this.grid.height = this.size.y;
	this.grid.style.width = width + 'px';
	this.grid.style.height = this.size.y + 'px';
	this.updateGrid();

	// Graph
	for ( var i = 0; i < this.graph.length; i ++ ) {

		var graph = this.graph[ i ];
		graph.canvas.width = width;
		graph.canvas.height = this.size.y;
		graph.canvas.style.width = width + 'px';
		graph.canvas.style.height = this.size.y + 'px';
		this.updateGraph( graph );

	}

	// Scale
	var step = ( this.size.y - 14 ) / ( this.scale.length - 1 );
	for ( var i = 0; i < this.scale.length; i ++ ) {

		this.scale[ i ].style.top = i * step + 'px';

	}

};


var UIColorGradientChooser = function () {

	UIElement.call( this );

	var dom = document.createElement( 'div' );
	dom.className = 'ColorGradientChooser';

	this.size = { x: 160, y: 18 };
	this.dom = dom;
	this.onChange = null;
	this.values = [];
	this.buttons = [];

	this.dom.style.overflow = "hidden";
	this.dom.style.backgroundColor = "var(--panel-color)";
	this.dom.style.borderStyle = "none";
	this.dom.style.boxSizing = "border-box";
	this.dom.style.borderRadius = "4px";
	this.dom.style.zIndex = "2000";


	this.canvas = document.createElement( "canvas" );
	this.canvas.style.position = "absolute";
	this.canvas.style.top = "0px";
	this.canvas.style.left = "0px";
	this.canvas.style.width = "100%";
	this.canvas.style.height = "100%";

	this.dom.appendChild( this.canvas );

	this.setWidth( this.size.x + 'px' );
	this.setHeight( this.size.y + 'px' );

};

UIColorGradientChooser.prototype = Object.create( UIElement.prototype );
UIColorGradientChooser.prototype.constructor = UIColorGradientChooser;

UIColorGradientChooser.prototype.updateButtons = function () {

	var self = this;

	// Color change method called in the context of the DOM input
	function buttonOnChange() {

		var color = new THREE.Color( this.value );

		self.values[ this.index ].setRGB( color.r, color.g, color.b );
		self.updateValues();

		if ( self.onChange !== null ) {

			self.onChange( self.values[ this.index ], this.index );

		}

	}

	while ( this.buttons.length > this.values.length ) {

		this.dom.removeChild( this.buttons.shift() );

	}

	while ( this.buttons.length < this.values.length ) {

		var button = document.createElement( "input" );
		button.type = "color";
		button.style.display = "block";
		button.style.position = "absolute";
		button.style.top = "0px";
		button.style.width = "15px";
		button.style.height = "100%";
		button.style.cursor = "pointer";
		button.style.outline = "none";
		button.style.borderStyle = "none";
		button.style.boxSizing = "border-box";
		button.style.borderRadius = "2px";
		button.onchange = buttonOnChange;
		button.index = - 1;
		this.dom.appendChild( button );

		this.buttons.push( button );

	}

	for ( var i = 0; i < this.buttons.length; i ++ ) {

		this.buttons[ i ].index = i;

	}

};

UIColorGradientChooser.prototype.updateValues = function () {

	var context = this.canvas.getContext( "2d" );
	var gradient = context.createLinearGradient( 0, 0, this.canvas.width, 0 );

	var colorStep = 1 / ( this.values.length - 1 );
	var colorPercentage = 0;

	var buttonSpacing = ( this.size.x - 15 ) / ( this.buttons.length - 1 );
	var buttonPosition = 0;

	for ( var i = 0; i < this.values.length; i ++ ) {

		gradient.addColorStop( colorPercentage, this.values[ i ].getStyle() );

		var c = new THREE.Color( this.values[ i ].r, this.values[ i ].g, this.values[ i ].b );
		this.buttons[ i ].value = "#" + c.getHexString();
		this.buttons[ i ].style.left = buttonPosition + "px";

		colorPercentage += colorStep;
		buttonPosition += buttonSpacing;

	}

	context.fillStyle = gradient;
	context.fillRect( 0, 0, this.canvas.width, this.canvas.height );

};

UIColorGradientChooser.prototype.setOnChange = function ( onChange ) {

	this.onChange = onChange;

};

UIColorGradientChooser.prototype.setValue = function ( values ) {

	this.values = [];

	for ( var i = 0; i < values.length; i ++ ) {

		var color = new THREE.Color();
		color.copy( values[ i ] );
		this.values.push( color );

	}

	this.updateButtons();
	this.updateValues();

};

UIColorGradientChooser.prototype.getValue = function () {

	return this.values;

};

UIColorGradientChooser.prototype.updateSize = function () {

	this.canvas.width = this.size.x;
	this.canvas.height = this.size.y;

	this.updateValues();

};

export { UIStyledCheckbox, UIStyledRadioButton, UIStyledTabs, UIColorPicker, UIGrid, UIGallery, UIAccordion, UIDropdown, UITimelineDropdown, UITrackDropdown, UISkybox, UIImageButton, UIGraph, UIColorGradientChooser };
