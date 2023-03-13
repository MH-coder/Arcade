import { UIDiv, UIRow, UIText, UIImageButton } from '../components/ui.js';
import { ImportSceneCommand } from '../../commands/ImportSceneCommand.js';

import { ObjectLoader } from '../../utils/ObjectLoader.js';
import createExample from './Examples/addExample/addExampleModal.ts';
import isSuperAdmin from '../utils/isSuperAdmin';

function LibraryProjectItem( editor, project ) {

    var api = editor.api;
    var config = editor.config;
    var signals = editor.signals;

    let exampleData = {
		title: '',
		vimeoId: '',
		description: '',
		thumbUrl: '',
	};

    var container = new UIRow().addClass( 'ProjectItem' );
    container.dom.id = `ProjectItem-${project.id}`
    container.dom.dataset.project= JSON.stringify(project);
    // container.dom.draggable = isSuperAdmin;
    container.dom.draggable = true;
	container.dom.addEventListener('dragstart', (event) => {
		event.dataTransfer.setData('projectId', String(project.id));
		event.dataTransfer.setData('exampleData', JSON.stringify(exampleData));
        event.dataTransfer.setData('project', JSON.stringify(project));
        window.exampleProjectThumbnail = exampleData.thumbnail;
	});

    var projectName = new UIText( project.name );
    container.add( projectName);

    var buttonGroup = new UIDiv().setClass( 'ProjectButtonGroup' );
    container.add(buttonGroup);

    const settingsBtn = new UIImageButton(config.getImage('engine-ui/settings.svg'));
	isSuperAdmin && buttonGroup.add(settingsBtn);
	settingsBtn.dom.onclick = function () {
		createExample({
			data: exampleData,
			onSubmit: (data) => {
				exampleData = { ...data };
			},
		});
	};

    var launchButton = new UIImageButton( config.getImage( 'engine-ui/play-btn.svg' ) );
    launchButton.setPadding( '10px' );
    launchButton.onClick( function () {

        window.location.href = `/asset/projects/${project.id}`;

    } );
    buttonGroup.add(launchButton);

    var duplicateButton = new UIImageButton( config.getImage( 'engine-ui/duplicate-btn.svg' ) );
    duplicateButton.onClick( function () {

        api.post( '/asset/project/duplicate', { id: project.id } ).then( function ( res ) {

            if ( res.status == 'limit' ) {

                alert( 'that is a pro feature' );
                return;

            }

            signals.projectAssetAdded.dispatch( project );

		} ).catch( (err) => {

			alert( err );

		} );

    } );
    buttonGroup.add(duplicateButton);

    var importButton = new UIImageButton( config.getImage( 'engine-ui/add-btn.svg' ) );
    importButton.onClick( function () {

        if ( editor.projectId != project.id ) {

            api.get( `/asset/project/state_url?id=${project.id}` ).then( json => {

                api.load( json.url ).then( state => {

                    var loader = new ObjectLoader( editor.assets );
                    loader.parse( state.scene, function ( result ) {

                        editor.execute( new ImportSceneCommand( editor, result ) );

                    } );

                } );

            } );

        }

    } );
    buttonGroup.add(importButton);

    signals.projectItemUpdated.add(projectData=>{
        if (projectData.id !== project.id) return;
        for (let key in projectData){
            project[key]  = projectData[key]
        }
    })

    var deleteButton = new UIImageButton( config.getImage( 'engine-ui/close-delete-btn.svg' ) );
    deleteButton.onClick( function () {

        if ( editor.projectId == project.id ) {

            alert( 'can not delete current project' );
            return;

        }

        if ( confirm( 'are you sure to delete this project?' ) ) {

            api.post( '/asset/project/delete', { id: project.id } ).then( function () {

                container.delete();
    
            } ).catch( (err) => {
    
                alert( err );
    
            } );

        }

    } );
    buttonGroup.add(deleteButton);

    signals.titleChanged.add( function ( value ) {

        if (value.id === project.id) {
            projectName.setValue( value.name );
        }

    });

    signals.titleChanged.add(function (value) {
		if (value.id === project.id) {
			project.name = value.name;
		}
	});

    return container;

}

export { LibraryProjectItem };
