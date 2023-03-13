/*!
 * Colr Pickr
 *
 * R-TEK
 *
 * https://github.com/R-TEK/colr_pickr
 *
 * MIT License
 */

/*
 * Set-up
 */

/**
 * All global states and variables needed for reference over the entire project
 *
 * @type {{instance: object | null, boxStatus: boolean, boxStatusTouch: boolean, sliderStatus: boolean, sliderStatusTouch: boolean, colorTypeStatus: string, hue: number, saturation: number, lightness: number, alpha: number, contextMenuElem: HTMLElement | null, doubleTapTime: number}}
 */
let colorPicker = {
	instance: null,
	boxStatus: false,
	boxStatusTouch: false,
	sliderStatus: false,
	sliderStatusTouch: false,
	colorTypeStatus: 'HEXA',
	hue: 0,
	saturation: 100,
	lightness: 50,
	alpha: 1,
	contextMenuElem: null,
	doubleTapTime: 0
};

/**
 * Custom colors saved to local storage
 *
 * @type {{0: Array}}
 */
window.LSCustomColors = { 0: [] };

// Constructor
function ColorPicker(element, color) {
	// Adding the element to the instance
	this.element = element;

	// Adding the object to the elements object
	colorPicker.instance = this;

	updateColorDisplays(color);
}

