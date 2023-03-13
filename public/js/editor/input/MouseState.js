var MouseState = function() {
	
	var self = this;

	this.status = {};
	
	this.mouseName = function (id) {

		var buttons = ['left', 'mid', 'right'];
		return buttons[id];

	}
	
	this.onMouseUp = function (event) {

		var mouseName = self.mouseName(event.button);

		if ( self.status[mouseName] ) {

			self.status[mouseName] = { down: false, pressed: true, up: false, released: true, heldDown: false, downUpdated: true, upUpdated: false };

		}
	}
	
	this.onMouseDown = function (event) {

		var mouseName = self.mouseName(event.button);

		if ( !self.status[mouseName] ) {

			self.status[mouseName] = { down: false, pressed: true, up: false, released: false, heldDown: false, downUpdated: false, upUpdated: true };

		}
		else if ( self.status[mouseName].released ) {

			self.status[mouseName].downUpdated = false;
			self.status[mouseName].released = false;

		}

	}

	this.onMouseMove = function (event) {
		var onmousestop = function() {
			self.move = false;
		}, thread;
	
		self.move = true;
		clearTimeout(thread);
		thread = setTimeout(onmousestop, 500);
	}
}

MouseState.prototype = Object.assign( Object.create( { } ), {

	constructor: MouseState,

	init: function () {

		this.status = {};

		document.addEventListener("mousedown", this.onMouseDown, false);
		document.addEventListener("mouseup", this.onMouseUp, false);
		document.addEventListener("mousemove", this.onMouseMove, false);

	},

	dispose: function () {

		document.removeEventListener("mousedown", this.onMouseDown);
		document.removeEventListener("mouseup", this.onMouseUp);
		document.removeEventListener("mousemove", this.onMouseMove);	

	},

	update: function() {
		for (var mouseName in this.status) {
			if ( !this.status[mouseName].downUpdated ) {
				this.status[mouseName].down = true;
				this.status[mouseName].heldDown = true;
				this.status[mouseName].downUpdated = true;
			}
			else
				this.status[mouseName].down = false;

			if ( this.status[mouseName].pressed && !this.status[mouseName].upUpdated ) {
				this.status[mouseName].up = true;
				this.status[mouseName].upUpdated = true;
			}
			else
				this.status[mouseName].up = false;
		}
	},
	
	wasPressed: function (mouseName) {
		return (this.status[mouseName] && this.status[mouseName].down);
	},

	wasPressedRepeat: function (mouseName) {
		return (this.status[mouseName] && this.status[mouseName].pressed);
	},

	isUp: function (mouseName) {
		return (this.status[mouseName] && this.status[mouseName].up);
	},

	isReleased: function (mouseName) {
		return (this.status[mouseName] && this.status[mouseName].released);
	},

	isHeldDown: function (mouseName) {
		return (this.status[mouseName] && this.status[mouseName].heldDown);
	},

	isMoving: function () {
		return this.move == true;
	},

	isNotMoving: function () {
		return this.move != true;
	}

});