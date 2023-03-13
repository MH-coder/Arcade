/**
 * Utils Helper
 * @author codelegend620
 */

const UtilsHelper = {};
window.UtilsHelper = UtilsHelper;

UtilsHelper.toCamelCase = function ( sentenceCase ) {
	var out = "";
	sentenceCase.split(" ").forEach(function(el, idx) {
		var add = el.replace(/\W/g, '').toLowerCase();
		out += idx === 0 ? add : add[0].toUpperCase() + add.slice(1);
	});
	return out;
}

UtilsHelper.getMiliseconds = function ( mm, ss, mss ) {
	mm = UtilsHelper.parseValue(mm);
	ss = UtilsHelper.parseValue(ss);
	mss = UtilsHelper.parseValue(mss);
	return parseInt(mm) * 60 * 1000 + parseInt(ss) * 1000 + parseInt(mss) * 10;
}

UtilsHelper.getRandom = function ( min, max ) {
	return Math.random() * (max - min) + min;
}

UtilsHelper.isMathOperator = function ( o ) {
	return o == "+" || o == "-" || o == "*" || o == "/";
}

UtilsHelper.parseValue = function ( op ) {
	if (op == undefined) return 0;
	if (typeof op === "number") return op;
	var numbers = [];
	var segments = op.split(",");
	for (var i = 0; i < segments.length; i++) {
		var range = segments[i].split("_");
		if (range.length == 2) {
			var min = parseFloat(range[0]);
			var max = parseFloat(range[1]);
			if (Number.isNaN(min) || Number.isNaN(max)) return undefined;
			numbers.push(Math.round(UtilsHelper.getRandom(min, max)));
		} else {
			var number = parseFloat(segments[i]);
			if (!Number.isNaN(number)) numbers.push(number);
			else return undefined;
		}
	}
	var index = Math.floor(UtilsHelper.getRandom(0, numbers.length));
	return numbers[index];
}

/** @returns {op:"Math operation like *,/,-,>, etc., value: Math value} */
UtilsHelper.parseOperation = function ( cond ) {
	var res = {
		op: undefined,
		val: undefined
	};

	if (cond == "is equal to") res.op = "==";
	else if (cond == "is greater than") res.op = ">";
	else if (cond == "is less than") res.op = "<";
	else if (cond == "on") res.op = " == true";
	else if (cond == "off") res.op = " == false";
	else if (
		cond.startsWith('"') &&
		cond.endsWith('"') &&
		UtilsHelper.isMathOperator(cond[1])
	) {
		res.op = cond[1];
		res.val = UtilsHelper.parseValue(cond.substring(2, cond.length - 1));
	} else {
		var val = UtilsHelper.parseValue(cond);
		if (val != undefined) {
			res.op = "none";
			res.val = val;
		}
	}

	return res;
}

UtilsHelper.tween = function ( object, attr, delta, duration, easingName, easingType, onUpdate ) {
	var target = {};
	target[attr] = delta;

	if ( Number.isNaN( duration ) ) duration = 0;

	var easing = TWEEN.Easing.Linear.None;
	if ( easingName && easingType ) easing = TWEEN.Easing[easingName][easingType];

	new TWEEN.Tween( object )
		.to(target, duration)
		.easing(easing)
		.onUpdate(function() {
			if ( onUpdate ) {
				onUpdate( object[ attr ] );
			}
		} )
		.start();
}

UtilsHelper.tweenVector = function ( object, deltaVector, duration, easingName, easingType, onUpdate ) {

	if ( Number.isNaN( duration ) ) duration = 0;

	var easing = TWEEN.Easing.Linear.None;
	if ( easingName && easingType ) easing = TWEEN.Easing[easingName][easingType];

	new TWEEN.Tween( object )
		.to(deltaVector, duration)
		.easing(easing)
		.onUpdate(function() {
			if ( onUpdate ) {
				onUpdate( object[ attr ] );
			}
		} )
		.start();
}

UtilsHelper.getObjectsDropdownList = function ( parent, json, types ) {


    parent.children.map(x => {
		const isAxesHelperEngineTool =  ()=> x.name ==="AxesHelperEngineTool";
		
        if ( types == undefined || types.includes( x.type ) ) {
					var isVoxel = false;
		      if(x.userData && x.userData.isVoxel){
		        isVoxel = true;
		      }
		      if(!isVoxel && !isAxesHelperEngineTool()){
						json.push( { type: x.type, uuid: x.uuid, name: x.name } );
				}

		}
        if ( x.children.length > 0 ) {

			this.getObjectsDropdownList( x, json, types );

		}

	});

	return json;

}

UtilsHelper.getAttributeByName = function ( attributes, name ) {

	return attributes.find( a => a.name == name );

}

UtilsHelper.getObjectUuidListByTag = function ( uuid, tags, tag ) {

	var uuidList = [];

	if ( uuid == 'Tag' ) {

		if ( tag == 'all' ) {

			for ( var t in tags ) {

				uuidList.push( tags[t] == undefined ? [] : tags[t] );

			}

		} else {

			uuidList.push( tags[tag] );

		}

	} else {

		uuidList.push( [ uuid ] );

	}

	return uuidList;

}

UtilsHelper.chooseFile = function ( callback, filter ) {

	var fileInput = document.createElement("input");
	fileInput.multiple = true;
	fileInput.type = "file";
	if ( filter ) {

		fileInput.accept = filter;

	}
	fileInput.addEventListener("change", function () {

		callback( fileInput.files);

	} );

	fileInput.click();

}

UtilsHelper.chooseSingleFile = function ( callback, filter ) {

	var fileInput = document.createElement("input");
	fileInput.multiple = false;
	fileInput.type = "file";
	if ( filter ) {

		fileInput.accept = filter;

	}
	fileInput.addEventListener("change", function () {

		callback( fileInput.files);

	} );

	fileInput.click();

}

UtilsHelper.getDurationString = function ( seconds ) {

	mm = Math.floor(seconds / 60);
	ss = Math.floor(seconds % 60);
	mss = Math.round( ( seconds - Math.floor( seconds ) ) * 100 );

	return ("0" + mm).slice(-2) + ":" + ("0" + ss).slice(-2) + ":" + ("0" + mss).slice(-2);

}


UtilsHelper.lookUp = function ( object, key, value, result ) {

	if ( Array.isArray( object ) ) {

		for ( var elem of object ) {

			UtilsHelper.lookUp( elem, key, value, result );

		}

	} else {

		if ( object[key] == value ) {

			result.push( object );

		}

		for ( var k in object ) {

			if ( object[k] && ( Array.isArray( object[k] ) || object[k].constructor.name == "Object" ) ) {

				UtilsHelper.lookUp( object[k], key, value, result );

			}

		}

	}
}
// export default UtilsHelper;