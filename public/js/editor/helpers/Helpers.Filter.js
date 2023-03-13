/**
 * Filter Helper
 * @author codelegend620
 */

const { default: isDefined } = require("../utils");

window.FilterHelper = {};

FilterHelper.Color = function ( composer, filter ) {

	var nodepass = new NodePass();
	var screen = new Nodes.ScreenNode();
	var nodes = {
		hue: new Nodes.FloatNode( filter.hue ),
		saturation: new Nodes.FloatNode( filter.saturation ),
		vibrance: new Nodes.FloatNode( filter.vibrance ),
		brightness: new Nodes.FloatNode( filter.brightness ),
		contrast: new Nodes.FloatNode( filter.contrast ),
	};
	var hueNode = new Nodes.ColorAdjustmentNode( screen, nodes.hue, Nodes.ColorAdjustmentNode.HUE );
	var satNode = new Nodes.ColorAdjustmentNode( hueNode, nodes.saturation, Nodes.ColorAdjustmentNode.SATURATION );
	var vibranceNode = new Nodes.ColorAdjustmentNode( satNode, nodes.vibrance, Nodes.ColorAdjustmentNode.VIBRANCE );
	var brightnessNode = new Nodes.ColorAdjustmentNode( vibranceNode, nodes.brightness, Nodes.ColorAdjustmentNode.BRIGHTNESS );
	var contrastNode = new Nodes.ColorAdjustmentNode( brightnessNode, nodes.contrast, Nodes.ColorAdjustmentNode.CONTRAST );

	this.Update = function ( filter ) {

		nodepass.enabled = true;

		if ( filter.mode ) {

			var value = UtilsHelper.parseValue( filter.value );
			var duration = UtilsHelper.parseValue( filter.duration ) * 1000;

			UtilsHelper.tween( nodes[ filter.mode ], 'value', value, duration, filter.easing, filter.easingType );

		} else {

			nodes.hue.value = filter.hue;
			nodes.saturation.value = filter.saturation;
			nodes.vibrance.value = filter.vibrance;
			nodes.brightness.value = filter.brightness;
			nodes.contrast.value = filter.contrast;

		}

	};

	this.Disable = function () {

		nodepass.enabled = false;
		composer.passes[ 0 ].renderToScreen = true;
	};

	nodepass.name = 'color adjust';
	nodepass.input = contrastNode;
	nodepass.needsUpdate = true;

	composer.addPass( nodepass );

	return this;

};

FilterHelper.Color.Default = function () {

	return {
		hue: 0,
		saturation: 1,
		vibrance: 0,
		brightness: 0,
		contrast: 1
	};

};

FilterHelper.Fade = function ( composer, filter ) {

	var nodepass = new NodePass();
	var color = new Nodes.ColorNode( filter.color );
	var percent = new Nodes.FloatNode( filter.amount );
	var fade = new Nodes.MathNode(
		new Nodes.ScreenNode(),
		color,
		percent,
		Nodes.MathNode.MIX
	);

	this.Update = function ( filter ) {

		nodepass.enabled = true;

		var c = new THREE.Color( filter.color );

		if ( filter.mode ) {

			if ( filter.mode == 'color' ) {

				color.value = c;

			} else {

				UtilsHelper.tween( percent, 'value',  UtilsHelper.parseValue( filter.value ), UtilsHelper.parseValue( filter.duration ) * 1000, filter.easing, filter.easingType );

			}

		} else {

			color.value = c;
			percent.value = filter.amount;

		}

	};

	this.Disable = function () {

		nodepass.enabled = false;

	};

	nodepass.name = "fade";
	nodepass.input = fade;
	nodepass.needsUpdate = true;

	composer.addPass( nodepass );

	return this;

};

FilterHelper.Fade.Default = function () {

	return {
		color: 0x000000,
		amount: 0,
	};

};

