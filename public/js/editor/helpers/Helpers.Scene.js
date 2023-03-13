/**
 * Scene Helper
 * @author codelegend620
 */

window.SceneHelper = {};

SceneHelper.setBackground = function ( scene, uuid, textures ) {

	if ( textures[uuid] != undefined ) {

		scene.background = textures[uuid];

	}

}

SceneHelper.addObject = function ( scene, player, srcUuid, srcTag, relative, destUuid, destTag, match, x, y, z ) {

	var srcUuidList = UtilsHelper.getObjectUuidListByTag( srcUuid, player.tags, srcTag );

	for ( var srcList of srcUuidList ) {

		for ( var srcId of srcList ) {

			var object = scene.getObjectByProperty("uuid", srcId);

			if ( relative == 'relative to scene' ) {

				var newObject = object.clone();
				newObject.position.set( UtilsHelper.parseValue(x), UtilsHelper.parseValue(y), UtilsHelper.parseValue(z) );
				newObject.visible = true;

				scene.add( newObject );
				player.addScript( ScriptHelper.generate('movement'), newObject );
				if ( newObject.userData.connection ) self.addScript( ScriptHelper.generate( 'connection', newObject ), newObject );

			} else {

				var targetUuidList = UtilsHelper.getObjectUuidListByTag( destUuid, player.tags, destTag );

				for ( var targetList of targetUuidList ) {

					for ( var targetId of targetList ) {

						var targetObject = scene.getObjectByProperty("uuid", targetId);
						var position = targetObject.position.clone();
						position.add( new THREE.Vector3( UtilsHelper.parseValue(x), UtilsHelper.parseValue(y), UtilsHelper.parseValue(z) ) );

						var newObject = object.clone();
						newObject.position.set( position.x, position.y, position.z );

						if ( match == 'match rotation' ) {

							newObject.setRotationFromEuler( targetObject.rotation );

							if ( newObject.userData.movement ) {

								newObject.userData.movement.direction.local = true;
								newObject.userData.movement.rotation.local = true;

							}

						}

						newObject.visible = true;

						scene.add( newObject );
						player.addScript( ScriptHelper.generate('movement'), newObject );
						if ( newObject.userData.connection ) self.addScript( ScriptHelper.generate( 'connection', newObject ), newObject );

					}

				}

			}

		}

	}
}

SceneHelper.rotateObject = function ( player, uuid, tag, x, y, z ) {

	var uuidList = UtilsHelper.getObjectUuidListByTag( uuid, player.tags, tag );

	for ( var list of uuidList ) {

		for ( var id of list ) {

			player.updateMovement( id, 'rotation', { x: UtilsHelper.parseValue(x), y: UtilsHelper.parseValue(y), z: UtilsHelper.parseValue(z) } );
			player.updateMovement( id, 'rotation limit', { xEnabled: "on", xMin: "-200", xMax: "200", yEnabled: "on", yMin: "-200", yMax: "200", zEnabled: "on", zMin: "-200", zMax: "200" } );

		}

	}

}

SceneHelper.removeObject = function ( scene, player, uuid, tag ) {

	var uuidList = UtilsHelper.getObjectUuidListByTag( uuid, player.tags, tag );

	for ( var list of uuidList ) {

		for ( var id of list ) {

			var object = scene.getObjectByProperty("uuid", id);

			player.removeDragControls(id);
			if ( object ) object.parent.remove( object );

		}
	}

}

SceneHelper.objectSelection = function ( scene, player, uuid, tag, condition ) {

	var uuidList = UtilsHelper.getObjectUuidListByTag( uuid, player.tags, tag );
	var result = false;
	var allResult = true;
	var anyResult = false;

	if ( uuidList.length == 0) return false;

	for ( var list of uuidList ) {

		result = false;

		for ( var id of list ) {

			var state = condition == 'cursor is over object' ? 'cursorState' : 'selectionState';
			var object = scene.getObjectByProperty("uuid", id);

			if ( object ) {

				if ( condition == 'is clicked' ) {

					result |= object.userData.clicked;
					object.userData.clicked = false;

				} else if ( condition != 'is not selected' ) {

					result |= ( object.userData[state] == condition );

				} else {

					result |= ( object.userData.selectionState == "is not selected" || object.userData.selectionState == "de-selected" );

				}

			}

		}

		allResult &= result;
		anyResult |= result;

	}

	if ( uuid != "Tag" || ( tag != "all" && tag != "any" ) ) return result;

	if ( tag == "all" ) return allResult;

	if ( tag == "any" ) return anyResult;

}