// Function to setup the color picker
(function () {
	// Creating the HTML content
	const HTMLContent = `
		<svg id="color_box" width="228" height="120">
			<defs>
				<linearGradient id="saturation" x1="0%" y1="0%" x2="100%" y2="0%">
					<stop offset="0%" stop-color="#fff"></stop>
					<stop offset="100%" stop-color="hsl(0,100%,50%)"></stop>
				</linearGradient>
				<linearGradient id="brightness" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stop-color="rgba(0,0,0,0)"></stop>
					<stop offset="100%" stop-color="#000"></stop>
				</linearGradient>
				<pattern id="pattern_config" width="100%" height="100%">
					<rect x="0" y="0" width="100%" height="100%" fill="url(#saturation)"></rect> }
					<rect x="0" y="0" width="100%" height="100%" fill="url(#brightness)"></rect>
				</pattern>
			</defs>
			<rect rx="0" ry="0" x="1" y="1" width="228" height="120" fill="url(#pattern_config)"></rect>
			<svg id="box_dragger" x="218" y="10" style="overflow: visible;">
				<circle r="7" fill="none" stroke="#000" stroke-width="2"></circle>
				<circle r="5" fill="none" stroke="#fff" stroke-width="2"></circle>
			</svg>
		</svg>
		<br>
		<div id="sliders">
			<svg id="color_slider" width="228" height="20">
				<defs>
					<linearGradient id="hue" x1="100%" y1="0%" x2="0%" y2="0%">
						<stop offset="0%" stop-color="#f00"></stop>
						<stop offset="16.666%" stop-color="#ff0"></stop>
						<stop offset="33.333%" stop-color="#0f0"></stop>
						<stop offset="50%" stop-color="#0ff"></stop>
						<stop offset="66.666%" stop-color="#00f"></stop>
						<stop offset="83.333%" stop-color="#f0f"></stop>
						<stop offset="100%" stop-color="#f00"></stop>
					</linearGradient>
				</defs>
				<rect rx="5" ry="5" x="2" y="2" width="226" height="18" fill="url(#hue)"></rect>
				<svg id="color_slider_dragger" x="218" y="11" style="overflow: visible;">
					<circle r="7" fill="none" stroke="#000" stroke-width="2"></circle>
					<circle r="5" fill="none" stroke="#fff" stroke-width="2"></circle>
				</svg>
			</svg>
		</div>
		<div id="custom_colors">
			<div id="custom_colors_box">
				<button id="custom_colors_add" class="custom_colors_preview">
					<img src="https://arcadestudio-assets.s3.us-east-2.amazonaws.com/engine-ui/add-btn.svg" width="12" height="12" style="margin: 2px;">
				</button>
			</div>
		</div>
		<div id="color_context_menu" class="color_ctx_menu">
			<button id="color_clear_single" class="color_ctx_menu" name="remove-single-color">Remove Color</button>
			<button id="color_clear_all" class="color_ctx_menu" name="remove-all-colors">Remove All</button>
		</div>
		<div id="color_preview_container">
			<svg id="color_picked_preview" width="25" height="30">
				<circle cx="12" cy="15" r="10"></circle>
			</svg>
			<div id="color_text_values">
				<div id="hexa">
					<input id="hex_input" name="hex_input" type="text" maxlength="9" spellcheck="false" />
					<label for="hex_input" class="label_text">HEX</label>
				</div>
				<div id="rgba" style="display: none;">
					<input class="rgba_input" name="r" type="number" min="0" max="255" />
					<input class="rgba_input" name="g" type="number" min="0" max="255" />
					<input class="rgba_input" name="b" type="number" min="0" max="255" />
					<label class="label_text">RGB</label>
				</div>
				<div id="hsla" style="display: none;">
					<input class="hsla_input" name="h" type="number" min="0" max="359" />
					<input class="hsla_input" name="s" type="number" min="0" max="100" />
					<input class="hsla_input" name="l" type="number" min="0" max="100" />
					<label class="label_text">HSL</label>
				</div>
			</div>
			<button id="switch_color_type" name="switch-color-type">
				<img src="https://arcadestudio-assets.s3.us-east-2.amazonaws.com/engine-ui/hamburg-drop.svg" width="10" height="10">
			</button>
		</div>
	`;

	// Creating a node to store the data HTML in
	const colorPickerContainer = document.createElement('ASIDE');
	colorPickerContainer.id = 'color_picker';
	colorPickerContainer.innerHTML = HTMLContent;
	document.getElementsByTagName('BODY')[0].appendChild(colorPickerContainer);

	// Creating a darken background node
	const colorPickerBackground = document.createElement('DIV');
	colorPickerBackground.id = 'color_picker_bg';
	document.getElementsByTagName('BODY')[0].appendChild(colorPickerBackground);

	// Checking if a local storage variable has been set
	if (localStorage.getItem('custom_colors') === null) {
		// If not then I set one
		localStorage.setItem('custom_colors', '{"0": []}');
	} else {
		// If it has then I define the LSCustomColors with the value for this
		window.LSCustomColors = JSON.parse(localStorage.getItem('custom_colors'));

		// Looping through the data to update the DOM with the custom colors
		for (let x = window.LSCustomColors[0].length - 1; x >= 0; x--) {
			// Creating the element
			let customColorElem = document.createElement('BUTTON');
			customColorElem.className = 'custom_colors_preview';
			customColorElem.style.background = window.LSCustomColors[0][x];
			customColorElem.setAttribute('data-custom-color', window.LSCustomColors[0][x]);
			// Placing the element in the DOM
			document.getElementById('custom_colors_box').appendChild(customColorElem);
		}

		// Check whether to display the add color button
		if (window.LSCustomColors[0].length == 28)
			document.getElementById('custom_colors_add').style.display = 'none';
	}
})();

// Click anywhere to close a pop-up
document.addEventListener('mousedown', function () {
	// Close context menu
	if (event.target.id != 'color_context_menu') {
		document.getElementById('color_context_menu').style.display = 'none';
	}
});

/*
 * Custom Color Change Event
 */

// Custom color change event function
function colorChange(color, elem) {
	// Creating the event
	const event = new CustomEvent('colorChange', {
		// Adding the response details
		detail: {
			color: color
		}
	});

	// Defining element
	const element = elem === undefined ? colorPicker.instance.element : elem;

	// Changing color attributes
	element.setAttribute('data-color', color);

	// Dispatching the event for the active object
	element.dispatchEvent(event);
}

/*
 * Color Value Converter
 */

