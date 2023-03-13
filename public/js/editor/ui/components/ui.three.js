import * as THREE from '../../libs/three.module.js';

import { RGBELoader } from '../../core/loaders/RGBELoader.js';
import { TGALoader } from '../../core/loaders/TGALoader.js';

import { UIElement, UISpan, UIDiv, UIRow, UIButton, UICheckbox, UIText, UINumber } from './ui.js';
import { MoveObjectCommand } from '../../commands/MoveObjectCommand.js';
import { AddObjectCommand } from '../../commands/AddObjectCommand.js';



//UINewTexture
function UINewTexture( editor, mapping ) {

	UIElement.call( this );

	var scope = this;

	var dom = document.createElement( 'span' );
	dom.className = 'Texture';
	dom.style.position = "relative";

	var canvas = document.createElement( 'canvas' );
	canvas.width = 23;
	canvas.height = 13;
	canvas.style.cursor = 'pointer';
	canvas.style.border = '1px solid #6c8db8';
	canvas.style.borderRadius = '4px';
	canvas.addEventListener( 'click', function () {

		UtilsHelper.chooseSingleFile( function ( files ) {

			Promise.all( editor.loader.loadFiles( files, null, 'Image') ).then( function ( results ) {
				var assets = {};
				var asset = editor.assets.uploadImage( results[0].texture );
				editor.assets[results[0].filename] = asset;
				loading.style.display = "block";

				var texture = results[0].texture;
				var image = results[0].texture.image;

				var formData = new FormData();
				formData.append( 'type', 'Image' );
				formData.append( 'projectId', editor.projectId );

				for ( let i = 0; i < files.length; i++ ) {

					formData.append( 'file', files[i] );

					asset.id = files[i].id;
					asset.imageId = files[i].imageId;
					loading.style.display = "none";

					scope.setValue( texture );
					if ( scope.onChangeCallback ) scope.onChangeCallback( -1 );

				}

				// editor.api.post( '/asset/my-image/upload', formData ).then( res => {

				// 	for ( var file of res.files ) {

				// 		asset.id = file.id;
				// 		asset.imageId = file.imageId;
				// 		loading.style.display = "none";

				// 		scope.setValue( texture );
				// 		if ( scope.onChangeCallback ) scope.onChangeCallback( file.id );
				// 	}

				// } );

			} );

		}, "image/*, .hdr" );

	}, false );
	canvas.addEventListener( 'drop', function ( e ) {
		console.log("UI New Texture drop called");
		var assetType = event.dataTransfer.getData( 'assetType' );

		if ( assetType == 'Image' ) {

			var assetId = event.dataTransfer.getData( 'assetId' );
			var asset = editor.assets.get('Image', 'id', assetId );

			asset.texture ? scope.setValue( asset.texture ) : asset.apply();
			if ( scope.onChangeCallback ) scope.onChangeCallback( asset.id );

		}

		if ( assetType == 'Environment' ) {

			var assetId = event.dataTransfer.getData( 'assetId' );
			var asset = editor.assets.get( 'Environment', 'id', assetId );
			if (typeof asset == 'undefined') {
				editor.api.post('/asset/my-environment/add', {
				  id: assetId,
				  projectId: editor.projectId,
				  folderId: 0
				}).then(function (environment) {
				  editor.addAsset('Environment', 0, environment).then(function (asset) {
					editor.signals.environmentAssetAdded.dispatch(asset, 0);
					asset.apply();
					
				  });
				}).catch(err => {
				  alert(err);
				});
			  } else {
				asset.texture ? scope.setValue( asset.texture ) : asset.apply();
				
			  }

			
			if ( scope.onChangeCallback ) scope.onChangeCallback( asset.id );

		}

	}, false );
	dom.appendChild( canvas );
	var loading = document.createElement( 'div' );
	loading.classList.add("w-lightbox-spinner");
	loading.style.display = "none";
	loading.style.width = "20px";
	loading.style.height = "20px";
	loading.style.marginTop = "-10px";
	loading.style.marginLeft = "-10px";
	dom.appendChild( loading );

	function loadFile( file ) {

		var extension = file.name.split( '.' ).pop().toLowerCase()
		var reader = new FileReader();

		if ( extension === 'hdr' ) {

			reader.addEventListener( 'load', function ( event ) {

				// assuming RGBE/Radiance HDR iamge format

				var loader = new RGBELoader().setDataType( THREE.UnsignedByteType );
				loader.load( event.target.result, function ( hdrTexture ) {

					hdrTexture.sourceFile = file.name;
					hdrTexture.isHDRTexture = true;

					scope.setValue( hdrTexture );

					var newId = Date.now();
					editor.assets.images[0].items.push({
						id: newId,
						texture: hdrTexture
					});

					if ( scope.onChangeCallback ) scope.onChangeCallback( newId );

				} );

			} );

			reader.readAsDataURL( file );

		} else if ( extension === 'tga' ) {

			reader.addEventListener( 'load', function ( event ) {

				var canvas = new TGALoader().parse( event.target.result );

				var texture = new THREE.CanvasTexture( canvas, mapping );
				texture.sourceFile = file.name;

				scope.setValue( texture );

				if ( scope.onChangeCallback ) scope.onChangeCallback( texture );

			}, false );

			reader.readAsArrayBuffer( file );

		} else if ( file.type.match( 'image.*' ) ) {

			reader.addEventListener( 'load', function ( event ) {

				var image = document.createElement( 'img' );
				image.addEventListener( 'load', function () {

					var texture = new THREE.Texture( this, mapping );
					texture.sourceFile = file.name;
					texture.format = file.type === 'image/jpeg' ? THREE.RGBFormat : THREE.RGBAFormat;
					texture.needsUpdate = true;

					var newId = Date.now();
					editor.assets.images[0].items.push({
						id: newId,
						texture: texture
					});
					scope.setValue( texture );

					if ( scope.onChangeCallback ) scope.onChangeCallback( newId );

				}, false );

				image.src = event.target.result;

			}, false );

			reader.readAsDataURL( file );
		}

	}

	this.dom = dom;
	this.texture = null;
	this.onChangeCallback = null;

	return this;

}

