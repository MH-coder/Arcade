const { renderToCanvas } = require("../../ui/components/ui.three");
const { SidebarColorPicker, default: showColorPicker } = require("../../ui/utils/colorPicker/ColorPicker");
const { default: showSidebar } = require("./utils/showSidebar");

window.Block = (function (options) {
	
	var vars = {
		cursor: null,
		snapback: null,
		editor: null
	};

	var clipboard = null;

	var timer = null;

	var isDescendant = function( parent, child ) {

		var node = child.parentNode;
		while (node != null) {
			if (node == parent) {
				return true;
			}
			node = node.parentNode;
		}
		return false;
	}

	var blocks = function () {
		return $('.block-container');
	}

	var findBlockFromCursor = function ( cursor ) {
		return cursor.closest('.block-container');
	}

	var selected = function () {
		return $($('.block-container.selected')[0]);
	}

	var selectedIndex = function () {
		return blocks().index(selected());
	}

	var editables = function () {
		var block = selected();
		return block.find('.editable');
	}

	var selectedEditable = function () {
		return editables().filter('.selected');
	}

	var selectedEditableIndex = function () {
		return editables().index(selectedEditable());
	}

	var select = function (block) {
		block.addClass('selected');
	}

	var clearSelection = function () {
		$('.block-container.selected').removeClass('selected');
		$('.block-container .editable').removeClass('selected');
		$('.w--open').removeClass('w--open');
	}

	var enableEditable = function (editable, enabled) {
		var blockText = $(editable.find('.block-text')[0]);
		blockText.attr('spellcheck', 'false');
		blockText.attr('contenteditable', enabled);
		if (enabled) {
			blockText.focus();
			document.execCommand('selectAll',false,null)
		}
	}

	var editBlockText = function () {
		enableEditable(selectedEditable(), true);
	}

	var selectPrevBlockEditable = function () {
		var blockEditables = editables();
		var editable = selectedEditable();
		var index = selectedEditableIndex();
		editable.removeClass('selected');
		$(blockEditables[Math.max(0, index - 1)]).addClass('selected');
	}

	var selectNextBlockEditable = function () {
		var blockEditables = editables();
		var editable = selectedEditable();
		var index = selectedEditableIndex();
		editable.removeClass('selected');
		$(blockEditables[Math.min(blockEditables.length - 1, index + 1)]).addClass('selected');
	}

	var addBlockToCursor = function (cursor, newBlock) {

		var block = findBlockFromCursor(cursor);
		block.after(newBlock);

		var cursorBlock = newBlock;
		var newBlockType = newBlock.attr('block-type');

		if (newBlockType == 'rule' || newBlockType == 'group')
		{
			cursorBlock = $(newBlock.find('.block-container')[0]);
		}

		vars.cursor.selectCursor(cursorBlock);

		vars.snapback.register();

	}

	var addBlock = function (param, cursor) {

		var newBlock = null;

		newBlock = BlockUI[param.type]( param.options, vars.editor );

		addBlockToCursor(cursor, newBlock);

	}

	var removeBlock = function () {
		vars.snapback.register();
		var block = selected();
		block.remove();
	}

	var copyBlock = function () {
		clipboard = $(selected().clone());
	}

	var cutBlock = function () {
		clipboard = $(selected().clone());
		selected().remove();
	}

	var pasteBlock = function () {
		if (clipboard != null) {
			clearSelection();
			addBlockToCursor(vars.cursor.getSelectedCursor(), clipboard.clone());
		}
	}

	var toggleBlock = function () {
		var block = selected();
		block.toggleClass('off');
	}

	var toggleMinimizeBlock = function () {
		var block = selected();
		var type = block.attr('block-type');
		if ( type == 'rule' || type == 'group' || type == 'timer' ) {
			block.toggleClass('closed');
			block.find('.block-container').toggleClass('in-closed');
		}
	}

	var toggleMinimizeAllBlock = function () {
		var block = selected();
		var selectedType = block.attr('block-type');

		if ( selectedType == 'rule' || selectedType == 'group' || selectedType == 'timer' ) {

			var isClosed = block.hasClass('closed');

			['rule', 'group', 'timer'].map( type => {

				$(`div[block-type="${type}"]`).each( function ( index, elm ) {

					isClosed == true ? $(elm).removeClass('closed') : $(elm).addClass('closed');
					isClosed == true ? $(elm).find('block-container').removeClass('in-closed') : $(elm).find('block-container').addClass('in-closed');

				} );

			} );

		}

	}

	var selectPrevBlock = function (cursor) {
		var items = blocks();
		var index = selectedIndex();
		if (index < 0) {
			index = items.index(findBlockFromCursor(cursor));
		} else {
			index = Math.max(1, index - 1);
		}
		var block = items[index];
		while ($(block).attr('block-type') == 'empty' || $(block).hasClass('in-closed'))
			block = items[Math.max(1, index--)];

		clearSelection();
		select($(block));
	}

	var selectNextBlock = function (cursor) {
		var items = blocks();
		var index = selectedIndex();
		if (index < 0)
			index = items.index(findBlockFromCursor(cursor));
		index = Math.min(items.length - 1, index + 1);

		var block = items[index];
		while (($(block).attr('block-type') == 'empty' || $(block).hasClass('in-closed')) && block != null && index < items.length)
			block = items[Math.min(items.length - 1, index++)];

		if (block != null && $(block).attr('block-type') != 'empty') {
			clearSelection();
			select($(block));
		}
	}

	var selectPrevCursorFromBlock = function (block) {
		vars.cursor.selectCursor(block);
		$.Topic('select-prev-cursor').publish();
	}

	var selectNextCursorFromBlock = function (block) {
		vars.cursor.selectCursor(block);
	}

	var undo = function () {
		vars.snapback.undo();
	}

	var redo = function () {
		vars.snapback.redo();
	}

	var DomFromJSON = function (parent, json) {
		json.forEach(obj => {

			switch (obj.type) {

				case 'rule':
					var rule = BlockUI.rule(obj);
					$(parent).append(rule);
					rule.find('> .rule > .rule-action-container').each( function (index) {
						DomFromJSON( $(this), obj.children[index] );
					});
					break;

				case 'group':
					var group = BlockUI.group(obj);
					$(parent).append(group);
					DomFromJSON( group.find('> .group > .rule-action-container'), obj.children );
					break;

				case 'timer':
					var timer = BlockUI.timer(obj);
					$(parent).append(timer);
					DomFromJSON( timer.find('> .rule > .rule-action-container'), obj.children );
					break;

				default:
					$(parent).append( BlockUI[obj.type]( obj, vars.editor ) );
					break;

			}

		});

	}

	var BlockToJSON = function (block, keys) {
		var json = {};
		json['type'] = block.attr('block-type');
		json['off'] = block.hasClass('off');
		keys.forEach(key => {
			json[key] = block.find('.block-text.' + key).text();
		});

		return json;
	}

	var DomToJSON = function (parent, json) {

		$(parent).find('> .block-container').each( function() {

			var block = $(this);
			var blockType = block.attr('block-type');
			var obj = {
				type: blockType,
				off: block.hasClass('off'),
				minimized: block.hasClass('closed')
			};

			switch (blockType) {

				case 'empty':
					break;

				case 'rule':
					obj.conditions = block.find('> .rule > .when-this-happens-container > .block-text').text();
					obj.name = block.find('.rule-top > .block-text')[0].innerText;
					json.push( obj );
					obj['children'] = {};
					block.find('> .rule > .rule-action-container').each( function (index) {
						var children = [];
						DomToJSON( $(this), children );
						obj['children'][index] = children;
					});
					break;

				case 'group':
					obj.name = block.find('> .group > .group-top > .block-text')[0].innerText;
					json.push( obj );
					obj[ 'children' ] = [];
					DomToJSON( block.find('> .group > .rule-action-container'), obj.children );
					break;

				case 'timer':
					obj.conditions = block.find('.w-dropdown.conditions .block-text').text();
					let durationsBlocks = block.find('[data-key="duration"] > .block-text');
					if(durationsBlocks.length>1){
						obj.duration = durationsBlocks[0].innerText;
					}else{
						obj.duration = durationsBlocks.text();
					}

					obj.name = block.find('.rule-top > .block-text')[0].innerText;
					json.push( obj );
					obj['children'] = [];
					DomToJSON( block.find('> .rule > .rule-action-container'), obj.children );
					break;

				case 'change':
					obj.uuid = block.find('.w-dropdown.objects').attr('data-uuid');
					obj.objectType = block.find('.w-dropdown.objects').attr('data-objectType');
					obj.property = block.find('.w-dropdown.properties').find('.block-text').text();
					obj.property = obj.property == 'select property' ? "" : obj.property;
					obj.attribute = block.find('.w-dropdown.attributes').find('.block-text').text();
					obj.attribute = obj.attribute == 'select attribute' ? "" : obj.attribute;
					obj.values = {};
					if (obj.property == 'animation' && obj.attribute) {
						obj.values.id = block.find('.w-dropdown.attributes').attr('data-objectType');
					}
					if (obj.attribute) {
						if (obj.attribute == 'active camera') {
							obj.values.cameraType = block.find('.w-dropdown.cameras').attr('data-objecttype');
							obj.values.cameraUuid = block.find('.w-dropdown.cameras').attr('data-uuid');
						}


						block.find('.w-dropdown.attributes').nextAll().each(function(index, e) {
							var self = $(e);
							if (self.hasClass('movements') || self.hasClass('cam-movements')) {
								// console.log("obj b4 uuid", JSON.parse(JSON.stringify(obj)));
								obj.values['uuid'] = self.attr('data-uuid');
								obj.values['objectType'] = self.attr('data-objectType');
								// console.log("obj post uuid", JSON.parse(JSON.stringify(obj)));
							} else if (self.hasClass('easings')) {

								var key = self.attr('data-key');
								obj.values[key] = self.attr('data-easing');
								obj.values[key + 'Type'] = self.attr('data-type');

							} else {

								var key = self.attr('data-key');
								if (key != undefined && key != '') {
									obj.values[key] = self.find('.block-text').text();
									if (self.hasClass('filter') && obj.values[key] == 'refraction')
										obj.values['map'] = 'refractionFilter';
								}
							}
						});
					}
					json.push( obj );
					break;

				case 'timeline':
					obj.action = block.find('.w-dropdown.actions').attr('data-key');
					block.find('.w-dropdown.actions').nextAll().each(function(index, e) {
						var self = $(e);
						if ( self.hasClass( 'connects' ) ) {
							obj['connect'] = self.find('.block-text').text();
						} else if ( !self.hasClass('timelines') ) {
							var key = self.attr('data-key');
							obj[key] = self.find('.block-text').text();
						} else {
							obj.index = self.attr('data-key');
						}
					});
					json.push( obj );
					break;

				case 'add':
					var keys = ['x', 'y', 'z', 'relative', 'match'];
					obj = BlockToJSON(block, keys);
					obj.srcUuid = block.find('.w-dropdown.srcMesh').attr('data-src-uuid');
					obj.destUuid = block.find('.w-dropdown.destMesh').attr('data-dest-uuid');
					obj.srcTag = block.find('.w-dropdown.srcTags').attr('data-uuid');
					obj.destTag = block.find('.w-dropdown.destTags').attr('data-uuid');
					json.push( obj );
					break;

				case 'remove':
					obj.uuid = block.find('.w-dropdown.objects').attr('data-uuid');
					obj.objectType = block.find('.w-dropdown.objects').attr('data-objectType');
					obj.tag = block.find('.w-dropdown.tags').attr('data-uuid');
					json.push( obj );
					break;

				case 'trigger':
					var keys = ['trigger', 'key', 'keyEvent', 'mouse', 'mouseEventType', 'mouseClickEvent', 'mouseMoveEvent'];
					json.push ( BlockToJSON(block, keys) );
					break;

				case 'attribute':
					obj.uuid = block.find('.w-dropdown.objects').attr('data-uuid');
					obj.objectType = block.find('.w-dropdown.objects').attr('data-objectType');
					obj.attribute = block.find('.w-dropdown.attributes').attr('data-attribute');

					if (obj.attribute != undefined) {

						block.find('.w-dropdown.attributes').nextAll().each(function(index, e) {
							var self = $(e);
							var key = self.attr('data-key');
							if (key != undefined && key != '') {
								obj[key] = self.find('.block-text').text();
							}
						});

					}
					json.push( obj );
					break;

				case 'collision':
					obj.uuid = block.find('.w-dropdown.objects').attr('data-uuid');
					obj.tag = block.find('.w-dropdown.tags').attr('data-uuid');
					obj.targetUuid = block.find('.w-dropdown.targetObjects').attr('data-uuid');
					obj.targetTag = block.find('.w-dropdown.targetTags').attr('data-uuid');
					obj.condition = block.find('.w-dropdown.condition').find('.block-text').text();
					json.push(obj);
					break;

				case 'selection':
					var obj = { type: blockType, off: block.hasClass('off') };
					obj.uuid = block.find('.w-dropdown.objects').attr('data-uuid');
					obj.tag = block.find('.w-dropdown.tags').attr('data-uuid');
					obj.condition = block.find('.w-dropdown.condition').find('.block-text').text();
					json.push(obj);
					break;

				case 'link':
					var keys = ['target', 'url'];
					obj = BlockToJSON(block, keys);
					json.push( obj );
					break;

				case 'play':
					var action = block.find('.w-dropdown.actions').attr('data-type');
					obj.action = action ? action : 'play';
					var mode = block.find('.w-dropdown.modes').attr('data-type');
					obj.mode = mode ? mode : 'audio';
					obj.audio = block.find('.w-dropdown.audios').attr('data-uuid');
					obj.audioId = block.find('.w-dropdown.audios').attr('data-type');
					obj.video = block.find('.w-dropdown.videos').attr('data-uuid');
					obj.videoId = block.find('.w-dropdown.videos').attr('data-type');
					obj.animation = block.find('.w-dropdown.animations').attr('data-uuid');
					obj.animationId = block.find('.w-dropdown.animations').attr('data-type');
					obj.objectType = block.find('.w-dropdown.objects').attr('data-type');
					obj.objectUuid = block.find('.w-dropdown.objects').attr('data-uuid');
					obj.map = block.find('.w-dropdown.maps').attr('data-type');
					obj.sensitivity = parseInt(block.find('[data-key="sensitivity"] > .block-text').text());
					obj.iterationCount = parseInt(block.find('[data-key="iterationCount"] > .block-text').text());
					obj.iterationType = block.find('.iteration-type .dropdown > .block-text').text();
					obj.jumpToAndPlayOrPause = block.find('.jump-to-and-play-or-pause .dropdown > .block-text').text();
					obj.frame = block.find('[data-key="frame"] > .block-text').text();
					obj.framerate = block.find('[data-key="framerate"] > .block-text').text();
					obj.frameRate = block.find('[data-key="framerate"] > .block-text').text();
					json.push( obj );
					break;

				default:
					json.push( obj );
					break;
			}

		});

	}

	this.construct = function (options) {
		$.extend(vars, options);
	}

	this.construct(options);

	return  {

		clearSelectedBlocks: function () {
			var editable = $('.block-container .editable.selected');
			enableEditable(editable, false);
			clearSelection();
		},

		getSelectedBlock: function () {
			return selected();
		},

		subscribe: function () {
			$.Topic('add-block').subscribe(addBlock);
			$.Topic('remove-block').subscribe(removeBlock);
			$.Topic('copy-block').subscribe(copyBlock);
			$.Topic('cut-block').subscribe(cutBlock);
			$.Topic('paste-block').subscribe(pasteBlock);
			$.Topic('toggle-block').subscribe(toggleBlock);
			$.Topic('select-prev-block').subscribe(selectPrevBlock);
			$.Topic('select-next-block').subscribe(selectNextBlock);
			$.Topic('select-prev-cursor-from-block').subscribe(selectPrevCursorFromBlock);
			$.Topic('select-next-cursor-from-block').subscribe(selectNextCursorFromBlock);
			$.Topic('edit-block-text').subscribe(editBlockText);
			$.Topic('select-prev-block-editable').subscribe(selectPrevBlockEditable);
			$.Topic('select-next-block-editable').subscribe(selectNextBlockEditable);
			$.Topic('toggle-minimize-block').subscribe(toggleMinimizeBlock);
			$.Topic('toggle-minimize-all-block').subscribe(toggleMinimizeAllBlock);
			$.Topic('undo').subscribe(undo);
			$.Topic('redo').subscribe(redo);
		},

		fromJSON: function (json) {

			$('#logicblockspace').empty();

			$('#logicblockspace').append( BlockUI.empty() );

			DomFromJSON($('#logicblockspace')[0], json);

			vars.cursor.clearSelectedCursor();

		},

		toJSON: function () {

			var json = [];

			DomToJSON($('#logicblockspace')[0], json);

			return json;

		},

		initEvents: function () {

			$(document).on('click', '.block-container', function(e) {
				e.stopPropagation();
				clearSelection();
				select($(this));
			});

			$(document).on('dragstart', '.block-container', function (e) {
				e.stopPropagation();
				clearSelection();
				vars.snapback.disable();
				$(this).addClass('outlined');
				e.originalEvent.dataTransfer.setDragImage($('#drag-ghost')[0], 0, 0);
			});

			$(document).on('dragend', '.block-container', function (e) {
				e.stopPropagation();
				var block = $(this);
				var cursor = vars.cursor.getSelectedCursor();

				block.removeClass('outlined');
				vars.snapback.enable();

				if (!isDescendant(block[0], cursor[0]))
					addBlockToCursor(cursor, block);
			});

			$(document).on('dragover', '.block-container.closed > .rule', function (e) {
				var block = $(this).closest('.block-container');
				timer = setTimeout( function() {
					block.removeClass('closed');
				}, 1500);
			});

			$(document).on('drag', '.block-container.closed > .rule', function (e) {
				clearTimeout(timer);
			});

			$(document).on('dragleave', '.block-container.closed > .rule', function (e) {
				clearTimeout(timer);
			});

			$(document).on('dblclick', '.block', function (e) {
				e.stopPropagation();
			})

			$(document).on('dblclick', '.block.editable', function(e) {
				e.stopPropagation();
				var editable = $(this);
				editable.addClass('selected');
				enableEditable(editable, true);
			});

			$(document).on('keydown', '.block.editable', function(e) {
				e.stopPropagation();
				if (e.keyCode == 13) {
					e.preventDefault();
					var editable = $(this);
					editable.removeClass('selected');
					enableEditable(editable, false);
				}
			});

			$(document).on('click', '.block.toggle', function (e) {
				var self = $(this);
				var prev = self.prev();
				var parent = self.parent();
				var uuid = parent.find('.w-dropdown.objects').data('uuid');
				var objectType = parent.find('.w-dropdown.objects').data('objectType');
				var attribute = parent.find('.w-dropdown.attributes').find('.block-text').text();
				var blockType = self.closest('.block-container').attr('block-type');
				var textBlock = self.find('.block-text');
				var newText = self.attr('data-toggle');

				self.attr('data-toggle', textBlock.text());
				textBlock.text(newText);

				if ( blockType == 'timeline' && self.hasClass('condition') ) {

					prev.toggle();

				} else if ( blockType == 'add' && self.hasClass('relative') ) {

					self.nextAll('.destMesh').toggle();
					self.nextAll('.toggle').toggle();
					if (self.nextAll('.destMesh').attr('data-dest-uuid') == 'Tag' && self.text() == 'relative to object') {
						self.nextAll('.destTags').show();
					} else {
						self.nextAll('.destTags').hide();
					}

				} else if ( blockType == 'change' && (prev.hasClass('filter') || prev.hasClass('limit-axis'))) {

					if ( newText == 'on' ) {
						var prev = self.prev();
						var dropdown = prev.prev();
						var type = prev.find('.block-text').text();

						if ( attribute == 'filter' ) {
							BlockUI.attributeFieldsForChange( vars.editor, prev, uuid, objectType, prev.find('.block-text').text(), { enabled: 'on' } );
						} else {
							prev.remove();
							BlockUI.attributeFieldsForChange( vars.editor, dropdown, uuid, objectType, attribute, { axis: type, enabled: 'on', type: 'min' } );
						}
					} else {
						self.nextAll().remove();
					}
				}

			});

			$(document).on('click', '.block.dropdown:not(.only-two-items)', function (e) {
				e.stopPropagation();
				$('.w-dropdown-list.w--open').removeClass('w--open');
				$(this).next().addClass('w--open');
			});

			$(document).on('click', '.block.dropdown.only-two-items', function (e) {
				e.stopPropagation();
				$('.w-dropdown-list.w--open').removeClass('w--open');
				// $(this).next().addClass('w--open');

				let selected = $(this).find(".block-text").text()
				let options = $(this).parent().find('.w-dropdown-list > *')

				Array.from(options).find(elem=>{
					if (elem.innerText !== selected){
						elem.click()
					}
					return elem.innerText !== selected;
				})
			});

			$(document).on('click', '.block.color-picker', function (e) {
				var self = $(this);
				var input = self.find('input');
				var text = self.prev().find('.block-text');
				var color = input.prev();

				// showSidebar();
				

				showColorPicker(text.get(0));

				vars.editor.showColorPicker = ! vars.editor.showColorPicker;
				vars.editor.signals.showColorPickerChanged.dispatch(true, input.val(), function (c) {
					input.val(c);
					text.text(c);
					color.css('background-color', c);
				});
			});

			$(document).on('click', '.block.image-picker', function (e) {
				var self = $(this);

				var loading = $(self.find('.w-lightbox-spinner')[0]);
				var canvas = self.find('canvas')[0];
				var assetId = self.closest('.image-picker').next();


				const filter = self.data("accept") ?? "image/*";
				//self.find('input')[0].click();
				UtilsHelper.chooseSingleFile( function ( files ) {

					// Promise.all( editor.loader.loadFiles( files, null, 'Image') ).then( function ( results ) {

					// 	var assets = {};
					// 	for ( var result of results ) {
					// 		const isHDR = result.filename.includes('.hdr');
					// 		var asset = editor.assets.uploadImage( result.texture, isHDR );
					// 		assets[result.filename] = asset;
					// 		loading.show();
					// 	}
					// 	var image = result.texture.image;

					// 	var formData = new FormData();
					// 	formData.append( 'type', 'Image' );
					// 	formData.append( 'projectId', editor.projectId );

					// 	for ( let i = 0; i < files.length; i++ ) {

					// 		formData.append( 'file', files[i] );

					// 	}



					// 	editor.api.post( '/asset/my-image/upload', formData ).then( res => {

					// 		for ( var file of res.files ) {
					// 			assets[ file.name ].id = file.id;
					// 			assets[ file.name ].imageId = file.imageId;

					// 			var context = canvas.getContext( '2d' );
					// 			var scale = canvas.width / image.width;
					// 			// context.drawImage( image, 0, 0, image.width * scale, image.height * scale );

					// 			if ( image.data === undefined ) {

					// 				context.drawImage( image, 0, 0, image.width * scale, image.height * scale );
					
					// 			} else {
					
					// 				var canvas2 = renderToCanvas( result.texture );
					// 				context.drawImage( canvas2, 0, 0, image.width * scale, image.height * scale );
					
					// 			}

					// 			assetId.find('.block-text').text(file.id);
					// 			loading.hide();
					// 		}

					// 	} )

					// } );
					loadAndUploadFiles({canvas, files, loading, self});
				}, filter );
			});

			$(document).on('dragover', '.block.image-picker', function (e) {
				e.preventDefault();
			});

			$(document).on('drop', '.block.image-picker', function (e) {
				var self = $(this);
				var canvas = self.find('canvas')[0];
				var assetType = e.originalEvent.dataTransfer.getData( 'assetType' );
				var loading = $(self.find('.w-lightbox-spinner')[0]);

				var assetId = e.originalEvent.dataTransfer.getData( 'assetId' );
				var context = canvas.getContext( '2d' );

				if (assetType == 'Image') {
					var texture = editor.assets.get( 'Image', 'id', assetId ).texture;
					var image = texture.image;
					var scale = canvas.width / image.width;

					context.drawImage( image, 0, 0, image.width * scale, image.height * scale );
					self.next().find('.block-text').text(assetId);
				} else if (assetType == "Environment"){

					var asset = editor.assets.get( 'Environment', 'id', assetId );

					if (typeof asset == 'undefined') {
						editor.api.post('/asset/my-environment/add', {
							id: assetId,
							projectId: editor.projectId,
							folderId: 0
						}).then(function (environment) {
							// editor.addAsset('Image', 0, environment).then(function (asset) {
							// 	console.log("Uploaded asset", asset);
							// 	assetId= asset.id;
							// 	applyTexture()
		
							// });

							fetch(environment.url).then(res=>{
								return res.blob();
							}).then((blob)=>{
								const file = new File([blob], asset.name + '.hdr');
								let files =[file] 
	
								
	
								loadAndUploadFiles({canvas, files, loading, self});
								
	
								
							})
						}).catch(err => {
							alert(err);
						});
					} else {

						fetch(asset.url).then(res=>{
							return res.blob();
						}).then((blob)=>{
							const file = new File([blob], asset.name + '.hdr');
							let files =[file] 

							loadAndUploadFiles({files,canvas, loading, self});
							

							
						})
				
					}

					

					function applyTexture(){
						var asset = editor.assets.get( 'Image', 'id', assetId );

						let texture = asset.texture;
						const image = texture.image;
						var scale = canvas.width / image.width;
	
						var canvas2 = renderToCanvas( texture );
						context.drawImage( canvas2, 0, 0, image.width * scale, image.height * scale );
					
						self.next().find('.block-text').text(assetId);
					}

					
				}
			});

			function loadAndUploadFiles({files, loading, self, canvas}){

				Promise.all( editor.loader.loadFiles( files, null, 'Image') ).then( function ( results ) {

					var assets = {};
					for ( var result of results ) {
						const isHDR = result.filename.includes('.hdr');
						
						var asset = editor.assets.uploadImage( result.texture, isHDR );
						
						assets[result.filename] = asset;
						
						loading.show();
					}
					var image = result.texture.image;

					var formData = new FormData();
					formData.append( 'type', 'Image' );
					formData.append( 'projectId', editor.projectId );

					for ( let i = 0; i < files.length; i++ ) {
						formData.append( 'file', files[i] );
					}			


					editor.api.post( '/asset/my-image/upload', formData ).then( res => {

						for ( var file of res.files ) {
							assets[ file.name ].id = file.id;
							assets[ file.name ].imageId = file.imageId;

							var context = canvas.getContext( '2d' );
							var scale = canvas.width / image.width;

							if ( image.data === undefined ) {

								context.drawImage( image, 0, 0, image.width * scale, image.height * scale );
				
							} else {
				
								var canvas2 = renderToCanvas( result.texture );
								context.drawImage( canvas2, 0, 0, image.width * scale, image.height * scale );
				
							}

							self.closest('.image-picker').next().find('.block-text').text(file.id);
							loading.hide();
						}

					} )

				} );
			}

			$(document).on('change', '.block.image-picker > input', function (e) {
				/*var self = $(this);
				var canvas = self.prev()[0];
				var assetId = self.closest('.image-picker').next();

				var file = e.target.files[0];
				var reader = new FileReader();

				reader.readAsDataURL( file );
				if ( file.type.match( 'image.*' ) ) {

					reader.addEventListener( 'load', function ( event ) {

						var image = document.createElement( 'img' );
						image.addEventListener( 'load', function () {

							var texture = new THREE.Texture( this );
							texture.sourceFile = file.name;
							texture.format = file.type === 'image/jpeg' ? THREE.RGBFormat : THREE.RGBAFormat;
							texture.needsUpdate = true;

							var context = canvas.getContext( '2d' );
							var scale = canvas.width / image.width;
							context.drawImage( image, 0, 0, image.width * scale, image.height * scale );

							var newId = Date.now();

							editor.assets.images[0].items.push({
								id: newId,
								texture: texture
							});

							assetId.find('.block-text').text(newId);

						}, false );

						image.src = event.target.result;

					}, false );
				}*/
			});

			$(document).on('click', '.dropdown-link', function (e) {
				var self = $(this);
				var text = self.text();
				var block = self.closest('.block-container');
				var dropdown = self.closest('.w-dropdown');
				var prevText = dropdown.find('.block-text').text();
				var blockType = block.attr('block-type');

				if (text != prevText || ( self.attr('data-uuid') != dropdown.attr('data-uuid') )) {

					dropdown.find('.block-text').text(text);

					if (dropdown.hasClass('easings')) {

						dropdown.attr( 'data-easing', self.attr( 'data-easing' ) );
						dropdown.attr( 'data-type', self.attr( 'data-type' ) );

					} else {

						var dataType = self.attr( 'data-type' );
						var dataUuid = self.attr( 'data-uuid' );

						if ( blockType == 'trigger' ) {

							if (dropdown.hasClass('trigger')) {
								if (text == 'key') {
									block.find('.key-trigger').show();
									block.find('.mouse-trigger').hide();
								} else {
									block.find('.key-trigger').hide();
									if (block.find('.block-text.mouseEventType').text() == 'click') {
										block.find('.mouse-trigger').show();
										block.find('.move-event').hide();
									}
									else {
										block.find('.mouse-trigger').show();
										block.find('.click-event').hide();
									}
								}
							} else if (dropdown.hasClass('mouse-event-type')) {
								if (text == 'click') {
									block.find('.click-event').show();
									block.find('.move-event').hide();
								} else {
									block.find('.click-event').hide();
									block.find('.move-event').show();
								}
							}

						} else if ( blockType ==  'change' ) {

							var objectType = block.find('.w-dropdown.objects').attr('data-objectType');
							var uuid = block.find('.w-dropdown.objects').attr('data-uuid');

							if ( dropdown.hasClass('objects') || dropdown.hasClass('movements') || dropdown.hasClass('cameras') || dropdown.hasClass('attributes') || dropdown.hasClass('cam-movements') ) {

								dropdown.attr('data-uuid', dataUuid);
								dropdown.attr('data-objectType', dataType);

							}

							if ( dropdown.hasClass('objects') ) {

								dropdown.nextAll().remove();
								dropdown.after( BlockUI.propertyDropdownForChange( vars.editor, dataUuid, dataType ) );

							} else if ( dropdown.hasClass('properties') ) {

								dropdown.nextAll().remove();
								dropdown.after( BlockUI.attributeDropdownForChange( vars.editor, dropdown.prev().attr('data-uuid'), dataType ) );

							} else if ( dropdown.hasClass('attributes') || dropdown.hasClass('filter') || dropdown.hasClass('subdropdown') ) {

								BlockUI.attributeFieldsForChange( vars.editor, dropdown, uuid, objectType, dataType, {} );

							} else if ( dropdown.hasClass('movements') ) {

								var prev = dropdown.prev();
								var objectType = block.find('.w-dropdown.objects').attr('data-objectType');
								var movementType = prev.find('.block-text').text();

								BlockUI.attributeFieldsForChange( vars.editor, prev, uuid, objectType, movementType, { movementType: movementType, uuid: dataUuid, objectType: dataType } );

							} else if ( dropdown.hasClass('actions') ) {

								var prev = dropdown.prev();
								var animationName = prev.find('.block-text').text();
								var actionName = dropdown.find('.block-text').text();
								BlockUI.attributeFieldsForChange( vars.editor, dropdown, uuid, objectType, animationName, { action: actionName } );

							}

						} else if ( blockType == 'timeline' ) {

							dropdown.attr('data-key', dataType);

							if ( dropdown.hasClass('actions') ) {

								BlockUI.timelineAttributes( vars.editor, dropdown, dataType, {} );

							}

						} else if ( blockType ==  'attribute' ) {

							var data = {
								objectType: block.find('.w-dropdown.objects').attr('data-objectType'),
								uuid: dataUuid,
								type: dataType
							};
							BlockUI.attributeConditions( dropdown, data , {} );

						} else if ( blockType == 'collision' ) {

							dropdown.attr( 'data-uuid', dataUuid );

							if ( dropdown.hasClass( 'objects') || dropdown.hasClass('targetObjects') ) {

								dataType != 'Tag' ? dropdown.next().hide() : dropdown.next().show();
							}

						} else if ( blockType == 'remove' || blockType == 'selection' ) {

							dropdown.attr( 'data-uuid', dataUuid );
							dropdown.attr( 'data-objectType', dataType );

							if ( dropdown.hasClass('objects') ) {

								dataType == 'Tag' ? dropdown.next().show() : dropdown.next().hide();

							}

						} else if ( blockType == 'add' ) {

							if ( dropdown.hasClass( 'srcMesh') || dropdown.hasClass('destMesh') ) {

								var className = dropdown.hasClass('srcMesh') ? 'data-src-uuid' : 'data-dest-uuid';

								dropdown.attr( className, dataUuid );

								dataType != 'Tag' ? dropdown.next().hide() : dropdown.next().show();

							} else {

								dropdown.attr( 'data-uuid', dataUuid );

							}

						} else if ( blockType == 'play' ) {

							dropdown.attr( 'data-uuid', dataUuid );
							dropdown.attr( 'data-type', dataType );

							if ( dropdown.hasClass('objects') ) {
								block.find('.play-video-animation').show();
								if (dataType == 'Scene' || dataType == 'SpotLight') {
									block.find('.play-video-animation.mesh').hide();
									dropdown.next().find('.block-text').text(dataType == 'Scene' ? 'texture' : 'map');
								} else {
									block.find('.play-video-animation.scene').hide();
								}
							} else if ( dropdown.hasClass('modes') ) {
								var parent = dropdown.parent();
								var actions = parent.find('.actions');
								var action = actions.find('.block-text').text();
								parent.find('.audios').hide();
								parent.find('.videos').hide();
								parent.find('.animations').hide();
								if (text == 'audio') {
									actions.replaceWith( BlockUIElement.dropdown('actions', '', 'block', action, Global.playActions) );
									parent.find('.audios').show();
									parent.find('.play-video-animation').hide();
									parent.find('.play-animation').hide();
								} else {
									if (text == 'video') {
										actions.replaceWith( BlockUIElement.dropdown('actions', '', 'block', action, Global.playActions) );
										parent.find('.play-animation').hide();
										parent.find('.videos').show();
									} else {
										actions.replaceWith( BlockUIElement.dropdown('actions', '', 'block', action, Global.playAnimationActions) );
										parent.find('.play-animation').show();
										parent.find('.play-animation.frame').hide();
										parent.find('.animations').show();
									}
									parent.find('.play-video-animation').show();
									if (parent.find('.w-dropdown.objects').attr('data-type') == 'Scene') {
										parent.find('.play-video-animation.mesh').hide();
									} else {
										parent.find('.play-video-animation.scene').hide();
									}
								}
							} else if ( dropdown.hasClass('actions') ) {
								var parent = dropdown.parent();
								var action = dropdown.find('.block-text').text();
								var frame = parent.find('.play-animation.frame');
								if (action == "jump to frame") {
									frame.show();
								} else {
									frame.hide();
								}
							}

						} else {

							dropdown.attr( 'data-uuid', dataUuid );
							dropdown.attr( 'data-objectType', dataType );

						}

					}

				}

				block.find('.w-dropdown-list.w--open').removeClass('w--open');

			});

			$(document).on('click', '.when-this-happens', function (e) {
				var self = $(this);
				var block = self.find('.block-text');
				var text = block.attr('data-toggle');

				block.attr('data-toggle', block.text());
				block.text(text);
			});
		},
	}
});