// Convert HSLA to RGBA
let HSLAToRGBA = function (h, s, l, a, toHex) {
	h = h / 360;
	s = s / 100;
	l = l / 100;
	let rgb = [];
	let t2;
	let t3;
	let val;

	if (s == 0) {
		val = Math.round(l * 255); // achromatic
		rgb = [val, val, val]
	} else {
		if (l < 0.5) {
			t2 = l * (1 + s);
		} else {
			t2 = l + s - l * s;
		}
		
		const t1 = 2 * l - t2;

		rgb = [0, 0, 0];
		for (let i = 0; i < 3; i++) {
			t3 = h + 1 / 3 * -(i - 1);
			if (t3 < 0) {
				t3++;
			}

			if (t3 > 1) {
				t3--;
			}

			if (6 * t3 < 1) {
				val = t1 + (t2 - t1) * 6 * t3;
			} else if (2 * t3 < 1) {
				val = t2;
			} else if (3 * t3 < 2) {
				val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
			} else {
				val = t1;
			}

			rgb[i] = Math.round(val * 255);
		}
	}

	if (toHex === true) {
		return RGBAToHexA(rgb[0], rgb[1], rgb[2], a);
	} else {
		return {
			r: rgb[0],
			g: rgb[1],
			b: rgb[2],
			a: a
		};
	}
};

// Convert RGBA to HSLA
let RGBAToHSLA = function (r, g, b, a) {
	r /= 255, g /= 255, b /= 255;
	a = a == undefined ? 1 : a;

	const min = Math.min(r, g, b);
	const max = Math.max(r, g, b);
	const delta = max - min;
	let h;
	let s;

	if (max === min) {
		h = 0;
	} else if (r === max) {
		h = (g - b) / delta;
	} else if (g === max) {
		h = 2 + (b - r) / delta;
	} else if (b === max) {
		h = 4 + (r - g) / delta;
	}

	h = Math.min(h * 60, 360);

	if (h < 0) {
		h += 360;
	}

	const l = (min + max) / 2;

	if (max === min) {
		s = 0;
	} else if (l <= 0.5) {
		s = delta / (max + min);
	} else {
		s = delta / (2 - max - min);
	}

	return {
		h: h,
		s: s * 100,
		l: l * 100,
		a: a
	};
};

// Convert RGBA to HexA
let RGBAToHexA = function (r, g, b, a) {
	r = r.toString(16);
	g = g.toString(16);
	b = b.toString(16);
	a = Math.round(a * 255).toString(16);

	if (r.length == 1) r = '0' + r;
	if (g.length == 1) g = '0' + g;
	if (b.length == 1) b = '0' + b;
	if (a.length == 1) a = '0' + a;

	if (a == 'ff') {
		return '#' + r + g + b;
	} else {
		return '#' + r + g + b + a;
	}
};

// Convert HexA to RGBA
let hexAToRGBA = function (h, toHSL) {
	if (h.length == 7) h += 'ff';
	else if (h.length == 4) h += h.substring(1, 4) + 'ff';

	let r = 0,
		g = 0,
		b = 0,
		a = 1;

	if (h.length == 5) {
		r = '0x' + h[1] + h[1];
		g = '0x' + h[2] + h[2];
		b = '0x' + h[3] + h[3];
		a = '0x' + h[4] + h[4];
	} else if (h.length == 9) {
		r = '0x' + h[1] + h[2];
		g = '0x' + h[3] + h[4];
		b = '0x' + h[5] + h[6];
		a = '0x' + h[7] + h[8];
	}

	a = +(a / 255).toFixed(3);

	if (toHSL === true) {
		return RGBAToHSLA(+r, +g, +b, a);
	} else {
		return 'rgba(' + +r + ',' + +g + ',' + +b + ',' + a + ')';
	}
};

/*
 * Color Text Values
 */

