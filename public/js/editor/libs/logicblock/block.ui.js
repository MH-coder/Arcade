const { default: isDefined } = require("../../utils");
const { default: refreshLogicBlock } = require("./utils/refreshLogicBlock");

window.BlockUI = {};

BlockUI.cursor = function () {
    var cursor = $('<div class="cursor selected"></div>');
    return cursor;
};

BlockUI.empty = function () {
    var block = $('<div class="block-container" block-type="empty"></div>');
    block.append( this.cursor() );
    return block;
};

BlockUI.wrapper = function ( options, type ) {
    var offClass = (options != null && options.off) ? ' off' : '';
    var block = $(`<div draggable="true" class="block-container ${offClass}" block-type="${type}"></div>`);
    return block;
};

BlockUI.action = function () {
    return $('<div class="action-container"></div>');
}

BlockUI.add = function ( options, editor ) {
    var block = this.wrapper( options, "add" );
    var action = this.action();
    var destMeshDropdown = BlockUIElement.objectsDropdownByTypes( editor, options.destUuid, ['Mesh', 'Sprite', 'TextMesh'], 'destMesh', 'data-dest-uuid' );
    var destTagDropdown = BlockUIElement.tagDropdown( editor, options.destTag, 'destTags' );
    var srcTagDropdown = BlockUIElement.tagDropdown( editor, options.srcTag, 'srcTags' );
    var matchToggle = BlockUIElement.toggle('block', 'match', '', options.match, (options.match == 'match rotation' ? 'do not match rotation' : 'match rotation'));

    action.append(
        BlockUIElement.label('block', '', 'add'),
        BlockUIElement.objectsDropdownByTypes( editor, options.srcUuid, ['Mesh', 'Sprite', 'TextMesh'], 'srcMesh', 'data-src-uuid' ),
        srcTagDropdown,
        BlockUIElement.toggle('block relative', 'relative', '', options.relative, (options.relative == 'relative to scene' ? 'relative to object' : 'relative to scene')),
        destMeshDropdown,
        destTagDropdown,
        matchToggle,
        BlockUIElement.editable('block', 'x', 'x :', options.x),
        BlockUIElement.editable('block', 'y', 'y :', options.y),
        BlockUIElement.editable('block', 'z', 'z :', options.z)
    );

    ( options.srcUuid == 'Tag' ) ? srcTagDropdown.show() : srcTagDropdown.hide();
    ( options.destUuid == 'Tag' ) ? destTagDropdown.show() : destTagDropdown.hide();

    if ( options.relative == 'relative to scene' ) {

        destMeshDropdown.hide();
        destTagDropdown.hide();
        matchToggle.hide();

    }

    block.append(
        action,
        this.cursor()
    );

    return block;

};

BlockUI.rotate = function ( options, editor ) {
    var params = Object.assign({}, options);
    var block = this.wrapper( options, "rotate" );
    var action = this.action();

    action.append(
        BlockUIElement.label('block', '', 'rotate'),
        BlockUIElement.objectsDropdown( editor, params ),
        BlockUIElement.editable('block', 'x', 'x :', options.x),
        BlockUIElement.editable('block', 'y', 'y :', options.y),
        BlockUIElement.editable('block', 'z', 'z :', options.z),
        BlockUIElement.toggle('block', 'local', '', options.local, (options.local == 'local' ? 'world' : 'local'))
    );

    block.append(
        action,
        this.cursor()
    );

    return block;
};

BlockUI.remove = function ( options, editor ) {
    var block = this.wrapper( options, 'remove' );
    var action = this.action();

    var objectDropdown = BlockUIElement.objectsDropdownByTypes( editor, options.uuid );
    var tagDropdown = BlockUIElement.tagDropdown( editor, options.tag );
    action.append(
        BlockUIElement.label( 'block', '', 'remove' ),
        objectDropdown,
        tagDropdown
    );
    options.uuid == 'Tag' ? tagDropdown.show() : tagDropdown.hide();

    block.append(
        action,
        this.cursor()
    );
    return block;
};

BlockUI.attribute = function ( options, editor ) {

    var options = Object.assign({}, options);
    var block = this.wrapper( options, 'attribute' );
    var action = this.action();

    var objectDropdown = BlockUIElement.objectsDropdown( editor, options );
    var objectType = options.objectType;
    if ( objectType == 'TextMesh' ) objectType = 'Mesh';

    var customAttributes = [];
    if (editor.attributes != undefined)
        customAttributes = editor.attributes.map(x => x.name);

    var dropdownData = Global.attributeConditions[objectType].concat(customAttributes);
    var attrDropdown = BlockUIElement.dropdown( 'attributes', '', 'block', (options.attribute ? options.attribute : 'select attribute'), dropdownData );
    action.append( objectDropdown );
    action.append( attrDropdown );

    if (options.attribute) {

        BlockUI.attributeConditions( attrDropdown, { type: options.attribute }, options );

    }

    block.append(action);
    block.append( this.cursor() );

    return block;

};

BlockUI.attributeConditions = function ( dropdown, data, options ) {

    if (dropdown.hasClass('objects')) {

        var objectType = data.type;
        if ( objectType == 'TextMesh' ) objectType = 'Mesh';
        if ( objectType == 'Sprite' ) objectType = 'Mesh';

        dropdown.nextAll().remove();
        dropdown.after( BlockUIElement.dropdown('attributes', '', 'block', 'select attribute', Global.attributeConditions[objectType]) );
        dropdown.attr('data-uuid', data.uuid);
        dropdown.attr('data-objectType', data.type);

    }
    else if (dropdown.hasClass('attributes')) {

        var parent = dropdown.parent();

        dropdown.attr('data-attribute', data.type);
        dropdown.nextAll().remove();

        if (data.type == 'none' || data.type == 'select attribute') {
            return;
        }

        switch (data.type) {

            case 'position': case 'rotation': case 'scale':
                var condition = options.condition == undefined ? 'is equal to' : options.condition;
                var axis = options.axis == undefined ? 'x' : options.axis;
                parent.append( BlockUIElement.dropdown('', 'condition', 'block', condition, Global.conditions.attribute) );
                parent.append( BlockUIElement.dropdown('axis', 'axis', 'block', axis, Global.axes) );
                parent.append( BlockUIElement.editable('block', 'value', '', options.value) );
                break;

            case 'movement':
                var condition = options.condition == undefined ? 'is equal to' : options.condition;
                var movementType = options.movementType == undefined ? 'direction' : options.movementType;
                var axis = options.axis == undefined ? 'x' : options.axis;
                parent.append( BlockUIElement.dropdown('', 'movementType', 'block', movementType, [ 'direction', 'rotation', 'grow' ]) );
                parent.append( BlockUIElement.dropdown('', 'condition', 'block', condition, Global.conditions.attribute) );
                parent.append( BlockUIElement.dropdown('axis', 'axis', 'block', axis, Global.axes) );
                parent.append( BlockUIElement.editable('block', 'value', '', options.value) );
                break;

            case 'visible': case 'cast shadow': case 'receive shadow':
                var enabled = options.enabled == undefined ? 'on' : options.enabled;
                parent.append( BlockUIElement.toggle('block', 'enabled', 'is', enabled, enabled == 'on' ? 'off' : 'on') );
                break;

            default:
                var condition = options.condition == undefined ? 'is equal to' : options.condition;
                parent.append( BlockUIElement.dropdown('', 'condition', 'block', condition, Global.conditions.attribute) );
                parent.append( BlockUIElement.editable('block', 'value', '', options.value) );
                break;

        }

    }

};

