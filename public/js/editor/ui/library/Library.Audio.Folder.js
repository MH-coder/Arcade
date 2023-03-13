import { UIDiv } from "../components/ui.js";
import { LibraryBaseFolder } from './Library.Base.Folder.js';
import { LibraryBaseFolderPanel } from './Library.Base.Folder.Panel.js';
import { LibraryAudioFolderItem } from './Library.Audio.Folder.Item.js';

function LibraryAudioFolder( editor ) {

	var scope = this;
    var api = editor.api;
    var assets = editor.assets;
    var strings = editor.strings;
    var signals = editor.signals;
    var loader = editor.loader;

	LibraryBaseFolder.call( this, editor, {
		bannerText: strings.getKey( 'library/audio/folder' ),
		buttons: [ 'add' ]
	} );

	scope.buttons[ 'add' ].onClick( function ( e ) {

		UtilsHelper.chooseFile( function ( files ) {

			Promise.all( loader.loadFiles( files, null, 'Audio' ) ).then( results => {

				var assets = {};
				var items = {};

				for ( var result of results ) {

					var asset = editor.assets.uploadAudio( result.filename, result.buffer );
					assets[ result.filename ] = asset;

					var item = new LibraryAudioFolderItem( editor, 0, asset );
					items[ result.filename ] = item;
					item.setLoading( true );

					scope.items.push( item );
					scope.folders[ 0 ].add( item.container );
					
				}

				var formData = new FormData();
				formData.append( 'type', 'Audio' );
				formData.append( 'projectId', editor.projectId );

				for ( let i = 0; i < files.length; i++ ) {
	
					formData.append( 'file', files[i] );
	
				}
	
				api.post( '/asset/my-audio/upload', formData ).then( res => {
	
					for ( var file of res.files ) {

						assets[ file.name ].id = file.id;
						assets[ file.name ].audioId = file.audioId;
						items[ file.name ].setLoading( false );
						
					}
	
				} );

			} );
			
		}, "audio/*" );

	} );

	// scope.buttons[ 'record' ].onClick( function ( e ) {

	// 	console.log( 'record audio' );

	// } );

	assets.audios.map( folder => {

		var dom = scope.createFolder( editor, folder.id, folder.name );

		folder.items.map( function ( audio ) {

			var item = new LibraryAudioFolderItem( editor, folder.id, audio );
			scope.items.push( item );
			dom.add( item.container );

		} );

	} );

	signals.audioAssetAdded.add( function ( audio, folderId ) {

		var item = new LibraryAudioFolderItem( editor, folderId, audio );
		scope.items.push( item );

		var folder = scope.folders.find(x => x.id == folderId);
		folder.add( item.container );

	} );

	signals.moveAsset.add( function ( assetType, assetId, from, to, altKey ) {

		if ( assetType == 'Audio' && from != to ) {

			if ( altKey ) {

				var asset = editor.assets.get( assetType, 'id', assetId );
				var assetItem = scope.items.find( x => x.asset.id == assetId );

				assetItem.setLoading( true );

				api.post( '/asset/my-audio/add', { id: asset.audioId, projectId: editor.projectId } ).then( function ( audio ) {

					editor.addAsset( 'Audio', to, audio ).then( function ( asset ) {

						assetItem.setLoading( false );
						signals.audioAssetAdded.dispatch( asset, to );

					} );

				} ).catch( (err) => {

					alert( err );

				} );

			} else {

				editor.api.post( `/asset/my-audio/update/${assetId}`, { folderId: to } ).then( function () {

					editor.assets.move( assetType, assetId, from, to );

					var item = scope.items.find( x => x.asset.id == assetId );
					var index = scope.items.indexOf( item );
					item.container.delete();
					scope.items.splice( index, 1 );

					var asset = editor.assets.get( assetType, 'id', assetId );
					var newItem = new LibraryAudioFolderItem( editor, to, asset );
					scope.items.push( newItem );
					scope.folders.find( x => x.id == to ).add( newItem.container );

				} );

			}

		}

	} );

	return this;

}

LibraryAudioFolder.prototype = Object.create( LibraryBaseFolder.prototype );
LibraryAudioFolder.prototype.constructor = LibraryAudioFolder;

LibraryAudioFolder.prototype = {

	createFolder: function ( editor, id, name ) {

		var folder = new LibraryBaseFolderPanel( editor, 'Audio', id, name );
		var gallery = new UIDiv().setClass( 'AudioList' );
	
		folder.setPanel( gallery );
		this.folders.push( folder )
		this.foldersList.add( folder.container );

		editor.assets.addFolder( 'Audio', id, name );

		return folder;

	},

	createNewFolder: function ( editor ) {

		var scope = this;

		editor.api.post( '/folder/create', { type: 'audio', name: 'Untitled' } ).then( function ( folder ) {

			scope.createFolder( editor, folder.id, folder.name );

		} );

	}

};

export { LibraryAudioFolder };