// Function to switch the color type inputs
let switchColorType = function () {
	// Checking the current selected input color type
	if (colorPicker.colorTypeStatus == 'HEXA') {
		// Updating the data object
		colorPicker.colorTypeStatus = 'RGBA';

		// Displaying the correct elements
		document.getElementById('hexa').style.display = 'none';
		document.getElementById('rgba').style.display = 'flex';

		// Converting the value
		const RGBAValue = HSLAToRGBA(
			colorPicker.hue,
			colorPicker.saturation,
			colorPicker.lightness,
			colorPicker.alpha
		);

		// Applying the value to the inputs
		document.getElementsByClassName('rgba_input')[0].value = RGBAValue.r;
		document.getElementsByClassName('rgba_input')[1].value = RGBAValue.g;
		document.getElementsByClassName('rgba_input')[2].value = RGBAValue.b;
	} else if (colorPicker.colorTypeStatus == 'RGBA') {
		// Updating the data object
		colorPicker.colorTypeStatus = 'HSLA';

		// Displaying the correct elements
		document.getElementById('rgba').style.display = 'none';
		document.getElementById('hsla').style.display = 'flex';

		// Applying the value to the inputs
		document.getElementsByClassName('hsla_input')[0].value = colorPicker.hue;
		document.getElementsByClassName('hsla_input')[1].value = colorPicker.saturation;
		document.getElementsByClassName('hsla_input')[2].value = colorPicker.lightness;
	} else if (colorPicker.colorTypeStatus == 'HSLA') {
		// Updating the data object
		colorPicker.colorTypeStatus = 'HEXA';

		// Displaying the correct elements
		document.getElementById('hsla').style.display = 'none';
		document.getElementById('hexa').style.display = 'flex';

		// Converting the value
		const hexValue = HSLAToRGBA(
			colorPicker.hue,
			colorPicker.saturation,
			colorPicker.lightness,
			colorPicker.alpha,
			true
		);

		// Applying the value to the input
		document.getElementById('hex_input').value = hexValue;
	}
};
document.getElementById('switch_color_type').addEventListener('click', function () {
	switchColorType();
});