FilterHelper.Invert = function ( composer, filter ) {

	var nodepass = new NodePass();
	var alpha = new Nodes.FloatNode( filter.amount );
	var screen = new Nodes.ScreenNode();
	var inverted = new Nodes.MathNode( screen, Nodes.MathNode.INVERT );
	var fade = new Nodes.MathNode( screen, inverted, alpha, Nodes.MathNode.MIX );

	this.Update = function ( filter ) {

		nodepass.enabled = true;

		if ( filter.duration ) {

			UtilsHelper.tween( alpha, 'value', UtilsHelper.parseValue( filter.value ), UtilsHelper.parseValue( filter.duration ) * 1000, filter.easing, filter.easingType );

		} else {

			alpha.value = filter.amount;

		}

	};

	this.Disable = function () {

		nodepass.enabled = false;

	};

	nodepass.name = "invert";
	nodepass.input = fade;
	nodepass.needsUpdate = true;

	composer.addPass( nodepass );

	return this;

};

FilterHelper.Invert.Default = function () {

	return {
		amount: 0,
	};

};

FilterHelper.Blur = function ( composer, filter, renderer ) {

	var nodepass = new NodePass();
	var size = renderer.getDrawingBufferSize( new THREE.Vector2() );
	var blurScreen = new Nodes.BlurNode( new Nodes.ScreenNode() );
	blurScreen.size = new THREE.Vector2( size.width, size.height );
	blurScreen.radius.x = filter.x;
	blurScreen.radius.y = filter.y;

	this.Update = function ( filter ) {

		nodepass.enabled = true;

		if ( filter.xSeconds && filter.x != '?' ) {

			UtilsHelper.tween( blurScreen.radius, 'x', filter.x, UtilsHelper.parseValue( filter.duration ) * 1000 );

		} else {

			blurScreen.radius.x = filter.x;

		}

		if ( filter.ySeconds && filter.y != '?' ) {

			UtilsHelper.tween( blurScreen.radius, 'y', filter.y, UtilsHelper.parseValue( filter.duration ) * 1000 );

		} else {

			blurScreen.radius.y = filter.y;

		}

	};

	this.Disable = function () {

		nodepass.enabled = false;

	};

	nodepass.name = "blur";
	nodepass.input = blurScreen;
	nodepass.needsUpdate = true;

	composer.addPass( nodepass );

	return this;

};

FilterHelper.Blur.Default = function () {

	return {
		x: 0,
		y: 0,
	};

};

FilterHelper.Refraction = function ( composer, filter ) {

	var nodepass = new NodePass();
	var map = new THREE.Texture();
	map.wrapS = map.wrapT = Nodes.RepeatWrapping;
	var normal = new Nodes.TextureNode( map );
	var normalXY = new Nodes.SwitchNode( normal, "xy" );
	var scale = new Nodes.FloatNode( filter.scale );
	var normalXYFlip = new Nodes.MathNode( normalXY, Nodes.MathNode.INVERT );
	var offsetNormal = new Nodes.OperatorNode(
		normalXYFlip,
		new Nodes.FloatNode( 0.5 ),
		Nodes.OperatorNode.ADD
	);
	offsetNormal.a = filter.invert == 'off' ? normalXYFlip : normalXY;
	var scaleTexture = new Nodes.OperatorNode(
		new Nodes.SwitchNode( normal, "z" ),
		offsetNormal,
		Nodes.OperatorNode.MUL
	);
	var scaleNormal = new Nodes.MathNode(
		new Nodes.FloatNode( 1 ),
		scaleTexture,
		scale,
		Nodes.MathNode.MIX
	);
	var offsetCoord = new Nodes.OperatorNode(
		new Nodes.UVNode(),
		scaleNormal,
		Nodes.OperatorNode.MUL
	);
	var screen = new Nodes.ScreenNode( offsetCoord );

	this.Update = function ( filter ) {

		nodepass.enabled = true;

		if ( filter.mode ) {

			UtilsHelper.tween( scale, 'value', filter.scale, UtilsHelper.parseValue( filter.duration ) * 1000 );

		} else {

			scale.value = filter.scale;

		}

		offsetNormal.a = filter.invert ? normalXYFlip : normalXY;
		nodepass.needsUpdate = true;

	};

	this.Disable = function () {

		nodepass.enabled = false;

	};

	nodepass.name = "refraction";
	nodepass.input = screen;
	nodepass.needsUpdate = true;

	composer.addPass( nodepass );

	return this;

};

FilterHelper.Refraction.Default = function ( f ) {

	return {
		scale: 0,
		map: f.map,
	};

};

