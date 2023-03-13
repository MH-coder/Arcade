/**
 * @author mrdoob / http://mrdoob.com/
 */

var Config = function ( editor ) {

	var settings = {
		'api/pixabay': '13838034-bed06591439bb7ede439d71eb',
		'api/unsplash': '7uvLOvcJobn4kUszQ-ftApVAtjbt1wvq1oJTgKBlbPc',
		'settings/shortcuts/undo': 'z',
		'settings/shortcuts/userinterface/snap': 's',
		'settings/shortcuts/userinterface/fullscreen': '0',
		'settings/shortcuts/userinterface/logic': '1',
		'settings/shortcuts/userinterface/library': '2',
		'settings/shortcuts/userinterface/sidebar': '3',
		'settings/shortcuts/userinterface/timeline': '4',
		'settings/shortcuts/userinterface/play': 'tab',
		'settings/shortcuts/userinterface/group': 'g',
		'settings/shortcuts/userinterface/helper': 'i',
		'settings/shortcuts/clone': 'd',
		'settings/shortcuts/userinterface/color_picker': 'p',
		'settings/shortcuts/logicblocks/copy': 'c',
		'settings/shortcuts/logicblocks/paste': 'v',
		'settings/shortcuts/logicblocks/edit': 'return',
		'settings/shortcuts/logicblocks/new': 'double click',
		'settings/shortcuts/logicblocks/move': 'click drag',
		'settings/shortcuts/timeline/play': 'space bar',
	};

	var storage = {
		'language': 'en',
		'exportPrecision': 6,
		'autosave': true,
		'project/name': 'untitled',
		'project/thumbnail': null,
		'project/editable': false,
		'project/renderer/antialias': true,
		'project/renderer/shadows': true,
		'project/renderer/shadowType': 1, // PCF
		'project/renderer/physicallyCorrectLights': false,
		'project/renderer/toneMapping': 0, // NoToneMapping
		'project/renderer/toneMappingExposure': 1,
		'project/renderer/toneMappingWhitePoint': 1,
		'project/snap/translate': 1,
		'project/snap/rotate': 45,
		'project/snap/scale': 1,
		'project/navigation/WASDRF/movement': 5,
		'project/navigation/WASDRF/pointer': 40,
		'project/zoomSpeed': 5,
		'project/vr': false,
		'settings/history': false,
	};

	return {

		getKey: function ( key ) {

			return storage[ key ];

		},

		setKey: function () {

			for ( var i = 0, l = arguments.length; i < l; i += 2 ) {

				storage[ arguments[ i ] ] = arguments[ i + 1 ];

			}

		},

		saveKey: function () {

			for ( var i = 0, l = arguments.length; i < l; i += 2 ) {

				storage[ arguments[ i ] ] = arguments[ i + 1 ];

			}

			this.save();

		},

		getSetting: function ( key ) {

			return settings[ key ];

		},

		getImage: function ( key ) {

			return 'https://arcadestudio-assets.s3.us-east-2.amazonaws.com/' + key;

		},

		fromJSON: function ( json ) {

			Object.assign( storage, json );

		},
		
		toJSON: function () {

			return storage;

		},

		load: function ( url, onProgress ) {

			var scope = this;

			return new Promise( function ( resolve, reject) {
				
				editor.api.load( url, onProgress ).then( json => {

					scope.fromJSON( json );
					resolve();

				} );

			} );
		},

		save: function () {

			editor.api.save( '/asset/project/config', { id: editor.projectId, config: this.toJSON() } ).then( function () {

				console.log( 'config is saved successfully.');

			} );
			
		}

	};

};

export { Config };