UINewTexture.prototype = Object.create( UIElement.prototype );
UINewTexture.prototype.constructor = UINewTexture;

UINewTexture.prototype.getValue = function () {

	return this.texture;

};

UINewTexture.prototype.setValue = function ( texture ) {

	var canvas = this.dom.children[ 0 ];
	var context = canvas.getContext( '2d' );

	// Seems like context can be null if the canvas is not visible
	if ( context ) {

		// Always clear the context before set new texture, because new texture may has transparency
		context.clearRect( 0, 0, canvas.width, canvas.height );

	}

	if ( texture !== null ) {

		var image = texture.image;

		if ( image !== undefined && image.width > 0 ) {

			canvas.title = texture.sourceFile;
			var scale = canvas.width / image.width;

			if ( image.data === undefined ) {

				context.drawImage( image, 0, 0, image.width * scale, image.height * scale );

			} else {

				var canvas2 = renderToCanvas( texture );
				context.drawImage( canvas2, 0, 0, image.width * scale, image.height * scale );

			}

		} else {

			canvas.title = texture.sourceFile + ' (error)';

		}

	} else {

		canvas.title = 'empty';

	}

	this.texture = texture;

};

UINewTexture.prototype.setEncoding = function ( encoding ) {

	var texture = this.getValue();
	if ( texture !== null ) {

		texture.encoding = encoding;

	}

	return this;

};

UINewTexture.prototype.onChange = function ( callback ) {

	this.onChangeCallback = callback;

	return this;

};