FilterHelper.Mosaic = function ( composer, filter ) {

	var nodepass = new NodePass();
	var nodes = {
		scale: new Nodes.FloatNode( filter.scale ),
		fade: new Nodes.FloatNode( filter.fade )
	}
	var uv = new Nodes.UVNode();
	var blocks = new Nodes.OperatorNode( uv, nodes.scale, Nodes.OperatorNode.MUL );
	var blocksSize = new Nodes.MathNode( blocks, Nodes.MathNode.FLOOR );
	var mosaicUV = new Nodes.OperatorNode(
		blocksSize,
		nodes.scale,
		Nodes.OperatorNode.DIV
	);
	var fadeScreen = new Nodes.MathNode( uv, mosaicUV, nodes.fade, Nodes.MathNode.MIX );

	this.Update = function ( filter ) {

		nodepass.enabled = true;

		if ( filter.mode ) {

			UtilsHelper.tween( nodes[ filter.mode ], 'value', UtilsHelper.parseValue( filter.value ), UtilsHelper.parseValue( filter.duration ) * 1000, filter.easing, filter.easingType );

		} else {

			nodes.scale.value = filter.scale;
			nodes.fade.value = filter.fade;

		}

	};

	this.Disable = function () {

		nodepass.enabled = false;

	};

	nodepass.name = "mosaic";
	nodepass.input = new Nodes.ScreenNode( fadeScreen );
	nodepass.needsUpdate = true;

	composer.addPass( nodepass );

	return this;

};

FilterHelper.Mosaic.Default = function () {

	return {
		scale: 128,
		fade: 0,
	};

};

FilterHelper.Comic = function ( composer, filter ) {

	var effect1 = new ShaderPass( DotScreenShader );
	effect1.name = "comic";
	effect1.uniforms[ "scale" ].value = filter.scale;
	composer.addPass( effect1 );

	var effect2 = new ShaderPass( RGBShiftShader );
	effect2.name = "comic";
	effect2.uniforms[ "amount" ].value = 0.0015;
	composer.addPass( effect2 );

	this.Update = function ( filter ) {

		const duration = UtilsHelper.parseValue( filter.duration ) * 1000;

		if (isDefined(filter.scale) && duration ) {

			UtilsHelper.tween( effect1.uniforms[ "scale" ], 'value', UtilsHelper.parseValue( filter.scale ), duration, filter.easing, filter.easingType );

		} else if (isDefined(filter.scale)) {

			effect1.uniforms[ "scale" ].value = UtilsHelper.parseValue( filter.scale );

		}

	};

	this.Disable = function () {

		effect1.enabled = false;
		effect2.enabled = false;

	};

	this.Enable = function () {
		effect1.enabled = true;
		effect2.enabled = true;
	}

	this.isEnabled= () => effect1.enabled && effect2.enabled;


	return this;

};

FilterHelper.Comic.Default = function () {

	return {
		scale: 0,
	};

};

FilterHelper.Glitch = function ( composer ) {

	var glitchPass = new GlitchPass();
	glitchPass.name = "glitch";
	composer.addPass( glitchPass );

	this.Update = function () {

		glitchPass.enabled = true;

	};

	this.Disable = function () {

		glitchPass.enabled = false;

	};

	this.isEnabled = () => glitchPass.enabled;

	return this;

};

FilterHelper.Glitch.Default = function () {

	return { };

};

FilterHelper.Outline = function ( composer ) {

	var effectGrayScale = new ShaderPass( LuminosityShader );
	effectGrayScale.name = "outline";
	composer.addPass( effectGrayScale );
	effectSobel = new ShaderPass( SobelOperatorShader );
	effectSobel.name = "outline";
	effectSobel.uniforms[ "resolution" ].value.x = window.innerWidth * window.devicePixelRatio;
	effectSobel.uniforms[ "resolution" ].value.y = window.innerHeight * window.devicePixelRatio;
	composer.addPass( effectSobel );

	this.Update = function ( filter ) {

		effectGrayScale.enabled = true;
		effectSobel.enabled = true;

	};

	this.Disable = function () {

		effectGrayScale.enabled = false;
		effectSobel.enabled = false;

	};

	this.isEnabled = () => {
		return effectGrayScale.enabled && effectSobel.enabled ;
	}

	return this;

};

