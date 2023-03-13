var Asset = function ( editor, type, id, name ) {

	this.editor = editor;
	this.type = type;
	this.id = id;
	this.name = name;
	this.inUse = false;
	
};

Asset.prototype.toJSON = function () {

	var output = {};
	output.type = this.type;
	output.id = this.id;
	output.name = this.name;
	output.inUse = this.inUse;
	return output;

};

Asset.prototype.fromJSON = function ( json ) {

	this.type = json.type;
	this.id = json.id;
	this.name = json.name;
	this.inUse = json.inUse;

};

export { Asset };