//UIEnvTexture
function UIEnvTexture( editor, mapping ) {

	UIElement.call( this );

	var scope = this;

	var dom = document.createElement( 'span' );
	dom.className = 'Texture';
	dom.style.position = "relative";

	var canvas = document.createElement( 'canvas' );
	canvas.width = 23;
	canvas.height = 13;
	canvas.style.cursor = 'pointer';
	canvas.style.border = '1px solid #6c8db8';
	canvas.style.borderRadius = '4px';
	canvas.addEventListener( 'click', function () {

		UtilsHelper.chooseSingleFile( function ( files ) {

			Promise.all( editor.loader.loadFiles( files, null, 'Image') ).then( function ( results ) {
				var assets = {};
				var asset = editor.assets.uploadImage( results[0].texture );
				editor.assets[results[0].filename] = asset;
				loading.style.display = "block";

				var texture = results[0].texture;
				var image = results[0].texture.image;

				var formData = new FormData();
				formData.append( 'type', 'Image' );
				formData.append( 'projectId', editor.projectId );

				for ( let i = 0; i < files.length; i++ ) {

					formData.append( 'file', files[i] );

					asset.id = files[i].id;
					asset.imageId = files[i].imageId;
					loading.style.display = "none";

					scope.setValue( texture );
					console.log("files[i].id: ",files[i].id);
					if ( scope.onChangeCallback ) scope.onChangeCallback( -1 );

				}

				/*editor.api.post( '/asset/my-image/upload', formData ).then( res => {

					for ( var file of res.files ) {

						asset.id = file.id;
						asset.imageId = file.imageId;
						loading.style.display = "none";

						scope.setValue( texture );
						if ( scope.onChangeCallback ) scope.onChangeCallback( file.id );
					}

				} );*/

			} );

		}, "image/*, .hdr" );

	}, false );
	canvas.addEventListener( 'drop', function ( e ) {
		console.log("UIEnvTexture drop called");
		var assetType = event.dataTransfer.getData( 'assetType' );

		if ( assetType == 'Image' ) {

			var assetId = event.dataTransfer.getData( 'assetId' );
			var asset = editor.assets.get('Image', 'id', assetId );

			scope.setValue( asset.texture );
			if ( scope.onChangeCallback ) scope.onChangeCallback( asset.id );

		}

		if ( assetType == 'Environment' ) {

			var assetId = event.dataTransfer.getData( 'assetId' );
			var asset = editor.assets.get( 'Environment', 'id', assetId );
			if (typeof asset == 'undefined') {
				editor.api.post('/asset/my-environment/add', {
					id: assetId,
					projectId: editor.projectId,
					folderId: 0
				}).then(function (environment) {
					editor.addAsset('Environment', 0, environment).then(function (asset) {
						editor.signals.environmentAssetAdded.dispatch(asset, 0);
						asset.apply();

					});
				}).catch(err => {
					alert(err);
				});
			} else {
				asset.texture ? scope.setValue( asset.texture ) : asset.apply();

			}


			if ( scope.onChangeCallback ) scope.onChangeCallback( asset.id );

		}

	}, false );
	dom.appendChild( canvas );
	var loading = document.createElement( 'div' );
	loading.classList.add("w-lightbox-spinner");
	loading.style.display = "none";
	loading.style.width = "20px";
	loading.style.height = "20px";
	loading.style.marginTop = "-10px";
	loading.style.marginLeft = "-10px";
	dom.appendChild( loading );

	function loadFile( file ) {

		var extension = file.name.split( '.' ).pop().toLowerCase()
		var reader = new FileReader();

		if ( extension === 'hdr' ) {

			reader.addEventListener( 'load', function ( event ) {

				// assuming RGBE/Radiance HDR iamge format

				var loader = new RGBELoader().setDataType( THREE.UnsignedByteType );
				loader.load( event.target.result, function ( hdrTexture ) {

					hdrTexture.sourceFile = file.name;
					hdrTexture.isHDRTexture = true;

					scope.setValue( hdrTexture );

					var newId = Date.now();
					editor.assets.images[0].items.push({
						id: newId,
						texture: hdrTexture
					});

					if ( scope.onChangeCallback ) scope.onChangeCallback( newId );

				} );

			} );

			reader.readAsDataURL( file );

		} else if ( extension === 'tga' ) {

			reader.addEventListener( 'load', function ( event ) {

				var canvas = new TGALoader().parse( event.target.result );

				var texture = new THREE.CanvasTexture( canvas, mapping );
				texture.sourceFile = file.name;

				scope.setValue( texture );

				if ( scope.onChangeCallback ) scope.onChangeCallback( texture );

			}, false );

			reader.readAsArrayBuffer( file );

		} else if ( file.type.match( 'image.*' ) ) {

			reader.addEventListener( 'load', function ( event ) {

				var image = document.createElement( 'img' );
				image.addEventListener( 'load', function () {

					var texture = new THREE.Texture( this, mapping );
					texture.sourceFile = file.name;
					texture.format = file.type === 'image/jpeg' ? THREE.RGBFormat : THREE.RGBAFormat;
					texture.needsUpdate = true;

					var newId = Date.now();
					editor.assets.images[0].items.push({
						id: newId,
						texture: texture
					});
					scope.setValue( texture );

					if ( scope.onChangeCallback ) scope.onChangeCallback( newId );

				}, false );

				image.src = event.target.result;

			}, false );

			reader.readAsDataURL( file );
		}

	}

	this.dom = dom;
	this.texture = null;
	this.onChangeCallback = null;

	return this;

}

UIEnvTexture.prototype = Object.create( UIElement.prototype );
UIEnvTexture.prototype.constructor = UIEnvTexture;

UIEnvTexture.prototype.getValue = function () {

	return this.texture;

};

UIEnvTexture.prototype.setValue = function ( texture ) {
	var canvas = this.dom.children[ 0 ];
	var context = canvas.getContext( '2d' );

	// Seems like context can be null if the canvas is not visible
	if ( context ) {

		// Always clear the context before set new texture, because new texture may has transparency
		context.clearRect( 0, 0, canvas.width, canvas.height );

	}

	if ( texture !== null ) {

		var image = texture.image;

		if ( image !== undefined && image.width > 0 ) {

			canvas.title = texture.sourceFile;
			var scale = canvas.width / image.width;

			if ( image.data === undefined ) {

				context.drawImage( image, 0, 0, image.width * scale, image.height * scale );

			} else {

				var canvas2 = renderToCanvas( texture );
				context.drawImage( canvas2, 0, 0, image.width * scale, image.height * scale );

			}

		} else {

			canvas.title = texture.sourceFile + ' (error)';

		}

	} else {

		canvas.title = 'empty';

	}

	this.texture = texture;

};

UIEnvTexture.prototype.setEncoding = function ( encoding ) {

	var texture = this.getValue();
	if ( texture !== null ) {

		texture.encoding = encoding;

	}

	return this;

};

UIEnvTexture.prototype.onChange = function ( callback ) {

	this.onChangeCallback = callback;

	return this;

};