BlockUI.trigger = function ( options ) {
    var block = this.wrapper( options, 'trigger' );
    var action = this.action();

    // key trigger settings
    var triggerDropdown = BlockUIElement.dropdown('trigger', 'trigger', 'block', options.trigger, Global.trigger.Trigger);
    var key = BlockUIElement.editable('block key-trigger', 'key', '', (options.key != null ? options.key : ''));
    var keyEventDropdown = BlockUIElement.dropdown('key-trigger', 'keyEvent', 'block key-trigger', options.keyEvent, Global.trigger.Key);
    var mouseEventTypeDropdown = BlockUIElement.dropdown('mouse-trigger mouse-event-type', 'mouseEventType', 'block', options.mouseEventType, Object.keys(Global.trigger.MouseEvent));
    var mouseDropdown = BlockUIElement.dropdown('mouse-trigger click-event', 'mouse', 'block', options.mouse, Global.trigger.MouseButton);
    var mouseClickEventDropdown = BlockUIElement.dropdown('mouse-trigger click-event', 'mouseClickEvent', 'block', options.mouseClickEvent, Global.trigger.MouseEvent['click']);
    var mouseMoveEventDropdown = BlockUIElement.dropdown('mouse-trigger move-event', 'mouseMoveEvent', 'block', options.mouseMoveEvent, Global.trigger.MouseEvent['move']);


    // set maxLength for trigger key to 1
    keys = {
        'backspace': 8,
        'shift': 16,
        'ctrl': 17,
        'alt': 18,
        'delete': 46,
        'leftArrow': 37,
        'upArrow': 38,
        'rightArrow': 39,
        'downArrow': 40,
    }

    utils = {
    special: {},
    navigational: {},
    isSpecial(e) {
        return typeof this.special[e.keyCode] !== 'undefined';
    },
    isNavigational(e) {
        return typeof this.navigational[e.keyCode] !== 'undefined';
    }
    }

    utils.special[keys['backspace']] = true;
    utils.special[keys['shift']] = true;
    utils.special[keys['ctrl']] = true;
    utils.special[keys['alt']] = true;
    utils.special[keys['delete']] = true;

    utils.navigational[keys['upArrow']] = true;
    utils.navigational[keys['downArrow']] = true;
    utils.navigational[keys['leftArrow']] = true;
    utils.navigational[keys['rightArrow']] = true;

    key.children()[0].addEventListener('keydown', function(event) {
    let len = event.target.innerText.trim().length;
    hasSelection = false;
    selection = window.getSelection();
    isSpecial = utils.isSpecial(event);
    isNavigational = utils.isNavigational(event);
    
    if (selection) {
        hasSelection = !!selection.toString();
    }
    
    if (isSpecial || isNavigational) {
        return true;
    }
    
    if (len >= 1 && !hasSelection) {
        event.preventDefault();
        return false;
    }
    
    });


 

    if (options.trigger != 'key') {
        key.hide();
        keyEventDropdown.hide();
        if (options.mouseEventType == 'click')
            mouseMoveEventDropdown.hide();
        else {
            mouseClickEventDropdown.hide();
            mouseDropdown.hide();
        }
    } else {
        mouseEventTypeDropdown.hide();
        mouseDropdown.hide();
        mouseClickEventDropdown.hide();
        mouseMoveEventDropdown.hide();
    }

    action.append(triggerDropdown);
    action.append(key);
    action.append(keyEventDropdown);
    action.append(mouseEventTypeDropdown);
    action.append(mouseDropdown);
    action.append(mouseClickEventDropdown);
    action.append(mouseMoveEventDropdown);

    block.append(action);
    block.append( this.cursor() );

    return block;
};

BlockUI.rule = function ( options ) {

    var condition = options.conditions == 'when any of these happen' ? 'when all of these happen' : 'when any of these happen';
    var className = '';
    if (options.off)
        className += ' off';
    if (options.minimized)
        className += ' closed';

    var block = $('<div draggable="true" class="block-container' + className + '" block-type="rule"></div>');
    var rule = $('<div class="rule"></div>');
    var image = '<img src="https://arcadestudio-assets.s3.us-east-2.amazonaws.com/engine-ui/arrow.svg" width="12" height="12" alt="" class="menu">';

    // add rule name
    var ruleName = $('<div class="block editable rule-top ">');
    ruleName.append('<div class="block-text">' + options.name + '</div>');
    rule.append(ruleName);

    // add condition container
    var codeLine = $('<div class="when-this-happens-container">');
    var conditionLine = $('<div class="block-text when-this-happens"></div>');
    conditionLine.append(`<div class="block-text" data-toggle="${condition}">${options.conditions}</div>`);
    conditionLine.append( image );
    codeLine.append( conditionLine );
    rule.append( codeLine);

    var conditions = $('<div class="rule-action-container conditions"></div>');
    conditions.append( this.empty() );
    rule.append(conditions);

    // add true actions container
    var doThis = $('<div class="block-text do-this">do this</div>');
    var trueActions = $('<div class="rule-action-container true-actions"></div>');
    trueActions.append( this.empty() );
    rule.append(doThis);
    rule.append(trueActions);

    // add false actions container
    var doThisElse = $('<div class="block-text do-this">otherwise do this</div>');
    var falseActions = $('<div class="rule-action-container false-actions"></div>');
    falseActions.append( this.empty() );
    rule.append(doThisElse);
    rule.append(falseActions);

    block.append(rule);
    block.append( this.cursor() );

    return block;
};

BlockUI.group = function ( options ) {

    var className = '';
    if (options.off)
        className += ' off';
    if (options.minimized)
        className += ' closed';

    var block = $(`<div draggable="true" class="block-container ${className}" block-type="group"></div>`);
    var group = $('<div class="group"></div>');

    var groupTop = $('<div class="block group-top editable">');
    groupTop.append(`<div class="block-text">${options.name}</div>`);
    group.append(groupTop);

    var actionContainer = $('<div class="rule-action-container"></div>');
    actionContainer.append( this.empty() );
    group.append(actionContainer);

    block.append(group);
    block.append( this.cursor() );

    return block;

};

BlockUI.timer = function ( options ) {

    //var condition = options.conditions == 'After' ? 'For' : 'After';
    var className = '';
    if (options.off)
        className += ' off';
    if (options.minimized)
        className += ' closed';

    var block = $(`<div draggable="true" class="block-container ${className}" block-type="timer"></div>`);
    var timer = $(`<div class="rule"></div>`);

    // add timer name
    var timerName = $('<div class="block rule-top editable">');
    timerName.append(`<div class="block-text">${options.name}</div>`);
    timer.append(timerName);

    // add condition container
    var codeLine = $('<div class="when-this-happens-container">');
    var conditionsDropdown = BlockUIElement.dropdown( 'conditions', '', 'block', (options.conditions == undefined ? 'After' : options.conditions), Global.conditions.timer );
    //codeLine.append(`<div class="block-text when-this-happens timer-cond" data-toggle="${condition}">${options.conditions}</div>`);
    codeLine.append(conditionsDropdown);
    BlockUIElement.clock( codeLine, null, options.duration, true, {withoutOver:1} );
    timer.append(codeLine);

    var container = $('<div class="rule-action-container"></div>');
    container.append( this.empty() );
    timer.append(container);

    block.append(timer);
    block.append( this.cursor() );
    return block;

};

BlockUI.selection = function ( options, editor  ) {

    var block = this.wrapper( options, 'selection' );
    var action = this.action();

    var condition = options.condition == undefined ? 'is selected' : options.condition;
    var tagDropdown = BlockUIElement.tagDropdown( editor, options.tag );

    action.append(
        BlockUIElement.objectsDropdownByTypes( editor, options.uuid, ['Mesh', 'TextMesh'] ),
        tagDropdown,
        BlockUIElement.dropdown('condition', '', 'block', condition, Global.attributeConditions['selection'])
    );

    ( options.uuid == 'Tag' ) ? tagDropdown.show() : tagDropdown.hide();

    block.append(
        action,
        this.cursor()
    );

    return block;

};

