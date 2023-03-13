import { UIDiv, UIRow } from '../components/ui.js';
import { UIGrid } from '../components/ui.openstudio.js';
import { ParticleEmitter } from '../../objects/particle/ParticleEmitter.js';
import { AddObjectCommand } from '../../commands/AddObjectCommand.js';
import { VoxelGroup } from '../../objects/voxel/VoxelGroup.js';

function LibraryToolWidget( editor ) {

	var config = editor.config;
	var signals = editor.signals;
	var strings = editor.strings;

	var container = new UIDiv();

	var category = new UIRow();
	category.setTextContent( strings.getKey( 'library/tools/widgets' ) );
	category.setBackgroundColor( 'rgba(49, 55, 75, 0.26)' );

	var grid = new UIGrid();
	var widgets = strings.getKey( 'library/tools/widgets/objects' );
	var gridItems = [];

	widgets.map( widget => {

		gridItems.push( {
			name: widget,
			value: widget
		} );

	} );

	grid.setItems( gridItems );
	grid.setItemClickedHandler( handleClick );

	function handleClick ( id ) {

		switch ( id ) {

/*			case '2D Box':

				var voxelGroup = new VoxelGroup( 32 );

				for ( let y = 0; y < 2; y++ ) {

					for ( let z = 0; z < 2; z++ ) {

						for ( let x = 0; x < 3; x++ ) {

							voxelGroup.setVoxel( x, y, z, 1 );

						}

					}

				}

				voxelGroup.updateGeometry();

				editor.execute( new AddObjectCommand( editor, voxelGroup ) );

			break;

			case 'video':
				break;

			case 'audio':
				break;
*/
			case 'particle':

				var particle = new ParticleEmitter( editor.assets );
				particle.textureId = 'defaultParticleTexture';
				particle.reload();

				editor.execute( new AddObjectCommand( editor, particle ) );

				break;
			
		}

	}

	container.add( category );
	container.add( grid );

	return container;

}

export { LibraryToolWidget };