//UITexture
function UITexture( editor, mapping ) {

	UIElement.call( this );

	var scope = this;

	var dom = document.createElement( 'span' );
	dom.className = 'Texture';

	var form = document.createElement( 'form' );

	var input = document.createElement( 'input' );
	input.type = 'file';
	input.addEventListener( 'change', function ( event ) {

		loadFile( event.target.files[ 0 ] );

	} );
	form.appendChild( input );

	var canvas = document.createElement( 'canvas' );
	canvas.width = 23;
	canvas.height = 13;
	canvas.style.cursor = 'pointer';
	canvas.style.border = '1px solid #6c8db8';
	canvas.style.borderRadius = '4px';
	canvas.addEventListener( 'click', function () {

		input.click();

	}, false );
	canvas.addEventListener( 'drop', function ( e ) {

		var assetType = event.dataTransfer.getData( 'assetType' );

		if ( assetType == 'Image' ) {

			var assetId = event.dataTransfer.getData( 'assetId' );
			var asset = editor.assets.get('Image', 'id', assetId );

			scope.setValue( asset.texture );
			if ( scope.onChangeCallback ) scope.onChangeCallback( asset.id );
			editor.assets.images[0].items.push({
				id: assetId,
				texture: asset.texture
			});

		}

		if ( assetType == 'Environment' ) {

			var assetId = event.dataTransfer.getData( 'assetId' );
			var asset = editor.assets.get( 'Environment', 'id', assetId );

			scope.setValue( asset.texture );
			if ( scope.onChangeCallback ) scope.onChangeCallback( asset.id );

		}

	}, false );
	dom.appendChild( canvas );

	function loadFile( file ) {

		var extension = file.name.split( '.' ).pop().toLowerCase()
		var reader = new FileReader();

		if ( extension === 'hdr' ) {

			reader.addEventListener( 'load', function ( event ) {

				// assuming RGBE/Radiance HDR iamge format

				var loader = new RGBELoader().setDataType( THREE.UnsignedByteType );
				loader.load( event.target.result, function ( hdrTexture ) {

					hdrTexture.sourceFile = file.name;
					hdrTexture.isHDRTexture = true;

					scope.setValue( hdrTexture );

					var newId = Date.now();
					editor.assets.images[0].items.push({
						id: newId,
						texture: hdrTexture
					});

					if ( scope.onChangeCallback ) scope.onChangeCallback( newId );

				} );

			} );

			reader.readAsDataURL( file );

		} else if ( extension === 'tga' ) {

			reader.addEventListener( 'load', function ( event ) {

				var canvas = new TGALoader().parse( event.target.result );

				var texture = new THREE.CanvasTexture( canvas, mapping );
				texture.sourceFile = file.name;

				scope.setValue( texture );

				if ( scope.onChangeCallback ) scope.onChangeCallback( texture );

			}, false );

			reader.readAsArrayBuffer( file );

		} else if ( file.type.match( 'image.*' ) ) {

			reader.addEventListener( 'load', function ( event ) {

				var image = document.createElement( 'img' );
				image.addEventListener( 'load', function () {

					var texture = new THREE.Texture( this, mapping );
					texture.sourceFile = file.name;
					texture.format = file.type === 'image/jpeg' ? THREE.RGBFormat : THREE.RGBAFormat;
					texture.needsUpdate = true;

					var newId = Date.now();
					editor.assets.images[0].items.push({
						id: newId,
						texture: texture
					});
					scope.setValue( texture );

					if ( scope.onChangeCallback ) scope.onChangeCallback( newId );

				}, false );

				image.src = event.target.result;

			}, false );

			reader.readAsDataURL( file );
		}

		form.reset();

	}

	this.dom = dom;
	this.texture = null;
	this.onChangeCallback = null;

	return this;

}

UITexture.prototype = Object.create( UIElement.prototype );
UITexture.prototype.constructor = UITexture;

UITexture.prototype.getValue = function () {

	return this.texture;

};

UITexture.prototype.setValue = function ( texture ) {

	var canvas = this.dom.children[ 0 ];
	var context = canvas.getContext( '2d' );

	// Seems like context can be null if the canvas is not visible
	if ( context ) {

		// Always clear the context before set new texture, because new texture may has transparency
		context.clearRect( 0, 0, canvas.width, canvas.height );

	}

	if ( texture !== null ) {

		var image = texture.image;

		if ( image !== undefined && image.width > 0 ) {

			canvas.title = texture.sourceFile;
			var scale = canvas.width / image.width;

			if ( image.data === undefined ) {

				context.drawImage( image, 0, 0, image.width * scale, image.height * scale );

			} else {

				var canvas2 = renderToCanvas( texture );
				context.drawImage( canvas2, 0, 0, image.width * scale, image.height * scale );

			}

		} else {

			canvas.title = texture.sourceFile + ' (error)';

		}

	} else {

		canvas.title = 'empty';

	}

	this.texture = texture;

};

UITexture.prototype.setEncoding = function ( encoding ) {

	var texture = this.getValue();
	if ( texture !== null ) {

		texture.encoding = encoding;

	}

	return this;

};

UITexture.prototype.onChange = function ( callback ) {

	this.onChangeCallback = callback;

	return this;

};

// UICubeTexture