BlockUI.collision = function ( options, editor ) {

    var block = this.wrapper( options, 'collision' );
    var action = this.action();

    var tagDropdown = BlockUIElement.tagDropdown( editor, options.tag, 'tags' );
    var targetTagDropdown = BlockUIElement.tagDropdown( editor, options.targetTag, 'targetTags' );
    var conditionDropdown = BlockUIElement.dropdown('condition', '', 'block', options.condition ? options.condition : 'is touching', Global.collision);

    action.append(
        BlockUIElement.collisionDropdown( editor, options.uuid, false ),
        tagDropdown,
        conditionDropdown,
        BlockUIElement.collisionDropdown( editor, options.targetUuid, true ),
        targetTagDropdown
    );

    ( options.uuid == 'Tag' ) ? tagDropdown.show() : tagDropdown.hide();
    ( options.targetUuid == 'Tag' ) ? targetTagDropdown.show() : targetTagDropdown.hide();

    block.append(
        action,
        this.cursor()
    );

    return block;

};

BlockUI.change = function ( options, editor ) {

    var params = Object.assign({}, options);
    var block = this.wrapper( params, 'change' );
    var action = this.action();

    var objectDropdown = BlockUIElement.objectsDropdown( editor, params );
    action.append( BlockUIElement.label( 'block', '', 'change attribute' ) );
    action.append( objectDropdown );
    action.append( this.propertyDropdownForChange( editor, params.uuid, params.objectType, params.property ) );

    if ( params.property != "" && params.property != undefined ) {

        var attributeDropdown = this.attributeDropdownForChange( editor, params.uuid, params.property, params.attribute );
        action.append( attributeDropdown );

        if ( params.attribute != "" && params.attribute != undefined ) {

            dropdown = this.attributeFieldsForChange( editor, attributeDropdown, params.uuid, params.objectType, params.attribute, params.values );

            if ( params.attribute == 'fog' || params.attribute == 'filter' || params.attribute == 'dragtype' || params.attribute == 'movements' ) {

                this.attributeFieldsForChange( editor, dropdown, params.uuid, params.objectType, params.values.type, params.values );

            }

        }

    }

    block.append(action);
    block.append( this.cursor() );

    return block;
};

BlockUI.propertyDropdownForChange = function ( editor, uuid, objectType, property ) {

    var type = objectType;
    if ( objectType == 'TextMesh' ) type = 'Mesh';

    var properties = Global.attributes[type];
    var propertyData = Object.keys(properties).filter(x => {
        return x != 'map' && x !== "limit"; 
    });

    var object = editor.objectByUuid(uuid);
    if ( object && object.animations.length > 0 ) {
        propertyData.push('animation');
    }

    var propertyDropdown = BlockUIElement.dropdown( 'properties', '', 'block', (property ? property : 'select property'), propertyData );
    return propertyDropdown;

};

BlockUI.attributeDropdownForChange = function ( editor, uuid, property, attribute ) {
    var object = editor.objectByUuid(uuid);
    var type = object ? object.type : null;

    if ( type == 'TextMesh' ) type = 'Mesh';

    var attributes = [];
    if ( type == 'Scene' && property == 'custom attribute' ) {
        attributes = editor.attributes;
    } else if ( type == 'Mesh' && property == 'geometry') {        
            var geometryType = (object.type == 'TextMesh' ? 'TextGeometry' : object.geometry.type);
            // Types were renamed from XYZBufferGeometry to XYZGeometry in ThreeJS r125. Below string replacement is to support objects created with older version
            var geometryLookupKey = geometryType.replace(/BufferGeometry$/, 'Geometry');
            attributes = Global.attributes.Mesh.geometry[geometryLookupKey];
    } else if(type =='Mesh' && property == 'material') {
        attributes = Global.attributes.Mesh.material[object.material.type];
    } else if ( property == 'animation' ) { 
    attributes = object.animations;
    } else {
        attributes = Global.attributes[type][property];
    }

    // remove look at from camera
    if (property === "movement" && object.isCamera){
        attributes = attributes.filter(a=> a !== "look at");
    }

    var attributeDropdown = BlockUIElement.dropdown( 'attributes', '', 'block', (attribute ? attribute : 'select attribute'), attributes );


    return attributeDropdown;

};