// Event to update the color when the user leaves the hex value box
document.getElementById('hex_input').addEventListener('blur', function () {
	// Value
	const hexInput = this.value;

	// Check to see if the hex is formatted correctly
	if (hexInput.match(/^#[0-9a-f]{3}([0-9a-f]{3})?([0-9a-f]{2})?$/)) {
		// Updating the picker
		updateColorDisplays(hexInput);
		colorChange(HSLAToRGBA(colorPicker.hue, colorPicker.saturation, colorPicker.lightness, 1, true));
	}
});

document.getElementById('hex_input').addEventListener('keydown', function (e) {
	if (e.key === 'Enter') {
	// Value
		const hexInput = this.value;
		// Check to see if the hex is formatted correctly
		if (hexInput.match(/^#[0-9a-f]{3}([0-9a-f]{3})?([0-9a-f]{2})?$/)) {
			// Updating the picker
			updateColorDisplays(hexInput);
			colorChange(HSLAToRGBA(colorPicker.hue, colorPicker.saturation, colorPicker.lightness, 1, true));
		}
	}
	e.stopPropagation();
})

// Gathering all the rgba inputs boxes
document.querySelectorAll('.rgba_input').forEach((element) => {
	// Event to update the color when the user changes the value to any of the input boxes
	element.addEventListener('change', function () {
		// Input boxes
		const rgbaInput = document.querySelectorAll('.rgba_input');

		// Checking that the numbers are within the correct boundaries
		if (rgbaInput[0].value > 255) throw 'Value must be below 256';
		if (rgbaInput[1].value > 255) throw 'Value must be below 256';
		if (rgbaInput[2].value > 255) throw 'Value must be below 256';

		// Updating the picker
		updateColorDisplays(
			`rgba(${rgbaInput[0].value}, ${rgbaInput[1].value}, ${rgbaInput[2].value}, ${1})`
		);
		colorChange(HSLAToRGBA(colorPicker.hue, colorPicker.saturation, colorPicker.lightness, 1, true));
	});
	element.addEventListener('keydown', function (e) {
		e.stopPropagation();
	});
});

// Gathering all the hsla inputs boxes
document.querySelectorAll('.hsla_input').forEach((element) => {
	// Event to update the color when the user changes the value to any of the input boxes
	element.addEventListener('change', function () {
		// Input boxes
		const hslaInput = document.querySelectorAll('.hsla_input');

		// Checking that the numbers are within the correct boundaries
		if (hslaInput[0].value > 359) throw 'Value must be below 360';
		if (hslaInput[1].value > 100) throw 'Value must be below 100';
		if (hslaInput[2].value > 100) throw 'Value must be below 100';

		// Updating the picker
		updateColorDisplays(
			`hsla(${hslaInput[0].value}, ${hslaInput[1].value}%, ${hslaInput[2].value}%, ${1})`
		);
		colorChange(HSLAToRGBA(colorPicker.hue, colorPicker.saturation, colorPicker.lightness, 1, true));
	});
	element.addEventListener('keydown', function (e) {
		e.stopPropagation();
	});
});

/*
 * Custom Colors
 */

// Click on color listener to update the picker
document.getElementById('custom_colors_box').addEventListener('click', function (event) {

	// Making sure the users has selected a color preview
	if (event.target.className == 'custom_colors_preview') {
		// Color
		const color = event.target.getAttribute('data-custom-color');
		// Updating the picker with that color
		updateColorDisplays(color);
		colorChange(HSLAToRGBA(colorPicker.hue, colorPicker.saturation, colorPicker.lightness, 1, true));
	}
});

// Function to add a new custom color
let addCustomColor = function () {
	// Limiting a custom color to two rows
	if (window.LSCustomColors[0].length == 27)
		document.getElementById('custom_colors_add').style.display = 'none';

	// Getting the color
	const color = `hsla(${colorPicker.hue}, ${colorPicker.saturation}%, ${colorPicker.lightness}%, ${colorPicker.alpha})`;

	// Creating the element
	let customColorElem = document.createElement('BUTTON');
	customColorElem.className = 'custom_colors_preview';
	customColorElem.style.background = color;
	customColorElem.setAttribute('data-custom-color', color);
	// Placing the element in the DOM
	document.getElementById('custom_colors_box').appendChild(customColorElem);

	// Pushing the color to the top of the array
	window.LSCustomColors[0].unshift(color);

	// Updating the local storage with the new custom color
	localStorage.setItem('custom_colors', JSON.stringify(window.LSCustomColors));
};
document.getElementById('custom_colors_add').addEventListener('mouseup', function () {
	addCustomColor();
});

// Event to fire for a context menu
document.getElementById('custom_colors_box').addEventListener('contextmenu', function (event) {
	// Making sure the users has selected a color preview
	if (event.target.className == 'custom_colors_preview') {
		// Preventing default
		event.preventDefault();

		// Defining the context menu
		const contextMenu = document.getElementById('color_context_menu');

		// Updating the styling of the menu
		contextMenu.style.display = 'block';
		contextMenu.style.top = event.target.getBoundingClientRect().top + 25 + 'px';
		if(event.target.getBoundingClientRect().left + 125 > window.innerWidth) {
			contextMenu.style.right = '34px';
		} else {
			contextMenu.style.left = event.target.getBoundingClientRect().left + 'px';
		}
		
		// Defining the color selected
		colorPicker.contextMenuElem = event.target;
	}
});

// Clears a selected custom color
let clearSingleCustomColor = function (element) {
	const elemToRemove = element === undefined ? colorPicker.contextMenuElem : element;

	// Removing the element
	document.getElementById('custom_colors_box').removeChild(elemToRemove);

	// Clearing the variable
	window.LSCustomColors = { '0': [] };

	// Looping through the custom colors to repopulate the variable
	for (let x in document.getElementsByClassName('custom_colors_preview')) {
		// Continuing if its a number
		if (isNaN(x) === true) {
			continue;
		}

		// Pushing the colors to the array
		window.LSCustomColors[0].push(
			document
				.getElementsByClassName('custom_colors_preview')
				[x].getAttribute('data-custom-color')
		);
	}

	// Updating the local storage
	localStorage.setItem('custom_colors', JSON.stringify(window.LSCustomColors));

	// Making sure the add color button is displaying
	document.getElementById('custom_colors_add').style.display = 'inline-block';
};
document.getElementById('color_clear_single').addEventListener('mousedown', function () {
	clearSingleCustomColor();
});

// Clear single selected color for touch mobile devices
let clearSingleCustomColorTouch = function (event) {
	if (event.target.className == 'custom_colors_preview') {
		const now = new Date().getTime();
		const timeSince = now - colorPicker.doubleTapTime;

		if (timeSince < 200 && timeSince > 0) {
			clearSingleCustomColor(event.target);
		} else {
			colorPicker.doubleTapTime = new Date().getTime();
		}
	}
};
document.getElementById('custom_colors_box').addEventListener(
	'touchstart',
	function () {
		clearSingleCustomColorTouch(event);
	},
	{ passive: true }
);

// Clears all custom colors
let clearAllCustomColors = function () {
	// Clearing variable
	window.LSCustomColors = { '0': [] };

	// Looping through the custom colors to repopulate the variable
	while (document.getElementsByClassName('custom_colors_preview').length > 1) {
		document
			.getElementById('custom_colors_box')
			.removeChild(document.getElementsByClassName('custom_colors_preview')[1]);
	}

	// Updating the local storage
	localStorage.setItem('custom_colors', JSON.stringify(window.LSCustomColors));
};
document.getElementById('color_clear_all').addEventListener('mousedown', function () {
	clearAllCustomColors();
});

/*
 * Hue Slider
 */

// Function to handle changes to the HUE slider
let colorSliderHandler = function (position) {
	// Defining the slider and dragger
	const sliderContainer = document.getElementById('color_slider');
	const sliderDragger = document.getElementById('color_slider_dragger');

	// Defining the X position
	let eventX = position - sliderContainer.getBoundingClientRect().left;

	// Making conditions so that the user don't drag outside the box
	if (eventX < 11) {
		eventX = 11;
	}

	if (eventX > 218) {
		eventX = 218;
	}

	// Updating the X property of the dragger
	sliderDragger.attributes.x.nodeValue = eventX;

	// Percentage of the dragger on the X axis
	const percent = ((eventX - 11) / 207) * 100;
	// Calculating the color
	// Max number for hue colors is 359, I find the percentage of this, from the percent variable
	// I take it away from the max number because the slider should work backwards
	const HColor = Math.round(359 - (359 / 100) * percent);

	// Updating the Hue value in the data object
	colorPicker.hue = HColor;

	// Full HSLA color
	const HSLA = `hsla(${HColor}, ${colorPicker.saturation}%, ${colorPicker.lightness}%, ${colorPicker.alpha})`;

	// Updating the color for the color preview
	document.getElementById('color_picked_preview').children[0].setAttribute('fill', HSLA);

	// Updating the Hue color in the Saturation and lightness box
	document
		.getElementById('saturation')
		.children[1].setAttribute('stop-color', `hsl(${HColor}, 100%, 50%)`);

	// Update the color text values
	updateColorValueInput();
	colorChange(HSLAToRGBA(colorPicker.hue, colorPicker.saturation, colorPicker.lightness, 1, true));
};

/*
 * Mouse Events
 */

// Start the slider drag
document.getElementById('color_slider').addEventListener('mousedown', function (event) {
	// Updating the status in the data object
	colorPicker.sliderStatus = true;
	// Calling handler function
	colorSliderHandler(event.pageX);
});

// Moving the slider drag
document.addEventListener('mousemove', function (event) {
	// Checking that the drag has started
	if (colorPicker.sliderStatus === true) {
		// Calling handler function
		colorSliderHandler(event.pageX);
	}
});

// End the slider drag
document.addEventListener('mouseup', function () {
	// Checking that the drag has started
	if (colorPicker.sliderStatus === true) {
		// Updating the status in the data object
		colorPicker.sliderStatus = false;
	}
});

/*
 * Touch Events
 */

// Start the slider drag on touch
document.getElementById('color_slider').addEventListener(
	'touchstart',
	function (event) {
		// Updating the status
		colorPicker.sliderStatusTouch = true;
		// Calling the handler function
		colorSliderHandler(event.changedTouches[0].clientX);
	},
	{ passive: true }
);

// Moving the slider drag on touch
document.addEventListener(
	'touchmove',
	function () {
		// Checking that the touch drag has started
		if (colorPicker.sliderStatusTouch === true) {
			// Prevent page scrolling
			event.preventDefault();
			// Calling the handler function
			colorSliderHandler(event.changedTouches[0].clientX);
		}
	},
	{ passive: false }
);

// End the slider drag on touch
document.addEventListener('touchend', function () {
	// Checking that the touch drag has started
	if (colorPicker.sliderStatusTouch === true) {
		// Updating the status
		colorPicker.sliderStatusTouch = false;
	}
});

/*
 * Saturation and Lightness Box
 */

// Function to handle changes to the saturation and lightness box
let colorBoxHandler = function (positionX, positionY, touch) {
	// Defining the box and dragger
	const boxContainer = document.getElementById('color_box');
	const boxDragger = document.getElementById('box_dragger');

	// Defining X and Y position, Y differently works with scroll so I make conditions for that
	let eventX = positionX - boxContainer.getBoundingClientRect().left;
	let eventY =
		touch === true
			? positionY - boxContainer.getBoundingClientRect().top
			: positionY -
			  boxContainer.getBoundingClientRect().top -
			  document.getElementsByTagName('HTML')[0].scrollTop;

	// Making conditions so that the user don'-t drag outside the box
	if (eventX < 10) {
		eventX = 10;
	}

	if (eventX > 218) {
		eventX = 218;
	}

	if (eventY < 10) {
		eventY = 10;
	}

	if (eventY > 112) {
		eventY = 112;
	}

	// Changes X and Y properties of the dragger
	boxDragger.attributes.y.nodeValue = eventY;
	boxDragger.attributes.x.nodeValue = eventX;

	// Calculating the Saturation Percent value
	// SPercent is just the percent of where the dragger is on the X axis
	// 208 is the max number of pixels the dragger can move
	const SPercent = Math.round(((eventX - 11) / 208) * 100);

	// Calculating the X and Y Percent Values
	const percentX = 100 - SPercent / 2;
	const percentY = 100 - ((eventY - 11) / 102) * 100;

	// Calculating the LPercent
	// LPercent is the the X percentage of the of the Y percentage of the dragger
	let LPercent = Math.floor((percentY / 100) * percentX);

	// Applying the Saturation and Lightness to the data object
	colorPicker.saturation = SPercent;
	colorPicker.lightness = LPercent;

	// Full HSLA color
	const HSLA = `hsla(${colorPicker.hue}, ${SPercent}%, ${LPercent}%, ${colorPicker.alpha})`;

	// Applying the color to the color preview
	document.getElementById('color_picked_preview').children[0].setAttribute('fill', HSLA);

	// Update the color text values
	updateColorValueInput();
	colorChange(HSLAToRGBA(colorPicker.hue, colorPicker.saturation, colorPicker.lightness, 1, true));
};

/*
 * Mouse Events
 */

// Start box drag listener
document.getElementById('color_box').addEventListener('mousedown', function (event) {
	// Updating the status in the data object
	colorPicker.boxStatus = true;
	// Calling handler function
	colorBoxHandler(event.pageX, event.pageY);
});

// Moving box drag listener
document.addEventListener('mousemove', function (event) {
	// Checking that the drag has started
	if (colorPicker.boxStatus === true) {
		// Calling handler function
		colorBoxHandler(event.pageX, event.pageY);
	}
});

// End box drag listener
document.addEventListener('mouseup', function (event) {
	// Checking that the drag has started
	if (colorPicker.boxStatus === true) {
		// Updating the status in the data object
		colorPicker.boxStatus = false;
	}
});

/*
 * Touch Events
 */

// Start the box drag on touch
document.getElementById('color_box').addEventListener(
	'touchstart',
	function (event) {
		// Updating the status
		colorPicker.boxStatusTouch = true;
		// Calling the handler function
		colorBoxHandler(event.changedTouches[0].clientX, event.changedTouches[0].clientY, true);
	},
	{ passive: true }
);

// Moving the box drag on touch
document.addEventListener(
	'touchmove',
	function () {
		// Checking that the touch drag has started
		if (colorPicker.boxStatusTouch === true) {
			// Prevent page scrolling
			event.preventDefault();
			// Calling the handler function
			colorBoxHandler(event.changedTouches[0].clientX, event.changedTouches[0].clientY, true);
		}
	},
	{ passive: false }
);

// End box drag on touch
document.addEventListener('touchend', function () {
	// Checking that the touch drag has started
	if (colorPicker.boxStatusTouch === true) {
		// Calling the handler function
		colorPicker.boxStatusTouch = false;
	}
});

/*
 * Update Picker
 */

// Function to update color displays
let updateColorDisplays = function (color) {
	// Checking the color type that has been given
	if (color.substring(0, 1) == '#') {
		// Converting the color to HSLA
		color = hexAToRGBA(color, true);
	} else if (color.substring(0, 1) == 'r') {
		// Extracting the values
		const rgb = color.match(/[.?\d]+/g);
		// Making sure there is a alpha value
		rgb[3] = rgb[3] == undefined ? 1 : rgb[3];
		// Converting the color to HSLA
		color = RGBAToHSLA(rgb[0], rgb[1], rgb[2], rgb[3]);
	} else {
		// Extracting the values
		const hsl = color.match(/[.?\d]+/g);
		// Making sure there is a alpha value
		hsl[3] = hsl[3] == undefined ? 1 : hsl[3];
		// Formatting the value properly
		color = {
			h: hsl[0],
			s: hsl[1],
			l: hsl[2],
			a: hsl[3]
		};
	}

	// Updating the data object
	colorPicker.hue = color.h;
	colorPicker.saturation = color.s;
	colorPicker.lightness = color.l;
	colorPicker.alpha = color.a;

	// Updating the input values
	updateColorValueInput();

	// Updating color preview and box hue color initially
	document
		.getElementById('color_picked_preview')
		.children[0].setAttribute('fill', `hsla(${color.h}, ${color.s}%, ${color.l}%, ${color.a}`);

	// Updating the Hue color in the Saturation and lightness box
	document
		.getElementById('saturation')
		.children[1].setAttribute('stop-color', `hsl(${color.h}, 100%, 50%)`);

	// Color box (saturation and lightness) config
	// Defining the box and dragger
	const boxDragger = document.getElementById('box_dragger');

	let x, y;

	// Calculating y value
	const percentY = 100 - (color.l / (100 - color.s / 2)) * 100;
	y = (102 / 100) * percentY + 10;

	// Calculating x value
	x = (208 / 100) * color.s + 10;

	// Making changes the the UI
	boxDragger.attributes.x.nodeValue = x;
	boxDragger.attributes.y.nodeValue = y;

	// Hue slider config
	// Defining the hue slider and dragger
	const hueSliderDragger = document.getElementById('color_slider_dragger');

	// Calculating x value
	let percentHue = 100 - (color.h / 359) * 100;
	let hueX = (207 / 100) * percentHue + 11;

	// Making changes the the UI
	hueSliderDragger.attributes.x.nodeValue = hueX;
};

// Update the color value inputs
let updateColorValueInput = function () {
	// Checking the value color type the user has selected
	if (colorPicker.colorTypeStatus == 'HEXA') {
		// Converting the value
		const hexValue = HSLAToRGBA(
			colorPicker.hue,
			colorPicker.saturation,
			colorPicker.lightness,
			colorPicker.alpha,
			true
		);

		// Applying the value to the input
		document.getElementById('hex_input').value = hexValue;
	} else if (colorPicker.colorTypeStatus == 'RGBA') {
		// Converting the value
		const RGBAValue = HSLAToRGBA(
			colorPicker.hue,
			colorPicker.saturation,
			colorPicker.lightness,
			colorPicker.alpha
		);

		// Applying the value to the inputs
		document.getElementsByClassName('rgba_input')[0].value = RGBAValue.r;
		document.getElementsByClassName('rgba_input')[1].value = RGBAValue.g;
		document.getElementsByClassName('rgba_input')[2].value = RGBAValue.b;
	} else {
		// Applying the value to the inputs
		document.getElementsByClassName('hsla_input')[0].value = colorPicker.hue;
		document.getElementsByClassName('hsla_input')[1].value = colorPicker.saturation;
		document.getElementsByClassName('hsla_input')[2].value = colorPicker.lightness;
	}
};