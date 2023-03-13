import { UIGallery } from "../components/ui.openstudio.js";
import { LibraryBaseFolder } from './Library.Base.Folder.js';
import { LibraryBaseFolderPanel } from './Library.Base.Folder.Panel.js';
import { LibraryVideoFolderItem } from './Library.Video.Folder.Item.js';

function LibraryVideoFolder( editor ) {

	var scope = this;
	var api = editor.api;
    var assets = editor.assets;
    var strings = editor.strings;
    var signals = editor.signals;

	LibraryBaseFolder.call( this, editor, {
		bannerText: strings.getKey( 'library/videos/folder' ),
		buttons: [ 'add' ]
	} );

	scope.buttons[ 'add' ].onClick( function ( e ) {

		UtilsHelper.chooseFile( function ( files ) {

			var assets = {};
			var items = {};

			for ( var file of files ) {
				var modifiedName = file.name.split(".").slice(0, -1).join(".");
				var asset = editor.assets.uploadVideo( file.name, URL.createObjectURL( file ), modifiedName );
				assets[ file.name ] = asset;

				var item = new LibraryVideoFolderItem( editor, 0, asset );
				item.setLoading( true );
				items[ file.name ] = item;

				scope.items.push( item );
				scope.folders[ 0 ].add( item.container );

			}

			var formData = new FormData();
			formData.append( 'type', 'Video' );
			formData.append( 'projectId', editor.projectId );

			for ( let i = 0; i < files.length; i++ ) {

				formData.append( 'file', files[i] );

			}

			api.post( '/asset/my-video/upload', formData ).then( res => {

				for ( var file of res.files ) {

					assets[ file.name ].id = file.id;
					assets[ file.name ].videoId = file.videoId;
					items[ file.name ].setLoading( false );
					
				}

			} );

		}, "video/*" );

	} );

	// scope.buttons[ 'record' ].onClick( function ( e ) {

	// 	console.log( 'record video' );

	// } );

	assets.videos.map( function ( folder ) {

		var dom = scope.createFolder( editor, folder.id, folder.name );

		folder.items.map( function ( video ) {

			var item = new LibraryVideoFolderItem( editor, folder.id, video );
			scope.items.push( item );
			dom.add( item.container );

		} );

	} );

	signals.videoAssetAdded.add( function ( asset, folderId ) {

		var item = new LibraryVideoFolderItem( editor, folderId, asset );
		scope.items.push( item );

		var folder = scope.folders.find(x => x.id == folderId);
		folder.add( item.container );

	} );

	signals.moveAsset.add( function ( assetType, assetId, from, to, altKey ) {

		if ( assetType == 'Video' && from != to ) {

			if ( altKey ) {

				var asset = editor.assets.get( assetType, 'id', assetId );
				var assetItem = scope.items.find( x => x.asset.id == assetId );

				assetItem.setLoading( true );

				api.post( '/asset/my-video/add', { id: asset.videoId, projectId: editor.projectId } ).then( function ( video ) {

					editor.addAsset( 'Video', to, video ).then( function ( asset ) {

						assetItem.setLoading( false );
						signals.videoAssetAdded.dispatch( asset, to );

					} );

				} ).catch( (err) => {

					alert( err );

				} );

			} else {

				editor.api.post( `/asset/my-video/update/${assetId}`, { folderId: to } ).then( function () {

					editor.assets.move( assetType, assetId, from, to );

					var item = scope.items.find( x => x.asset.id == assetId );
					var index = scope.items.indexOf( item );
					item.container.delete();
					scope.items.splice( index, 1 );

					var asset = editor.assets.get( assetType, 'id', assetId );
					var newItem = new LibraryVideoFolderItem( editor, to, asset );
					scope.items.push( newItem );
					scope.folders.find( x => x.id == to ).add( newItem.container );

				} );

			}

		}

	} );

	return this;

};

LibraryVideoFolder.prototype = Object.create( LibraryBaseFolder.prototype );
LibraryVideoFolder.prototype.constructor = LibraryVideoFolder;

LibraryVideoFolder.prototype = {

	createFolder: function ( editor, id, name ) {

		var folder = new LibraryBaseFolderPanel( editor, 'Video', id, name );
		var gallery = new UIGallery( 1 );
		gallery.addClass( 'ImageVideoGallery' );

		folder.setPanel( gallery );
		this.folders.push( folder )
		this.foldersList.add( folder.container );

		editor.assets.addFolder( 'Video', id, name );

		return folder;

	},

	createNewFolder: function ( editor ) {

		var scope = this;

		editor.api.post( '/folder/create', { type: 'video', name: 'Untitled' } ).then( function ( folder ) {

			scope.createFolder( editor, folder.id, folder.name );

		} );

	}

};

export { LibraryVideoFolder };