function UICubeTexture( editor ) {

	UIElement.call( this );

	var container = new UIDiv();

	this.cubeTexture = null;
	this.onChangeCallback = null;
	this.dom = container.dom;

	this.textures = [];

	var scope = this;

	var pRow = new UIRow();
	var nRow = new UIRow();

	pRow.add( new UIText( 'P:' ).setWidth( '35px' ) );
	nRow.add( new UIText( 'N:' ).setWidth( '35px' ) );

	var posXTexture = new UITexture( editor ).onChange( onTextureChanged );
	var negXTexture = new UITexture( editor ).onChange( onTextureChanged );
	var posYTexture = new UITexture( editor ).onChange( onTextureChanged );
	var negYTexture = new UITexture( editor ).onChange( onTextureChanged );
	var posZTexture = new UITexture( editor ).onChange( onTextureChanged );
	var negZTexture = new UITexture( editor ).onChange( onTextureChanged );

	this.textures.push( posXTexture, negXTexture, posYTexture, negYTexture, posZTexture, negZTexture );

	pRow.add( posXTexture );
	pRow.add( posYTexture );
	pRow.add( posZTexture );

	nRow.add( negXTexture );
	nRow.add( negYTexture );
	nRow.add( negZTexture );

	container.add( pRow, nRow );

	function onTextureChanged() {

		var images = [];

		for ( var i = 0; i < scope.textures.length; i ++ ) {

			var texture = scope.textures[ i ].getValue();

			if ( texture !== null ) {

				images.push( texture.isHDRTexture ? texture : texture.image );

			}

		}

		if ( images.length === 6 ) {

			var cubeTexture = new THREE.CubeTexture( images );
			cubeTexture.needsUpdate = true;

			if ( images[ 0 ].isHDRTexture ) cubeTexture.isHDRTexture = true;

			scope.cubeTexture = cubeTexture;

			if ( scope.onChangeCallback ) scope.onChangeCallback( cubeTexture );

		}

	}

}

UICubeTexture.prototype = Object.create( UIElement.prototype );
UICubeTexture.prototype.constructor = UICubeTexture;

UICubeTexture.prototype.setEncoding = function ( encoding ) {

	var cubeTexture = this.getValue();
	if ( cubeTexture !== null ) {

		cubeTexture.encoding = encoding;

	}

	return this;

};

UICubeTexture.prototype.getValue = function () {

	return this.cubeTexture;

};

UICubeTexture.prototype.setValue = function ( cubeTexture ) {

	this.cubeTexture = cubeTexture;

	if ( cubeTexture !== null ) {

		var images = cubeTexture.image;

		if ( Array.isArray( images ) === true && images.length === 6 ) {

			for ( var i = 0; i < images.length; i ++ ) {

				var image = images[ i ];

				var texture = new THREE.Texture( image );
				this.textures[ i ].setValue( texture );

			}

		}

	} else {

		var textures = this.textures;

		for ( var i = 0; i < textures.length; i ++ ) {

			textures[ i ].setValue( null );

		}

	}

	return this;

};

UICubeTexture.prototype.onChange = function ( callback ) {

	this.onChangeCallback = callback;

	return this;

};

// UIOutliner

function UIOutliner( editor ) {

	UIElement.call( this );

	var scope = this;

	var dom = document.createElement( 'div' );
	dom.className = 'Outliner';
	dom.tabIndex = 0;	// keyup event is ignored without setting tabIndex


	this.scene = editor.scene;

	// Prevent native scroll behavior
	dom.addEventListener( 'keydown', function ( event ) {

		switch ( event.keyCode ) {

			case 38: // up
			case 40: // down
			case 77: // M
			case 16: // Shift
				event.preventDefault();
				event.stopPropagation();
				break;

		}

	}, false );

	// Keybindings to support arrow navigation
	dom.addEventListener( 'keyup', function ( event ) {

		if ( scope.selectedIndex >= 0 ) {

			var option = scope.options[ scope.selectedIndex ];
			if ( option ) {

				var id = option.value;
				//var object = scope.scene.getObjectById( id );
				var object = scope.editor.getObjectById( id );
				switch ( event.keyCode ) {

					case 38: // up
					var newIndex = object && ( object.isScene || (object.parent && object.parent.isScene) || (object.name == "Camera") ? scope.selectedIndex - 1 : scope.getOptionIndexByValue( object.parent.id ) );
						scope.selectIndex( newIndex );
						event.stopPropagation();
						break;
					case 40: // down
					newIndex = scope.selectedIndex + 1;
						scope.selectIndex( newIndex );
						event.stopPropagation();
						break;
					case 77: // M
						if ( !object || object.isScene || ( object.parent.isScene && object.children.length == 0 ) ) break;
						var groupId = object.children.length > 0 ? id : object.parent.id;
						scope.groupCollapseCallback( groupId, event.shiftKey );
						event.stopPropagation();
						break;

				}

			}

		}

	}, false );

	this.dom = dom;
	this.editor = editor;

	this.options = [];
	this.selectedIndex = - 1;
	this.selectedValue = null;

	this.renameEnabled = false;
	this.renameCallback = null;
	this.groupCollapseCallback = null;

	return this;

}

UIOutliner.prototype = Object.create( UIElement.prototype );
UIOutliner.prototype.constructor = UIOutliner;

UIOutliner.prototype.selectIndex = function ( index ) {

	if ( index >= 0 && index < this.options.length ) {

		this.setValue( this.options[ index ].value );

		var changeEvent = document.createEvent( 'HTMLEvents' );
		changeEvent.initEvent( 'change', true, true );
		this.dom.dispatchEvent( changeEvent );

	}

};

