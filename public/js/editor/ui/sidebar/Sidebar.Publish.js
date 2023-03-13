/**
 * @author codelegend620
 */

import { UIRow, UIText, UIDiv, UIInput, UIButton } from '../components/ui.js';
import { SidebarPublishItem } from './Sidebar.Publish.Item.js';
import * as THREE from '../../libs/three.module.js';
import { zipSync, strToU8 } from '../../../lib/app/fflate.module.js';



function save( blob, filename ) {
	var link = document.createElement( 'a' );

	if ( link.href ) {

		URL.revokeObjectURL( link.href );

	}

	link.href = URL.createObjectURL( blob );
	link.download = filename || 'data.json';
	link.dispatchEvent( new MouseEvent( 'click' ) );

}


function SidebarPublish( editor ) {
	var api = editor.api;
	var strings = editor.strings;
	var signals = editor.signals;
	var config = editor.config;

	var container = new UIDiv().setId( 'publish-panel' );

    var newPublishLocationRow = new UIRow();
    newPublishLocationRow.addClass( 'ProjectItem' );
    newPublishLocationRow.addClass( 'HasInput' );
    container.add( newPublishLocationRow );

    var newPublishLocationInput = new UIInput( '', createProject );
    newPublishLocationInput.dom.placeholder = strings.getKey( 'sidebar/publish/new' );
    newPublishLocationRow.add( newPublishLocationInput );

    var publishLocationCreateButton = new UIButton( strings.getKey( 'sidebar/publish/create' ) ).setClass('ProjectButton');

	function createProject() {
		var title = newPublishLocationInput.getValue();

		newPublishLocationInput.setValue('');
        if ( !title ) {

            alert( 'publish location can not be empty.' );
            return;

        }

        api.post( '/publish/create', { title } ).then( res => {

			if ( res.status == 'limit' ) {

				alert( 'this is a pro feature.' );
				return;

			}
			if(res.status === 'error' && res.msg === 'Username doesnt exists'){
				let username = prompt("To publish apps you first have to create a username. Your username will be part of the link to your app.");
				if(username){
					api.post( '/account/username', { 'profile.username': username } ).then( res => {
						console.log({res});
						if (res.status == "error") {
							alert(res.msg)
						  }
					});
				}
				return;
			}
			if ( res.status == 'exists' ) {

				alert( 'the name is already taken.' );
				return;

			}

			publishLocationRows.prepend( new SidebarPublishItem( editor, res.publish ) );

        } );
	}
    publishLocationCreateButton.onClick( function () {
		createProject()
    } );
	newPublishLocationRow.add( publishLocationCreateButton );

	var publishLocationRows = new UIDiv();
    container.add( publishLocationRows );

    api.get( '/publish/list' ).then( publishes => {

        publishes.map( publish => {

            publishLocationRows.add( new SidebarPublishItem( editor, publish ) );

        } );

    } ).catch( err => {

		console.log( err );

	} );

	var publishToDesktopRow = new UIRow();
	publishToDesktopRow.add( new UIText( strings.getKey( 'sidebar/publish/desktop' ) ) );

	container.add( publishToDesktopRow );

	var downloadWebFilesRow = new UIRow();
	downloadWebFilesRow.add( new UIText( strings.getKey( 'sidebar/publish/download' ) ) );


	api.post("/asset/project/allowDownload", {
			test: 1
	}).then(res => {
			if (res.status == 'limit') {
					window.allowDownload = false;
			} else {
				window.allowDownload = true;
			}
	}).catch(err => {
			window.allowDownload = false;
			console.log(err);
	});
	//add click event for download
	downloadWebFilesRow.onClick(function () {
				if (!window.allowDownload) {
					$('#pro-popup').fadeIn();
					return;

				}else{
					api.post("/asset/project/download", { projectId: editor.projectId })
						.then(res => {})
						.catch(err => {});

						var toZip = {};
						var output = editor.toJSON();
						//output.metadata.type = 'App';
						delete output.history;

						output = JSON.stringify(output);
						//output = JSON.stringify(output, null, '\t');
						//output = output.replace(/[\n\t]+([\d\.e\-\[\]]+)/g, '$1');

						toZip['app.json'] = strToU8(output);


						//var title = "tiltle1";
						var title = config.getKey('project/name');


						var manager = new THREE.LoadingManager(function () {

								var zipped = zipSync(toZip, {
										level: 9
								});

								var blob = new Blob([zipped.buffer], {
										type: 'application/zip'
								});

								save(blob, (title !== '' ? title : 'untitled') + '.zip');

						});

						var loader = new THREE.FileLoader(manager);
						loader.load('/js/download/index.html', function (content) {

								content = content.replace('<!-- title -->', title);

								toZip['index.html'] = strToU8(content);

						});


						loader.load('/js/download/app.js', function (content) {

							toZip['js/app.js'] = strToU8(content);

					});
					loader.load('/js/editor/libs/three.module.js', function (content) {

							toZip['js/three.module.js'] = strToU8(content);

					});

					loader.load('/js/app/js/vendor.min.js', function (content) {

						toZip['js/vendor.min.js'] = strToU8(content);

					});

					loader.load('/js/webapp.min.js', function (content) {

						toZip['js/webapp.min.js'] = strToU8(content);

					});

					loader.load('/js/download/VRButton.js', function (content) {

							toZip['js/VRButton.js'] = strToU8(content);

					});
					
					loader.load('/js/editor/libs/loading-bar/loading-bar.min.css', function (content) {

							toZip['css/loading-bar.min.css'] = strToU8(content);

					});
					loader.load('/css/app.css', function (content) {

							toZip['css/app.css'] = strToU8(content);

					});
				}
	});

	container.add( downloadWebFilesRow );

	return container;

};

export { SidebarPublish };
