import { BufferGeometry, ExtrudeBufferGeometry, ShapeBufferGeometry, Object3D, Mesh } from "../../libs/three.module.js";

class TextMesh extends Mesh {
	constructor(text, material, fontAsset, size, extruded, curveSegments, thickness, bevel, bevelThickness, bevelSize) {
		super(TextMesh.EMPTY_GEOMETRY, material);

		this.name = "text";
		this.type = "TextMesh";

		this.fontAsset = fontAsset !== undefined ? fontAsset : null;
		this.extruded = extruded !== undefined ? extruded : true;
		this.size = size !== undefined ? size : 1;
		this.thickness = thickness !== undefined ? thickness : 0.5;
		this.curveSegments = curveSegments !== undefined ? curveSegments : 15;
		this.bevel = bevel !== undefined ? bevel : false;
		this.bevelThickness = bevelThickness !== undefined ? bevelThickness : 0.1;
		this.bevelSize = bevelSize !== undefined ? bevelSize : 0.05;
		var text = text !== undefined ? text : "text";

		Object.defineProperties(this, {
			text: {
				get: function () {

					return text;

				},
				set: function (value) {

					if (text !== value) {

						text = value;
						this.updateGeometry();

					}

				}
			}
		});

		this.updateGeometry();

	}
	setFont(fontAsset) {

		if (this.fontAsset.id !== fontAsset.id) {

			this.fontAsset = fontAsset;
			this.updateGeometry();

		}

	}
	setText(text) {

		this.text = text;

	}
	updateGeometry() {

		if (this.fontAsset !== null) {

			var font = this.fontAsset.font;

			if (this.geometry !== undefined) {

				this.geometry.dispose();

			}

			if (font.isFont !== true) {

				this.geometry = TextMesh.EMPTY_GEOMETRY;
				return;

			}

			var shapes = font.generateShapes(this.text, this.size);

			if (this.extruded) {

				this.geometry = new ExtrudeBufferGeometry(shapes, {
					curveSegments: this.curveSegments,
					depth: this.thickness,
					bevelEnabled: this.bevel,
					bevelSize: this.bevelSize,
					bevelThickness: this.bevelThickness
				});
				this.geometry.computeVertexNormals();

			} else {

				this.geometry = new ShapeBufferGeometry(shapes, this.curveSegments);

			}

		}

	}
	clone() {

		return new TextMesh(this.text, this.material, this.fontAsset, this.size, this.extruded, this.curveSegments, this.thickness, this.bevel, this.bevelThickness, this.bevelSize);

	}
	toJSON(meta) {

		var data = Object3D.prototype.toJSON.call(this, meta);

		data.object.text = this.text;
		data.object.font = this.fontAsset.id;
		data.object.size = this.size;
		data.object.extruded = this.extruded;
		data.object.curveSegments = this.curveSegments;
		data.object.thickness = this.thickness;
		data.object.bevel = this.bevel;
		data.object.bevelThickness = this.bevelThickness;
		data.object.bevelSize = this.bevelSize;

		return data;

	}
}

// TextMesh.prototype = Object.create( Mesh.prototype );

TextMesh.EMPTY_GEOMETRY = new BufferGeometry();






export { TextMesh };
