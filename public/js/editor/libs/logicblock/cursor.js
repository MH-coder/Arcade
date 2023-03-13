window.Cursor = (function (options) {

	var vars = {
		snapback: null
	}

	var cursors = function () {
		return $('.cursor');
	}

	var selected = function () {
		return $($('.cursor.selected')[0]);
	}

	var selectedIndex = function () {
		return cursors().index(selected());
	}

	var clearSelection = function () {
		$('.cursor.selected').removeClass('selected');
	}

	var select = function (cursor) {
		clearSelection();
		cursor.addClass('selected');
	}

	var selectPrevCursor = function (block) {
		
		vars.snapback.disable();

		var items = cursors();
		var index = selectedIndex();

		if (index < 0 && block) {
			$.Topic('select-prev-cursor-from-block').publish(block);
		} else {
			select($(items[Math.max(0, index - 1)]));
		}

		vars.snapback.enable();
	}

	var selectNextCursor = function (block) {

		vars.snapback.disable();

		var items = cursors();
		var index = selectedIndex();
		if (index < 0 && block) {
			$.Topic('select-next-cursor-from-block').publish(block);
		} else {
			select($(items[Math.min(items.length - 1, index + 1)]));
		}

		vars.snapback.enable();
	}

	var showAllCursor = function () {
		$('.cursor').show();
	}

	this.construct = function (options) {
		$.extend(vars, options);
	}

	this.construct(options);

	return  {

		getSelectedCursor: function () {
			return selected();
		},

		clearSelectedCursor: function () {
			clearSelection();
		},

		selectCursor: function (block) {
			if (block) {
				select(block.find('> .cursor'));
			}
		},

		initEvents: function () {

			$(document).on('click', '.cursor', function (e) {
				e.stopPropagation();
			});

			$(document).on('mouseenter', '.cursor', function () {

				vars.snapback.disable();

				clearSelection();
				$(this).addClass('selected');

				vars.snapback.enable();
			});

			$(document).on('dragover', '.cursor', function (e) {
				e.preventDefault();
				
				//vars.snapback.disable();

				clearSelection();
				$(this).addClass('selected');

				//vars.snapback.enable();
			});
			
		},

		subscribe: function () {
			$.Topic('select-prev-cursor').subscribe(selectPrevCursor);
			$.Topic('select-next-cursor').subscribe(selectNextCursor);
			$.Topic('show-all-cursor').subscribe(showAllCursor);
		}
	}

});