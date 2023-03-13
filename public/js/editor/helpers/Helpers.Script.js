/**
 * Script Helper
 * @author codelegend620
 */

const { capitalizeFirstLetter, default: isDefined } = require("../utils");
const { default: MaterialHelper } = require("./Helpers.Material");
// import UtilsHelper from "./Helpers.Utils";
window.ScriptHelper = {};

ScriptHelper.generate = function ( type, object ) {
	switch ( type ) {

		case 'movement':
			return `
				var movement = new ObjectControls(this, scene, renderer, camera, player);
				player.setMovement(this.uuid, movement);

				function stop() {
					movement.dispose();
				}

				function update(e) {
					movement.update();
					TWEEN.update();
				}
			`;

		case 'connection':
			return `
				function mousemove(e) {
					ScriptHelper.objectMouseConnect(player, this, 'mousemove', e);
				}

				function wheel(e) {
					ScriptHelper.objectMouseConnect(player, this, 'wheel', e);
				}
			`;

		case 'template':
			return `
				function update(event) {
					TWEEN.update();
					updateScript();
				}
			`;

		case 'timeline_connect':
			return `
				function mousemove(e) {
					ScriptHelper.timelineMouseConnect(player, e);
				}

				function wheel(e) {
					ScriptHelper.timelineMouseConnect(player, e);
				}
			`;

		case 'animation_connect':
			return `
				function wheel(e) {
					ScriptHelper.animationMouseConnect(player, e);
				}
			`;
	}

};

ScriptHelper.init = function () {

	var script = this.generate( 'template' );
	script += '\n\nfunction updateScript() {\n}';
	return script;

};

