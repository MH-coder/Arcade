const { default: refreshLogicBlock } = require("./utils/refreshLogicBlock");


window.LogicBlock = (function (editor) {

	var snapback = null;

	var cursor = null;

	var search = null;

	var block = null;

	var trackMode = 0;

	var initEvents = function () {
		
		$(document).on('dblclick', '#logicblock', function (e) {

			if(document.selection && document.selection.empty) {
			    document.selection.empty();
			} else if(window.getSelection) {
			    var sel = window.getSelection();
			    sel.removeAllRanges();
			}
			block.clearSelectedBlocks();

			if ( !search.displayed() ) {
				$.Topic('add-search').publish( cursor.getSelectedCursor() );
			}
		});

		$(document).on('click', '#logicblock', function (e) {
			e.preventDefault();
			block.clearSelectedBlocks();
			if (search.displayed())
				search.remove();
		});

		$(document).on('keydown', '#logicblock', function (e) {
			

			if (e.keyCode == 83 || e.keyCode == 9)
				return;

			if (e.shiftKey && (e.keyCode == 38 || e.keyCode == 40)) {
				trackMode = 1 - trackMode;
			}

			if (e.keyCode == 13) { // enter
				e.preventDefault();
				if ( !search.displayed() ) {
					if (trackMode == 0)
						$.Topic('add-search').publish( cursor.getSelectedCursor() );
					else
						$.Topic('edit-block-text').publish();
				}
				else {
					$.Topic('add-block-from-search').publish();
				}
			}

			else if (e.keyCode == 37) { // left arrow
				e.preventDefault();
				if ( search.displayed() )
					$.Topic('select-prev-search').publish();
				else if (trackMode == 1)
					$.Topic('select-prev-block-editable').publish();
			}

			else if (e.keyCode == 39) { // right arrow
				e.preventDefault();
				if ( search.displayed() )
					$.Topic('select-next-search').publish();
				else if (trackMode == 1)
					$.Topic('select-next-block-editable').publish();
			}

			else if (e.keyCode == 38) { // up arrow
				e.stopPropagation();
				e.preventDefault();
				if ( !search.displayed() ) {
					if (trackMode == 0) {
						$.Topic('select-prev-cursor').publish( block.getSelectedBlock() );
						block.clearSelectedBlocks();
					}
					else {
						$.Topic('select-prev-block').publish( cursor.getSelectedCursor() );
						cursor.clearSelectedCursor();
					}
				}
			}

			else if (e.keyCode == 40) { // down arrow
				e.preventDefault();
				if ( !search.displayed() ) {
					if (trackMode == 0) {
						$.Topic('select-next-cursor').publish( block.getSelectedBlock() );
						block.clearSelectedBlocks();
					}
					else {
						$.Topic('select-next-block').publish( cursor.getSelectedCursor() );
						cursor.clearSelectedCursor();
					}
				}
			}

			else if (e.keyCode == 46 || e.keyCode == 8) {

				if ( block.getSelectedBlock().length > 0 ) {
					e.stopPropagation();
					$.Topic('remove-block').publish();
				}
				
			}

			else if (e.ctrlKey && e.keyCode == 67) {
				e.preventDefault();
				// ctrl + C
				$.Topic('copy-block').publish();

			}

			else if (e.keyCode == 77) {
				e.preventDefault();
				if (search.displayed())
					search.remove();
				cursor.clearSelectedCursor();
				if (e.shiftKey) {
					$.Topic('toggle-minimize-all-block').publish();
				} else {
					$.Topic('toggle-minimize-block').publish();
				}
			}

			else if (e.ctrlKey && e.keyCode == 88) {
				e.preventDefault();
				// ctrl + X
				$.Topic('cut-block').publish();
			}

			else if (e.keyCode == 86) {
				e.preventDefault();
				if (e.ctrlKey) {
					$.Topic('paste-block').publish();
					refreshLogicBlock();
				} else {
					$.Topic('toggle-block').publish();
				}
			}

			else if ((e.ctrlKey || e.metaKey) && e.keyCode == 90) {
				e.preventDefault();
				// ctrl + Z
				cursor.clearSelectedCursor();
				if (!e.shiftKey)
					$.Topic('undo').publish();
				else
					$.Topic('redo').publish();
			}

		});
	}
	
	let lastScriptIndex=editor.scripts[0]; 
	return  {
		getLastScriptIndex:function(){
			return lastScriptIndex;
		},

		init: function () {
			snapback = new Snapback(document.querySelector("#logicblockspace"));
			snapback.enable();

			cursor = new Cursor({
				snapback: snapback
			});
			cursor.initEvents();
			cursor.subscribe();

			search = new Search({
				snapback: snapback
			});
			search.subscribe();

			block = new Block({
				cursor: cursor,
				snapback: snapback,
				editor: editor
			});
			block.initEvents();
			block.subscribe();

			initEvents();

		},

		fromJSON: function (json) {		
			let lastScript= editor.scripts.find(script=>script.json === json);
			lastScriptIndex=editor.scripts.indexOf(lastScript);


			block.fromJSON(json);

		},

		toJSON: function () {

			return block.toJSON();

		}
	}
});