BlockUI.attributeFieldsForChange = function ( editor, dropdown, uuid, objectType, attribute, values ) {

    dropdown.nextAll().remove();
    var parent = dropdown.parent();
    var property = parent.find('.w-dropdown.properties .block-text').text();

    if (attribute == 'none' || attribute == 'select attribute') {
        return;
    }
    switch (attribute) {

        case 'position': case 'rotation': case 'scale': case 'direction': case 'rotation': case 'grow':
            if (property == 'limit') {
                if (!values.enabled) {
                    values.enabled = 'off';
                    values.type = 'min';
                }
                parent.append( BlockUIElement.dropdown( 'limit-axis', 'axis', 'block', values.axis ? values.axis : 'x', Global.axes ) );
                parent.append( BlockUIElement.toggle( 'block', 'enabled', '', values.enabled, values.enabled == 'on' ? 'off' : 'on' ) );
                if (values.enabled == 'on') {
                    parent.append( BlockUIElement.toggle( 'block', 'type', '', values.type, values.type == 'min' ? 'max' : 'min' ) );
                    parent.append( BlockUIElement.editable('block', 'value', '', values.value) );
                }
            } else if (property == 'styling') {
                if (attribute == 'position') {
                    if (!values.mode) {
                        values.mode = 'initial';
                    }
                    parent.append( BlockUIElement.toggle('block', 'mode', '', values.mode, values.mode == 'initial' ? 'variation' : 'initial') );
                    parent.append( BlockUIElement.dropdown( 'axis', 'axis', 'block', values.axis ? values.axis : 'x', Global.axes ) );
                    parent.append( BlockUIElement.editable('block', 'value', '', values.value) );
                } else {
                    if (!values.value) {
                        values.value = 'forward';
                    }
                    parent.append( BlockUIElement.toggle('block', 'value', '', values.value, values.value == 'forward' ? 'backward' : 'forward') );
                }
            } else if (property == 'environment') {
                parent.append( BlockUIElement.editable('block', 'scale', '', values.scale) );
                BlockUIElement.clock( parent, null, values.duration );
                parent.append( BlockUIElement.easingDropdown( 'easing', values.easing, values.easingType ) );
            } else {
                parent.append( BlockUIElement.dropdown( 'axis', 'axis', 'block', values.axis ? values.axis : 'x', Global.axes ) );
                parent.append( BlockUIElement.editable('block', 'value', '', values.value) );
            }
            if (property != 'styling' && property != 'environment') {
                if (property != 'limit' || values.enabled == 'on') {
                    BlockUIElement.clock( parent, null, values.duration );
                    parent.append( BlockUIElement.label( 'block', '', 'with' ) );
                    parent.append( BlockUIElement.easingDropdown( 'easing', values.easing, values.easingType ) );
                }
                if (
                    (property != 'limit' && objectType !='Scene' && attribute != 'grow') &&
                    !(property === "spacial")
                    ) {
                    //parent.append( BlockUIElement.label( 'block', '', 'world' ) );
                    if(!values.local){
                      values.local = 'world';
                    }
                    parent.append( BlockUIElement.toggle('block', 'local', '', values.local, (values.local == 'local' ? 'world' : 'local')));
                }
            }
            break;

        case 'velocity': case 'acceleration':
            if (!values.mode) {
                values.mode = 'initial';
            }
            parent.append( BlockUIElement.toggle('block', 'mode', '', values.mode, values.mode == 'initial' ? 'variation' : 'initial') );
            parent.append( BlockUIElement.dropdown( 'axis', 'axis', 'block', values.axis ? values.axis : 'x', Global.axes ) );
            parent.append( BlockUIElement.editable('block', 'value', '', values.value) );
            break;

        case 'open ended': case 'closed': case 'bevel': case 'extruded':
        case 'visible': case 'cast shadow': case 'receive shadow':
        case 'vertex colors': case 'vertex tangents': case 'skinning': case 'flat shading': case 'transparent': case 'depth test': case 'depth write': case 'wireframe':
            if ($.isEmptyObject(values)) {
                values.value = 'on';
            }
            parent.append( BlockUIElement.dropdown('', 'value', 'block', values.value, Global.conditions.toggle) );
            break;

        case 'color': case 'ground color':
            if ($.isEmptyObject(values))
                values.color = '#ffffff';
            parent.append( BlockUIElement.label('block', 'color', values.color) );
            parent.append( BlockUIElement.color('block', values.color) );
            break;

        case 'background':
            if (!values.mode) {
                values.mode = 'none';
            }
            var modeDropdown = BlockUIElement.dropdown('subdropdown', 'mode', 'block', values.mode, Global.background);
            parent.append( modeDropdown );
            if (values.mode != 'none') {
                this.attributeFieldsForChange(editor, modeDropdown, uuid, objectType, values.mode, values);
            }

            break;

        case 'environment':{
            // if (!values.env) {
            //     values.env = 'none';
            // }
            // parent.append( BlockUIElement.toggle( 'block', 'env', '', values.env, values.env == 'none' ? 'background' : 'none' ) );
        
            let properties = ["toggle", "equirect"];

            values.isAbout = values.isAbout ?? properties[1];

            const {isAbout} = values;

            {
                const dropdown = BlockUIElement.dropdown( '', 'isAbout', 'block', isAbout ,properties, {onChange: refreshLogicBlock}  );
                parent.append(dropdown);
            }

            const acceptFiles =  "image/*, .hdr";

            if (isAbout === "equirect"){
                const assetId = values.assetId; 
                const asset = assetId < 0 ? null : editor.assets.get( 'Image', 'id', assetId );

                parent.append( BlockUIElement.image('block', asset, acceptFiles ) );
                parent.append( `<div data-key="assetId" style="display: none;"><div class="block-text">${values.assetId}</div></div>` );
            }else{
                values.toggle = values.toggle ?? 'on';
                parent.append( BlockUIElement.dropdown('', 'toggle', 'block', values.toggle, Global.conditions.toggle) );
            }

            break;
        }

        case 'emissive':
            if ($.isEmptyObject(values))
                values.color = '#ffffff';
            // parent.append( BlockUIElement.editable('block', 'value', '', values.value) );
            // BlockUIElement.clock( parent, null, values.duration );
            // parent.append( BlockUIElement.easingDropdown( 'easing', values.easing, values.easingType ) );
            parent.append( BlockUIElement.label('block', 'color', values.color) );
            parent.append( BlockUIElement.color('block', values.color) );
            break;
        case 'emissive intensity':
            parent.append( BlockUIElement.editable('block', 'value', '', values.value) );
            BlockUIElement.clock( parent, null, values.duration );
            parent.append( BlockUIElement.easingDropdown( 'easing', values.easing, values.easingType ) );
            break;

        case 'map': case 'env map': case 'alpha map': case 'rough map': case 'roughness map': case 'metal map': case 'metalness map': case 'light map': case 'emissive map': case 'texture': case 'particle texture': case 'equirect':
            if (objectType != 'PerspectiveCamera' && objectType != 'OrthographicCamera') {
                if (!values.mapEnabled) {
                    values.mapEnabled = 'on';
                    values.mapAssetId = -1;
                }
                const acceptFiles = attribute === "equirect"? "image/*, .hdr": undefined;

                if (['map', 'env map', 'alpha map', 'roughness map', 'metalness map', 'light map', 'emissive map', 'equirect', 'texture']. includes(attribute)){
                    
                    let properties = ["toggle", "texture"];

                    values.isAbout = values.isAbout ?? properties[1];
    
                    const {isAbout} = values;
    
                    {
                        const dropdown = BlockUIElement.dropdown( '', 'isAbout', 'block', isAbout ,properties, {onChange: refreshLogicBlock}  );
                        parent.append(dropdown);
                    }
        
    
                    if (isAbout === "texture"){
                        const assetId = values.assetId; 
                        const asset = assetId < 0 ? null : editor.assets.get( 'Image', 'id', assetId );

                        parent.append( BlockUIElement.image('block', asset, acceptFiles ) );
                        parent.append( `<div data-key="assetId" style="display: none;"><div class="block-text">${values.assetId}</div></div>` );
                    }else{
                        values.toggle = values.toggle ?? 'on';
                        parent.append( BlockUIElement.dropdown('', 'toggle', 'block', values.toggle, Global.conditions.toggle) );
                    }

                } else {
                    parent.append( BlockUIElement.image('block', values.mapAssetId < 0 ? null : editor.assets.get( 'Image', 'id', values.mapAssetId ),  acceptFiles  ));
               
                    parent.append( `<div data-key="mapAssetId" style="display: none;"><div class="block-text">${values.mapAssetId}</div></div>` );
              
                    parent.append( BlockUIElement.dropdown('', 'mapEnabled', 'block', values.mapEnabled, Global.conditions.toggle) );
                }
                
                

            } else {
                if (!values.mode) {
                    values.mode = Global.map[0];
                }
                var modeDropdown = BlockUIElement.dropdown( 'subdropdown', 'mode', 'block', values.mode, Global.map );
                parent.append( modeDropdown );
                this.attributeFieldsForChange(editor, modeDropdown, uuid, objectType, values.mode, values );
            }
            break;

        case 'bump map': case 'displacement map': case 'ao map': case 'enviro map':
            if ($.isEmptyObject(values)) {
                values.toggle = 'on';
                values.assetId = -1;
            }
            if (!isDefined(values.toggle)){
                values.toggle = "on";
            }
            const mapOrPropertiesValues = ["map", "properties"];

            let {mapOrProperties} = values;
            if (!mapOrProperties){
                mapOrProperties = "map";
            }

            {
                const dropdown = BlockUIElement.dropdown( 'subdropdown', 'mapOrProperties', 'block', mapOrProperties ,mapOrPropertiesValues, {onChange: refreshLogicBlock}  );
                parent.append(dropdown);
            }

            if (mapOrProperties === "map"){

                let properties = ["toggle", "texture"];

                values.isAbout = values.isAbout ?? properties[1];

                const {isAbout} = values;

                {
                    const dropdown = BlockUIElement.dropdown( '', 'isAbout', 'block', isAbout ,properties, {onChange: refreshLogicBlock}  );
                    parent.append(dropdown);
                }
    

                if (isAbout === "texture"){
                    parent.append( BlockUIElement.image('block', values.assetId < 0 ? null : editor.assets.get( 'Image', 'id', values.assetId ) ) );
                    parent.append( `<div data-key="assetId" style="display: none;"><div class="block-text">${values.assetId}</div></div>` );
                }else{
                    values.toggle = values.toggle ?? 'on';

                    parent.append( BlockUIElement.dropdown('', 'toggle', 'block', values.toggle, Global.conditions.toggle) );
                }

              
  

            }else if(mapOrProperties === "properties"){
                parent.append( BlockUIElement.editable('block', 'value', '', values.value) );
                BlockUIElement.clock( parent, null, values.duration );
                parent.append( BlockUIElement.easingDropdown( 'easing', values.easing, values.easingType ) );
            }
            
           
            break;

        case 'normal map': case 'clearcoat map':
            if ($.isEmptyObject(values)) {
                values.toggle = 'on';
                values.assetId = -1;
            }

            if (!isDefined(values.toggle)){
                values.toggle = "on";
            }

           

            {
                const mapOrPropertiesValues = ["map", "scaleX", "scaleY"];

                let {mapOrProperties} = values;

                if (!mapOrProperties){
                    mapOrProperties = "map";
                }

                {
                    const dropdown = BlockUIElement.dropdown( 'subdropdown', 'mapOrProperties', 'block', mapOrProperties ,mapOrPropertiesValues, {onChange: refreshLogicBlock}  );
                    parent.append(dropdown);
                }

                if (mapOrProperties === "map"){

                    let properties = ["toggle", "texture"];

                    values.isAbout = values.isAbout ?? properties[1];
    
                    const {isAbout} = values;
    
                    {
                        const dropdown = BlockUIElement.dropdown( '', 'isAbout', 'block', isAbout ,properties, {onChange: refreshLogicBlock}  );
                        parent.append(dropdown);
                    }
        
    
                    if (isAbout === "texture"){
                        parent.append( BlockUIElement.image('block', values.assetId < 0 ? null : editor.assets.get( 'Image', 'id', values.assetId ) ) );
                        parent.append( `<div data-key="assetId" style="display: none;"><div class="block-text">${values.assetId}</div></div>` );
                    }else{
                        parent.append( BlockUIElement.dropdown('', 'toggle', 'block', values.toggle, Global.conditions.toggle) );
                    }

                }else if (mapOrProperties==="scaleX" || mapOrProperties === "scaleY"){
                    parent.append( BlockUIElement.editable('block', 'value', '', values.value) );
                    BlockUIElement.clock( parent, null, values.duration );
                    parent.append( BlockUIElement.easingDropdown( 'easing', values.easing, values.easingType ) );
                }



                
                break;
            }

        case 'look at': case 'go to':
            if (dropdown.data('key') == 'control') {
                parent.append( BlockUIElement.movementDropdown(editor, attribute, values, 'cam-movements') );
                parent.append( BlockUIElement.editable('block', 'distance', 'distance: ', values.distance) );
                BlockUIElement.clock( parent, null, values.duration );
                parent.append( BlockUIElement.easingDropdown( 'easing', values.easing, values.easingType ) );
            } else {
                parent.append( BlockUIElement.movementDropdown(editor, attribute, values, 'movements') );

                if (values.uuid == 'location') {
                    // parent.append( BlockUIElement.dropdown( '', 'key', 'block', values.key ? values.key : Global[attribute][0], Global[attribute] ) );

                    const setAxesOrPropertiesValues = ['axis', 'properties'];

                    values.setAxesOrProperties= values.setAxesOrProperties || 'properties';

                    
                   
                     const dropdown = BlockUIElement.dropdown( 'subdropdown', 'setAxesOrProperties', 'block', values.setAxesOrProperties ,setAxesOrPropertiesValues, {onChange: refreshLogicBlock}  );
                    

                    parent.append( dropdown);

                    if (values.setAxesOrProperties === "properties"){
                        parent.append( BlockUIElement.editable('block', attribute == 'look at' ? 'drag' : 'speed', attribute == 'look at' ? 'drag: ' : 'speed: ', attribute === "look at"?values.drag:values.speed) );

                        // parent.append( BlockUIElement.editable('block', 'value', '', values.value) );

                    }else{
                        const axis = values.axis || 'x';
                        parent.append( BlockUIElement.dropdown('axis', 'axis', 'block', axis , Global.axes) );
                        parent.append( BlockUIElement.editable('block', 'value',  '', values.value) );
                    }
                   
                    BlockUIElement.clock( parent, null, values.duration );

                    let hideEasings = false;

                    if (
                        values.setAxesOrProperties !== "properties" && attribute === "look at" ||
                        values.setAxesOrProperties === "properties"
                        ){
                            hideEasings=true;
                        }

                    const easingClassname = hideEasings && "hidden-important";
                    // const easingClassname = "";
                    // if (values.setAxesOrProperties === "properties"){
                        parent.append( BlockUIElement.easingDropdown( 'easing', values.easing, values.easingType,easingClassname ) );
                    // }

                } else if (values.uuid == 'cursor location') {
                    return;
                } else if (values.uuid != 'none') {

                    const enableOrDragValues = ['enable in', 'properties'];

                    values.enableOrDrag= values.enableOrDrag || 'properties';

                    const dropdown = BlockUIElement.dropdown( 'subdropdown', 'enableOrDrag', 'block', values.enableOrDrag ,enableOrDragValues, {onChange: refreshLogicBlock}  ); 

                    
                    parent.append( dropdown);

                    if (values.enableOrDrag === "enable in"){
                        const axis = values.axis || 'x';
                        const key = axis + "Enabled";
                        parent.append( BlockUIElement.dropdown('axis', 'axis', 'block', axis , Global.axes) );
    
                        values[key] = values[key] || 'on';

                        parent.append( BlockUIElement.toggle('block', key, '' , values[key], values[key] == 'on' ? 'off' : 'on') );
                    } else{
                                    
                        parent.append( BlockUIElement.editable('block', 'speed', attribute == 'look at' ? 'drag : ' : 'speed: ', values.speed) );
                        if ( !values['speedSeconds'] ) {
                            values['speedSeconds'] = 0;
                        }
                        BlockUIElement.clock( parent, 'speedSeconds', values.speedSeconds );
                        parent.append( BlockUIElement.easingDropdown( 'easing', values.easing, values.easingType ) );
                    }

           
                  

                    // ['x', 'y', 'z'].map(axis => {
                    //     var key = axis + 'Enabled';
                    //     if ( !values[key] ) {
                    //         values[key] = 'on';
                    //     }
                    
                }
            }
            break;

        case 'selected':case 'can be selected': case 'can be deselected':
            // var enabled = options.enabled == undefined ? 'on' : options.enabled;
            // parent.append( BlockUIElement.toggle('block', 'enabled', 'is', enabled, enabled == 'on' ? 'off' : 'on') );

            var keys = { 'selected': 'selected' , 'can be selected': 'canSelect', 'can be deselected': 'canDeselect' };
            var key = keys[attribute];
            if ($.isEmptyObject(values)) {
                values[key] = 'on';
            }
            parent.append( BlockUIElement.toggle('block', key, '', values[key], values[key] == 'on' ? 'off' : 'on') );
            break;

        case 'drag type':
            var dropdown = BlockUIElement.dropdown('subdropdown', 'dragType', 'block', (values.dragType ? values.dragType : 'select drag'), Global.dragTypes);
            parent.append( dropdown );
            if ( values.dragType && values.dragType != 'select drag' ) {
                this.attributeFieldsForChange( editor, dropdown, uuid, objectType, values.dragType, values );
            }
            break;

        case 'move': case 'rotate': case 'transform handles':
            if ( attribute == 'transform handles' ) {
                if ( values.show == undefined )
                    values.show = 'when selected';
                parent.append( BlockUIElement.toggle('block', 'show', 'show', values.show, values.show == 'when selected' ? 'always' : 'when selected') );
            }

            parent.append( BlockUIElement.label('block', '', 'enable movement in') );
            var axis = values.axis ?? 'x';
            parent.append( BlockUIElement.dropdown('axis', 'axis', 'block', axis, Global.axes) );
            values.value = values.value ?? "on";
            parent.append( BlockUIElement.dropdown('', 'value', 'block', values.value, Global.conditions.toggle) );
            break;

        case 'controls':
            var controls = (objectType == 'OrthographicCamera' || objectType == 'PerspectiveCamera') ? Global.cameraControls : Global.objectControls;
            var dropdown = BlockUIElement.dropdown('subdropdown', 'control', 'block', (values.control == undefined ? 'none' : values.control), controls);
            parent.append( dropdown );
            if ( values.control && values.control != 'none' ) {
                this.attributeFieldsForChange( editor, dropdown, uuid, objectType, values.control, values );
            }
            break;

        case 'keyboard':
            if (!values.movement) {
                values.movement = 'local movements';
                values.direction = Global.keyboard[0];
            }
            parent.append( BlockUIElement.toggle('block', 'movement', '', values.movement, values.movement == 'local movements' ? 'global movements' : 'local movements') );
            parent.append( BlockUIElement.dropdown( '', 'direction', 'block', values.direction, Global.keyboard ) );
            parent.append( BlockUIElement.editable( 'block', 'speed', 'speed: ', values.speed ) );
            BlockUIElement.clock( parent, 'duration', values.duration );
            parent.append( BlockUIElement.easingDropdown( 'easing', values.easing, values.easingType ) );
            break;

        case 'bounce':
            parent.append( BlockUIElement.editable( 'block', 'speed', 'speed: ', values.speed ) );
            BlockUIElement.clock( parent, 'duration', values.duration );
            parent.append( BlockUIElement.easingDropdown( 'easing', values.easing, values.easingType ) );
            parent.append( BlockUIElement.label( 'block', '', 'direction' ) );
            parent.append( BlockUIElement.dropdown('axis', 'axis', 'block', values.axis ? values.axis : 'x', Global.axes) );
            parent.append( BlockUIElement.editable( 'block', 'start', '', values.start ) );
            break;

        case 'orbit':
            if (dropdown.data('key') == 'mode') {
                if (!values.enabled) {
                    values.enabled = 'off';
                }
                parent.append( BlockUIElement.editable('block', 'min', 'min: ', values.min) );
                parent.append( BlockUIElement.editable('block', 'max', 'max: ', values.max) );
                parent.append( BlockUIElement.toggle( 'block', 'enabled', '', values.enabled, values.enabled == 'on' ? 'off' : 'on' ) );
            } else {
                if (!values.mode) {
                    values.mode = Global.orbit[0];
                }
                var modeDropdown = BlockUIElement.dropdown( 'subdropdown', 'mode', 'block', values.mode, Global.orbit );
                parent.append( modeDropdown );
                this.attributeFieldsForChange(editor, modeDropdown, uuid, objectType, values.mode, values );
            }
            break;

        case 'center':
            parent.append( BlockUIElement.editable('block', 'x', 'x: ', values.x) );
            parent.append( BlockUIElement.editable('block', 'y', 'y: ', values.y) );
            parent.append( BlockUIElement.editable('block', 'z', 'z: ', values.z) );
            break;

        case 'zoom': case 'pitch':
            if (!values.enabled) {
                values.enabled = 'off';
            }
            parent.append( BlockUIElement.editable('block', 'min', 'min: ', values.min) );
            parent.append( BlockUIElement.editable('block', 'max', 'max: ', values.max) );
            parent.append( BlockUIElement.toggle( 'block', 'enabled', '', values.enabled, values.enabled == 'on' ? 'off' : 'on' ) );
            break;

        case 'pointer lock':
            if (!values.direction) {
                values.direction = Global.pointerLock[0];
            }
            parent.append( BlockUIElement.label( 'block', '', 'local movement' ) );
            parent.append( BlockUIElement.dropdown( '', 'direction', 'block', values.direction, Global.pointerLock ) );
            parent.append( BlockUIElement.editable('block', 'speed', 'speed: ', values.speed) );
            BlockUIElement.clock( parent, null, values.duration );
            parent.append( BlockUIElement.easingDropdown( 'easing', values.easing, values.easingType ) );
            break;

        case 'follow':
            parent.append( BlockUIElement.movementDropdown(editor, attribute, values, 'cam-movements') );
            parent.append( BlockUIElement.editable('block', 'distance', 'distance: ', values.distance) );
            BlockUIElement.clock( parent, null, values.duration );
            parent.append( BlockUIElement.easingDropdown( 'easing', values.easing, values.easingType ) );
            break;

        case 'WASDRF':
            if (!values.mode) {
                values.mode = 'movement speed';
            }
            parent.append( BlockUIElement.toggle( 'block', 'mode', '', values.mode, values.mode == 'movement speed' ? 'pointer speed' : 'movement speed' ) );
            parent.append( BlockUIElement.editable('block', 'value', '', values.value) );
            BlockUIElement.clock( parent, null, values.duration );
            parent.append( BlockUIElement.easingDropdown( 'easing', values.easing, values.easingType ) );
            break;

        case 'filter':
            var filterDropdown = BlockUIElement.dropdown('filter', 'type', 'block', (values.type ? values.type : 'select filter'), Global.filter);
            parent.append(filterDropdown);
            return filterDropdown;

        case 'glitch': case 'outline':
            if (!values.enabled) {
                values.enabled = 'off';
            }
            parent.append( BlockUIElement.dropdown('', 'enabled', 'block', values.enabled, Global.conditions.toggle) );
            break;

        case 'color adjust': case 'mosaic': 
            if (!values.enabled) {
                values.enabled = 'off';
            } else if (!values.mode) {
                values.mode = Global.filters[attribute][0];
            }
            parent.append( BlockUIElement.toggle( 'block', 'enabled', '', values.enabled, values.enabled == 'on' ? 'off' : 'on' ) );
            if (values.enabled == 'on') {
                parent.append( BlockUIElement.dropdown( '', 'mode', 'block', values.mode, Global.filters[attribute] ) );
                parent.append( BlockUIElement.editable('block', 'value', '', values.value) );
                BlockUIElement.clock( parent, 'duration', values.duration );
                parent.append( BlockUIElement.easingDropdown( 'easing', values.easing, values.easingType ) );
            }
            break;

        case 'depth-of-field': case 'bloom':{

            const depthOfFieldProperties = ["focus", "aperture", "maxblur", "toggle"];
            const bloomProperties = ["exposure", "threshold", "strength", "radius", "toggle"];

            const properties = attribute === "bloom"? bloomProperties: depthOfFieldProperties;

            values.isAbout = values.isAbout || properties[0];

            const {isAbout} = values;

            const isAboutDropdown = BlockUIElement.dropdown('wrapperClassName','isAbout','block', values.isAbout, properties, {onChange:refreshLogicBlock});

            parent.append(isAboutDropdown);

            // if (!values.enabled) {
            //     values.enabled = 'off';
            // } else if (!values.mode) {
            //     values.mode = Global.filters[attribute][0];
            // }

            switch (isAbout){
                case 'toggle':
                    values.toggle = values.toggle ?? "on";
                    parent.append( BlockUIElement.dropdown('', 'toggle', 'block', values.toggle, Global.conditions.toggle) );
                    break;
                default:
                    parent.append( BlockUIElement.editable('block', isAbout, '', values[isAbout]) );
                    BlockUIElement.clock( parent, 'duration', values.duration );
                    parent.append( BlockUIElement.easingDropdown( 'easing', values.easing, values.easingType ) );
            }
            break;
           
        }

        case 'fade':
            if (!values.enabled) {
                values.enabled = 'off';
            } else if (!values.mode) {
                values.mode = 'color';
                values.color = '#ffffff';
            }
            parent.append( BlockUIElement.toggle( 'block', 'enabled', '', values.enabled, values.enabled == 'on' ? 'off' : 'on' ) );
            if (values.enabled == 'on') {
                var modeDropdown = BlockUIElement.dropdown( 'subdropdown', 'mode', 'block', values.mode, Global.filters.fade );
                parent.append( modeDropdown );
                this.attributeFieldsForChange(editor, modeDropdown, uuid, objectType, values.mode, values );
            }
            break;

        case 'invert':  
            if (!values.enabled) {
                values.enabled = 'off';
            }
            parent.append( BlockUIElement.toggle( 'block', 'enabled', '', values.enabled, values.enabled == 'on' ? 'off' : 'on' ) );
            if (values.enabled == 'on') {
                var label = attribute == 'invert' ? 'amount: ' : attribute == 'comic' ? 'scale: ' : 'strength: ';
                parent.append( BlockUIElement.editable('block', 'value', label, values.value) );
                BlockUIElement.clock( parent, '' , values.duration );
            }
            break;
        case 'trails': case 'comic': {
            const trailsProperties = ['strength', 'toggle'];
            const comicProperties = ['scale', 'toggle'];
            
            const properties =attribute === "comic"? comicProperties: trailsProperties;

            values.isAbout = values.isAbout || properties[0];

            const {isAbout} = values;

            const isAboutDropdown = BlockUIElement.dropdown('wrapperClassName','isAbout','block', values.isAbout, properties, {onChange:refreshLogicBlock});

            parent.append(isAboutDropdown);
            
            if (isAbout==="toggle"){
                values.toggle = values.toggle ?? "on";
                parent.append( BlockUIElement.dropdown('', 'toggle', 'block', values.toggle, Global.conditions.toggle) );
            }else{
                // parent.append( BlockUIElement.editable('block', 'value','',  values.value) );
                parent.append( BlockUIElement.editable('block', isAbout,'',  values[isAbout]) );
                BlockUIElement.clock( parent, '' , values.duration );
                parent.append( BlockUIElement.easingDropdown( 'easing', values.easing, values.easingType ) );
            }
           
          
            break;
        }

        case 'refraction':
            if (!values.enabled) {
                values.enabled = 'off';
            } else if (!values.mode) {
                values.mode = 'map';
            }
            parent.append( BlockUIElement.toggle( 'block', 'enabled', '', values.enabled, values.enabled == 'on' ? 'off' : 'on' ) );
            if (values.enabled == 'on') {
                var modeDropdown = BlockUIElement.dropdown( 'subdropdown', 'mode', 'block', values.mode, Global.filters.refraction );
                parent.append( modeDropdown );
                this.attributeFieldsForChange(editor, modeDropdown, uuid, objectType, values.mode, values );
            }
            break;

        case 'blending':
            parent.append( BlockUIElement.dropdown('blending', 'value', 'block', ($.isEmptyObject(values) ? 'none' : values.value), Global.blendings) );
            break;

        case 'blend mode': case 'emitter type':
            if (!values.enabled) {
                values.enabled = 'off';
            }
            parent.append( BlockUIElement.dropdown('blendMode', 'value', 'block', (!values.value ? Global.particle[attribute][0] : values.value), Global.particle[attribute]) );
            break;

        case 'age': case 'wiggle':
            if (!values.mode) {
                values.mode = 'F';
            }
            parent.append( BlockUIElement.toggle( 'block', 'mode', '', values.mode, values.mode == 'F' ? '+/-' : 'F' ) );
            parent.append( BlockUIElement.editable('block', 'value', '', values.value) );
            BlockUIElement.clock( parent, null, values.duration );
            parent.append( BlockUIElement.easingDropdown( 'easing', values.easing, values.easingType ) );
            break;

        case 'sides':
            parent.append( BlockUIElement.dropdown('sides', 'value', 'block', ($.isEmptyObject(values) ? 'front' : values.value), Global.sides) );
            break;

        case 'curve type':
            parent.append( BlockUIElement.dropdown('curvetype', 'value', 'block', ($.isEmptyObject(values) ? 'centripetal' : values.value), Global.curveTypes) );
            break;

        case 'fog':
            var fogDropdown = BlockUIElement.dropdown('subdropdown', 'type', 'block', ($.isEmptyObject(values) ? 'none' : values.type), Global.fogs);
            parent.append( fogDropdown );
            return fogDropdown;

        case 'active camera':
            parent.append( BlockUIElement.cameraDropdown( editor, values, 'cameras') );
            break;

        case 'linear':
            let properties = ["color", "toggle", "near", "far"];
            values.isAbout = values.isAbout || properties[0];

            const {isAbout} = values;

            const isAboutDropdown = BlockUIElement.dropdown('wrapperClassName','isAbout','block', values.isAbout, properties, {onChange:refreshLogicBlock});

            parent.append(isAboutDropdown);


            switch (isAbout){
                case 'color':{
                    values.color = values.color ?? '#ffffff';

                    parent.append( BlockUIElement.label('block', 'color', values.color) );
                    parent.append( BlockUIElement.color('block', values.color) );
                    break;
                }
                case 'near':{
                    values.near = values.near ?? 0.5;
                    parent.append( BlockUIElement.editable('block', 'near', '', values.near));
                    BlockUIElement.clock( parent, 'durationNear', values.durationNear );
                    parent.append( BlockUIElement.easingDropdown( 'nearEasing', values.nearEasing, values.nearEasingType ) );
                    break;
                }
                case 'far':{
                    values.far = values.far ?? 50;

                    parent.append( BlockUIElement.editable('block', 'far', '', values.far));
                    BlockUIElement.clock( parent, 'durationFar', values.durationFar );
                    parent.append( BlockUIElement.easingDropdown( 'farEasing', values.farEasing, values.farEasingType ) );
                    break;
                }
                case 'toggle' :{
                    values.toggle = values.toggle ?? "on";
                    parent.append( BlockUIElement.dropdown('', 'toggle', 'block', values.toggle, Global.conditions.toggle) );
                }

            }
           
            break;

        case 'exponential':{
            let properties = ["color", "density", "toggle"];
            values.isAbout = values.isAbout ?? properties[0];
        
            const {isAbout} = values;

            const isAboutDropdown = BlockUIElement.dropdown('wrapperClassName','isAbout','block', values.isAbout, properties, {onChange:refreshLogicBlock});

            parent.append(isAboutDropdown);

            if (isAbout === "color"){
                values.color = values.color ?? '#ffffff';

                parent.append( BlockUIElement.label('block', 'color', values.color) );
                parent.append( BlockUIElement.color('block', values.color) );
            }else if (isAbout === "density"){
                values.density = values.density ?? 0.1;

                parent.append( BlockUIElement.editable('block', 'density', '', values.density));
                BlockUIElement.clock( parent, 'duration', values.duration );
                parent.append( BlockUIElement.easingDropdown( 'easing', values.easing, values.easingType ) );
            }else if (isAbout === "toggle"){
                values.toggle = values.toggle ?? "on";
                parent.append( BlockUIElement.dropdown('', 'toggle', 'block', values.toggle, Global.conditions.toggle) );
            }
           
           
            break;
        }

        default:
            var action = null;
            if (property == 'animation') {
                if (!dropdown.hasClass('actions')) {
                    dropdown.attr('data-objectType', values.id);
                    parent.append( BlockUIElement.dropdown('actions', 'action', 'block', values.action ? values.action : 'select action', Global.animationActions) );
                }
                var action = values.action;
                if (dropdown.hasClass('actions')) {
                    action = dropdown.find('.block-text').text();
                }
            }
            if (property != 'animation' || action == 'speed' || action == 'blend') {
                parent.append( BlockUIElement.editable('block', 'value', '', values.value) );
                if (objectType != 'Particle' && (property !== "custom attribute" && objectType !== "Scene")) {
                    BlockUIElement.clock( parent, null, values.duration );
                    parent.append( BlockUIElement.easingDropdown( 'easing', values.easing, values.easingType ) );
                }
            }
            break;
    }

};