FilterHelper.Outline.Default = function () {

	return { };

};

FilterHelper.Trails = function ( composer, filter ) {

	var afterimagePass = new AfterimagePass();
	afterimagePass.name = "trails";
	afterimagePass.uniforms[ "damp" ].value = filter.strength;

	this.Update = function ( filter ) {


		const duration = UtilsHelper.parseValue( filter.duration ) * 1000;

		if (isDefined(filter.strength) && duration ) {

			UtilsHelper.tween( afterimagePass.uniforms[ "damp" ], 'value', UtilsHelper.parseValue( filter.strength ), duration, filter.easing, filter.easingType );

		} else if (isDefined(filter.strength)) {

			afterimagePass.uniforms[ "damp" ].value = UtilsHelper.parseValue( filter.strength );

		}

	};

	this.Disable = function () {

		afterimagePass.enabled = false;

	};

	this.Enable = function () {
		afterimagePass.enabled = true;
	};

	this.isEnabled = () => afterimagePass.enabled;

	composer.addPass( afterimagePass );

	return this;

};

FilterHelper.Trails.Default = function () {

	return {
		strength: 0.8
	};

};

FilterHelper.Shadows = function ( composer, filter, renderer, scene, camera ) {

	var ssaoPass = new SSAOPass(
		scene,
		camera,
		window.innerWidth,
		window.innerHeight
	);
	ssaoPass.kernelRadius = filter.radius;
	ssaoPass.maxDistance = filter.max;
	ssaoPass.minDistance = filter.min;

	this.Update = function ( filter ) {

		ssaoPass.enabled = true;

		if ( filter.radiusSeconds && filter.radius != '?' ) {

			UtilsHelper.tween( ssaoPass, 'kernelRadius', filter.radius, UtilsHelper.parseValue( filter.duration ) * 1000 );

		} else {

			ssaoPass.kernelRadius = filter.radius;

		}

		if ( filter.minSeconds && filter.min != '?' ) {

			UtilsHelper.tween( ssaoPass, 'maxDistance', filter.max, UtilsHelper.parseValue( filter.duration ) * 1000 );

		} else {

			ssaoPass.maxDistance = filter.max;

		}

		if ( filter.maxSeconds && filter.max != '?' ) {

			UtilsHelper.tween( ssaoPass, 'minDistance', filter.min, UtilsHelper.parseValue( filter.duration ) * 1000 );

		} else {

			ssaoPass.minDistance = filter.min;

		}

	};

	this.Disable = function () {

		ssaoPass.enabled = false;

	};

	ssaoPass.name = "shadows";
	composer.addPass( ssaoPass );

	return this;

};

FilterHelper.Trails.Default = function () {

	return {
		radius: 0,
		min: 0,
		max: 0
	};

};

FilterHelper.Bloom = function ( composer, filter, renderer ) {

	renderer.toneMappingExposure = filter.exposure;
	var bloomPass = new UnrealBloomPass(
		new THREE.Vector2( window.innerWidth, window.innerHeight ),
		filter.strength, //strength
		filter.radius, //radius
		filter.threshold //threshod
	);

	this.Update = function ( filter ) {

		const {isAbout} = filter;

		let properties = ["threshold", "radius", "strength"];

		const duration = UtilsHelper.parseValue(filter.duration) * 1000;

		if (isAbout === "exposure"){
			if (duration){
				UtilsHelper.tween( renderer, 'toneMappingExposure', UtilsHelper.parseValue( filter.value ), duration, filter.easing, filter.easingType );
			}else{
				renderer.toneMappingExposure = filter.exposure;
			}
		}else if (properties.includes(isAbout)){
			let property = isAbout;
			if  (duration){
				UtilsHelper.tween( bloomPass, property, UtilsHelper.parseValue( filter[property] ), duration, filter.easing, filter.easingType );
			}else {
				bloomPass[property] =  UtilsHelper.parseValue(filter[property]);
			}
		}

		// if ( filter.mode ) {

		// 	if ( filter.mode == 'exposure' ) {

		// 		UtilsHelper.tween( renderer, 'toneMappingExposure', UtilsHelper.parseValue( filter.value ), UtilsHelper.parseValue( filter.duration ) * 1000, filter.easing, filter.easingType );
				
		// 	} else {

		// 		UtilsHelper.tween( bloomPass, filter.mode, UtilsHelper.parseValue( filter.value ), UtilsHelper.parseValue( filter.duration ) * 1000, filter.easing, filter.easingType );

		// 	}

		// } else {

		// 	renderer.toneMappingExposure = filter.exposure;
		// 	bloomPass.strength = filter.strength;
		// 	bloomPass.threshold = filter.threshold;
		// 	bloomPass.radius = filter.radius;
			
		// }

	};

	this.Disable = function () {

		bloomPass.enabled = false;

	};

	this.isEnabled  = ()=>{
		return bloomPass.enabled;

	}

	this.Enable = ()=>{
		bloomPass.enabled = true;
	}

	bloomPass.name = "bloom";
	composer.addPass( bloomPass );

	return this;

};