UIOutliner.prototype.setOptions = function ( options ) {

	var scope = this;
	var editor = scope.editor;

	while ( scope.dom.children.length > 0 ) {

		scope.dom.removeChild( scope.dom.firstChild );

	}

	function onClick() {

		scope.setValue( this.value );

		var changeEvent = document.createEvent( 'HTMLEvents' );
		changeEvent.initEvent( 'change', true, true );
		scope.dom.dispatchEvent( changeEvent );

	}

	function onDblClick() {

		var name = this.getElementsByClassName( 'name' )[0];
		name.contentEditable = "true";
		name.spellcheck = "false";
		name.focus();

		var saveName = function () {

			if ( scope.renameCallback ) {

				scope.renameCallback( name.textContent );

			}

		}

		name.addEventListener( 'keydown', function () {

			event.stopPropagation();

			if ( event.keyCode == 13 ) {

				event.preventDefault();
				name.contentEditable = "false";

			}

		});

		name.addEventListener( 'keyup', function() {
			// prevent keyup event listeners from being called when typing names for the element
			event.stopImmediatePropagation();
			event.preventDefault();
		} );

		name.addEventListener( 'blur', function () {

			name.contentEditable = "false";
			saveName();

		} );

		document.execCommand('selectAll',false,null)

	}

	// Drag

	var currentDrag = this;

	function onDrag() {
		currentDrag = this;

	}

	function onDragStart( event ) {
		event.dataTransfer.setData( 'text', 'foo' );

	}

	function onDragOver( event ) {

		if ( this === currentDrag ) return;

		var area = event.offsetY / this.clientHeight;

		if ( area < 0.25 ) {

			this.className = 'option dragTop';

		} else if ( area > 0.75 ) {

			this.className = 'option dragBottom';

		} else {

			this.className = 'option drag';

		}

	}

	function onDragLeave() {

		if ( this === currentDrag ) return;

		this.className = 'option';

	}

	function onDrop( event ) {
		var area = event.offsetY / this.clientHeight;
		var assetType = event.dataTransfer.getData( 'assetType' );
		var assetId = event.dataTransfer.getData( 'assetId' );

		if ( assetType == 'Image' ) {

			var object = scope.scene.getObjectById( this.value );
			var objectHasUvs = false;
			var geometry = object.geometry;

			if ( object.isSprite ) objectHasUvs = true;
			if ( geometry.isGeometry && geometry.faceVertexUvs[ 0 ].length > 0 ) objectHasUvs = true;
			if ( geometry.isBufferGeometry && geometry.attributes.uv !== undefined ) objectHasUvs = true;

			if ( objectHasUvs ) {

				var asset = editor.assets.get('Image', 'id', assetId );
				asset.apply( object );

			}

			return;

		}

		if ( assetType == 'Environment' ) {

			var object = scope.scene.getObjectById( this.value );

			if ( object && object.isScene ) {

				editor.signals.sceneBackgroundTypeChanged.dispatch( 'Equirectangular', assetId, editor.assets.getEnvironment( assetId ).texture );

			}

			return;

		}

		if ( this === currentDrag ) return;

		this.className = 'option';

		var scene = scope.scene;
		var object;

		if ( assetType == 'Geometry' ) {

			var asset = editor.assets.get( 'Geometry', 'id', assetId );
			//changes to fix dragging bug
			if (typeof asset == 'undefined') {

				editor.api.post( '/asset/my-geometry/add', { id: assetId, projectId: editor.projectId, folderId: 0 } ).then( function ( geometry ) {

					editor.addAsset( 'Geometry', 0, geometry ).then( function ( asset ) {

						editor.signals.geometryAssetAdded.dispatch( asset, 0 );

						object = asset;

						if ( !event.shiftKey ) asset.render();

					} );
				} ).catch( ( err ) => {

					alert( err );
					
				} );
				
			}
			else if ( asset.object === undefined ) {

				asset.render();
				
				object = asset.object.clone();

			} else {
				
				object = asset.object.clone();
				
				editor.execute( new AddObjectCommand( editor, object ) );
			
			}

		} else {

			object = scene.getObjectById( currentDrag.value );

		}

		if ( area < 0.25 ) {

			var nextObject = scene.getObjectById( this.value );
			moveObject( object, nextObject.parent, nextObject, event.shiftKey );

		} else if ( area > 0.75 ) {

			var nextObject, parent;

			if ( this.nextSibling !== null ) {

				nextObject = scene.getObjectById( this.nextSibling.value );
				parent = nextObject.parent;

			} else {

				// end of list (no next object)

				nextObject = null;
				parent = scene.getObjectById( this.value ).parent;

			}
			setTimeout( function () {
				moveObject( object, parent, nextObject, event.shiftKey );
			}, 4000 );
			
			
			if (typeof object !== 'undefined') {
			
				moveObject( object, parent, nextObject, event.shiftKey );
			
			}

		} else {

			var parentObject = scene.getObjectById( this.value );
			moveObject( object, parentObject, null, event.shiftKey );

		}

	}

	function moveObject( object, newParent, nextObject, shiftKey ) {

		if ( nextObject === null ) nextObject = undefined;

		var newParentIsChild = false;

		if ( typeof object.traverse !== 'undefined' ) {

			object.traverse( function ( child ) {

				if ( child === newParent ) newParentIsChild = true;

			} );

		}

		if ( newParentIsChild ) return;

		editor.execute( new MoveObjectCommand( editor, object, newParent, nextObject, shiftKey ) );

		var changeEvent = document.createEvent( 'HTMLEvents' );
		changeEvent.initEvent( 'change', true, true );
		scope.dom.dispatchEvent( changeEvent );

	}

	//

	scope.options = [];

	for ( var i = 0; i < options.length; i ++ ) {

		var div = options[ i ];
		div.className = 'option';
		scope.dom.appendChild( div );

		scope.options.push( div );

		div.addEventListener( 'click', onClick );

		if ( scope.renameEnabled ) {

			div.addEventListener( 'dblclick', onDblClick, false );

		}

		if ( div.draggable === true ) {
			div.addEventListener( 'drag', onDrag );
			div.addEventListener( 'dragstart', onDragStart ); // Firefox needs this

			div.addEventListener( 'dragover', onDragOver );
			div.addEventListener( 'dragleave', onDragLeave );
			div.addEventListener( 'drop', onDrop );

		} else {

			div.addEventListener( 'drop', onDrop );

		}

	}

	return scope;

};