ScriptHelper.change = function ( scene, camera, renderer, player, composer, obj ) {

	var object = scene.getObjectByProperty( 'uuid', obj.uuid );
	var property = obj.property;
	var attribute = UtilsHelper.toCamelCase( obj.attribute );


	if ( object && property && obj.attribute ) {

		switch ( property ) {

			case 'movement':
				player.updateMovement( obj.uuid, obj.attribute, obj.values );
				break;

			case 'limit':
				player.updateLimit( obj.uuid, obj.attribute, obj.values );
				break;

			case 'selectable':
				player.updateSelectable( obj.uuid, obj.values, object.userData.selectable );
				break;

			case 'geometry':
				var geometryValue = UtilsHelper.parseValue(obj.values.value);
				var duration = UtilsHelper.parseValue(obj.values.duration) * 1000;

				// Special cases 
				{
					if (obj.attribute === "open ended"){
						geometryValue = obj.values.value;
					}
				}

				GeometryHelper.set(object, obj.attribute, geometryValue, duration, obj.values.easing, obj.values.easingType);
				break;

			case 'material':
				//var material = editor.getObjectMaterial( object, 0 );
				var material = object.material[0] || object.material;

				switch ( obj.attribute ) {

					case 'color': case 'emissive':
						var hex = parseInt( obj.values.color.substr( 1 ), 16 );
						MaterialHelper.setColor( object, obj.attribute, hex, 0 );
						break;

					case 'roughness': case 'metalness': case 'opacity': case 'alpha test': case 'emissive intensity':
						var tweenObj = { attribute: material[attribute] };
						var target = UtilsHelper.parseValue( obj.values.value );
						var duration = UtilsHelper.parseValue( obj.values.duration ) * 1000;

						UtilsHelper.tween( material, attribute, target, duration, obj.values.easing, obj.values.easingType);
						break;

					case 'vertex colors': case 'vertex tangents': case 'skinning': case 'flat shading': case 'transparent': case 'wireframe': case 'depth test': case 'depth write':

						var value = obj.values.value;
						var newValue = ( value == 'on' ? true : value == 'off' ? false : !material[attribute] );
						MaterialHelper.setValue( object, attribute, newValue , 0 );
						break;

					case 'map': case 'alpha map': case 'rough map': case 'roughness map': case 'metal map': case 'metalness map': case 'env map': case 'light map': case 'emissive map':
						setOrToggleMap(object, obj, player);
						break;

					case 'bump map': case 'displacement map': case 'ao map':
						{
							let {mapOrProperties} = obj.values;

							let mapName = attribute;

							if (mapOrProperties === "map"){
			
								setOrToggleMap(object, obj, player);

							} else if (mapOrProperties === "properties"){

								let material = object.material;

								let tweenProperty="";

								switch (obj.attribute){
									case "bump map":
										tweenProperty = "bumpScale";
										break;
									case "displacement map":
										tweenProperty = "displacementScale";
										break;
									case "ao map":
										tweenProperty = "aoMapIntensity";
										break;
								}

								let tweenObj = {[tweenProperty]:material[tweenProperty]};

								let duration = (UtilsHelper.parseValue(obj.values.duration) ?? 0) * 1000;

								if (!duration){
									MaterialHelper.setValue( object, tweenProperty, obj.values.value, 0 );
								}else{
									UtilsHelper.tween(tweenObj, [tweenProperty], obj.values.value, duration, obj.values.easing, obj.values.easingType, ()=>{
										MaterialHelper.setValue( object, tweenProperty, tweenObj[tweenProperty], 0 );
									});
								}
								
							}

							
						
							break;
						}

					
					case 'normal map':
						{
							let {mapOrProperties} = obj.values;
							let mapName = attribute;
							if (mapOrProperties === "map"){
							
								setOrToggleMap(object, obj, player);


							}else if (mapOrProperties === "scaleX" || mapOrProperties === "scaleY"){

								let material = object.material;
								let tweenProperty=mapOrProperties;
	
								let axis = mapOrProperties[5].toLowerCase()
							
								let tweenObj = {[tweenProperty]:material.normalScale[axis]};
	
								let duration = (UtilsHelper.parseValue(obj.values.duration) ?? 0) * 1000;
	
								if (!duration){
									MaterialHelper.setValue( object, tweenProperty, obj.values.value, 0 );
								}else{
									UtilsHelper.tween(tweenObj, [tweenProperty], obj.values.value, duration, obj.values.easing, obj.values.easingType, ()=>{
										let axisVal = tweenObj[tweenProperty];
										let otherAxisVal = material.normalScale[axis ==="x"?"y":"x"]
										MaterialHelper.setVector( object, "normalScale", axis==="x"?[axisVal, otherAxisVal]:[otherAxisVal, axisVal], 0 );
									});
								}
							}
						}
						// var asset = player.assets.get( 'Image', 'id', obj.values.assetId );
						// if (obj.values.toggle == 'on') {
						// 	MaterialHelper.setMap( object, 'normalMap', asset ? asset.texture : null, 0 );
						// 	MaterialHelper.setVector( object, 'normalScale', [obj.values.value1, obj.values.value2] , 0 );
						// }
						break;
					case 'clearcoat map':
						var asset = player.assets.get( 'Image', 'id', obj.values.assetId );
						if (obj.values.toggle == 'on') {
							MaterialHelper.setMap( object, 'clearcoatNormalMap', asset ? asset.texture : null, 0 );
							MaterialHelper.setVector( object, 'clearcoatNormalScale', [obj.values.value1, obj.values.value2] , 0 );
						}
						break;
					case 'blending':
						if (obj.values.value !== 'none') {
							var blendingOptions = {
								'normal': 1,
								'additive': 2,
								'subtractive': 3,
								'multiply': 4,
								'custom': 5
							}
							MaterialHelper.setValue( object, 'blending', blendingOptions[obj.values.value], 0 );
						}
						break;
					case "sides":
						let sideValue= material.side;
						switch(obj.values.value){
							case 'front':
								sideValue=0;
								break;
							case 'back':
								sideValue=1;
								break;
							case 'double':
								sideValue=2;
								break;
						}
						MaterialHelper.setValue( object, 'side', sideValue, 0 );
						break;
				}
				break;

			case 'animation':
				SceneHelper.runAction( player.actions, obj.uuid, obj.values );
				break;

			case 'environment':

				switch ( obj.attribute ) {

					case 'background':
						switch ( obj.values.mode ) {
							case 'none':
								scene.background = null;
								break;
							case 'color':
								scene.background = new THREE.Color( parseInt( obj.values.color.substr( 1 ), 16 ) );
								break;
							// case 'texture':
							// 	var asset = player.assets.get( 'Image', 'id', obj.values.mapAssetId );
							// 	if (asset && asset.texture){
							// 		scene.background=asset.texture;
							// 	}
							// 	break;
							case 'texture': case 'equirect':{
								var asset = player.assets.get( 'Image', 'id', obj.values.assetId );

								const texture = asset && asset.texture;

								const {isAbout, toggle} = obj.values;

								if (isAbout === "toggle"){
									let setTexture = false;
									
									switch (toggle){
										case "on":{
											setTexture=true;
											break;
										}case "off":{
											setTexture=false;
											break;
										}case "toggle":{
											setTexture= scene.userData.enableBackground ?? true;
										}
									} 
		
									scene.userData.enableBackground = setTexture;
									if (setTexture){
										scene.background= scene.userData.lastBackground || scene.background;
										if (obj.values.mode==="equirect"){
											scene.equirectBackground= scene.userData.lastBackground || scene.background;
										}
										
									} else {
										scene.background=null;
										scene.equirectBackground=null;
									}
								} else {
									if (texture){

										scene.userData.lastBackground=texture;
										
										const bgEnabled = scene.userData.enableBackground ?? true;

										if (bgEnabled){
											scene.background = texture;

											if (obj.values.mode==="equirect"){	
												scene.equirectBackground = texture;
												texture.mapping = THREE.EquirectangularReflectionMapping;
											}
										}
									}
								}

								
								break;

							}
						}
						break;

					case 'environment':{
					
						var asset = player.assets.get( 'Image', 'id', obj.values.assetId );

						const texture = asset && asset.texture;



						const {isAbout, toggle} = obj.values;


						if (isAbout === "toggle"){
							let setTexture = false;
							
							switch (toggle){
								case "on":{
									setTexture=true;
									break;
								}case "off":{
									setTexture=false;
									break;
								}case "toggle":{
									setTexture= scene.userData.enableEnvironment ?? true;
								}
							} 

							scene.userData.enableEnvironment = setTexture;

							if (setTexture){
								scene.environment= scene.userData.lastEnvironment || scene.environment;
								
							} else {
								scene.environment=null;
							}
						} else {
							if (texture){
								texture.mapping = THREE.EquirectangularReflectionMapping;

								scene.userData.lastEnvironment=texture;
								
								const bgEnabled = scene.userData.enableEnvironment ?? true;

								if (bgEnabled){
									scene.environment = texture;

								}
							}
						}
						
						break;

						
					}

					case 'fog':
						if (!scene.userData.lastFog){
							const type = scene.fog && scene.fog.toJSON().type;
							scene.userData.lastFog = {
								Fog:scene.fog && type=== "Fog" && scene.fog,
								FogExp2:scene.fog && type === "FogExp2" && scene.fog,
							}
						}
						if (obj.values.type == 'none') {
							scene.fog = null;
						} else if (obj.values.type == 'linear') {
						
							const {isAbout} = obj.values;

							const fogType = scene.fog && scene.fog.toJSON().type;

							if ( !( scene.fog && scene.fog.isFog )) {
								scene.fog = scene.userData.lastFog.Fog || new THREE.Fog( 0x00000000 );
							}

							switch (isAbout){
								case 'color':{
									var fogColor = parseInt( obj.values.color.substr( 1 ), 16 );						
									scene.fog.color.setHex( fogColor );

									break;
								}
								case 'near':{
									var fogNear = UtilsHelper.parseValue( obj.values.near );
									var durationNear = UtilsHelper.parseValue( obj.values.durationNear ) * 1000;
									UtilsHelper.tween( scene.fog, 'near', fogNear, durationNear, obj.values.nearEasing, obj.values.nearEasingType );
									break;
								}
								case 'far':{
									var fogFar = UtilsHelper.parseValue( obj.values.far );
									var durationFar = UtilsHelper.parseValue( obj.values.durationFar ) * 1000;
									UtilsHelper.tween( scene.fog, 'far', fogFar, durationFar, obj.values.farEasing, obj.values.farEasingType );
									break;
								}
								case 'toggle':{

									let newValue = obj.values.toggle;
									
									const isActive = fogType === "Fog";

									switch (obj.values.toggle){
										case 'on':
											newValue=true;
											break;
										case 'off':
											newValue=false;
											break;
										case 'toggle':
											newValue = !isActive;
									}


									if (newValue){
										scene.fog = scene.userData.lastFog.Fog || scene.fog;
									}else{
										scene.fog = null;
									}
									break;
								}
								default:
									break;
							}

							if (isAbout !== "toggle"){
								scene.userData.lastFog.Fog= scene.Fog;
							}
						
						} else {

							const {isAbout} = obj.values;

							const fogType = scene.fog && scene.fog.toJSON().type;

							if ( !( scene.fog && scene.fog.isFogExp2 )) {
								scene.fog = scene.userData.lastFog.FogExp2 || new THREE.FogExp2( 0x00000000 );
							}

							switch (isAbout){
								case 'color':{
									var fogColor = parseInt( obj.values.color.substr( 1 ), 16 );
									scene.fog.color.setHex( fogColor );
									break;
								}
								case 'density':{
									var fogDensity = UtilsHelper.parseValue( obj.values.density );
									var duration = UtilsHelper.parseValue( obj.values.duration ) * 1000;
									UtilsHelper.tween( scene.fog, 'density', fogDensity, duration, obj.values.easing, obj.values.easingType );
									break;
								}
								case 'toggle':{
									let newValue = obj.values.toggle;
									
									const isActive = fogType === "FogExp2";

									switch (obj.values.toggle){
										case 'on':
											newValue=true;
											break;
										case 'off':
											newValue=false;
											break;
										case 'toggle':
											newValue = !isActive;
									}


									if (newValue){
										scene.fog = scene.userData.lastFog.FogExp2 || scene.fog;
									}else{
										scene.fog = null;
									}
									break;
								}
							}

							if (isAbout !== "toggle"){
								scene.userData.lastFog.FogExp2= scene.Fog;
							}
						}
						break;

					case 'filter':
						FilterHelper.Update(composer, player.filters, obj.values, renderer, scene, camera);
						break;
					case 'active camera':
						player.setCamera( obj.values.cameraUuid );
						break;

				}

				break;

			case 'custom attribute':
				var exp = obj.values.value;
				var duration = UtilsHelper.parseValue(obj.values.duration) * 1000;
				var res = UtilsHelper.parseOperation(exp);
				if ( res.val && res.op ) {
					var customAttribute = UtilsHelper.getAttributeByName( player.attributes, obj.attribute );
					var value = ( res.op == 'none' ? UtilsHelper.parseValue( exp ) : UtilsHelper.parseValue( exp.substring(2, exp.length - 1 ) ) );
					var newValue = ( res.op == 'none' ? value : eval( `${customAttribute.value} ${res.op} ${value}` ) );
					UtilsHelper.tween( customAttribute, 'value', newValue, duration, obj.values.easing, obj.values.easingType, function ( newVal ) {

						var uuid = player.attributeTextMap[ obj.attribute ];

						if ( uuid ) {

							object = scene.getObjectByProperty( 'uuid', uuid );
							object.text = newVal.toString();
							object.updateGeometry();

						}

					} );
				}
				break;

			case 'spacial':
				var exp = obj.values.value;
				var res = UtilsHelper.parseOperation( exp );
				if ((res.val || res.val === 0) && res.op) {
					var value = ( res.op == 'none' ? UtilsHelper.parseValue(exp) : UtilsHelper.parseValue(exp.substring(2, exp.length - 1)) );
					var newValue = ( res.op == 'none' ? value : eval(`${object[obj.attribute][obj.values.axis]} ${res.op} ${value}`) );
					if ( obj.attribute == 'rotation' ) {
						var deg = THREE.MathUtils.radToDeg( object[obj.attribute][obj.values.axis] );
						newValue = ( res.op == 'none' ? value : eval(`${deg} ${res.op} ${value}`) );
						newValue = THREE.MathUtils.degToRad( newValue );
					}
					var duration = UtilsHelper.parseValue(obj.values.duration) * 1000;
					UtilsHelper.tween( object[obj.attribute], obj.values.axis, newValue, duration, obj.values.easing, obj.values.easingType );
				}
				break;

			default:
				if ( obj.objectType == 'Scene') object = scene;
				if ( obj.objectType == 'MainCamera' ) object = camera; // TODO:: this should no longer be needed
				switch ( obj.attribute ) {
					case 'particle count':
						var value = UtilsHelper.parseValue( obj.values.value );
						object.emitter.particleCount = value;
						object.group.maxParticleCount = value;
						object.reload();
						break;

					case 'blend mode':
						object.group.blending = obj.values.value;
						object.reload();
						break;

					case 'direction': case 'duration':
						object.emitter[ attribute ] = UtilsHelper.parseValue( obj.values.value );
						object.reload();
						break;

					case 'particle rate':
						object.emitter.particleCount = UtilsHelper.parseValue( obj.values.value );
						object.reload();
						break;

					case 'emitter type':
						object.emitter.type = obj.values.value;
						object.reload();
						break;

					case 'age': case 'wiggle':
						var value = UtilsHelper.parseValue( obj.values.value );
						var i = ( attribute == 'age' ? 'maxAge' : attribute );
						var j = ( obj.values.mode == 'F' ? 'value' : 'spread' );

						object.emitter[ i ][ j ] = value;
						object.reload();
						break;

					case 'position': case 'velocity': case 'acceleration':
						var value = UtilsHelper.parseValue( obj.values.value );
						object.emitter[attribute][obj.values.mode][ 'set' + obj.values.axis.toUpperCase() ]( value );
						object.reload();
						break;

					case 'intensity': case 'distance': case 'decay': case 'angle': case 'penumbra':
					case 'fov': case 'left': case 'right': case 'bottom': case 'top': case 'near': case 'far':
						var value = UtilsHelper.parseValue( obj.values.value );

						if (obj.attribute === "fov"){
							var exp = obj.values.value;
							var res = UtilsHelper.parseOperation( exp );

							if ((res.val || res.val === 0) && res.op) {
								var valueTemp = ( res.op == 'none' ? UtilsHelper.parseValue(exp) : UtilsHelper.parseValue(exp.substring(2, exp.length - 1)) );
								var newValue = ( res.op == 'none' ? valueTemp : eval(`${object[obj.attribute]} ${res.op} ${valueTemp}`) );
								value= newValue;
							}
						}
						var duration = UtilsHelper.parseValue( obj.values.duration ) * 1000;
						UtilsHelper.tween( object, obj.attribute, value, duration, obj.values.easing, obj.values.easingType, function () {
							if ( object.isCamera ) {
								object.updateProjectionMatrix();
							}
						} );
						break;

					case 'visible': case 'render shadow': case 'cast shadow':
						var newValue = ( obj.values.value == 'on' ? true : obj.values.value == 'off' ? false : ! object[attribute] );
						object[attribute] = newValue;
						if(obj.attribute == 'visible'){
							for(let i=0; i<object.children.length; i++){
								if(object.children[i].userData && object.children[i].userData.isVoxel){
									object.children[i].visible = newValue;
								}
							}
						}
						break;

					case 'shadow bias': case 'shadow radius':
						var value = UtilsHelper.parseValue( obj.values.value );
						var duration = UtilsHelper.parseValue( obj.values.duration ) * 1000;
						UtilsHelper.tween( object.shadow, attribute, value, duration, obj.values.easing, obj.values.easingType );
						break;

					case 'color': case 'ground color':
						var color = parseInt( obj.values.color.substr( 1 ), 16 );
						object[attribute].setHex( color );
						break;
				}
				break;
		}
	}
};

