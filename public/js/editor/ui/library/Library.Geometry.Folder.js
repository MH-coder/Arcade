import { UIGrid } from "../components/ui.openstudio.js";
import { LibraryBaseFolder } from './Library.Base.Folder.js';
import { LibraryBaseFolderPanel } from './Library.Base.Folder.Panel.js';
import { LibraryGeometryFolderItem } from './Library.Geometry.Folder.Item.js';

function LibraryGeometryFolder( editor ) {

	var scope = this;
	var api = editor.api;
    var assets = editor.assets;
	var strings = editor.strings;
    var signals = editor.signals;
	var loader = editor.loader;
	

	LibraryBaseFolder.call( this, editor, {
		bannerText: strings.getKey( 'library/geometry/folder' ),
		buttons: [ 'add' ]
	} );

	if (!editor.libraryGeometryFolderRef) {
		editor['libraryGeometryFolderRef'] = null;
	}
	editor.libraryGeometryFolderRef = scope;
	
	scope.buttons[ 'add' ].onClick( function () {

		UtilsHelper.chooseFile( function ( files ) {
					
			Promise.all( loader.loadFiles( files, null, 'Geometry' ) ).then( function ( results ) {
				
				var assets = {};
				var items = {};

				for ( var result of results ) {
					var name = result.filename.split('.').slice(0, -1).join('.');
					var ext = result.filename.split( '.' ).pop().toLowerCase();
					var asset = editor.assets.uploadGeometry( name, ext, result.object );

					assets[result.filename] = asset;

					var item = new LibraryGeometryFolderItem( editor, 0, asset );
					item.setLoading( true );
					items[result.filename] = item;

					scope.items.push( item );
					scope.folders[ 0 ].add( item.container );
					
				}

				var formData = new FormData();
				formData.append( 'type', 'Geometry' );
				formData.append( 'projectId', editor.projectId );

				for ( let i = 0; i < files.length; i++ ) {
	
					formData.append( 'file', files[i] );
	
				}
	
				api.post( '/asset/my-geometry/upload', formData ).then( res => {
					for ( var file of res.files ) {
						assets[ file.name ].id = file.id;
		              	assets[ file.name ].geometryId = file.geometryId;
			            items[ file.name ].setLoading( false );					
					}	
				} );

			} );

		}, ".obj, .dae, .gltf, .glb, .awd, .ply, .vtk, .vtp, .wrl, .vrml, .fbx, .pcd, .json, .3ds, .stl, .svg, .x, .js, .zip" );

	} );

	assets.geometries.map( function ( folder ) {

		var dom = scope.createFolder( editor, folder.id, folder.name );

		folder.items.map( function ( geometry ) {

			var item = new LibraryGeometryFolderItem( editor, folder.id, geometry );
			scope.items.push( item );
			dom.add( item.container );

		} );

	} );

	signals.geometryAssetAdded.add( function ( geometry, folderId ) {

		var item = new LibraryGeometryFolderItem( editor, folderId, geometry );
		scope.items.push( item );

		var folder = scope.folders.find(x => x.id == folderId);
		folder.add( item.container );

	} );

	signals.moveAsset.add( function ( assetType, assetId, from, to, altKey ) {

		if ( assetType == 'Geometry' && from != to ) {

			if ( altKey ) {

				var asset = editor.assets.get( assetType, 'id', assetId );
				var assetItem = scope.items.find( x => x.asset.id == assetId );

				assetItem.setLoading( true );

				api.post( '/asset/my-geometry/add', { id: asset.geometryId, projectId: editor.projectId } ).then( function ( geometry ) {

					editor.addAsset( 'Geometry', to, geometry ).then( function ( asset ) {

						assetItem.setLoading( false );
						signals.geometryAssetAdded.dispatch( asset, to );

					} );

				} ).catch( (err) => {

					alert( err );

				} );

			} else {

				editor.api.post( `/asset/my-geometry/update/${assetId}`, { folderId: to } ).then( function () {

					editor.assets.move( assetType, assetId, from, to );

					var item = scope.items.find( x => x.asset.id == assetId );
					var index = scope.items.indexOf( item );
					item.container.delete();
					scope.items.splice( index, 1 );

					var asset = editor.assets.get( assetType, 'id', assetId );
					var newItem = new LibraryGeometryFolderItem( editor, to, asset );
					scope.items.push( newItem );
					scope.folders.find( x => x.id == to ).add( newItem.container );

				} );

			}

		}

	} );

	return this;

}

LibraryGeometryFolder.prototype = Object.create( LibraryBaseFolder.prototype );
LibraryGeometryFolder.prototype.constructor = LibraryGeometryFolder;

LibraryGeometryFolder.prototype = {

	createFolder: function ( editor, id, name ) {

		var folder = new LibraryBaseFolderPanel( editor, 'Geometry', id, name );
		var grid = new UIGrid().addClass( 'Folder');
	
		folder.setPanel( grid );
		this.folders.push( folder )
		this.foldersList.add( folder.container );

		editor.assets.addFolder( 'Geometry', id, name );

		return folder;

	},

	createNewFolder: function ( editor ) {

		var scope = this;

		editor.api.post( '/folder/create', { type: 'geometry', name: 'Untitled' } ).then( function ( folder ) {

			scope.createFolder( editor, folder.id, folder.name );

		} );

	}

};

export { LibraryGeometryFolder };