FilterHelper.Bloom.Default = function () {

	return {
		exposure: Math.pow( 0, 4.0 ),
		strength: 0,
		radius: 0,
		threshod: 0
	};

};

FilterHelper.DepthOfField = function ( composer, filter, renderer, scene, camera ) {

	var bokehPass = new BokehPass( scene, camera, {
		focus: filter.focus,
		aperture: filter.aperture * 0.00001,
		maxblur: filter.maxblur,
		width: window.innerWidth,
		height: window.innerHeight
	} );

	this.Update = function ( filter ) {

		const duration = UtilsHelper.parseValue(filter.duration) *1000;

		const {isAbout} = filter;

		var value = UtilsHelper.parseValue( filter[isAbout] ) * ( isAbout == 'aperture' ? 0.0001 : 1 );

		if ( duration ) {
			
			UtilsHelper.tween( bokehPass.uniforms[isAbout ], 'value', value, duration, filter.easing, filter.easingType );

		} else {
			bokehPass.uniforms[ isAbout ].value = value;
		}

	};

	this.Disable = function () {

		bokehPass.enabled = false;

	};
	this.Enable = function () {

		bokehPass.enabled = true;

	};
	this.isEnabled = function () {

		return bokehPass.enabled;

	};

	bokehPass.name = "depth-of-field";
	composer.addPass( bokehPass );

	return this;

};

FilterHelper.DepthOfField.Default = function () {

	return {
		focus: 1.0,
		aperture: 0.025,
		maxblur: 1.0,
	};

};

FilterHelper.Update = function ( composer, filters, filter, renderer, scene, camera ) {
	var filterToUpdate = filters[ filter.type ];

	const {isAbout} = filter;

	function createFilter(){
	
			var filterMap = {
				'color adjust': 'Color',
				'fade': 'Fade',
				'invert': 'Invert',
				'refraction': 'Refraction',
				'mosaic': 'Mosaic',
				'comic': 'Comic',
				'glitch': 'Glitch',
				'bloom': 'Bloom',
				'outline': 'Outline',
				'trails': 'Trails',
				'depth-of-field': 'DepthOfField',
			};

			var name = filterMap[ filter.type ];
			var defaultFilter = FilterHelper[ name ].Default();
			filters[ filter.type ] = new FilterHelper[ name ]( composer, defaultFilter, renderer, scene, camera );
			filterToUpdate = filters[ filter.type ];
		
	}

	if (isAbout==="toggle" || filter.type === "glitch" || filter.type === "outline"){
		const toggle = filter.toggle || filter.enabled;
		const isFilterEnabled = filterToUpdate && filterToUpdate.isEnabled && filterToUpdate.isEnabled();
		const setFilter = toggle === "on"? true: toggle === "off"? false: !(isFilterEnabled);

		if ( setFilter ) {

			if (!filterToUpdate) createFilter();

			if (filterToUpdate.Enable){
				filterToUpdate.Enable();
			}else{
				filterToUpdate.Update(filter)
			}

	
		} else {
			if (!filterToUpdate) createFilter();
			filterToUpdate.Disable();
	
		}
	// } else if (isAbout === "scale"){
	} else {
		if (!filterToUpdate) createFilter()
		filterToUpdate.Update( filter );

	}
	

};