UIOutliner.prototype.getOptionIndexByValue = function ( value ) {

	var option = this.options.find( o => o.value == value );
	return this.options.indexOf( option );

}

UIOutliner.prototype.getValue = function () {

	return this.selectedValue;

};

UIOutliner.prototype.setValue = function ( value ) {

	for ( var i = 0; i < this.options.length; i ++ ) {

		var element = this.options[ i ];

		if ( element.value === value ) {
			//var object = this.scene.getObjectById( value, true );
			var object = this.editor.getObjectById( value, true );

			if ( object && object.visible ) {

				element.classList.add( 'active' );

				// scroll into view

				var y = element.offsetTop - this.dom.offsetTop;
				var bottomY = y + element.offsetHeight;
				var minScroll = bottomY - this.dom.offsetHeight;

				if ( this.dom.scrollTop > y ) {

					this.dom.scrollTop = y;

				} else if ( this.dom.scrollTop < minScroll ) {

					this.dom.scrollTop = minScroll;

				}

				this.selectedIndex = i;

			}

		} else {

			element.classList.remove( 'active' );

		}

	}

	this.selectedValue = value;

	return this;

};

UIOutliner.prototype.onRename = function ( callback ) {

	this.renameCallback = callback;

};

UIOutliner.prototype.onGroupCollapse = function ( callback ) {

	this.groupCollapseCallback = callback;

}

function UIPoints( onAddClicked ) {

	UIElement.call( this );

	var span = new UISpan().setDisplay( 'inline-block' );

	this.pointsList = new UIDiv();
	span.add( this.pointsList );

	var row = new UIRow();
	span.add( row );

	var addPointButton = new UIButton( '+' ).onClick( onAddClicked );
	row.add( addPointButton );

	this.update = function () {

		if ( this.onChangeCallback !== null ) {

			this.onChangeCallback();

		}

	}.bind( this );

	this.dom = span.dom;
	this.pointsUI = [];
	this.lastPointIdx = 0;
	this.onChangeCallback = null;
	return this;

}

UIPoints.prototype = Object.create( UIElement.prototype );
UIPoints.prototype.constructor = UIPoints;

UIPoints.prototype.onChange = function ( callback ) {

	this.onChangeCallback = callback;

	return this;

};

UIPoints.prototype.clear = function () {

	for ( var i = 0; i < this.pointsUI.length; ++ i ) {

		if ( this.pointsUI[ i ] ) {

			this.deletePointRow( i, true );

		}

	}

	this.lastPointIdx = 0;

};

UIPoints.prototype.deletePointRow = function ( idx, dontUpdate ) {

	if ( ! this.pointsUI[ idx ] ) return;

	this.pointsList.remove( this.pointsUI[ idx ].row );
	this.pointsUI[ idx ] = null;

	if ( dontUpdate !== true ) {

		this.update();

	}

};

function UIPoints2() {

	UIPoints.call( this, UIPoints2.addRow.bind( this ) );

	return this;

}

UIPoints2.prototype = Object.create( UIPoints.prototype );
UIPoints2.prototype.constructor = UIPoints2;

UIPoints2.addRow = function () {

	if ( this.pointsUI.length === 0 ) {

		this.pointsList.add( this.createPointRow( 0, 0 ) );

	} else {

		var point = this.pointsUI[ this.pointsUI.length - 1 ];

		this.pointsList.add( this.createPointRow( point.x.getValue(), point.y.getValue() ) );

	}

	this.update();

};

