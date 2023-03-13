var KeyboardState = function () {

	var self = this;

	this.k = {  
		8: "BACKSPACE",  9: "TAB",       13: "ENTER",    16: "SHIFT", 
		17: "CTRL",     18: "ALT",       27: "ESC",      32: "SPACE",
		33: "PAGEUP",   34: "PAGEDOWN",  35: "END",      36: "HOME",
		37: "LEFT",     38: "UP",        39: "RIGHT",    40: "DOWN",
		45: "INSERT",   46: "DELETE",   186: ";",       187: "=",
		188: ",",      189: "-",        190: ".",       191: "/",
		219: "[",      220: "\\",       221: "]",       222: "'"
	};

	this.status = {};

	this.keyName = function ( keyCode ) {
		return ( this.k[keyCode] != null ) ? this.k[keyCode] :  String.fromCharCode(keyCode);
	}

	this.onKeyUp = function(event) {
		var key = self.keyName(event.keyCode);
		if ( self.status[key] )
			self.status[key] = { down: false, pressed: true, up: false, released: true, heldDown: false, downUpdated: true, upUpdated: false }
	}

	this.onKeyDown = function(event) {
		var key = self.keyName(event.keyCode);
		if ( !self.status[key] )
			self.status[key] = { down: false, pressed: true, up: false, released: false, heldDown: false, downUpdated: false, upUpdated: true };
		else if ( self.status[key].released ) {
			self.status[key].downUpdated = false;
			self.status[key].released = false;
		}
	}	
}

KeyboardState.prototype = Object.assign( Object.create( { } ), {

	constructor: KeyboardState,

	init: function () {

		this.status = {};

		document.addEventListener("keydown", this.onKeyDown, false);
		document.addEventListener("keyup",   this.onKeyUp,   false);

	},

	dispose: function () {

		document.removeEventListener("keydown", this.onKeyDown);
		document.removeEventListener("keyup", this.onKeyUp);

	},

	update: function () {

		for (var key in this.status) {
			if ( !this.status[key].downUpdated ) {
				this.status[key].down = true;
				this.status[key].heldDown = true;
				this.status[key].downUpdated = true;
			}
			else
				this.status[key].down = false;
	
			if ( this.status[key].pressed && !this.status[key].upUpdated ) {
				this.status[key].up = true;
				this.status[key].upUpdated = true;
			}
			else
				this.status[key].up = false;
		}

	},

	wasPressed: function (keyName) {
		keyName = keyName.toUpperCase();
		return (this.status[keyName] && this.status[keyName].down);
	},
	
	wasPressedRepeat: function (keyName) {
		keyName = keyName.toUpperCase();
		return (this.status[keyName] && this.status[keyName].pressed);
	},
	
	isUp: function (keyName) {
		keyName = keyName.toUpperCase();
		return (this.status[keyName] && this.status[keyName].up);
	},
	
	isReleased: function (keyName) {
		keyName = keyName.toUpperCase();
		return (this.status[keyName] && this.status[keyName].released);
	},
	
	isHeldDown: function (keyName) {
		keyName = keyName.toUpperCase();
		return (this.status[keyName] && this.status[keyName].heldDown);
	}

});