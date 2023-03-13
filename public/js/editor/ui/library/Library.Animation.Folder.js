import { UIDiv } from "../components/ui.js";
import { LibraryBaseFolder } from './Library.Base.Folder.js';
import { LibraryBaseFolderPanel } from './Library.Base.Folder.Panel.js';
import { LibraryAnimationFolderItem } from './Library.Animation.Folder.Item.js';

function LibraryAnimationFolder( editor ) {

	var scope = this;
	var api = editor.api;
    var assets = editor.assets;
    var strings = editor.strings;
    var signals = editor.signals;
	var loader = editor.loader;

	LibraryBaseFolder.call( this, editor, {
		bannerText: strings.getKey( 'library/animations/folder' ),
		buttons: [ 'add' ]
	} );

	scope.buttons[ 'add' ].onClick( function ( e ) {

		UtilsHelper.chooseFile( function ( files ) {

			Promise.all( loader.loadFiles( files, null, 'Animation' ) ).then( function ( results ) {

				var assets = {};
				var items = {};

				for ( var result of results ) {

					var asset = editor.assets.uploadAnimation( result );
					assets[result.filename] = asset;

					var item = new LibraryAnimationFolderItem( editor, 0, asset );
					items[ result.filename ] = item;
					item.setLoading( true );

					scope.items.push( item );
					scope.folders[ 0 ].add( item.container );

				}

				var formData = new FormData();
				formData.append( 'type', 'Animation' );
				formData.append( 'projectId', editor.projectId );

				for ( let i = 0; i < files.length; i++ ) {

					formData.append( 'file', files[i] );

				}

				api.post( '/asset/my-animation/upload', formData ).then( res => {

					for ( var file of res.files ) {

						assets[ file.name ].id = file.id;
						assets[ file.name ].animationId = file.animationId;
						items[ file.name ].setLoading( false );

					}
	
				} );

			} );

		}, ".json" );

	} );

	assets.animations.map( function ( folder ) {

		var dom = scope.createFolder( editor, folder.id, folder.name );

		folder.items.map( function ( animation ) {

			var item = new LibraryAnimationFolderItem( editor, folder.id, animation );
			scope.items.push( item );
			dom.add( item.container );

		} );

	} );

	signals.animationAssetAdded.add( function ( asset, folderId ) {

		var item = new LibraryAnimationFolderItem( editor, folderId, asset );
		scope.items.push( item );

		var folder = scope.folders.find(x => x.id == folderId);
		folder.add( item.container );

	} );

	signals.moveAsset.add( function ( assetType, assetId, from, to, altKey ) {

		if ( assetType == 'Animation' && from != to ) {

			if ( altKey ) {

				var asset = editor.assets.get( assetType, 'id', assetId );
				var assetItem = scope.items.find( x => x.asset.id == assetId );

				assetItem.setLoading( true );

				api.post( '/asset/my-animation/add', { id: asset.animationId, projectId: editor.projectId } ).then( function ( animation ) {

					editor.addAsset( 'Animation', to, animation ).then( function ( asset ) {

						assetItem.setLoading( false );
						signals.animationAssetAdded.dispatch( asset, to );

					} );

				} ).catch( (err) => {

					alert( err );

				} );

			} else {

				editor.api.post( `/asset/my-animation/update/${assetId}`, { folderId: to } ).then( function () {

					editor.assets.move( assetType, assetId, from, to, altKey );
	
					var item = scope.items.find( x => x.asset.id == assetId );
					var index = scope.items.indexOf( item );
					item.container.delete();
					scope.items.splice( index, 1 );
	
					var asset = editor.assets.get( assetType, 'id', assetId );
					var newItem = new LibraryAnimationFolderItem( editor, to, asset );
					scope.items.push( newItem );
					scope.folders.find( x => x.id == to ).add( newItem.container );
	
				} );

			}

		}

	} );

	return this;

}

LibraryAnimationFolder.prototype = Object.create( LibraryBaseFolder.prototype );
LibraryAnimationFolder.prototype.constructor = LibraryAnimationFolder;

LibraryAnimationFolder.prototype = {

	createFolder: function ( editor, id, name ) {

		var folder = new LibraryBaseFolderPanel( editor, 'Animation', id, name );
		var gallery = new UIDiv().setClass( 'AnimationGallery' );
	
		folder.setPanel( gallery );
		this.folders.push( folder )
		this.foldersList.add( folder.container );

		editor.assets.addFolder( 'Animation', id, name );

		return folder;
	},

	createNewFolder: function ( editor ) {

		var scope = this;

		editor.api.post( '/folder/create', { type: 'animation', name: 'Untitled' } ).then( function ( folder ) {

			scope.createFolder( editor, folder.id, folder.name );

		} );

	}

};

export { LibraryAnimationFolder };