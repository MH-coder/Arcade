import { UIElement, UIPanel, UIText, UIDiv } from './components/ui.js';
import { UIStyledTabs } from './components/ui.openstudio.js';
import { v4 as uuid } from 'uuid';

import { AddScriptCommand } from '../commands/AddScriptCommand.js';
import { RemoveScriptCommand } from '../commands/RemoveScriptCommand.js';
import { SetScriptValueCommand } from '../commands/SetScriptValueCommand.js';
import { SetMaterialValueCommand } from '../commands/SetMaterialValueCommand.js';
import isWholeObjectAtGivenPosition from './utils/isWholeObjectAtGivenPosition';



function Script( editor ) {

	var signals = editor.signals;
	var config = editor.config;

	var container = new UIPanel();
	container.setId( 'script' );
	container.setDisplay( 'none' );

	var header = new UIDiv();
	header.setClass('script-top-bar');

	var tabs = new UIStyledTabs();

	var buttonNEW = ( function () {
		var button = document.createElement( 'div' );
		var image = document.createElement( 'img');
		image.src = config.getImage( 'engine-ui/add-btn.svg' );
		button.appendChild( image );
		return button;
	} )();

	var NEW = new UIElement( buttonNEW );
	NEW.setClass( 'NewScriptButton' );
	NEW.onClick( function () {

		if ( tabIndex > -1 ) {

			saveLogicBlocks();

		}

		editor.execute( new AddScriptCommand( editor, { name: 'untitled', json: [], source: ScriptHelper.init() } ) );
		tabs.addTab( 'untitled', config.getImage( 'engine-ui/add-btn.svg' ) );

		tabIndex = editor.scripts.length - 1;
		currentScript = editor.scripts[tabIndex];

		logicBlock.removeClass( 'hidden' );
		editor.logicBlock.fromJSON( currentScript.json );

	} );
	tabs.add( NEW );
	tabs.onNameChange( function ( index, name ) {

		editor.execute( new SetScriptValueCommand( editor, index, 'name', name ) );

	} );
	tabs.onChange( function ( index ) {

		if ( index != tabIndex ) {

			saveLogicBlocks();

			tabIndex = index;
			currentScript = editor.scripts[tabIndex];
			editor.logicBlock.fromJSON( currentScript.json );

		}

	} );
	tabs.onDelete( function ( index ) {

		editor.execute( new RemoveScriptCommand( editor, index ) );
		tabs.removeTab( index );

		if ( tabIndex == index ) {

			if ( editor.scripts.length == 0 ) {

				tabIndex = -1;
				currentScript = undefined;
				logicBlock.addClass( 'hidden' );

			} else {

				tabIndex = Math.max( 0, tabIndex - 1 );
				currentScript = editor.scripts[tabIndex];
				editor.logicBlock.fromJSON( currentScript.json );

			}

		} else if ( tabIndex < 0 ) {

			tabIndex = tabIndex - 1;

		}

	});

	header.add( tabs );

	container.add( header );

	var renderer;

	signals.rendererChanged.add( function ( newRenderer ) {

		renderer = newRenderer;

	} );

	var div = new UIDiv();
	div.setClass( 'script-editor' );

	var delay;
	var currentMode;
	var currentScript;
	var currentObject;

	var codemirror = CodeMirror( div.dom, {
		beautify: true,
		value: '',
		lineNumbers: true,
		matchBrackets: true,
		indentWithTabs: true,
		tabSize: 4,
		indentUnit: 4,
		hintOptions: {
			completeSingle: false
		},
	} );
	codemirror.setOption( 'theme', 'monokai' );
	codemirror.on( 'change', function () {

		if ( codemirror.state.focused === false ) return;

		clearTimeout( delay );
		delay = setTimeout( function () {

			var value = codemirror.getValue();

			if ( ! validate( value ) ) return;

			if ( typeof ( currentScript ) === 'object' ) {

				if ( value !== currentScript.source ) {

					editor.execute( new SetScriptValueCommand( editor, tabIndex, 'source', value ) );

				}

				return;

			}

			if ( currentScript !== 'programInfo' ) return;

			var json = JSON.parse( value );

			if ( JSON.stringify( currentObject.material.defines ) !== JSON.stringify( json.defines ) ) {

				var cmd = new SetMaterialValueCommand( editor, currentObject, 'defines', json.defines );
				cmd.updatable = false;
				editor.execute( cmd );

			}

			if ( JSON.stringify( currentObject.material.uniforms ) !== JSON.stringify( json.uniforms ) ) {

				var cmd = new SetMaterialValueCommand( editor, currentObject, 'uniforms', json.uniforms );
				cmd.updatable = false;
				editor.execute( cmd );

			}

			if ( JSON.stringify( currentObject.material.attributes ) !== JSON.stringify( json.attributes ) ) {

				var cmd = new SetMaterialValueCommand( editor, currentObject, 'attributes', json.attributes );
				cmd.updatable = false;
				editor.execute( cmd );

			}

		}, 300 );

	} );

	// prevent backspace from deleting objects
	var wrapper = codemirror.getWrapperElement();
	wrapper.addEventListener( 'keydown', function ( event ) {

		event.stopPropagation();

	} );

	// validate

	var errorLines = [];
	var widgets = [];

	var validate = function ( string ) {

		var valid;
		var errors = [];

		return codemirror.operation( function () {

			while ( errorLines.length > 0 ) {

				codemirror.removeLineClass( errorLines.shift(), 'background', 'errorLine' );

			}

			while ( widgets.length > 0 ) {

				codemirror.removeLineWidget( widgets.shift() );

			}

			//

			switch ( currentMode ) {

				case 'javascript':

					try {

						var syntax = esprima.parse( string, { tolerant: true } );
						errors = syntax.errors;

					} catch ( error ) {

						errors.push( {

							lineNumber: error.lineNumber - 1,
							message: error.message

						} );

					}

					for ( var i = 0; i < errors.length; i ++ ) {

						var error = errors[ i ];
						error.message = error.message.replace( /Line [0-9]+: /, '' );

					}

					break;

				case 'json':

					errors = [];

					jsonlint.parseError = function ( message, info ) {

						message = message.split( '\n' )[ 3 ];

						errors.push( {

							lineNumber: info.loc.first_line - 1,
							message: message

						} );

					};

					try {

						jsonlint.parse( string );

					} catch ( error ) {

						// ignore failed error recovery

					}

					break;

				case 'glsl':

					currentObject.material[ currentScript ] = string;
					currentObject.material.needsUpdate = true;
					signals.materialChanged.dispatch( currentObject.material );

					var programs = renderer.info.programs;

					valid = true;
					var parseMessage = /^(?:ERROR|WARNING): \d+:(\d+): (.*)/g;

					for ( var i = 0, n = programs.length; i !== n; ++ i ) {

						var diagnostics = programs[ i ].diagnostics;

						if ( diagnostics === undefined ||
								diagnostics.material !== currentObject.material ) continue;

						if ( ! diagnostics.runnable ) valid = false;

						var shaderInfo = diagnostics[ currentScript ];
						var lineOffset = shaderInfo.prefix.split( /\r\n|\r|\n/ ).length;

						while ( true ) {

							var parseResult = parseMessage.exec( shaderInfo.log );
							if ( parseResult === null ) break;

							errors.push( {

								lineNumber: parseResult[ 1 ] - lineOffset,
								message: parseResult[ 2 ]

							} );

						} // messages

						break;

					} // programs

			} // mode switch

			for ( var i = 0; i < errors.length; i ++ ) {

				var error = errors[ i ];

				var message = document.createElement( 'div' );
				message.className = 'esprima-error';
				message.textContent = error.message;

				var lineNumber = Math.max( error.lineNumber, 0 );
				errorLines.push( lineNumber );

				codemirror.addLineClass( lineNumber, 'background', 'errorLine' );

				var widget = codemirror.addLineWidget( lineNumber, message );

				widgets.push( widget );

			}

			return valid !== undefined ? valid : errors.length === 0;

		} );

	};

	// tern js autocomplete

	var server = new CodeMirror.TernServer( {
		caseInsensitive: true,
		plugins: { threejs: null }
	} );

	codemirror.setOption( 'extraKeys', {
		'Ctrl-Space': function ( cm ) {

			server.complete( cm );

		},
		'Ctrl-I': function ( cm ) {

			server.showType( cm );

		},
		'Ctrl-O': function ( cm ) {

			server.showDocs( cm );

		},
		'Alt-.': function ( cm ) {

			server.jumpToDef( cm );

		},
		'Alt-,': function ( cm ) {

			server.jumpBack( cm );

		},
		'Ctrl-Q': function ( cm ) {

			server.rename( cm );

		},
		'Ctrl-.': function ( cm ) {

			server.selectName( cm );

		}
	} );

	codemirror.on( 'cursorActivity', function ( cm ) {

		if ( currentMode !== 'javascript' ) return;
		server.updateArgHints( cm );

	} );

	codemirror.on( 'keypress', function ( cm, kb ) {

		if ( currentMode !== 'javascript' ) return;
		var typed = String.fromCharCode( kb.which || kb.keyCode );
		if ( /[\w\.]/.exec( typed ) ) {

			server.complete( cm );

		}

	} );

	var tabIndex = -1;

	var getScript = function (obj, script) {

		if (obj.off == false) {

			switch (obj.type) {

				case 'trigger':
					if (obj.trigger == 'key')
						script += `player.keyboardState.${UtilsHelper.toCamelCase(obj.keyEvent)}('${obj.key}')`;
					else
						script += "player.mouseState." + (obj.mouseEventType != 'move' ? (UtilsHelper.toCamelCase(obj.mouseClickEvent) + "('" + obj.mouse + "')") : (UtilsHelper.toCamelCase(obj.mouseMoveEvent) + "()"));
					break;

				case 'attribute':
					if ( obj.attribute != undefined && obj.off == false ) {

						var object = `scene.getObjectByProperty("uuid", "${obj.uuid}")`;
						script += '(' + object + ' && ';

						let operation = UtilsHelper.parseOperation(obj.condition).op;
								

						switch ( obj.attribute ) {

							case 'position': case 'scale':
								
								if (obj.attribute === "scale"){
									script += object + '.' + obj.attribute + '.' + obj.axis + ' ';
									script += UtilsHelper.parseOperation(obj.condition).op + ' ' + obj.value;
								}else if (obj.attribute === "position") {
									if (operation !== "=="){
										script += object + '.' + obj.attribute + '.' + obj.axis + ' ';
										script += operation + ' ' + obj.value;
									}else {
										script += ` isWholeObjectAtGivenPosition({axis:'${obj.axis}', position:${obj.value}, mesh:${object}})`
									}
									
								}
								
								break;

							case 'rotation':
								script += object + '.' + obj.attribute + '.' + obj.axis + ' ';
								script += UtilsHelper.parseOperation(obj.condition).op + ' THREE.Math.degToRad(' + obj.value + ')';
								break;

							case 'visible': case 'frustum cull':
								script += object + '.' + UtilsHelper.toCamelCase(obj.attribute);
								script += UtilsHelper.parseOperation(obj.value).op;
								break;

							case 'render order': case 'intensity': case 'distance': case 'decay': case 'angle': case 'penumbra': case 'left': case 'right': case 'top': case 'bottom': case 'near': case 'far': case 'fov':
								script += object + '.' + UtilsHelper.toCamelCase(obj.attribute) + ' ';
								script += UtilsHelper.parseOperation(obj.condition).op + ' ' + obj.value;
								break;

							default:
								script += `UtilsHelper.getAttributeByName(player.attributes, "${obj.attribute}").value `;
								script += UtilsHelper.parseOperation(obj.condition).op + ' ' + obj.value;
								break;
						}

						script += ')';

					}
					break;

				case 'collision':
					script += `SceneHelper.objectCollision(scene, player, "${obj.uuid}", "${obj.tag}", "${obj.targetUuid}", "${obj.targetTag}", "${obj.condition}")`;
					break;

				case 'selection':
					script += `SceneHelper.objectSelection(scene, player, "${obj.uuid}", "${obj.tag}", "${obj.condition}")`;
					break;

				case 'add':
					script += `SceneHelper.addObject(scene, player, "${obj.srcUuid}", "${obj.srcTag}", "${obj.relative}", "${obj.destUuid}", "${obj.destTag}", "${obj.match}", "${obj.x}", "${obj.y}", "${obj.z}" );\n`;
					break;

				case 'remove':
					script += `SceneHelper.removeObject(scene, player, "${obj.uuid}", "${obj.tag}");\n`;
					break;

				case 'change':
					script += `ScriptHelper.change(scene, camera, renderer, player, composer, ${JSON.stringify(obj)});\n`;
					break;

				case 'rule':
					var operator = ((obj.conditions == "any are true" || obj.conditions == "when any of these happen") ? '||' : '&&');
					var scrs = obj.children[0].filter((item => !item.off))
					var conditionLength = scrs.length;
					if (conditionLength > 0) {
						script += 'if (';
						for (var i = 0; i < conditionLength; i++) {
							script = getScript(scrs[i], script);
							if (i != conditionLength - 1 && scrs[i].off == false)
								script += (' ' + operator + ' ');
						}
						script += ')' + '\n';

						script += "{\n";
						obj.children[1].forEach(d => {
							script = getScript(d, script);

						});
						script += "}\n";

						script += "else {\n";
						obj.children[2].forEach(d => {
							script = getScript(d, script);
						});

						script += "}\n";
					}
					break;

				case 'timer':
					var duration = UtilsHelper.parseValue(obj.duration) * 1000;
					script += `
						if (!player.timerUuids){
							player.timerUuids=[];
						}
					`
					if ( obj.conditions == 'For' ) {
						const timerUuid= uuid();
						script += `if ( !player.timerUuids.includes("${timerUuid}") ) {\n`;
						script +=`const interval = setInterval( function () {\n`;
						obj.children.forEach(d => {
							script = getScript(d, script);
						});
						script += `}, 16);`;
						script += `player.timers.push(interval);\n`;
						script+= `player.timerUuids.push("${timerUuid}");`;

						script += `setTimeout( function () { clearInterval(interval); }, ${duration});\n`;
						
						script += `}\n`;
					} else if ( obj.conditions == 'After' ) {
						const timerUuid= uuid();
						script += `if ( !player.timerUuids.includes("${timerUuid}") ) {\n`;
						script += `player.timers.push( setTimeout( function () {\n`;
						obj.children.forEach(d => {
							script = getScript(d, script);
						});
					
						script += `}, ${duration}) );\n`;
						script+= `player.timerUuids.push("${timerUuid}");`;
						script += `}\n`;

					} else if ( obj.conditions == 'After event' ) {

						script += `player.timers.push( setTimeout( function () {\n`;
						obj.children.forEach(d => {
							script = getScript(d, script);
						});
						script += `}, ${duration}) );\n`;
						
					} else if ( obj.conditions == 'Every' ) {

						const timerUuid= uuid();
						script += `if ( !player.timerUuids.includes("${timerUuid}") ) {\n`;
						script += `player.timers.push( setInterval( function () {\n`;
						obj.children.forEach(d => {
							script = getScript(d, script);
						});
						script += `}, ${duration}) );\n`;
						script+= `player.timerUuids.push("${timerUuid}");`;

						script += `}\n`;
					}
					break;

				case 'group':
					obj.children.forEach(d => {
						script = getScript(d, script);
					});
					break;

				case 'timeline':

					if ( obj.index != '' ) {

						if ( obj.action == 'play' ) {

							script += `player.animations[${obj.index}].play(${UtilsHelper.parseValue(obj.times)}, '${obj.condition}');\n`;

						} else if ( obj.action == 'stop' ) {

							script += `player.animations[${obj.index}].stop();\n`;

						} else if ( obj.action == 'pause' ) {

							script += `player.animations[${obj.index}].pause();\n`;

						} else if ( obj.action == 'go to timecode' ) {

							script += `player.animations[${obj.index}].goTo(${UtilsHelper.parseValue(obj.duration)}, '${obj.gotoAction}');\n`;

						} else if ( obj.action == 'bounce' ) {

							script += `player.animations[${obj.index}].bounce(${UtilsHelper.parseValue(obj.times)}, '${obj.condition}');\n`;

						} else if ( obj.action == 'connect to mouse' ) {

							script += `ScriptHelper.addTimelineConnect(player, ${JSON.stringify(obj)});\n`;

						}

					}

					break;

				case 'link':
					if ( obj.target == 'new page' ) {
						script += `window.open("${obj.url}", '_blank');\n`;
					} else {
						script += `window.location.href = "${obj.url}";\n`;
					}

				case 'play':
					script += `MediaHelper.${UtilsHelper.toCamelCase(obj.action + " " + obj.mode)}(player, ${JSON.stringify(obj)}, scene);\n`;
					break;
			}

		}
		return script;
	}

	var parseJSON = function (json) {

		var script = ScriptHelper.generate('template');
		var initScript = '\n\nfunction init () {\n';

		script += '\n\nfunction updateScript() {\n';

		/** This function will remove the direct group of json and any consecutive children that are group as well  */
		function flattenGroups(objArray) {
			const flattened = [];
			objArray.forEach((obj) => {
				if (obj.type === "group") {
					// if commented
					if (obj.off != false) return
					obj.children.forEach((obj) => {
						if (obj.type == "group") {
							flattenGroups(obj.children).forEach((obj) => {
								flattened.push(obj)
							})
						} else {
							flattened.push(obj)
						}
					})
				} else {
					flattened.push(obj)
				}
			})
			return flattened
		} 
		
		const jsonWithFlattenedGroup = flattenGroups(json)

		jsonWithFlattenedGroup.forEach(obj => {
			if (obj.type == 'rule' || obj.type == 'timer')
				script = getScript(obj, script);
			else
				initScript = getScript(obj, initScript);
		});
		initScript += "}";
		script += "}";
		script += initScript;

		return script;
	}

	var saveLogicBlocks = function () {

		if ( currentScript ) {

			var json = editor.logicBlock.toJSON();
			editor.execute( new SetScriptValueCommand( editor, tabIndex, 'json', json ) );
			editor.execute( new SetScriptValueCommand( editor, tabIndex, 'source', parseJSON(json) ) );

		}

	}

	var logicBlock = new UIPanel();

	logicBlock.setId( 'logicblock' );
	logicBlock.dom.setAttribute( 'tabindex', '-1' );

	var workspace = document.createElement( 'div' );
	workspace.id = 'logicblockspace';

	var initialBlock = document.createElement( 'div' );
	initialBlock.className = 'block-container';
	initialBlock.setAttribute('block-type', 'empty');

	var initialCursor = document.createElement( 'div' );
	initialCursor.className = 'cursor selected';

	initialBlock.appendChild( initialCursor );
	workspace.appendChild(initialBlock);

	logicBlock.dom.appendChild(workspace);

	div.add( logicBlock );
	container.add( div );


	var updateEditor = function ( LB ) {

		logicBlock.setDisplay( LB ? '' : 'none' );
		wrapper.style.display = LB ? 'none' : '';

	}

	//

	signals.editorCleared.add( function () {

		container.setDisplay( 'none' );

	} );

	signals.saveScript.add( function () {

		saveLogicBlocks();

	})

	signals.editScript.add( function ( scripts, object, refresh ) {

		if(!refresh){
				if ( editor.isScripting ) {

					saveLogicBlocks();
					container.setDisplay( 'none' );

					editor.isScripting = false;
					return;

				}

				editor.isScripting = true;
				container.setDisplay( '' );
				updateEditor( true );
		}else{
			if ( editor.isScripting ) {
				saveLogicBlocks();
			}
		}



		if ( scripts.length == 0 ) {

			logicBlock.addClass( 'hidden' );
			return;

		}

		tabs.removeAllTabs();

		for ( var script of scripts ) {

			tabs.addTab( script.name, config.getImage( 'engine-ui/add-btn.svg' )  );

		}

		tabIndex = 0;
		currentScript = scripts[tabIndex];

		var mode, name, source;

		if ( typeof ( currentScript ) === 'object' ) {

			mode = 'javascript';
			name = currentScript.name;
			source = currentScript.source;

		} else {

			switch ( currentScript ) {

				case 'vertexShader':

					mode = 'glsl';
					name = 'Vertex Shader';
					source = object.material.vertexShader || "";

					break;

				case 'fragmentShader':

					mode = 'glsl';
					name = 'Fragment Shader';
					source = object.material.fragmentShader || "";

					break;

				case 'programInfo':

					mode = 'json';
					name = 'Program Properties';
					var json = {
						defines: object.material.defines,
						uniforms: object.material.uniforms,
						attributes: object.material.attributes
					};
					source = JSON.stringify( json, null, '' );

			}

		}

		currentMode = mode;
		currentObject = object;

		codemirror.setValue( source );

		for ( var i = 0; i < codemirror.lineCount(); i++ ) {

			codemirror.indentLine(i);

		}

		codemirror.clearHistory();

		if ( mode === 'json' ) {

			mode = { name: 'javascript', json: true }

		};
		codemirror.setOption( 'mode', mode );

		logicBlock.removeClass('hidden');
		editor.logicBlock.fromJSON( currentScript.json );

	} );
	signals.sceneGraphChanged.add( function(data){
		signals.editScript.dispatch( editor.scripts, null, true );
	} );

	signals.objectRemoved.add( function ( object ) {

		const updateScriptJSON = function ( oldArray, newArray, removedArray ) {

			for ( var obj of oldArray ) {

				if ( obj.type == 'rule' ) {

					var ruleObj = { ...obj, children: { 0: [], 1: [], 2: [] } };

					for ( var i = 0; i < 3; i++ ) {

						updateScriptJSON( obj.children[ i ], ruleObj.children[ i ], removedArray );

					}

					newArray.push( ruleObj );


				} else if ( obj.type == 'timer' || obj.type == 'group' ) {

					var groupObj = { ...obj, children: [] }

					updateScriptJSON( obj.children, groupObj.children, removedArray );

					newArray.push( groupObj );

				} else {

					if ( ( object.uuid == obj.uuid ) || ( obj.type == 'add' && ( obj.srcUuid == object.uuid || obj.destUuid == object.uuid ) ) ) {

						removedArray.push( obj );

					} else {

						newArray.push( obj );

					}

				}

			}

		}

		for ( var i = 0; i < editor.scripts.length; i++ ) {

			const newJSON = [];
			const removedBlocks = [];

			updateScriptJSON( editor.scripts[ i ].json, newJSON, removedBlocks );

			if ( removedBlocks.length > 0 ) {

				editor.execute( new SetScriptValueCommand( editor, i, 'json', newJSON ) );
				editor.execute( new SetScriptValueCommand( editor, i, 'source', parseJSON( newJSON ) ) );

			}

		}

	} );

	return container;

}

export { Script };