BlockUI.timeline = function ( options, editor ) {

    var block = this.wrapper( options, 'timeline' );
    var action = this.action();

    var actionDropdown = BlockUIElement.dropdown('actions', '', 'block', options.action ? options.action : 'select action', Global.timelineActions);
    action.append( BlockUIElement.label( 'block', '', 'timeline' ) );
    action.append( actionDropdown );

    this.timelineAttributes( editor, actionDropdown, options.action, options );

    block.append(action);
    block.append( this.cursor() );

    return block;
};

BlockUI.timelineAttributes = function ( editor, dropdown, action, attrs ) {

    if ( dropdown.hasClass('actions') ) {

        var parent = dropdown.parent();
        var timelineName = attrs.index ? editor.timelines[attrs.index].name : 'select timeline';
        var timelineDropdown = BlockUIElement.dropdown('timelines', '', 'block', timelineName, editor.timelines);

        dropdown.nextAll().remove();
        dropdown.attr('data-key', action);
        if ( attrs.index ) {
            timelineDropdown.attr('data-key', attrs.index);
        }

        if ( $.isEmptyObject(attrs) ) {
            attrs =  { condition: 'time', gotoAction: 'and play', duration: 0 };
        }

        switch ( action ) {

            case 'play': case 'bounce':
                parent.append( timelineDropdown );
                var times = BlockUIElement.editable('block', 'times', '', attrs.times);
                parent.append( times );
                if ( attrs.condition == 'forever')
                    times.hide();
                parent.append( BlockUIElement.toggle('block condition', 'condition', '', attrs.condition, (attrs.condition == 'time' ? 'forever' : 'time')) )
                break;

            case 'stop': case 'pause':
                parent.append( timelineDropdown );
                break;

            case 'go to timecode':
                parent.append( BlockUIElement.editable('block', 'duration', 'seconds: ', attrs.duration) );
                parent.append( timelineDropdown );
                parent.append( BlockUIElement.toggle('block', 'gotoAction', '', attrs.gotoAction, (attrs.gotoAction == 'and play' ? 'and pause' : 'and play')) )
                break;

            case 'connect to mouse':
                parent.append( timelineDropdown );
                parent.append( BlockUIElement.dropdown( 'connects', '', 'block', attrs.connect ? attrs.connect : Global.timelineConnects[0], Global.timelineConnects ) );
                parent.append( BlockUIElement.editable( 'block', 'multiplier', 'multiplier: ', attrs.multiplier ) );
                break;
        }

    }

};

