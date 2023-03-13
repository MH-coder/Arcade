/**
 * Material Helper
 * @author codelegend620
 */

const { default: isDefined, capitalizeFirstLetter } = require("../utils");

window.MaterialHelper = {};

const MaterialHelper = window.MaterialHelper;

MaterialHelper.get = function ( object, slot ) {

	var material = object.material;

	if ( Array.isArray( material ) ) {

		material = material[ slot ];

	}

	return material;

}

MaterialHelper.setColor = function ( object, attributeName, value, slot) {

	var material = this.get(object, slot);
	material[attributeName].setHex(value);

}

MaterialHelper.setValue = function ( object, attributeName, value, slot) {

	var material = this.get(object, slot);
	// console.log({material, attributeName, value});
	// console.log(material[attributeName]);
	material[attributeName] = value;
	// console.log(material[attributeName]);

	material.needsUpdate = true;

}

MaterialHelper.setMap = function ( object, attributeName, value, slot) {
	if (attributeName==="envMap" && value){
		value.mapping = THREE.EquirectangularReflectionMapping;
	}

	var material = this.get(object, slot);
	material[attributeName] = value;
	material.needsUpdate = true;
}
/**
 *  set enable or disable map <br/>
 * 
 *  object, mapName, value - on/ off/ toggle, slot
 *  */

MaterialHelper.toggleMapValue = function (object, mapName, value, slot) {

	const mat = MaterialHelper.get(object, slot);

	const existingToggleValue = MaterialHelper.isMapEnabled(object, mapName, slot);

	let newToggleValue = existingToggleValue;

	switch (value) {
		case 'on':
			newToggleValue=true;
			break;
		case 'off':
			newToggleValue = false;
			break;
		case 'toggle':
			newToggleValue = !existingToggleValue;
			break;
		default:
			break;
	}

	mat.userData[mapName+"Enabled"]= newToggleValue;
}

/** ojbect, mapName, slot */
MaterialHelper.isMapEnabled = function (object, mapName, slot){
	let mat = MaterialHelper.get(object, slot);
	
	let existingToggleValue = isDefined(mat.userData[mapName+"Enabled"])? mat.userData[mapName+"Enabled"]: true;

	return existingToggleValue;
}

MaterialHelper.getCurrentOrStoredMap = function(object, mapName, slot){
	const mat = MaterialHelper.get(object, slot);
	return mat[mapName] || mat.userData['last' + capitalizeFirstLetter(mapName)]
}

MaterialHelper.storeMap = function (  object, attributeName, value, slot){

	const mat = MaterialHelper.get(object, slot);

	mat.userData['last'+ capitalizeFirstLetter(attributeName)] = value;

}

MaterialHelper.updateMapBasedOnToggleValue = function (object,mapName, slot) {
	const isMapEnabled = MaterialHelper.isMapEnabled(object, mapName, slot);

	let map = MaterialHelper.getCurrentOrStoredMap(object,mapName, slot);

	if (isMapEnabled ){
		MaterialHelper.setMap(object, mapName, map, slot);
	} else {
		if (map){
			MaterialHelper.storeMap(object, mapName, map, slot);
		}
		MaterialHelper.setMap(object, mapName, null, slot);
		
	}

}


MaterialHelper.setVector = function ( object, attributeName, value, slot) {

	var material = this.get(object, slot);
	material[attributeName].fromArray( value );
	material.needsUpdate = true;

}

export default MaterialHelper;