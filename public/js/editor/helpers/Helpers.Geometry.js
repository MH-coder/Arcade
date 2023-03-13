/**
 * Geometry Helper
 * @author codelegend620
 */

window.GeometryHelper = {};

GeometryHelper.set = function ( object, param, value, duration, easingName, easingType ) {

	var parameters = object.geometry.parameters;
	var type = object.geometry.type;
	var key = UtilsHelper.toCamelCase(param);
	var target = {};

	var textParams = ["open ended", "closed", "curve type"];
	var degParams = [
		"theta start",
		"theta length",
		"phi start",
		"phi length",
		"arc"
	];

	if ( textParams.includes( param ) ) {
		target[key] = value == "on" ? true : value == "off" ? false : !parameters[key];
	} else if (degParams.includes(param)) {
		target[key] = value * THREE.Math.DEG2RAD;
	} else {
		target[key] = value;
	}

	if (Number.isNaN(duration)) duration = 0;

	var easing = TWEEN.Easing.Linear.None;
	if ( easingName && easingType ) {
		easing = TWEEN.Easing[easingName][easingType];
	}
	
	if ( object.type == 'TextMesh' ) {

		if ( param == 'text' ) {

			object.text = value;
			object.updateGeometry();

		} else {

			new TWEEN.Tween(object)
				.to(target, duration)
				.easing(easing)
				.onUpdate(function () {
					object.updateGeometry();
				})
				.start();

		}

		return;

	} else if (param === "open ended"){
		parameters.openEnded = target[key];
	}



	var effectiveGeometryType = type.replace(/BufferGeometry$/, 'Geometry');

	new TWEEN.Tween(parameters)
		.to(target, duration)
		.easing(easing)
		.onUpdate(function() {
			object.geometry.dispose();
			switch (effectiveGeometryType) {
				case "BoxGeometry":
					object.geometry = new THREE.BoxBufferGeometry(
						parameters.width,
						parameters.height,
						parameters.depth,
						parameters.widthSegments,
						parameters.heightSegments,
						parameters.depthSegments
					);
					break;
				case "CircleGeometry":
					object.geometry = new THREE.CircleBufferGeometry(
						parameters.radius,
						parameters.segments,
						parameters.thetaStart,
						parameters.thetaLength
					);
					break;
				case "CylinderGeometry":
					object.geometry = new THREE.CylinderBufferGeometry(
						parameters.radiusTop,
						parameters.radiusBottom,
						parameters.height,
						parameters.radialSegments,
						parameters.heightSegments,
						parameters.openEnded
					);
					break;
				case "DodecahedronGeometry":
				case "IcosahedronGeometry":
				case "OctahedronGeometry":
				case "TetrahedronGeometry":
					object.geometry = new THREE[type](
						parameters.radius,
						parseInt(parameters.detail)
					);
					break;
				case "LatheGeometry":
					object.geometry = new THREE.LatheBufferGeometry(
						parameters.points,
						parameters.segments,
						parameters.phiStart,
						parameters.phiLength
					);
					break;
				case "PlaneGeometry":
					object.geometry = new THREE.PlaneBufferGeometry(
						parameters.width,
						parameters.height,
						parameters.widthSegments,
						parameters.heightSegments
					);
					break;
				case "RingGeometry":
					object.geometry = new THREE.RingBufferGeometry(
						parameters.innerRadius,
						parameters.outerRadius,
						parseInt(parameters.thetaSegments),
						parseInt(parameters.phiSegments),
						parameters.thetaStart,
						parameters.thetaLength
					);
					break;
				case "SphereGeometry":
					object.geometry = new THREE.SphereBufferGeometry(
						parameters.radius,
						parameters.widthSegments,
						parameters.heightSegments,
						parameters.phiStart,
						parameters.phiLength,
						parameters.thetaStart,
						parameters.thetaLength
					);
					break;
				case "TorusGeometry":
					object.geometry = new THREE.TorusBufferGeometry(
						parameters.radius,
						parameters.tube,
						parameters.radialSegments,
						parameters.tubularSegments,
						parameters.arc
					);
					break;
				case "TorusKnotGeometry":
					object.geometry = new THREE.TorusKnotBufferGeometry(
						parameters.radius,
						parameters.tube,
						parameters.tubularSegments,
						parameters.radialSegments,
						parameters.p,
						parameters.q
					);
					break;
				case "TubeGeometry":
					object.geometry = new THREE.TubeBufferGeometry(
						new THREE.CatmullRomCurve3(
							parameters.path.points,
							parameters.closed,
							parameters.path.curveType,
							parameters.path.tension
						),
						parameters.tubularSegments,
						parameters.radius,
						parameters.radialSegments,
						parameters.closed
					);
					break;
			}
			object.geometry.computeBoundingSphere();
		})
		.start();
}