UIPoints2.prototype.getValue = function () {

	var points = [];
	var count = 0;

	for ( var i = 0; i < this.pointsUI.length; i ++ ) {

		var pointUI = this.pointsUI[ i ];

		if ( ! pointUI ) continue;

		points.push( new THREE.Vector2( pointUI.x.getValue(), pointUI.y.getValue() ) );
		++ count;
		pointUI.lbl.setValue( count );

	}

	return points;

};

UIPoints2.prototype.setValue = function ( points ) {

	this.clear();

	for ( var i = 0; i < points.length; i ++ ) {

		var point = points[ i ];
		this.pointsList.add( this.createPointRow( point.x, point.y ) );

	}

	this.update();
	return this;

};

UIPoints2.prototype.createPointRow = function ( x, y ) {

	var pointRow = new UIDiv();
	var lbl = new UIText( this.lastPointIdx + 1 ).setWidth( '20px' );
	var txtX = new UINumber( x ).setWidth( '30px' ).onChange( this.update );
	var txtY = new UINumber( y ).setWidth( '30px' ).onChange( this.update );

	var idx = this.lastPointIdx;
	var scope = this;
	var btn = new UIButton( '-' ).onClick( function () {

		if ( scope.isEditing ) return;
		scope.deletePointRow( idx );

	} );

	this.pointsUI.push( { row: pointRow, lbl: lbl, x: txtX, y: txtY } );
	++ this.lastPointIdx;
	pointRow.add( lbl, txtX, txtY, btn );

	return pointRow;

};

function UIPoints3() {

	UIPoints.call( this, UIPoints3.addRow.bind( this ) );

	return this;

}

UIPoints3.prototype = Object.create( UIPoints.prototype );
UIPoints3.prototype.constructor = UIPoints3;

UIPoints3.addRow = function () {

	if ( this.pointsUI.length === 0 ) {

		this.pointsList.add( this.createPointRow( 0, 0, 0 ) );

	} else {

		var point = this.pointsUI[ this.pointsUI.length - 1 ];

		this.pointsList.add( this.createPointRow( point.x.getValue(), point.y.getValue(), point.z.getValue() ) );

	}

	this.update();

};

UIPoints3.prototype.getValue = function () {

	var points = [];
	var count = 0;

	for ( var i = 0; i < this.pointsUI.length; i ++ ) {

		var pointUI = this.pointsUI[ i ];

		if ( ! pointUI ) continue;

		points.push( new THREE.Vector3( pointUI.x.getValue(), pointUI.y.getValue(), pointUI.z.getValue() ) );
		++ count;
		pointUI.lbl.setValue( count );

	}

	return points;

};

UIPoints3.prototype.setValue = function ( points ) {

	this.clear();

	for ( var i = 0; i < points.length; i ++ ) {

		var point = points[ i ];
		this.pointsList.add( this.createPointRow( point.x, point.y, point.z ) );

	}

	this.update();
	return this;

};

UIPoints3.prototype.createPointRow = function ( x, y, z ) {

	var pointRow = new UIDiv();
	var lbl = new UIText( this.lastPointIdx + 1 ).setWidth( '20px' );
	var txtX = new UINumber( x ).setWidth( '30px' ).onChange( this.update );
	var txtY = new UINumber( y ).setWidth( '30px' ).onChange( this.update );
	var txtZ = new UINumber( z ).setWidth( '30px' ).onChange( this.update );

	var idx = this.lastPointIdx;
	var scope = this;
	var btn = new UIButton( '-' ).onClick( function () {

		if ( scope.isEditing ) return;
		scope.deletePointRow( idx );

	} );

	this.pointsUI.push( { row: pointRow, lbl: lbl, x: txtX, y: txtY, z: txtZ } );
	++ this.lastPointIdx;
	pointRow.add( lbl, txtX, txtY, txtZ, btn );

	return pointRow;

};

function UIBoolean( boolean, text ) {

	UISpan.call( this );

	this.setMarginRight( '10px' );

	this.checkbox = new UICheckbox( boolean );
	this.text = new UIText( text ).setMarginLeft( '3px' );

	this.add( this.checkbox );
	this.add( this.text );

}

UIBoolean.prototype = Object.create( UISpan.prototype );
UIBoolean.prototype.constructor = UIBoolean;

UIBoolean.prototype.getValue = function () {

	return this.checkbox.getValue();

};

UIBoolean.prototype.setValue = function ( value ) {

	return this.checkbox.setValue( value );

};

var renderer;

export function renderToCanvas( texture ) {

	if ( renderer === undefined ) {

		renderer = new THREE.WebGLRenderer();
		renderer.outputEncoding = THREE.sRGBEncoding;

	}

	var image = texture.image;

	renderer.setSize( image.width, image.height, false );

	var scene = new THREE.Scene();
	var camera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );

	var material = new THREE.MeshBasicMaterial( { map: texture } );
	var quad = new THREE.PlaneBufferGeometry( 2, 2 );
	var mesh = new THREE.Mesh( quad, material );
	scene.add( mesh );

	renderer.render( scene, camera );

	return renderer.domElement;

}

export { UITexture, UICubeTexture, UIOutliner, UIPoints, UIPoints2, UIPoints3, UIBoolean, UINewTexture, UIEnvTexture };