ScriptHelper.addTimelineConnect = function ( player, json ) {

	var connect = player.timelineConnects.find( tc => tc.index == json.index );

	if ( !connect ) {

		player.timelineConnects.push( json );

	}

};

ScriptHelper.timelineMouseConnect = function ( player, event ) {

	player.timelineConnects.map( obj => {

		var speed = UtilsHelper.parseValue( obj.multiplier );
		var animation = player.animations[ obj.index ];

		if ( obj.connect == 'cursor position in X' ) {

			var delta = event.clientX / player.width * speed;
			animation.connect( delta );

		} else if ( obj.connect == 'cursor position in Y' ) {

			var delta = event.clientY / player.height * speed;
			animation.connect( delta );

		} else {

			var delta = (event.deltaY < 0 ? 1 : -1) * speed * 0.01;
			animation.connectScroll( delta );

		}

	} );

};

ScriptHelper.objectMouseConnect = function ( player, object, type, event ) {

	var connection = object.userData.connection;

	[ 'position', 'rotation', 'scale' ].map( ( spacial ) => {

		[ 'x', 'y', 'z' ].map( ( axis ) => {

			if ( connection[ spacial ] && connection[ spacial ][ axis ] ) {

				var mouse = connection[ spacial ][ axis ].mouse;
				var speed = connection[ spacial ][ axis ].speed * 5;

				if ( type == 'wheel' && mouse == 'wheel' ) {

					object[ spacial ][ axis ] += ( event.deltaY < 0 ? 1 : -1 ) * speed * 0.01;

				} else if ( type == 'mousemove' && mouse &&  mouse != 'wheel' ) {

					var value = connection[ spacial ][ axis ].value || 0;
					var add1 = ( event[ 'client' + mouse.toUpperCase() ] / player[ mouse == 'x' ? 'width' : 'height' ] - 0.5 ) * speed;
					if(mouse == 'y'){
						add1 *= -1;
					}
					object[ spacial ][ axis ] = value + add1;

				}

			}

		} );

	} );

	[ 'direction', 'rotate', 'grow' ].map( ( mv ) => {

		[ 'x', 'y', 'z' ].map( ( axis ) => {

			if ( connection[ mv ] && connection[ mv ][ axis ] ) {

				var mouse = connection[ mv ][ axis ].mouse;
				var speed = connection[ mv ][ axis ].speed * 5;
				var key = ( mv == 'rotate' ? 'rotation' : mv );

				if ( type == 'wheel' && mouse == 'wheel' ) {

					if ( player.getMovement( object.uuid ).movement[ key ][ axis ] == undefined ) {

						player.getMovement( object.uuid ).movement[ key ][ axis ] = 0;

					}

					player.getMovement( object.uuid ).movement[ key ][ axis ] += ( event.deltaY < 0 ? 1 : -1 ) * speed * 0.01;

				} else if ( type == 'mousemove' && mouse && mouse != 'wheel' ) {

					var value = connection[ mv ][ axis ].value || 0;
					player.getMovement( object.uuid ).movement[ key ][ axis ] = value + ( event[ 'client' + mouse.toUpperCase() ] / player[ mouse == 'x' ? 'width' : 'height' ] - 0.5 ) * speed;

				}

			}

		} );

	} );

	[ 'intensity', 'fov', 'near', 'far' ].map( ( key ) => {

		if ( connection[ key ] ) {

			var mouse = connection[ key ].mouse;
			var speed = connection[ key ].speed * 5;

			if ( type == 'wheel' && mouse == 'wheel' ) {

				object[ key ] += ( event.deltaY < 0 ? 1 : -1 ) * speed * 0.01;

			} else if ( type == 'mousemove' && mouse && mouse != 'wheel' ) {

				var value = connection[ key ].value || 0;
				object[ key ] = value + ( event[ 'client' + mouse.toUpperCase() ] / player[ mouse == 'x' ? 'width' : 'height' ] - 0.5 ) * speed;

			}

			if ( key == 'near' || key == 'fov' || key == 'far' ) {

				object[key] = Math.max( object[key], 0.1 );

			}

			if ( object.isCamera ) object.updateProjectionMatrix();

		}

	} );

	if ( connection[ 'opacity' ] ) {

		var mouse = connection[ 'opacity' ].mouse;
		var speed = connection[ 'opacity' ].speed * 5;

		if ( type == 'wheel' && mouse == 'wheel' ) {

			var opacity = MaterialHelper.get( object, 0 ).opacity;
			MaterialHelper.setValue( object, 'opacity', opacity + ( event.deltaY < 0 ? 1 : -1 ) * speed * 0.01 );

		} else if ( type == 'mousemove' && mouse &&  mouse != 'wheel' ) {

			var value = connection[ 'opacity' ].value || 0;
			MaterialHelper.setValue( object, 'opacity', value + ( event[ 'client' + mouse.toUpperCase() ] / player[ mouse == 'x' ? 'width' : 'height' ] * - 0.5 ) * speed, 0 );

		}

	}

}

