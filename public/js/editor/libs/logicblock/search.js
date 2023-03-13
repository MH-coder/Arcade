window.Search = (function (options) {

	var vars = {
		snapback: null
	};

	var blockData = [
    	{ condition: true, type: 'attribute', options: { } },
		{ condition: true, type: 'trigger',  options: { trigger: 'key', key: 'q', keyEvent: 'was pressed', mouse: 'left', mouseClickEvent: 'was pressed', mouseMoveEvent: 'is moving',  mouseEventType: 'click' } },
		{ condition: true, type: 'collision', options: { } },
		{ condition: true, type: 'selection', options: { } },
    	{ condition: false, type: 'add',  options: { x: 0, y: 0, z: 0, relative: 'relative to scene', match: 'match rotation' } },
    	{ condition: false, type: 'remove',  options: { } },
    	{ condition: false, type: 'change',  options: { } },
    	{ condition: false, type: 'link',  options: { target: 'new page', url: '?' } },
    	{ condition: false, type: 'timeline',  options: { condition: 'time', gotoAction: 'and play', duration: 0 } },
    	{ condition: false, type: 'rule', options: { name: 'rule', conditions: 'when any of these happen' } },
    	{ condition: false, type: 'group', options: { name: 'group' } },
    	{ condition: false, type: 'timer', options: { name: 'timer', conditions: 'After', duration: 0 } },
    	{ condition: false, type: 'play',  options: { action: 'play', mode: 'audio' } },
	];

	var currentCursor = null;

	var searchItems = function () {
		return $('.search-container').children();
	}

	var selectSearchItem = function (item) {
		selected().removeClass('selected');
		item.addClass('selected');
	}

	var selected = function () {
		return searchItems().filter('.selected');
	}

	var selectedIndex = function () {
		return searchItems().index(selected());
	}

	var createSearch = function (isCondition) {

		var block = $('<div class="search-container" style="display: flex;">');
		  
		blockData.forEach((d, index) => {
			if (isCondition == d.condition) {
				var choice = $('<div class="block" block-index="' + index + '"></div>');
				choice.append('<div class="block-text bar">' + d.type + '</div>');
				block.append(choice);
			}
		})
		
		return block;
		
	}

	var addSearch = function (cursor) {

		currentCursor = cursor;
		var isCondition = (cursor.closest('.conditions').length > 0);
		vars.snapback.disable();

		cursor.hide();
		cursor.after( createSearch(isCondition) );

		$('.search-container > div').click( function (e) {
			e.stopPropagation();
			removeSearch(cursor);
			vars.snapback.enable();
			$.Topic('add-block').publish( blockData[$(this).attr('block-index')], cursor );
		});

	}

	var addBlockFromSearch = function () {
		var item = selected();
		removeSearch(currentCursor);
		if (item.length > 0) {

			vars.snapback.enable();
			$.Topic('add-block').publish( blockData[item.attr('block-index')], currentCursor );

		}
	}

	var removeSearch = function () {
		$('.search-container').remove();
		$.Topic('show-all-cursor').publish();
	}

	var selectPrevSearch = function () {
		var items = searchItems();
		selectSearchItem($(items[Math.max(0, selectedIndex() - 1)]));
	}

	var selectNextSearch = function () {
		var items = searchItems();
		selectSearchItem($(items[Math.min(items.length - 1, selectedIndex() + 1)]));
	}

	this.construct = function (options) {
		$.extend(vars, options);
	}

	this.construct(options);

	return  {

		displayed: function () {
			return ($('.search-container').length > 0);
		},

		remove: function () {
			removeSearch();
		},

		subscribe: function () {
			$.Topic('add-search').subscribe(addSearch);
			$.Topic('add-block-from-search').subscribe(addBlockFromSearch);
			$.Topic('select-prev-search').subscribe(selectPrevSearch);
			$.Topic('select-next-search').subscribe(selectNextSearch);
		}
	}

});