BlockUI.link = function ( options ) {

    var block = this.wrapper( options, 'link' );
    var action = this.action();

    action.append( BlockUIElement.label('block', '', 'link') );
    action.append( BlockUIElement.toggle('block', 'target', '', options.target, (options.target == 'new page' ? 'this page' : 'new page')) );
    action.append( BlockUIElement.editable('block', 'url', '', options.url) );

    block.append(action);
    block.append( this.cursor() );

    return block;

};

BlockUI.play = function ( options, editor ) {
    var block = this.wrapper( options, 'play' );
    var action = this.action();

    var actionDropdown = BlockUIElement.dropdown('actions', '', 'block', options.action, options.mode != 'animation' ? Global.playActions : Global.playAnimationActions, {onChange:refreshLogicBlock});
    action.append( actionDropdown );

    var modeDropdown = BlockUIElement.dropdown('modes', '', 'block', options.mode ? options.mode : 'audio', Global.playModes, {onChange:refreshLogicBlock});
    action.append( modeDropdown );

    var audioDropdown = BlockUIElement.dropdown('audios', '', 'block', options.audio ? options.audio : 'select audio', editor.assets.getItems( 'audios' ));
    action.append( audioDropdown );

    var videoDropdown = BlockUIElement.dropdown('videos', '', 'block', options.video ? options.video : 'select video', editor.assets.getItems( 'videos' ));
    action.append( videoDropdown );

    var animationDropdown = BlockUIElement.dropdown('animations', '', 'block', options.animation ? options.animation : 'select animation', editor.assets.getItems( 'animations' ));
    action.append( animationDropdown );

    var framerate = BlockUIElement.editable('block play-animation', 'framerate', 'frame rate:', options.framerate);
    action.append( framerate );

    var frame = BlockUIElement.editable('block play-animation frame', 'frame', 'frame:', options.frame);
    action.append( frame );

    var playObjectsDropdown = BlockUIElement.playObjectsDropdown( editor, options, 'block' );
    action.append( playObjectsDropdown );

    var textureLabel = BlockUIElement.label('block play-video-animation scene', '', options.objectType == 'Scene' ? 'texture' : 'map');
    action.append( textureLabel );

    var mapLabel = BlockUIElement.label('block play-video-animation mesh', '', 'material');
    action.append( mapLabel );

    var mapDropdown = BlockUIElement.dropdown('play-video-animation maps mesh', '', 'block', options.map ? options.map : 'select material', Global.attributes.Mesh.map);
    action.append( mapDropdown );

    options.jumpToAndPlayOrPause = options.jumpToAndPlayOrPause ?? "and pause"; 

    /**  for jump to frame */ 
    let jumpToAndPlayOrPauseBlock = BlockUIElement.dropdown('jump-to-and-play-or-pause','jump-to-and-play-or-pause','block', options.jumpToAndPlayOrPause, ["and pause", "and play"], {onChange:refreshLogicBlock});
    action.append( jumpToAndPlayOrPauseBlock );


    options.iterationType = options.iterationType ?? "forever"; 

    let iterationCountBlock = BlockUIElement.editable('block', 'iterationCount','', options.iterationCount ?? 1);
    action.append( iterationCountBlock );
    iterationCountBlock.attr('data-key', 'iterationCount');

    let iterationTypeBlock = BlockUIElement.dropdown('iteration-type','iteration-type','block', options.iterationType ?? "forever", ["forever", "times"], {onChange:refreshLogicBlock});
    action.append( iterationTypeBlock );

    options.sensitivity = options.sensitivity ?? 1; 

    let sensitivityBlock = BlockUIElement.editable('block', 'sensitivity','sensitivity', options.sensitivity);
    action.append( sensitivityBlock );
    sensitivityBlock.attr('data-key', 'sensitivity');

    audioDropdown.hide();
    videoDropdown.hide();
    animationDropdown.hide();
    iterationCountBlock.hide();
    iterationTypeBlock.hide();
    jumpToAndPlayOrPauseBlock.hide();
    sensitivityBlock.hide();

    action.find('.play-animation').hide();

    if (options.mode == 'audio') {
        audioDropdown.show();
        action.find('.play-video-animation').hide();
    } else {
        if (options.mode == 'video') {
            videoDropdown.show();
        } else {
            animationDropdown.show();

            if (options.action !== "jump to frame" && options.action !== "play with scroll" ){ 
                framerate.show()
            };

            if (options.action === "play with scroll"){
                sensitivityBlock.show()
            }

            if (
                (options.action !== "jump to frame"
                || options.jumpToAndPlayOrPause !== "and pause")
                && options.action !== "play with scroll"
                ){

                iterationTypeBlock.show();

                if (options.iterationType === "times"){
                    iterationCountBlock.show();
                }
            }

            


            if (options.action == 'jump to frame') {
                jumpToAndPlayOrPauseBlock.show();
                frame.show();
            }
        }
        if (options.objectType == 'Scene' || options.objectType == 'SpotLight') {
            mapLabel.hide();
            mapDropdown.hide();
        } else {
            textureLabel.hide();
        }
    }

    if ( options.action ) {
        actionDropdown.attr('data-type', options.action);
    }
    if ( options.mode ) {
        modeDropdown.attr('data-type', options.mode);
    }
    if ( options.map ) {
        mapDropdown.attr('data-type', options.map);
    }
    if ( options.audio && options.audioId ) {
        audioDropdown.attr('data-uuid', options.audio);
        audioDropdown.attr('data-type', options.audioId);
    }
    if ( options.video && options.videoId ) {
        videoDropdown.attr('data-uuid', options.video);
        videoDropdown.attr('data-type', options.videoId);
    }
    if ( options.animation && options.animationId ) {
        animationDropdown.attr('data-uuid', options.animation);
        animationDropdown.attr('data-type', options.animationId);
    
    }

    block.append(action);
    block.append(this.cursor());

    return block;
};