ScriptHelper.animationMouseConnect = function ( player, event ) {

	player.animationConnects.map( obj => {

		var id = obj.animationId;

		if ( id ) {

			var texture = player.assets.get( 'Animation', 'id', id ).texture;
			var animation = texture.animation;
			var delta = (event.deltaY < 0 ? 1 : -1) * 0.05;

			const multiplier = obj.sensitivity ?? 1;

			const goToFrame =animation.currentFrame + delta * animation.frameRate * multiplier;

			if (goToFrame >= animation.firstFrame && goToFrame <= animation.totalFrames){
				animation.goToAndStop(goToFrame , true );
			}

		}

	} );

};


function setOrToggleMap(object, obj, player){

	const { isAbout } = obj.values;
	const mapName = UtilsHelper.toCamelCase( obj.attribute );
	const slot = 0;
	const asset = player.assets.get( 'Image', 'id', obj.values.assetId );
	
	if (isAbout === "texture" && asset){

		const isMapEnabled = MaterialHelper.isMapEnabled(object, mapName, slot);

		if (isMapEnabled) {
			MaterialHelper.setMap( object, mapName, asset ? asset.texture : null, slot);
		} else {
			MaterialHelper.storeMap( object, mapName, asset ? asset.texture : null, slot );
		}
	
	} else if (isAbout === "toggle"){

		MaterialHelper.toggleMapValue(object, mapName, obj.values.toggle, slot);

		MaterialHelper.updateMapBasedOnToggleValue(object,mapName, slot);

	}
}