window.Global = {

    trigger: {
        Trigger: [ "key", "mouse" ],
        Key: [ "was pressed", "is up", "was pressed +repeat", "is released", "is held down" ],
        MouseEvent: { click: [ "was pressed", "is up", "was pressed +repeat", "is released", "is held down" ], move: [ "is moving", "is not moving" ] },
        MouseButton: [ "left", "mid", "right" ]
    },

    attributes: {
        Group: {
            movement: [ 'direction', 'rotation', 'grow', 'look at', 'go to', 'controls' ],
            selectable: [ 'selected', 'can be selected', 'can be deselected', 'drag type' ],
            spacial: [ 'position', 'rotation', 'scale' ],
            render: [ 'cast shadow', 'receive shadow', 'visible' ],
        },
        Mesh: {
            movement: [ 'direction', 'rotation', 'grow', 'look at', 'go to', 'controls' ],
            selectable: [ 'selected', 'can be selected', 'can be deselected', 'drag type' ],
            spacial: [ 'position', 'rotation', 'scale' ],
            limit: [ 'position', 'rotation', 'scale' ],
            render: [ 'cast shadow', 'receive shadow', 'visible' ],
            geometry: {
                BoxGeometry: ['width', 'height', 'depth', 'width segments', 'height segments', 'depth segments'],
                CircleGeometry: ['radius', 'segments', 'theta start', 'theta length'],
                CylinderGeometry: ['radius top', 'radius bottom', 'height', 'radial segments', 'height segments', 'open ended'],
                DodecahedronGeometry: ['radius', 'detail'],
                IcosahedronGeometry: ['radius', 'detail'],
                LatheGeometry: ['segments', 'phi start', 'phi length'],
                OctahedronGeometry:[ 'radius', 'detail'],
                PlaneGeometry: ['width', 'height', 'width segments', 'height segments'],
                RingGeometry: ['inner radius', 'outer radius', 'theta segments', 'phi segments', 'theta start', 'theta length'],
                SphereGeometry: ['radius', 'width segments', 'height segments', 'phi start', 'phi length', 'theta start', 'theta length'],
                TetrahedronGeometry: ['radius', 'detail'],
                TorusGeometry: ['radius', 'tube', 'radial segments', 'tubular segments', 'arc'],
                TorusKnotGeometry: ['radius', 'tube', 'radial segments', 'tubular segments', 'p', 'q'],
                TubeGeometry: ['radius', 'tubular segments', 'radial segments', 'closed', 'curve type'],
                TextGeometry: ['font', 'text', 'size', 'extruded', 'thickness', 'curve detail', 'bevel', 'bevel thickness', 'bevel size']
            },
            material: {
                MeshBasicMaterial: ['color', 'vertex colors', 'skinning', 
                                'map', 'alpha map', 'specular map', 'env map', 'light map', 'ao map',
                                'sides', 'flat shading', 'blending', 'opacity', 'transparent', 'alpha test', 'depth test', 'depth write', 'wireframe'],
                MeshDepthMaterial: ['vertex colors', 'skinning', 
                                'map', 'alpha map', 'displacement map',
                                'sides', 'flat shading', 'blending', 'opacity', 'transparent', 'alpha test', 'depth test', 'depth write', 'wireframe'],
                MeshNormalMaterial: ['vertex colors', 'skinning', 
                                'bump map', 'normal map', 'displace map', 
                                'sides', 'flat shading', 'blending', 'opacity', 'transparent', 'alpha test', 'depth test', 'depth write', 'wireframe'],    
                MeshLambertMaterial: ['color', 'emissive', 'vertex colors', 'skinning', 
                                'map', 'alpha map', 'specular map', 'env map', 'light map', 'ao map', 'emissive map',
                                'sides', 'flat shading', 'blending', 'opacity', 'transparent', 'alpha test', 'depth test', 'depth write', 'wireframe'],    
                MeshMatcapMaterial: ['color', 'vertex colors', 'skinning', 
                                'map', 'matcap', 'alpha map', 'bump map', 'normal map', 'displacement map',
                                'sides', 'flat shading', 'blending', 'opacity', 'transparent', 'alpha test', 'depth test', 'depth write'],
                MeshPhongMaterial: ['color', 'emissive', 'vertex colors', 'skinning', 
                                'map', 'alpha map', 'bump map', 'normal map', 'displacement map', 'specular map', 'env map', 'light map', 'ao map', 'emissive map',
                                'sides', 'flat shading', 'blending', 'opacity', 'transparent', 'alpha test', 'depth test', 'depth write', 'wireframe'],
                MeshToonMaterial: ['color', 'emissive', 'vertex colors', 'skinning', 
                                'map', 'alpha map', 'bump map', 'normal map', 'displacement map', 'light map', 'ao map', 'emissive map', 'gradient map',
                                'sides', 'flat shading', 'blending', 'opacity', 'transparent', 'alpha test', 'depth test', 'depth write', 'wireframe'],
                MeshStandardMaterial: ['color', 'roughness', 'metalness', 'emissive', 'emissive intensity', 'vertex colors',  
                                'map', 'alpha map', 'bump map', 'normal map', 'displacement map', 'roughness map', 'metalness map', 'env map', 'light map', 'ao map', 'emissive map',
                                'sides', 'flat shading', 'blending', 'opacity', 'transparent', 'alpha test', 'depth test', 'depth write', 'wireframe'],
                MeshPhysicalMaterial: ['color', 'roughness', 'metalness', 'emissive', 'clearcoat', 'clearcoat roughness', 'vertex colors', 'vertex tangents', 'skinning', 
                                'map', 'alpha map', 'bump map', 'normal map', 'clearcoat normal map', 'displacement map', 'rough map', 'metal map', 'env map', 'light map', 'ao map', 'emissive map',
                                'sides', 'flat shading', 'blending', 'opacity', 'transparent', 'alpha test', 'depth test', 'depth write', 'wireframe'],
                ShaderMaterial: ['vertex colors', 'skinning', 
                                'sides', 'flat shading', 'blending', 'opacity', 'transparent', 'alpha test', 'depth test', 'depth write', 'wireframe'],
                RawShaderMaterial: ['vertex colors', 'skinning', 
                                'sides', 'flat shading', 'blending', 'opacity', 'transparent', 'alpha test', 'depth test', 'depth write', 'wireframe'],
                ShadowMaterial: ['color', 'vertex colors', 'flat shading', 'blending', 'opacity', 'transparent', 'alpha test', 'depth test', 'depth write'],
                
            },
            map: [ 'map', 'alpha map', 'bump map', 'normal map', 'clearcoat map', 'displacement map', 'rough map', 'metal map', 'enviro map', 'light map', 'ao map', 'emissive map', 'specular map', 'gradient map' ],
        },
        AmbientLight: {
            movement: [ 'direction', 'go to' ],
            spacial: [ 'position' ],
            limit: [ 'position' ],
            styling: [ 'intensity', 'color' ],
            render: [ 'visible' ],
        },
        DirectionalLight: {
            movement: [ 'direction', 'go to' ],
            spacial: [ 'position' ],
            limit: [ 'position' ],
            styling: [ 'intensity', 'color' ],
            render: [ 'cast shadow', 'shadow bias', 'shadow radius', 'visible' ],
        },
        HemisphereLight: {
            movement: [ 'direction', 'go to' ],
            spacial: [ 'position' ],
            limit: [ 'position' ],
            styling: [ 'intensity', 'color', 'ground color' ],
            render: [ 'visible' ],
        },
        PointLight: {
            movement: [ 'direction', 'go to' ],
            spacial: [ 'position' ],
            limit: [ 'position' ],
            styling: [ 'intensity', 'color', 'distance', 'decay' ],
            render: [ 'cast shadow', 'shadow bias', 'shadow radius', 'visible' ],
        },
        SpotLight: {
            movement: [ 'direction', 'go to' ],
            spacial: [ 'position' ],
            limit: [ 'position' ],
            styling: [ 'intensity', 'color', 'distance', 'angle', 'penumbra', 'decay' ],
            render: [ 'cast shadow', 'shadow bias', 'shadow radius', 'visible' ],
        },
        RectAreaLight: {
            movement: [ 'direction', 'rotation', 'go to' ],
            spacial: [ 'position', 'rotation', 'width', 'height' ],
            limit: [ 'position' ],
            styling: [ 'color', 'intensity' ],
            render: [ 'cast shadow', 'visible' ],
        },
        OrthographicCamera: {
            movement: [ 'direction', 'rotation', 'go to', 'controls' ],
            spacial: [ 'position', 'rotation', 'scale' ],
            limit: [ 'position', 'rotation', 'scale' ],
            lens: [ 'left', 'right', 'top', 'bottom', 'near', 'far' ],
            render: [ 'cast shadow', 'receive shadow', 'visible' ]
        },
        PerspectiveCamera: {
            movement: [ 'direction', 'rotation', 'go to', 'controls' ],
            spacial: [ 'position', 'rotation', 'scale' ],
            limit: [ 'position', 'rotation', 'scale' ],
            lens: [ 'fov', 'near', 'far' ],
            render: [ 'cast shadow', 'receive shadow', 'visible' ]
        },
        Scene: {
            environment: [ 'background', 'environment', 'fog', 'filter', 'active camera' ],
            spacial: [ 'position', 'rotation', 'scale' ],
            render: [ 'cast shadow', 'receive shadow', 'visible' ],
            'custom attribute': [],
        },
        Particle: {
            movement: [ 'direction', /* 'rotation', */ 'go to', 'controls' ],
            spacial: [ 'position', /* 'rotation', */ 'scale' ],
            // styling: [ 'particle texture', 'particle count', 'blend mode', 'direction', 'particle rate', 'duration', 'emitter type', 'age', 'position', 'velocity', 'acceleration', 'wiggle' ],
            // render: [ 'cast shadow', 'receive shadow', 'visible' ],
        }
    },

    attributeConditions: {
        Tag: [ 'position', 'rotation', 'scale', 'visible' ],
        Mesh: [ 'position', 'rotation', 'scale', 'visible', 'movement' ],
        AmbientLight: [ 'position', 'intensity', 'visible', 'movement' ],
        DirectionalLight: [ 'position', 'intensity', 'shadow', 'visible', 'movement' ],
        HemisphereLight: [ 'position', 'intensity', 'visible', 'movement' ],
        PointLight: [ 'position', 'intensity', 'distance', 'decay', 'shadow', 'visible', 'movement' ],
        SpotLight: [ 'position', 'intensity', 'distance', 'angle', 'penumbra', 'decay', 'shadow', 'visible', 'movement' ],
        OrthographicCamera: [ 'position', 'rotation', 'scale', 'left', 'right', 'top', 'bottom', 'near', 'far', 'visible', 'movement' ],
        PerspectiveCamera: [ 'position', 'rotation', 'scale', 'fov', 'near', 'far', 'visible', 'movement' ],
        Group: [ 'position', 'rotation', 'scale', 'visible', 'movement' ],
        Scene: [ 'fog', 'position', 'rotation', 'scale', 'shadow', 'visible', 'active camera', ],
        selection: [ 'is clicked', 'is selected', 'de-selected', 'is not selected', 'cursor is over object', ],
    },

    collision: [ 'is touching', 'is not touching', 'has touched' ],

    filter: [ /*'color adjust', 'fade', 'invert', 'refraction', 'mosaic'*/, 'comic', 'glitch', 'bloom', 'outline', 'trails', 'depth-of-field' ],

    filters: {
        'color adjust': [ 'hue', 'saturation', 'vibrance', 'brightness', 'contrast' ],
        fade: [ 'color', 'amount' ],
        refraction: [ 'map', 'scale', 'invert' ],
        mosaic: [ 'scale', 'fade' ],
        bloom: [ 'exposure', 'threshold', 'strength', 'radius' ],
        'depth-of-field': [ 'focus', 'aperture', 'maxblur' ],
    },

    timelineActions: [ 'play', 'bounce', 'stop', 'pause', 'go to timecode', 'connect to mouse' ],

    timelineConnects: [ 'cursor position in X', 'cursor position in Y', 'mouse scroll' ],

    playActions: [ 'play', 'pause', 'stop', 'loop' ],

    playAnimationActions: [ 'play', 'pause', 'stop', 'loop', 'bounce', 'play then stop', 'play backwards','loop backwards', 'jump to frame', 'play with scroll' ],

    animationActions: ['play', 'pause', 'stop', 'loop', 'play once', 'speed', 'blend'],

    playModes: [ 'audio', 'video', 'animation' ],

    easing: [ 'Quadratic', 'Cubic', 'Quartic', 'Quintic', 'Sinusoidal', 'Exponential', 'Circular', 'Elastic', 'Back', 'Bounce'],

    axes: [ 'x', 'y', 'z' ],

    dragTypes: ['none', 'move', 'rotate', 'transform handles'],

    objectControls: [ 'keyboard', 'bounce' ],

    cameraControls: ['none', 'orbit', 'map', 'pointer lock', 'look at', 'follow', 'WASDRF' ],

    'look at': [ 'x', 'y', 'z' ],

    'go to': [ 'x', 'y', 'z' ],

    orbit: [ 'center', 'zoom', 'zoom speed', 'orbit', 'pitch' ],

    map: [ 'zoom', 'zoom speed', ],

    pointerLock: [ 'Move +X', 'Move -X', 'Move +Z', 'Move -Z', 'Y Position' ],

    keyboard: [ 'Move +X', 'Move -X', 'Move +Y', 'Move -Y', 'Move +Z', 'Move -Z', 'Pitch +X', 'Pitch -X', 'Yaw +Y', 'Yaw -Y', 'Roll +Z', 'Roll -Z' ],

    bounce: [ 'speed', 'start direction' ],

    blendings: [ 'none', 'normal', 'additive', 'subtractive', 'multiply'],

    particle: {
        'blend mode': [ 'none', 'normal', 'additive', 'subtractive', 'multiply' ],
        'emitter type': [ 'box', 'sphere', 'disc' ],
        'pva': [ 'initial', 'variation' ],
    },

    sides: [ 'front', 'back', 'double' ],

    curveTypes: ['centripetal', 'chordal', 'catmullrom'],

    fogs: ['none', 'linear', 'exponential'],

    background: [ 'none', 'color', 'texture', 'equirect' ],

    conditions: {
        attribute: [ 'is equal to', 'is greater than', 'is less than' ],
        toggle: [ 'on', 'off', 'toggle' ],
        timer: [ 'For', 'After', 'After event', 'Every']
    },
}
