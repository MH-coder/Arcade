import { UIPanel, UIText, UIRow } from './components/ui.js';

function ViewportInfo( editor ) {

	var signals = editor.signals;
	var strings = editor.strings;

	var container = new UIPanel();

	var objectsRow = new UIRow();
	var objectsText = new UIText( '0' );
	objectsRow.add( new UIText( strings.getKey( 'viewport/info/objects' ) ) );
	objectsRow.add( objectsText );
	
	var verticesRow = new UIRow();
	var verticesText = new UIText( '0' );
	verticesRow.add( new UIText( strings.getKey( 'viewport/info/vertices' ) ) );
	verticesRow.add( verticesText );
	
	var trianglesRow = new UIRow();
	var trianglesText = new UIText( '0' );
	trianglesRow.add( new UIText( strings.getKey( 'viewport/info/triangles' ) ) );
	trianglesRow.add( trianglesText );
	
	var frametimeRow = new UIRow();
	var frametimeText = new UIText( '0' );
	frametimeRow.add( new UIText( strings.getKey( 'viewport/info/frametime' ) ) );
	frametimeRow.add( frametimeText );

	container.add( objectsRow, verticesRow, trianglesRow, frametimeRow );

	signals.objectAdded.add( update );
	signals.objectRemoved.add( update );
	signals.geometryChanged.add( update );

	//

	function update() {

		var scene = editor.scene;

		var objects = 0, vertices = 0, triangles = 0;

		for ( var i = 0, l = scene.children.length; i < l; i ++ ) {

			var object = scene.children[ i ];

			object.traverseVisible( function ( object ) {

				objects ++;

				if ( object.isMesh ) {

					var geometry = object.geometry;

					if ( geometry.isGeometry ) {

						vertices += geometry.vertices.length;
						triangles += geometry.faces.length;

					} else if ( geometry.isBufferGeometry ) {

						vertices += geometry.attributes.position.count;

						if ( geometry.index !== null ) {

							triangles += geometry.index.count / 3;

						} else {

							triangles += geometry.attributes.position.count / 3;

						}

					}

				}

			} );

		}

		objectsText.setValue( objects.format() );
		verticesText.setValue( vertices.format() );
		trianglesText.setValue( triangles.format() );

	}

	signals.sceneRendered.add( updateFrametime );

	function updateFrametime( frametime ) {

		frametimeText.setValue( Number( frametime ).toFixed( 2 ) + " ms" );

	}

	return container;

}

export { ViewportInfo };