SceneHelper.objectCollision = function ( scene, player, uuid, tag, targetUuid, targetTag, condition ) {

	var getAllMeshes = function ( scene, uuid, objects ) {

		scene.children.map(x => {

			if ( x.type == "Mesh" && x.uuid != uuid ) {

				objects.push(x);

			}

			if ( x.children.length > 0 ) {

				getAllMeshes( x, uuid, objects );

			}

		});

	}

	var getBoundingBox = function ( mesh ) {

		var objectHelper = new THREE.BoxHelper(mesh, 0x00ff00);
		objectHelper.update();
		var objectBox = new THREE.Box3();
		objectBox.setFromObject(objectHelper);

		return objectBox;

	};

	var checkCollision = function ( moving, target ) {

		var movingBox = getBoundingBox( moving );
		var targetBox = getBoundingBox( target );

		return targetBox.intersectsBox( movingBox );

	}

	var collisionDetect = function ( movingUuid, targetUuid, targetTag ) {

		var moving = scene.getObjectByProperty( "uuid", movingUuid );

		if ( targetUuid == "any" ) {

			var objects = [];

			getAllMeshes( scene, movingUuid, objects );

			for ( var object of objects ) {

				if ( checkCollision( moving, object ) == true ) return true;

			}

			return false;

		} else {

			var targetUuidList = UtilsHelper.getObjectUuidListByTag( targetUuid, player.tags, targetTag );
			var result = false;
			var allResult = true;
			var anyResult = false;

			for ( var targetList of targetUuidList ) {

				for ( var targetId of targetList ) {

					var target = scene.getObjectByProperty( "uuid", targetId );
					if(target){
						result |= checkCollision( moving, target );
					}


				}

				allResult &= result;
				anyResult |= result;

			}

			if ( targetUuid != "Tag" || ( targetTag != "all" && targetTag != "any" ) ) return result;

			if ( targetTag == "all" ) return allResult;

			if ( targetTag == "any" ) return anyResult;

		}

	}

	var uuidList = UtilsHelper.getObjectUuidListByTag( uuid, player.tags, tag );
	var result = false;
	var allResult = true;
	var anyResult = false;
	var finalResult;

	for ( var list of uuidList ) {

		for ( var id of list ) {

			var t = collisionDetect( id, targetUuid, targetTag );

			if ( condition == 'is not touching' ) t = !t;

			result |= t;

		}

		allResult &= result;
		anyResult |= result;

	}

	if ( uuid != "Tag" || ( tag != "all" && tag != "any" ) ) finalResult = result;

	if ( tag == "all" ) finalResult = allResult;

	if ( tag == "any" ) finalResult = anyResult;

	if ( condition == 'has touched' ) {

		var newCollisionState = [];
		for(var i=0; i<player.collisionState.length; i++){
			if(collisionDetect(player.collisionState[i].uuid, player.collisionState[i].targetUuid, player.collisionState[i].targetTag)){
				newCollisionState.push(player.collisionState[i]);
			}
		}
		player.collisionState = newCollisionState;
		var data = { uuid, tag, targetUuid, targetTag };
		var state = player.collisionState.find( x => JSON.stringify( x ) == JSON.stringify( data ) );

		if ( !state && finalResult ) {

			player.collisionState.push( data );
			return true;

		}

		return false;

	}

	return finalResult;

}

SceneHelper.runAction = function (actions, uuid, values ) {

	var action = actions[ uuid ][ values.id ];
	var actionName = values.action;

	switch ( actionName ) {

		case 'play':
			action.paused = false;
			action.play();
			break;

		case 'pause':
			action.paused = true;
			break;

		case 'stop':
			action.stop();
			break;

		case 'loop':
			action.setLoop( THREE.LoopRepeat, Infinity );
			action.paused = false;
			action.play();
			break;

		case 'play once':
			action.setLoop( THREE.LoopOnce );
			action.paused = false;
			action.play();
			break;

		case 'speed':
			var obj = { speed: action.getEffectiveTimeScale() };
			var target = UtilsHelper.parseValue( values.value );
			var duration = UtilsHelper.parseValue( values.duration ) * 1000;

			UtilsHelper.tween( obj, 'speed', target, duration, values.easing, values.easingType, function () {
				action.setEffectiveTimeScale( obj.speed );
			} );
			break;

		case 'blend':
			var obj = { blend: action.getEffectiveWeight() };
			var target = UtilsHelper.parseValue( values.value );
			var duration = UtilsHelper.parseValue( values.duration ) * 1000;

			UtilsHelper.tween( obj, 'blend', target, duration, values.easing, values.easingType, function () {
				action.setEffectiveWeight( obj.blend );
			} );
			break;

	}

}
