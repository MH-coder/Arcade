import * as THREE from '../../libs/three.module.js';

import { UIRow, UIInput, UIButton, UIText, UINumber, UISpan } from '../components/ui.js';
import { UIColorPicker, UIAccordion, UIStyledCheckbox, UIDropdown } from '../components/ui.openstudio.js';
import { UITexture } from '../components/ui.three.js';

import { SidebarObjectConnection } from './Sidebar.Object.Connection.js';
import { SetValueCommand } from '../../commands/SetValueCommand.js';
import { SetMaterialCommand } from '../../commands/SetMaterialCommand.js';
import { SetMaterialColorCommand } from '../../commands/SetMaterialColorCommand.js';
import { SetMaterialMapCommand } from '../../commands/SetMaterialMapCommand.js';
import { SetMaterialValueCommand } from '../../commands/SetMaterialValueCommand.js';
import { SetMaterialVectorCommand } from '../../commands/SetMaterialVectorCommand.js';

var materialClasses = {
	'LineBasicMaterial': THREE.LineBasicMaterial,
	'LineDashedMaterial': THREE.LineDashedMaterial,
	'MeshBasicMaterial': THREE.MeshBasicMaterial,
	'MeshDepthMaterial': THREE.MeshDepthMaterial,
	'MeshNormalMaterial': THREE.MeshNormalMaterial,
	'MeshLambertMaterial': THREE.MeshLambertMaterial,
	'MeshMatcapMaterial': THREE.MeshMatcapMaterial,
	'MeshPhongMaterial': THREE.MeshPhongMaterial,
	'MeshToonMaterial': THREE.MeshToonMaterial,
	'MeshStandardMaterial': THREE.MeshStandardMaterial,
	'MeshPhysicalMaterial': THREE.MeshPhysicalMaterial,
	'RawShaderMaterial': THREE.RawShaderMaterial,
	'ShaderMaterial': THREE.ShaderMaterial,
	'ShadowMaterial': THREE.ShadowMaterial,
	'SpriteMaterial': THREE.SpriteMaterial,
	'PointsMaterial': THREE.PointsMaterial
};

const MaterialDefinitionMap = {
	'MeshBasicMaterial': `A material that is used to render an object's color and texture without any lighting effects. This can be useful for creating simple, flat-shaded objects.`,
	'MeshDepthMaterial': `A material that is used to render an object's depth information as a grayscale texture. This can be useful for creating effects like shadows or creating a sense of depth in a 3D scene.`,
	'MeshNormalMaterial': `A material that is used to render an object's normals as a colored texture. This can be useful for getting a sense of the shape and curvature of an object.`,
	'MeshLambertMaterial': `A material that is used to create diffusely lit surfaces with a matte finish. It is based on the Lambertian reflectance model and is useful for creating realistic-looking materials such as cloth, paper, or skin.`,
	'MeshMatcapMaterial': `A material that is used to create a rendering of an object using a "matcap" texture. A matcap texture is a special kind of texture that is used to simulate the appearance of various materials and surface finishes. It is typically a sphere map that is used to modulate the diffuse and specular lighting of an object, giving it a unique look and feel.`,
	'MeshPhongMaterial': `A material that is used to create specularly lit surfaces with a glossy finish. It is based on the Phong lighting model and is useful for creating materials such as metal or plastic.`,
	'MeshToonMaterial': `A material that is used to create a cartoon-like, non-photorealistic rendering of an object. It is based on the Toon lighting model and is useful for creating stylized graphics.`,
	'MeshStandardMaterial': `A material that is used to create physically based rendered (PBR) surfaces with a metallic or non-metallic finish. It is based on the principles of physical materials and is useful for creating realistic-looking materials such as metal, plastic, or stone.`,
	'MeshPhysicalMaterial': `A variant of MeshStandardMaterial that is optimized for use with the physically based rendering (PBR) pipeline. It is useful for creating realistic-looking materials such as metal, plastic, or stone.`,
	'RawShaderMaterial': `A material that is used to apply a custom shader to an object. A shader is a program that runs on the graphics processing unit (GPU) and is used to define how an object is rendered. RawShaderMaterial allows you to specify your own shader code, giving you full control over the rendering of an object.`,
	'ShaderMaterial': `A material that is similar to RawShaderMaterial, but allows you to specify your shader code using the GLSL (OpenGL Shading Language) syntax. This can make it easier to write and maintain complex shaders.`,
	'ShadowMaterial': `A material that is used to render the shadows cast by an object. This material is usually used in conjunction with a shadow-casting light source and a receiving object, and is typically not used on objects that are intended to be directly visible in the scene.`
}

function SidebarMaterial( editor ) {

	var strings = editor.strings;

	var signals = editor.signals;

	var currentObject;

	var currentMaterialSlot = 0;

	var epsilon = 0.01 - Number.EPSILON;

	var container = new UIAccordion().setTitle( strings.getKey( 'sidebar/material' ) ).setId( 'material' );

	container.setDisplay( 'none' );

	// Current material slot

	var materialSlotRow = new UIRow();

	materialSlotRow.add( new UIText( strings.getKey( 'sidebar/material/slot' ) ) );

	var materialSlotSelect = new UIDropdown().onChange( update );
	materialSlotSelect.setOptions( { 0: '' } ).setValue( 0 );
	materialSlotRow.add( materialSlotSelect );

	container.addToBody( materialSlotRow );

	// type

	var materialClassRow = new UIRow();
	var materialClass = new UIDropdown().onChange( update );

	materialClassRow.add( new UIText( strings.getKey( 'sidebar/material/type' ) ) );
	materialClassRow.add( materialClass );
	container.addToBody( materialClassRow );

	// material type definition
	var materialDefinitionRow = new UIRow();
	var materialDefinition =  new UIText( "" );
	materialDefinitionRow.add(materialDefinition)
	container.addToBody( materialDefinitionRow );

	materialDefinitionRow.setStyle("height", ["auto"]);
	materialDefinition.setStyle("wordBreak", ["break-word"]);
	materialDefinition.setStyle("whiteSpace", ["normal"]);
	materialDefinition.setStyle("cursor", ["auto"]);


	// name

	var materialNameRow = new UIRow();
	var materialName = new UIInput().setWidth( '150px' ).onChange( function () {

		editor.execute( new SetMaterialValueCommand( editor, editor.selected, 'name', materialName.getValue(), currentMaterialSlot ) );

	} );

	materialNameRow.add( new UIText( strings.getKey( 'sidebar/material/name' ) ) );
	materialNameRow.add( materialName );

	container.addToBody( materialNameRow );

	// program

	var materialProgramRow = new UIRow();
	materialProgramRow.add( new UIText( strings.getKey( 'sidebar/material/program' ) ) );

	var materialProgramInfo = new UIButton( strings.getKey( 'sidebar/material/info' ) );
	materialProgramInfo.setMarginLeft( '4px' );
	materialProgramInfo.onClick( function () {

		signals.editScript.dispatch( currentObject, 'programInfo' );

	} );
	materialProgramRow.add( materialProgramInfo );

	var materialProgramVertex = new UIButton( strings.getKey( 'sidebar/material/vertex' ) );
	materialProgramVertex.setMarginLeft( '4px' );
	materialProgramVertex.onClick( function () {

		signals.editScript.dispatch( currentObject, 'vertexShader' );

	} );
	materialProgramRow.add( materialProgramVertex );

	var materialProgramFragment = new UIButton( strings.getKey( 'sidebar/material/fragment' ) );
	materialProgramFragment.setMarginLeft( '4px' );
	materialProgramFragment.onClick( function () {

		signals.editScript.dispatch( currentObject, 'fragmentShader' );

	} );
	materialProgramRow.add( materialProgramFragment );

	container.addToBody( materialProgramRow );

	// color

	var materialColorRow = new UIRow();
	var materialColor = new UIColorPicker( editor ).onChange( update );

	materialColorRow.add( new UIText( strings.getKey( 'sidebar/material/color' ) ) );
	materialColorRow.add( materialColor );

	container.addToBody( materialColorRow );

	// roughness

	var materialRoughnessRow = new UIRow();
	var materialRoughness = new UINumber( 0.5 ).setRange( 0, 1 ).onChange( update );

	materialRoughnessRow.add( new UIText( strings.getKey( 'sidebar/material/roughness' ) ) );
	materialRoughnessRow.add( materialRoughness );

	container.addToBody( materialRoughnessRow );

	// metalness

	var materialMetalnessRow = new UIRow();
	var materialMetalness = new UINumber( 0.5 ).setRange( 0, 1 ).onChange( update );

	materialMetalnessRow.add( new UIText( strings.getKey( 'sidebar/material/metalness' ) ) );
	materialMetalnessRow.add( materialMetalness );

	container.addToBody( materialMetalnessRow );

	
	// sheen

	var materialSheenRow = new UIRow();
	var materialSheen = new UINumber( 0.0 ).setRange( 0, 1 ).onChange( update );

	materialSheenRow.add( new UIText( strings.getKey( 'sidebar/material/sheen' ) ) );
	materialSheenRow.add( materialSheen );
	container.addToBody( materialSheenRow );

	// sheen roughness

	var materialSheenRoughnessRow = new UIRow();
	var materialSheenRoughness = new UINumber( 1.0 ).setRange( 0, 1 ).onChange( update );

	materialSheenRoughnessRow.add( new UIText( strings.getKey( 'sidebar/material/sheenRoughness' ) ) );
	materialSheenRoughnessRow.add( materialSheenRoughness );
	container.addToBody( materialSheenRoughnessRow );

	//sheen color

	var materialSheenColorRow = new UIRow();
	var materialSheenColor = new UIColorPicker( editor ).setHexValue( 0xffffff ).onChange( update );
	var materialSheenThreejsColor = new THREE.Color(1, 1, 1);

	materialSheenColorRow.add( new UIText( strings.getKey( 'sidebar/material/sheenColor' ) ) );
	materialSheenColorRow.add( materialSheenColor );

	container.addToBody( materialSheenColorRow );

	// transmission

	var materialTransmissionRow = new UIRow();
	var materialTransmission = new UINumber( 0 ).setWidth( '30px' ).setRange( 0, 1 ).onChange( update );

	materialTransmissionRow.add( new UIText( strings.getKey( 'sidebar/material/transmission' ) ).setWidth( '90px' ) );
	materialTransmissionRow.add( materialTransmission );

	container.addToBody( materialTransmissionRow );

	//reflectivity

	var materialPhysicalReflectivityRow = new UIRow();
	var materialPhysicalReflectivity = new UINumber( 0 ).setWidth( '30px' ).setRange( 0, 1 ).onChange( update );
		
	materialPhysicalReflectivityRow.add( new UIText( strings.getKey( 'sidebar/material/reflectivity' ) ).setWidth( '90px' ) );
	materialPhysicalReflectivityRow.add( materialPhysicalReflectivity );
		
	container.addToBody( materialPhysicalReflectivityRow );

	// Attenuation Distance

	var materialAttenuationDistanceRow = new UIRow();
	var materialAttenuationDistance = new UINumber( 1 ).setWidth( '30px' ).onChange( update );
			
	materialAttenuationDistanceRow.add( new UIText( strings.getKey( 'sidebar/material/attenuationDistance' ) ));
	materialAttenuationDistanceRow.add( materialAttenuationDistance );
			
	container.addToBody( materialAttenuationDistanceRow );

	// Attenuation Color

	var materialAttenuationColorRow = new UIRow();
	var materialAttenuationColor = new UIColorPicker( editor ).setHexValue( 0xffffff ).onChange( update );
	let materialAttenuationThreejsColor = new THREE.Color(1, 1, 1);
			
	materialAttenuationColorRow.add( new UIText( strings.getKey( 'sidebar/material/attenuationColor' ) ));
	materialAttenuationColorRow.add( materialAttenuationColor );
			
	container.addToBody( materialAttenuationColorRow );

	// thickness

	var materialThicknessRow = new UIRow();
	var materialThickness = new UINumber( 0 ).setWidth( '30px' ).onChange( update );
				
	materialThicknessRow.add( new UIText( strings.getKey( 'sidebar/material/thickness' ) ));
	materialThicknessRow.add( materialThickness );

	container.addToBody( materialThicknessRow );


	// emissive

	var materialEmissiveRow = new UIRow();
	var materialEmissive = new UIColorPicker( editor ).setHexValue( 0x000000 ).onChange( update );
	var materialEmissiveIntensity = new UINumber( 1 ).setWidth( '30px' ).onChange( update );

	materialEmissiveRow.add( new UIText( strings.getKey( 'sidebar/material/emissive' ) ) );
	materialEmissiveRow.add( materialEmissive );
	materialEmissiveRow.add( materialEmissiveIntensity );

	container.addToBody( materialEmissiveRow );

	// specular

	var materialSpecularRow = new UIRow();
	var materialSpecular = new UIColorPicker( editor ).setHexValue( 0x111111 ).onChange( update );

	materialSpecularRow.add( new UIText( strings.getKey( 'sidebar/material/specular' ) ) );
	materialSpecularRow.add( materialSpecular );

	container.addToBody( materialSpecularRow );

	// shininess

	var materialShininessRow = new UIRow();
	var materialShininess = new UINumber( 30 ).onChange( update );

	materialShininessRow.add( new UIText( strings.getKey( 'sidebar/material/shininess' ) ) );
	materialShininessRow.add( materialShininess );

	container.addToBody( materialShininessRow );

	// clearcoat

	var materialClearcoatRow = new UIRow();
	var materialClearcoat = new UINumber( 1 ).setRange( 0, 1 ).onChange( update );

	materialClearcoatRow.add( new UIText( strings.getKey( 'sidebar/material/clearcoat' ) ) );
	materialClearcoatRow.add( materialClearcoat );

	container.addToBody( materialClearcoatRow );

	// clearcoatRoughness

	var materialClearcoatRoughnessRow = new UIRow();
	var materialClearcoatRoughness = new UINumber( 1 ).setRange( 0, 1 ).onChange( update );

	materialClearcoatRoughnessRow.add( new UIText( strings.getKey( 'sidebar/material/clearcoatroughness' ) ) );
	materialClearcoatRoughnessRow.add( materialClearcoatRoughness );

	container.addToBody( materialClearcoatRoughnessRow );

	// vertex colors

	var materialVertexColorsRow = new UIRow();
	var materialVertexColors = new UIStyledCheckbox( false ).setIdFor( 'materialVertexColors' ).onChange( update );

	materialVertexColorsRow.add( new UIText( strings.getKey( 'sidebar/material/vertexcolors' ) ) );
	materialVertexColorsRow.add( materialVertexColors );

	container.addToBody( materialVertexColorsRow );

	// // vertex tangents

	// var materialVertexTangentsRow = new UIRow();
	// var materialVertexTangents = new UIStyledCheckbox( false ).setIdFor( 'materialVertexTangents' ).onChange( update );

	// materialVertexTangentsRow.add( new UIText( strings.getKey( 'sidebar/material/vertextangents' ) ).setWidth( '90px' ) );
	// materialVertexTangentsRow.add( materialVertexTangents );

	// container.addToBody( materialVertexTangentsRow );

	// depth packing

	var materialDepthPackingRow = new UIRow();
	var materialDepthPacking = new UIDropdown().setOptions( {
		[ THREE.BasicDepthPacking ]: 'BasicDepthPacking',
		[ THREE.RGBADepthPacking ]: 'RGBADepthPacking'
	} );
	materialDepthPacking.onChange( update );

	materialDepthPackingRow.add( new UIText( strings.getKey( 'sidebar/material/depthPacking' ) ) );
	materialDepthPackingRow.add( materialDepthPacking );

	container.addToBody( materialDepthPackingRow );

	// skinning

	var materialSkinningRow = new UIRow();
	var materialSkinning = new UIStyledCheckbox( false ).setIdFor( 'materialSkinning' ).onChange( update );

	materialSkinningRow.add( new UIText( strings.getKey( 'sidebar/material/skinning' ) ) );
	materialSkinningRow.add( materialSkinning );

	container.addToBody( materialSkinningRow );

	// map

	var materialMapRow = new UIRow();
	var materialMapSpan = new UISpan().setClass( 'ContainerSpan' );
	var materialMapEnabled = new UIStyledCheckbox( false ).setIdFor( 'materialMapEnabled' ).onChange( update );
	var materialMap = new UITexture( editor ).onChange( updateMaterial );

	materialMapSpan.add(materialMapEnabled, materialMap);
	materialMapRow.add( new UIText( strings.getKey( 'sidebar/material/map' ) ) );
	materialMapRow.add( materialMapSpan );

	container.addToBody( materialMapRow );

	// matcap map

	var materialMatcapMapRow = new UIRow();
	var materialMatcapMapSpan = new UISpan().setClass( 'ContainerSpan' );
	var materialMatcapMapEnabled = new UIStyledCheckbox( false ).setIdFor( 'materialMatcapMapEnabled' ).onChange( update );
	var materialMatcapMap = new UITexture( editor ).onChange( update );

	materialMatcapMapSpan.add( materialMatcapMapEnabled, materialMatcapMap );
	materialMatcapMapRow.add( new UIText( strings.getKey( 'sidebar/material/matcap' ) ) );
	materialMatcapMapRow.add( materialMatcapMapSpan );

	container.addToBody( materialMatcapMapRow );

	// alpha map

	var materialAlphaMapRow = new UIRow();
	var materialAlphaMapSpan = new UISpan().setClass( 'ContainerSpan' );
	var materialAlphaMapEnabled = new UIStyledCheckbox( false ).setIdFor( 'materialAlphaMapEnabled' ).onChange( update );
	var materialAlphaMap = new UITexture( editor ).onChange( update );

	materialAlphaMapSpan.add( materialAlphaMapEnabled, materialAlphaMap );
	materialAlphaMapRow.add( new UIText( strings.getKey( 'sidebar/material/alphamap' ) ) );
	materialAlphaMapRow.add( materialAlphaMapSpan );

	container.addToBody( materialAlphaMapRow );

	// bump map

	var materialBumpMapRow = new UIRow();
	var materialBumpMapSpan = new UISpan().setClass( 'ContainerSpan' );
	var materialBumpMapEnabled = new UIStyledCheckbox( false ).setIdFor( 'materialBumpMapEnabled' ).onChange( update );
	var materialBumpMap = new UITexture( editor ).onChange( update );
	var materialBumpScale = new UINumber( 1 ).onChange( update );

	materialBumpMapSpan.add( materialBumpScale, materialBumpMapEnabled, materialBumpMap );
	materialBumpMapRow.add( new UIText( strings.getKey( 'sidebar/material/bumpmap' ) ) );
	materialBumpMapRow.add( materialBumpMapSpan );

	container.addToBody( materialBumpMapRow );

	// normal map

	var materialNormalMapRow = new UIRow();
	var materialNormalMapSpan = new UISpan().setClass( 'ContainerSpan' );
	var materialNormalMapEnabled = new UIStyledCheckbox( false ).setIdFor( 'materialNormalMapEnabled' ).onChange( update );
	var materialNormalMap = new UITexture( editor ).onChange( update );
	var materialNormalScaleX = new UINumber( 1 ).onChange( update );
	var materialNormalScaleY = new UINumber( 1 ).onChange( update );

	materialNormalMapSpan.add( materialNormalScaleX, materialNormalScaleY, materialNormalMapEnabled, materialNormalMap );
	materialNormalMapRow.add( new UIText( strings.getKey( 'sidebar/material/normalmap' ) ) );
	materialNormalMapRow.add( materialNormalMapSpan );

	container.addToBody( materialNormalMapRow );

	// clearcoat normal map

	var materialClearcoatNormalMapRow = new UIRow();
	var materialClearcoatNormalMapSpan = new UISpan().setClass( 'ContainerSpan' );
	var materialClearcoatNormalMapEnabled = new UIStyledCheckbox( false ).setIdFor( 'materialClearcoatNormalMapEnabled' ).onChange( update );
	var materialClearcoatNormalMap = new UITexture( editor ).onChange( update );
	var materialClearcoatNormalScaleX = new UINumber( 1 ).onChange( update );
	var materialClearcoatNormalScaleY = new UINumber( 1 ).onChange( update );

	materialClearcoatNormalMapSpan.add( materialClearcoatNormalScaleX, materialClearcoatNormalScaleY, materialClearcoatNormalMapEnabled, materialClearcoatNormalMap );
	materialClearcoatNormalMapRow.add( new UIText( strings.getKey( 'sidebar/material/clearcoatnormalmap' ) ).setWidth( '90px' ) );
	materialClearcoatNormalMapRow.add( materialClearcoatNormalMapSpan );

	container.addToBody( materialClearcoatNormalMapRow );

	// displacement map

	var materialDisplacementMapRow = new UIRow();
	var materialDisplacementMapSpan = new UISpan().setClass( 'ContainerSpan' );
	var materialDisplacementMapEnabled = new UIStyledCheckbox( false ).setIdFor( 'materialDisplacementMapEnabled' ).onChange( update );
	var materialDisplacementMap = new UITexture( editor ).onChange( update );
	var materialDisplacementScale = new UINumber( 1 ).onChange( update );

	materialDisplacementMapSpan.add( materialDisplacementScale, materialDisplacementMapEnabled, materialDisplacementMap);
	materialDisplacementMapRow.add( new UIText( strings.getKey( 'sidebar/material/displacemap' ) ) );
	materialDisplacementMapRow.add( materialDisplacementMapSpan );

	container.addToBody( materialDisplacementMapRow );

	// roughness map

	var materialRoughnessMapRow = new UIRow();
	var materialRoughnessMapSpan = new UISpan().setClass( 'ContainerSpan' );
	var materialRoughnessMapEnabled = new UIStyledCheckbox( false ).setIdFor( 'materialRoughnessMapEnabled' ).onChange( update );
	var materialRoughnessMap = new UITexture( editor ).onChange( update );

	materialRoughnessMapSpan.add( materialRoughnessMapEnabled, materialRoughnessMap );
	materialRoughnessMapRow.add( new UIText( strings.getKey( 'sidebar/material/roughmap' ) ) );
	materialRoughnessMapRow.add( materialRoughnessMapSpan );

	container.addToBody( materialRoughnessMapRow );

	// metalness map

	var materialMetalnessMapRow = new UIRow();
	var materialMetalnessMapSpan = new UISpan().setClass( 'ContainerSpan' );
	var materialMetalnessMapEnabled = new UIStyledCheckbox( false ).setIdFor( 'materialMetalnessMapEnabled' ).onChange( update );
	var materialMetalnessMap = new UITexture( editor ).onChange( update );

	materialMetalnessMapSpan.add( materialMetalnessMapEnabled, materialMetalnessMap );
	materialMetalnessMapRow.add( new UIText( strings.getKey( 'sidebar/material/metalmap' ) ) );
	materialMetalnessMapRow.add( materialMetalnessMapSpan );

	container.addToBody( materialMetalnessMapRow );

	// specular map

	var materialSpecularMapRow = new UIRow();
	var materialSpecularMapSpan = new UISpan().setClass( 'ContainerSpan' );
	var materialSpecularMapEnabled = new UIStyledCheckbox( false ).setIdFor( 'materialSpecularMapEnabled' ).onChange( update );
	var materialSpecularMap = new UITexture( editor ).onChange( update );

	materialSpecularMapSpan.add( materialSpecularMapEnabled, materialSpecularMap );
	materialSpecularMapRow.add( new UIText( strings.getKey( 'sidebar/material/specularmap' ) ) );
	materialSpecularMapRow.add( materialSpecularMapSpan );

	container.addToBody( materialSpecularMapRow );

	// env map

	var materialEnvMapRow = new UIRow();
	var materialEnvMapSpan = new UISpan().setClass( 'ContainerSpan' );
	var materialEnvMapEnabled = new UIStyledCheckbox( false ).setIdFor( 'materialEnvMapEnabled' ).onChange( update );
	var materialEnvMap = new UITexture( editor, THREE.EquirectangularReflectionMapping ).onChange( updateMaterial );
	var materialReflectivity = new UINumber( 1 ).onChange( update );

	materialEnvMapSpan.add( materialReflectivity, materialEnvMapEnabled, materialEnvMap );
	materialEnvMapRow.add( new UIText( strings.getKey( 'sidebar/material/envmap' ) ) );
	materialEnvMapRow.add( materialEnvMapSpan );

	container.addToBody( materialEnvMapRow );

	// light map

	var materialLightMapRow = new UIRow();
	var materialLightMapSpan = new UISpan().setClass( 'ContainerSpan' );
	var materialLightMapEnabled = new UIStyledCheckbox( false ).setIdFor( 'materialLightMapEnabled' ).onChange( update );
	var materialLightMap = new UITexture( editor ).onChange( update );

	materialLightMapSpan.add( materialLightMapEnabled, materialLightMap );
	materialLightMapRow.add( new UIText( strings.getKey( 'sidebar/material/lightmap' ) ) );
	materialLightMapRow.add( materialLightMapSpan );

	container.addToBody( materialLightMapRow );

	// ambient occlusion map

	var materialAOMapRow = new UIRow();
	var materialAOMapSpan = new UISpan().setClass( 'ContainerSpan' );
	var materialAOMapEnabled = new UIStyledCheckbox( false ).setIdFor( 'materialAOMapEnabled' ).onChange( update );
	var materialAOMap = new UITexture( editor ).onChange( update );
	var materialAOScale = new UINumber( 1 ).setRange( 0, 1 ).onChange( update );

	materialAOMapSpan.add( materialAOScale, materialAOMapEnabled, materialAOMap );
	materialAOMapRow.add( new UIText( strings.getKey( 'sidebar/material/aomap' ) ) );
	materialAOMapRow.add( materialAOMapSpan );

	container.addToBody( materialAOMapRow );

	// transmission map

	var materialTransmissionMapRow = new UIRow();
	var materialTransmissionMapSpan = new UISpan().setClass( 'ContainerSpan' );
	var materialTransmissionMapEnabled = new UIStyledCheckbox( false ).setIdFor( 'materialTransmissionMapEnabled' ).onChange( update );
	var materialTransmissionMap = new UITexture( editor ).onChange( update );

	materialTransmissionMapSpan.add( materialTransmissionMapEnabled, materialTransmissionMap );
	materialTransmissionMapRow.add( new UIText( strings.getKey( 'sidebar/material/transmissionmap' ) ) );
	materialTransmissionMapRow.add( materialTransmissionMapSpan );

	container.addToBody( materialTransmissionMapRow );

	// thickness map

	var materialThicknessMapRow = new UIRow();
	var materialThicknessMapSpan = new UISpan().setClass( 'ContainerSpan' );
	var materialThicknessMapEnabled = new UIStyledCheckbox( false ).setIdFor( 'materialThicknessMapEnabled' ).onChange( update );
	var materialThicknessMap = new UITexture( editor ).onChange( update );

	materialThicknessMapSpan.add( materialThicknessMapEnabled, materialThicknessMap );
	materialThicknessMapRow.add( new UIText( strings.getKey( 'sidebar/material/thicknessmap' ) ) );
	materialThicknessMapRow.add( materialThicknessMapSpan );

	container.addToBody( materialThicknessMapRow );

	// emissive map

	var materialEmissiveMapRow = new UIRow();
	var materialEmissiveMapSpan = new UISpan().setClass( 'ContainerSpan' );
	var materialEmissiveMapEnabled = new UIStyledCheckbox( false ).setIdFor( 'materialEmissiveMapEnabled' ).onChange( update );
	var materialEmissiveMap = new UITexture( editor ).onChange( updateMaterial );

	materialEmissiveMapSpan.add( materialEmissiveMapEnabled, materialEmissiveMap );
	materialEmissiveMapRow.add( new UIText( strings.getKey( 'sidebar/material/emissivemap' ) ) );
	materialEmissiveMapRow.add( materialEmissiveMapSpan );

	container.addToBody( materialEmissiveMapRow );

	// gradient map

	var materialGradientMapRow = new UIRow();
	var materialGradientMapSpan = new UIRow();
	var materialGradientMapEnabled = new UIStyledCheckbox( false ).setIdFor( 'materialGradientMapEnabled' ).onChange( update );
	var materialGradientMap = new UITexture( editor ).onChange( update );

	materialGradientMapSpan.add( materialGradientMapEnabled, materialGradientMap );
	materialGradientMapRow.add( new UIText( strings.getKey( 'sidebar/material/gradientmap' ) ) );
	materialGradientMapRow.add( materialGradientMapSpan );

	container.addToBody( materialGradientMapRow );

	// side

	var materialSideRow = new UIRow();
	var materialSide = new UIDropdown().setOptions( {

		0: strings.getKey( 'sidebar/material/side/front' ),
		1: strings.getKey( 'sidebar/material/side/back' ),
		2: strings.getKey( 'sidebar/material/side/double' )

	} ).onChange( update );

	materialSideRow.add( new UIText( strings.getKey( 'sidebar/material/side' ) ) );
	materialSideRow.add( materialSide );

	container.addToBody( materialSideRow );

	// size

	var materialSizeRow = new UIRow();
	var materialSize = new UINumber( 1 ).setWidth( '60px' ).setRange( 0, Infinity ).onChange( update );

	materialSizeRow.add( new UIText( strings.getKey( 'sidebar/material/size' ) ).setWidth( '90px' ) );
	materialSizeRow.add( materialSize );

	container.addToBody( materialSizeRow );

	// sizeAttenuation

	var materialSizeAttenuationRow = new UIRow();
	var materialSizeAttenuation = new UIStyledCheckbox( true ).setIdFor( 'materialSizeAttenuation' ).onChange( update );

	materialSizeAttenuationRow.add( new UIText( strings.getKey( 'sidebar/material/sizeAttenuation' ) ).setWidth( '90px' ) );
	materialSizeAttenuationRow.add( materialSizeAttenuation );

	container.addToBody( materialSizeAttenuationRow );

	// shading

	var materialShadingRow = new UIRow();
	var materialShading = new UIStyledCheckbox( false ).setIdFor( 'materialShading' ).onChange( update );

	materialShadingRow.add( new UIText( strings.getKey( 'sidebar/material/flatshaded' ) ) );
	materialShadingRow.add( materialShading );

	container.addToBody( materialShadingRow );

	// blending

	var materialBlendingRow = new UIRow();
	var materialBlending = new UIDropdown().setOptions( {

		0: strings.getKey( 'sidebar/material/blending/no' ),
		1: strings.getKey( 'sidebar/material/blending/normal' ),
		2: strings.getKey( 'sidebar/material/blending/additive' ),
		3: strings.getKey( 'sidebar/material/blending/subtractive' ),
		4: strings.getKey( 'sidebar/material/blending/multiply' ),
		5: strings.getKey( 'sidebar/material/blending/custom' )

	} ).onChange( update );

	materialBlendingRow.add( new UIText( strings.getKey( 'sidebar/material/blending' ) ) );
	materialBlendingRow.add( materialBlending );

	container.addToBody( materialBlendingRow );

	// opacity

	var materialOpacityRow = new UIRow();
	var materialOpacity = new UINumber( 1 ).setRange( 0, 1 ).onChange( update );

	var materialOpacityLabel = new UIText( strings.getKey( 'sidebar/material/opacity' ) ).onClick( function () {

		var connection = currentObject.userData.connection;

		materialOpacityConnection.setDisplay( '' );
		materialOpacityConnection.clearValues();

		if ( connection && connection[ 'opacity' ] ) materialOpacityConnection.setValues( connection[ 'opacity' ] );

	} );
	materialOpacityRow.add( materialOpacityLabel );
	materialOpacityRow.add( materialOpacity );

	var materialOpacityConnection = new SidebarObjectConnection( editor, 'opacity' );
	materialOpacityConnection.onChange( function ( e ) {

		if ( e.eventType == 'connection' ) {

			if ( ! currentObject.userData.connection ) {
	
				currentObject.userData.connection = {};
	
			}
	
			if ( e.enabled ) {
	
				currentObject.userData.connection[ 'opacity' ] = {};
				currentObject.userData.connection[ 'opacity' ][ 'mouse' ] = e.mouse;
				currentObject.userData.connection[ 'opacity' ][ 'speed' ] = e.speed;
				currentObject.userData.connection[ 'opacity' ][ 'value' ] = editor.getObjectMaterial( currentObject, 0 ).opacity;
	
			} else {
	
				delete currentObject.userData.connection[ 'opacity' ];
	
			}
	
			updateConnectionUI( currentObject );
	
			editor.execute( new SetValueCommand( editor, currentObject, 'userData', currentObject.userData ) );

		}

	} );

	container.addToBody( materialOpacityRow );
	container.addToBody( materialOpacityConnection );

	// transparent

	var materialTransparentRow = new UIRow();
	var materialTransparent = new UIStyledCheckbox().setIdFor( 'materialTransparent' ).onChange( update );

	materialTransparentRow.add( new UIText( strings.getKey( 'sidebar/material/transparent' ) ) );
	materialTransparentRow.add( materialTransparent );

	container.addToBody( materialTransparentRow );

	// alpha test

	var materialAlphaTestRow = new UIRow();
	var materialAlphaTest = new UINumber().setRange( 0, 1 ).onChange( update );

	materialAlphaTestRow.add( new UIText( strings.getKey( 'sidebar/material/alphatest' ) ) );
	materialAlphaTestRow.add( materialAlphaTest );

	container.addToBody( materialAlphaTestRow );

	// depth test

	var materialDepthTestRow = new UIRow();
	var materialDepthTest = new UIStyledCheckbox().setIdFor( 'materialDepthTest' ).onChange( update );

	materialDepthTestRow.add( new UIText( strings.getKey( 'sidebar/material/depthtest' ) ).setWidth( '90px' ) );
	materialDepthTestRow.add( materialDepthTest );

	container.addToBody( materialDepthTestRow );

	// depth write

	var materialDepthWriteRow = new UIRow();
	var materialDepthWrite = new UIStyledCheckbox().setIdFor( 'materialDepthWrite' ).onChange( update );

	materialDepthWriteRow.add( new UIText( strings.getKey( 'sidebar/material/depthwrite' ) ).setWidth( '90px' ) );
	materialDepthWriteRow.add( materialDepthWrite );

	container.addToBody( materialDepthWriteRow );

	// wireframe

	var materialWireframeRow = new UIRow();
	var materialWireframe = new UIStyledCheckbox( false ).setIdFor( 'materialWireframe' ).onChange( update );

	materialWireframeRow.add( new UIText( strings.getKey( 'sidebar/material/wireframe' ) ).setWidth( '90px' ) );
	materialWireframeRow.add( materialWireframe );

	container.addToBody( materialWireframeRow );

	//

	function update() {

		if ( !currentObject ) return;

		var object = currentObject;

		var geometry = object.geometry;

		var previousSelectedSlot = currentMaterialSlot;

		currentMaterialSlot = parseInt( materialSlotSelect.getValue() );

		if ( currentMaterialSlot !== previousSelectedSlot ) refreshUI( true );

		var material = editor.getObjectMaterial( currentObject, currentMaterialSlot );

		var textureWarning = false;
		var objectHasUvs = false;

		if ( object.isSprite ) objectHasUvs = true;
		if ( geometry.isGeometry && geometry.faceVertexUvs[ 0 ].length > 0 ) objectHasUvs = true;
		if ( geometry.isBufferGeometry && geometry.attributes.uv !== undefined ) objectHasUvs = true;

		if ( material ) {

			if ( material.type !== materialClass.getValue() ) {

				material = new materialClasses[ materialClass.getValue() ]();

				if ( material.type === "RawShaderMaterial" ) {

					material.vertexShader = vertexShaderVariables + material.vertexShader;

				}

				if ( Array.isArray( currentObject.material ) ) {

					// don't remove the entire multi-material. just the material of the selected slot

					editor.removeMaterial( currentObject.material[ currentMaterialSlot ] );

				} else {

					editor.removeMaterial( currentObject.material );

				}

				editor.execute( new SetMaterialCommand( editor, currentObject, material, currentMaterialSlot ), 'New Material: ' + materialClass.getValue() );
				editor.addMaterial( material );
				// TODO Copy other references in the scene graph
				// keeping name and UUID then.
				// Also there should be means to create a unique
				// copy for the current object explicitly and to
				// attach the current material to other objects.

			}

			if ( material.color !== undefined && material.color.getHex() !== materialColor.getHexValue() ) {

				editor.execute( new SetMaterialColorCommand( editor, currentObject, 'color', materialColor.getHexValue(), currentMaterialSlot ) );

			}

			if ( material.roughness !== undefined && Math.abs( material.roughness - materialRoughness.getValue() ) >= epsilon ) {

				editor.execute( new SetMaterialValueCommand( editor, currentObject, 'roughness', materialRoughness.getValue(), currentMaterialSlot ) );

			}

			if ( material.metalness !== undefined && Math.abs( material.metalness - materialMetalness.getValue() ) >= epsilon ) {

				editor.execute( new SetMaterialValueCommand( editor, currentObject, 'metalness', materialMetalness.getValue(), currentMaterialSlot ) );

			}

			if ( material.sheen !== undefined && Math.abs( material.sheen - materialSheen.getValue() ) >= epsilon ) {

				editor.execute( new SetMaterialValueCommand( editor, currentObject, 'sheen', materialSheen.getValue(), currentMaterialSlot ) );

			}

			if ( material.sheenRoughness !== undefined && Math.abs( material.sheenRoughness - materialSheenRoughness.getValue() ) >= epsilon ) {

				editor.execute( new SetMaterialValueCommand( editor, currentObject, 'sheenRoughness', materialSheenRoughness.getValue(), currentMaterialSlot ) );

			}

			if ( material.sheenColor !== undefined && material.sheenColor.getHex() !== materialSheenColor.getHexValue() ) {
				materialSheenThreejsColor.setHex( materialSheenColor.getHexValue() );
				editor.execute( new SetMaterialColorCommand( editor, currentObject, 'sheenColor', materialSheenColor.getHexValue(), currentMaterialSlot ) );

			}

			/*
			if ( material.sheen !== undefined ) {

				var sheenEnabled = materialSheenEnabled.getValue() === true;

				var sheen = sheenEnabled ? new Color(materialSheen.getHexValue()) : null;

				editor.execute( new SetMaterialValueCommand( editor, currentObject, 'sheen', sheen, currentMaterialSlot ) );

			}

			if ( material.sheen !== undefined && material.sheen !== null && material.sheen.getHex() !== materialSheen.getHexValue() ) {

				editor.execute( new SetMaterialColorCommand( editor, currentObject, 'sheen', materialSheen.getHexValue(), currentMaterialSlot ) );

			}
			*/

			if ( material.transmission !== undefined && Math.abs( material.transmission - materialTransmission.getValue() ) >= epsilon ) {

				editor.execute( new SetMaterialValueCommand( editor, currentObject, 'transmission', materialTransmission.getValue(), currentMaterialSlot ) );

			}
			
			if ( material.emissive !== undefined && material.emissive.getHex() !== materialEmissive.getHexValue() ) {

				editor.execute( new SetMaterialColorCommand( editor, currentObject, 'emissive', materialEmissive.getHexValue(), currentMaterialSlot ) );

			}

			// if ( material.emissiveIntensity !== undefined && material.emissiveIntensity !== materialEmissiveIntensity.getValue() ) {

			if ( material.emissiveIntensity !== undefined && Math.abs(material.emissiveIntensity - materialEmissiveIntensity.getValue()) >= epsilon ) {

				editor.execute( new SetMaterialValueCommand( editor, currentObject, 'emissiveIntensity', materialEmissiveIntensity.getValue(), currentMaterialSlot ) );

			}
			if (materialEmissiveIntensity.getValue()===0){
				const smallestNum = Number.MIN_VALUE;
				editor.execute( new SetMaterialValueCommand( editor, currentObject, 'emissiveIntensity', smallestNum, currentMaterialSlot ) );
				materialEmissiveIntensity.setValue(smallestNum);
			}

			if ( material.specular !== undefined && material.specular.getHex() !== materialSpecular.getHexValue() ) {

				editor.execute( new SetMaterialColorCommand( editor, currentObject, 'specular', materialSpecular.getHexValue(), currentMaterialSlot ) );

			}

			if ( material.shininess !== undefined && Math.abs( material.shininess - materialShininess.getValue() ) >= epsilon ) {

				editor.execute( new SetMaterialValueCommand( editor, currentObject, 'shininess', materialShininess.getValue(), currentMaterialSlot ) );

			}

			if ( material.clearcoat !== undefined && Math.abs( material.clearcoat - materialClearcoat.getValue() ) >= epsilon ) {

				editor.execute( new SetMaterialValueCommand( editor, currentObject, 'clearcoat', materialClearcoat.getValue(), currentMaterialSlot ) );

			}

			if ( material.clearcoatRoughness !== undefined && Math.abs( material.clearcoatRoughness - materialClearcoatRoughness.getValue() ) >= epsilon ) {

				editor.execute( new SetMaterialValueCommand( editor, currentObject, 'clearcoatRoughness', materialClearcoatRoughness.getValue(), currentMaterialSlot ) );

			}

			if ( material.vertexColors !== undefined ) {

				var vertexColors = materialVertexColors.getValue();

				if ( material.vertexColors !== vertexColors ) {

					editor.execute( new SetMaterialValueCommand( editor, currentObject, 'vertexColors', vertexColors, currentMaterialSlot ) );

				}

			}

			if ( material.depthPacking !== undefined ) {

				var depthPacking = parseInt( materialDepthPacking.getValue() );
				if ( material.depthPacking !== depthPacking ) {

					editor.execute( new SetMaterialValueCommand( editor, currentObject, 'depthPacking', depthPacking, currentMaterialSlot ) );

				}

			}

			if ( material.skinning !== undefined && material.skinning !== materialSkinning.getValue() ) {

				editor.execute( new SetMaterialValueCommand( editor, currentObject, 'skinning', materialSkinning.getValue(), currentMaterialSlot ) );

			}

			if ( material.map !== undefined ) {

				var mapEnabled = materialMapEnabled.getValue() === true;

				if ( objectHasUvs ) {

					var map = mapEnabled ? materialMap.getValue() : null;
					if ( material.map !== map ) {

						editor.execute( new SetMaterialMapCommand( editor, currentObject, 'map', map, currentMaterialSlot ) );

					}

				} else {

					if ( mapEnabled ) textureWarning = true;

				}

			}

			if ( material.matcap !== undefined ) {

				var mapEnabled = materialMatcapMapEnabled.getValue() === true;

				if ( objectHasUvs ) {

					var matcap = mapEnabled ? materialMatcapMap.getValue() : null;
					if ( material.matcap !== matcap ) {

						editor.execute( new SetMaterialMapCommand( editor, currentObject, 'matcap', matcap, currentMaterialSlot ) );

					}

				} else {

					if ( mapEnabled ) textureWarning = true;

				}

			}

			if ( material.alphaMap !== undefined ) {

				var mapEnabled = materialAlphaMapEnabled.getValue() === true;

				if ( objectHasUvs ) {

					var alphaMap = mapEnabled ? materialAlphaMap.getValue() : null;
					if ( material.alphaMap !== alphaMap ) {

						editor.execute( new SetMaterialMapCommand( editor, currentObject, 'alphaMap', alphaMap, currentMaterialSlot ) );

					}

				} else {

					if ( mapEnabled ) textureWarning = true;

				}

			}

			if ( material.bumpMap !== undefined ) {

				var bumpMapEnabled = materialBumpMapEnabled.getValue() === true;

				if ( objectHasUvs ) {

					var bumpMap = bumpMapEnabled ? materialBumpMap.getValue() : null;
					if ( material.bumpMap !== bumpMap ) {

						editor.execute( new SetMaterialMapCommand( editor, currentObject, 'bumpMap', bumpMap, currentMaterialSlot ) );

					}

					if ( material.bumpScale !== materialBumpScale.getValue() ) {

						editor.execute( new SetMaterialValueCommand( editor, currentObject, 'bumpScale', materialBumpScale.getValue(), currentMaterialSlot ) );

					}

				} else {

					if ( bumpMapEnabled ) textureWarning = true;

				}

			}

			if ( material.normalMap !== undefined ) {

				var normalMapEnabled = materialNormalMapEnabled.getValue() === true;

				if ( objectHasUvs ) {

					var normalMap = normalMapEnabled ? materialNormalMap.getValue() : null;
					if ( material.normalMap !== normalMap ) {

						editor.execute( new SetMaterialMapCommand( editor, currentObject, 'normalMap', normalMap, currentMaterialSlot ) );

					}

					if ( material.normalScale.x !== materialNormalScaleX.getValue() ||
						material.normalScale.y !== materialNormalScaleY.getValue() ) {

						var value = [
							materialNormalScaleX.getValue(),
							materialNormalScaleY.getValue()
						];
						editor.execute( new SetMaterialVectorCommand( editor, currentObject, 'normalScale', value, currentMaterialSlot ) );

					}

				} else {

					if ( normalMapEnabled ) textureWarning = true;

				}

			}

			if ( material.clearcoatNormalMap !== undefined ) {

				var clearcoatNormalMapEnabled = materialClearcoatNormalMapEnabled.getValue() === true;

				if ( objectHasUvs ) {

					var clearcoatNormalMap = clearcoatNormalMapEnabled ? materialClearcoatNormalMap.getValue() : null;

					if ( material.clearcoatNormalMap !== clearcoatNormalMap ) {

						editor.execute( new SetMaterialMapCommand( editor, currentObject, 'clearcoatNormalMap', clearcoatNormalMap, currentMaterialSlot ) );

					}

					if ( material.clearcoatNormalScale.x !== materialClearcoatNormalScaleX.getValue() ||
						material.clearcoatNormalScale.y !== materialClearcoatNormalScaleY.getValue() ) {

						var value = [
							materialClearcoatNormalScaleX.getValue(),
							materialClearcoatNormalScaleY.getValue()
						];
						editor.execute( new SetMaterialVectorCommand( editor, currentObject, 'clearcoatNormalScale', value, currentMaterialSlot ) );

					}

				} else {

					if ( clearcoatNormalMapEnabled ) textureWarning = true;

				}

			}

			if ( material.displacementMap !== undefined ) {

				var displacementMapEnabled = materialDisplacementMapEnabled.getValue() === true;

				if ( objectHasUvs ) {

					var displacementMap = displacementMapEnabled ? materialDisplacementMap.getValue() : null;
					if ( material.displacementMap !== displacementMap ) {

						editor.execute( new SetMaterialMapCommand( editor, currentObject, 'displacementMap', displacementMap, currentMaterialSlot ) );

					}

					if ( material.displacementScale !== materialDisplacementScale.getValue() ) {

						editor.execute( new SetMaterialValueCommand( editor, currentObject, 'displacementScale', materialDisplacementScale.getValue(), currentMaterialSlot ) );

					}

				} else {

					if ( displacementMapEnabled ) textureWarning = true;

				}

			}

			if ( material.roughnessMap !== undefined ) {

				var roughnessMapEnabled = materialRoughnessMapEnabled.getValue() === true;

				if ( objectHasUvs ) {

					var roughnessMap = roughnessMapEnabled ? materialRoughnessMap.getValue() : null;
					if ( material.roughnessMap !== roughnessMap ) {

						editor.execute( new SetMaterialMapCommand( editor, currentObject, 'roughnessMap', roughnessMap, currentMaterialSlot ) );

					}

				} else {

					if ( roughnessMapEnabled ) textureWarning = true;

				}

			}

			if ( material.metalnessMap !== undefined ) {

				var metalnessMapEnabled = materialMetalnessMapEnabled.getValue() === true;

				if ( objectHasUvs ) {

					var metalnessMap = metalnessMapEnabled ? materialMetalnessMap.getValue() : null;
					if ( material.metalnessMap !== metalnessMap ) {

						editor.execute( new SetMaterialMapCommand( editor, currentObject, 'metalnessMap', metalnessMap, currentMaterialSlot ) );

					}

				} else {

					if ( metalnessMapEnabled ) textureWarning = true;

				}

			}

			if ( material.specularMap !== undefined ) {

				var specularMapEnabled = materialSpecularMapEnabled.getValue() === true;

				if ( objectHasUvs ) {

					var specularMap = specularMapEnabled ? materialSpecularMap.getValue() : null;
					if ( material.specularMap !== specularMap ) {

						editor.execute( new SetMaterialMapCommand( editor, currentObject, 'specularMap', specularMap, currentMaterialSlot ) );

					}

				} else {

					if ( specularMapEnabled ) textureWarning = true;

				}

			}

			if ( material.envMap !== undefined ) {

				var envMapEnabled = materialEnvMapEnabled.getValue() === true;

				var envMap = envMapEnabled ? materialEnvMap.getValue() : null;

				if ( material.envMap !== envMap ) {

					editor.execute( new SetMaterialMapCommand( editor, currentObject, 'envMap', envMap, currentMaterialSlot ) );

				}

			}

			// if ( material.reflectivity !== undefined ) {

			// 	var reflectivity = materialReflectivity.getValue();

			// 	if ( material.reflectivity !== reflectivity ) {

			// 		editor.execute( new SetMaterialValueCommand( editor, currentObject, 'reflectivity', reflectivity, currentMaterialSlot ) );

			// 	}

			// }

			if ( material.lightMap !== undefined ) {

				var lightMapEnabled = materialLightMapEnabled.getValue() === true;

				if ( objectHasUvs ) {

					var lightMap = lightMapEnabled ? materialLightMap.getValue() : null;
					if ( material.lightMap !== lightMap ) {

						editor.execute( new SetMaterialMapCommand( editor, currentObject, 'lightMap', lightMap, currentMaterialSlot ) );

					}

				} else {

					if ( lightMapEnabled ) textureWarning = true;

				}

			}

			if ( material.aoMap !== undefined ) {

				var aoMapEnabled = materialAOMapEnabled.getValue() === true;

				if ( objectHasUvs ) {

					var aoMap = aoMapEnabled ? materialAOMap.getValue() : null;
					if ( material.aoMap !== aoMap ) {

						editor.execute( new SetMaterialMapCommand( editor, currentObject, 'aoMap', aoMap, currentMaterialSlot ) );

					}

					if ( material.aoMapIntensity !== materialAOScale.getValue() ) {

						editor.execute( new SetMaterialValueCommand( editor, currentObject, 'aoMapIntensity', materialAOScale.getValue(), currentMaterialSlot ) );

					}

				} else {

					if ( aoMapEnabled ) textureWarning = true;

				}

			}

			if ( material.transmissionMap !== undefined ) {

				var transmissionMapEnabled = materialTransmissionMapEnabled.getValue() === true;

				if ( objectHasUvs ) {

					var transmissionMap = transmissionMapEnabled ? materialTransmissionMap.getValue() : null;
					if ( material.transmissionMap !== transmissionMap ) {

						editor.execute( new SetMaterialMapCommand( editor, currentObject, 'transmissionMap', transmissionMap, currentMaterialSlot ) );

					}

				} else {

					if ( transmissionMapEnabled ) textureWarning = true;

				}

			}

			if ( material.thicknessMap !== undefined ) {

				var thicknessMapEnabled = materialThicknessMapEnabled.getValue() === true;

				if ( objectHasUvs ) {

					var thicknessMap = thicknessMapEnabled ? materialThicknessMap.getValue() : null;
					if ( material.thicknessMap !== thicknessMap ) {

						editor.execute( new SetMaterialMapCommand( editor, currentObject, 'thicknessMap', thicknessMap, currentMaterialSlot ) );

					}

				} else {

					if ( thicknessMapEnabled ) textureWarning = true;

				}

			}

			if ( material.emissiveMap !== undefined ) {

				var emissiveMapEnabled = materialEmissiveMapEnabled.getValue() === true;

				if ( objectHasUvs ) {

					var emissiveMap = emissiveMapEnabled ? materialEmissiveMap.getValue() : null;
					if ( material.emissiveMap !== emissiveMap ) {

						editor.execute( new SetMaterialMapCommand( editor, currentObject, 'emissiveMap', emissiveMap, currentMaterialSlot ) );

					}

				} else {

					if ( emissiveMapEnabled ) textureWarning = true;

				}

			}

			if ( material.gradientMap !== undefined ) {

				var gradientMapEnabled = materialGradientMapEnabled.getValue() === true;

				var gradientMap = gradientMapEnabled ? materialGradientMap.getValue() : null;

				if ( material.gradientMap !== gradientMap ) {

					editor.execute( new SetMaterialMapCommand( editor, currentObject, 'gradientMap', gradientMap, currentMaterialSlot ) );

				}

			}

			if ( material.side !== undefined ) {

				var side = parseInt( materialSide.getValue() );
				if ( material.side !== side ) {

					editor.execute( new SetMaterialValueCommand( editor, currentObject, 'side', side, currentMaterialSlot ) );

				}


			}

			if ( material.size !== undefined ) {

				var size = materialSize.getValue();
				if ( material.size !== size ) {

					editor.execute( new SetMaterialValueCommand( editor, currentObject, 'size', size, currentMaterialSlot ) );

				}

			}

			if ( material.sizeAttenuation !== undefined ) {

				var sizeAttenuation = materialSizeAttenuation.getValue();
				if ( material.sizeAttenuation !== sizeAttenuation ) {

					editor.execute( new SetMaterialValueCommand( editor, currentObject, 'sizeAttenuation', sizeAttenuation, currentMaterialSlot ) );

				}

			}

			if ( material.flatShading !== undefined ) {

				var flatShading = materialShading.getValue();
				if ( material.flatShading != flatShading ) {

					editor.execute( new SetMaterialValueCommand( editor, currentObject, 'flatShading', flatShading, currentMaterialSlot ) );

				}

			}

			if ( material.blending !== undefined ) {

				var blending = parseInt( materialBlending.getValue() );
				if ( material.blending !== blending ) {

					editor.execute( new SetMaterialValueCommand( editor, currentObject, 'blending', blending, currentMaterialSlot ) );

				}

			}

			if ( material.opacity !== undefined && Math.abs( material.opacity - materialOpacity.getValue() ) >= epsilon ) {

				editor.execute( new SetMaterialValueCommand( editor, currentObject, 'opacity', materialOpacity.getValue(), currentMaterialSlot ) );

			}

			if ( material.transparent !== undefined && material.transparent !== materialTransparent.getValue() ) {

				editor.execute( new SetMaterialValueCommand( editor, currentObject, 'transparent', materialTransparent.getValue(), currentMaterialSlot ) );

			}

			if ( material.alphaTest !== undefined && Math.abs( material.alphaTest - materialAlphaTest.getValue() ) >= epsilon ) {

				editor.execute( new SetMaterialValueCommand( editor, currentObject, 'alphaTest', materialAlphaTest.getValue(), currentMaterialSlot ) );

			}

			if ( material.depthTest !== undefined && material.depthTest !== materialDepthTest.getValue() ) {

				editor.execute( new SetMaterialValueCommand( editor, currentObject, 'depthTest', materialDepthTest.getValue(), currentMaterialSlot ) );

			}

			if ( material.depthWrite !== undefined && material.depthWrite !== materialDepthWrite.getValue() ) {

				editor.execute( new SetMaterialValueCommand( editor, currentObject, 'depthWrite', materialDepthWrite.getValue(), currentMaterialSlot ) );

			}

			if ( material.wireframe !== undefined && material.wireframe !== materialWireframe.getValue() ) {

				editor.execute( new SetMaterialValueCommand( editor, currentObject, 'wireframe', materialWireframe.getValue(), currentMaterialSlot ) );

			}

			
			if ( material.attenuationDistance !== undefined ) {

				editor.execute( new SetMaterialValueCommand( editor, currentObject, 'attenuationDistance', materialAttenuationDistance.getValue(), currentMaterialSlot ) );
	
			}

			
			if ( material.reflectivity !== undefined ) {

				editor.execute( new SetMaterialValueCommand( editor, currentObject, 'reflectivity', materialPhysicalReflectivity.getValue(), currentMaterialSlot ) );

			}
	
			if ( material.thickness !== undefined ) {
	
				editor.execute( new SetMaterialValueCommand( editor, currentObject, 'thickness', materialThickness.getValue(), currentMaterialSlot ) );
	
			}
			
			if ( material.attenuationColor !== undefined && material.attenuationColor.getHex() !== materialAttenuationColor.getHexValue() ) {

				materialAttenuationThreejsColor.setHex( materialAttenuationColor.getHexValue() );
				editor.execute( new SetMaterialValueCommand( editor, currentObject, 'attenuationColor', materialAttenuationThreejsColor, currentMaterialSlot ) );
	
			}

			refreshUI();

		}

		if ( textureWarning ) {

			console.warn( "Can't set texture, model doesn't have texture coordinates" );

		}
	}

	function updateMaterial( id ) {

		var texture = null;
		var image = editor.assets.get( 'Image', 'id', id );
		var environmnet = editor.assets.get( 'Environment', 'id', id );

		if ( image ) {

			texture = image.texture;

		} else if ( environmnet ) {

			texture = environmnet.texture;
			
		}

		if ( texture !== null ) {

			if ( texture.isDataTexture !== true && texture.encoding !== THREE.sRGBEncoding ) {

				texture.encoding = THREE.sRGBEncoding;
				var object = currentObject;
				if ( object !== null ) {

					object.material.needsUpdate = true;

				}

			}

		}

		update();

	}

	//

	function setRowVisibility() {

		var properties = {
			'name': materialNameRow,
			'color': materialColorRow,
			'roughness': materialRoughnessRow,
			'metalness': materialMetalnessRow,
			'emissive': materialEmissiveRow,
			// 'sheen': materialSheenRow,
			'transmission': materialTransmissionRow,
			'reflectivity': materialPhysicalReflectivityRow,
			'sheen': materialSheenRow,
			'sheenRoughness': materialSheenRoughnessRow,
			'sheenColor': materialSheenColorRow,
			'attenuationDistance': materialAttenuationDistanceRow,
			'attenuationColor': materialAttenuationColorRow,
			'thickness': materialThicknessRow,
			'specular': materialSpecularRow,
			'shininess': materialShininessRow,
			'clearcoat': materialClearcoatRow,
			'clearcoatRoughness': materialClearcoatRoughnessRow,
			'vertexShader': materialProgramRow,
			'vertexColors': materialVertexColorsRow,
			// 'vertexTangents': materialVertexTangentsRow,
			'depthPacking': materialDepthPackingRow,
			'skinning': materialSkinningRow,
			'map': materialMapRow,
			'matcap': materialMatcapMapRow,
			'alphaMap': materialAlphaMapRow,
			'bumpMap': materialBumpMapRow,
			'normalMap': materialNormalMapRow,
			'clearcoatNormalMap': materialClearcoatNormalMapRow,
			'displacementMap': materialDisplacementMapRow,
			'roughnessMap': materialRoughnessMapRow,
			'metalnessMap': materialMetalnessMapRow,
			'specularMap': materialSpecularMapRow,
			'envMap': materialEnvMapRow,
			'lightMap': materialLightMapRow,
			'aoMap': materialAOMapRow,
			'transmissionMap': materialTransmissionMapRow,
			'thicknessMap': materialThicknessMapRow,
			'emissiveMap': materialEmissiveMapRow,
			'gradientMap': materialGradientMapRow,
			'side': materialSideRow,
			'size': materialSizeRow,
			'sizeAttenuation': materialSizeAttenuationRow,
			'flatShading': materialShadingRow,
			'blending': materialBlendingRow,
			'opacity': materialOpacityRow,
			'transparent': materialTransparentRow,
			'alphaTest': materialAlphaTestRow,
			'depthTest': materialDepthTestRow,
			'depthWrite': materialDepthWriteRow,
			'wireframe': materialWireframeRow
		};

		var material = currentObject.material;

		if ( Array.isArray( material ) ) {

			materialSlotRow.setDisplay( '' );

			if ( material.length === 0 ) return;

			material = material[ currentMaterialSlot ];

		} else {

			materialSlotRow.setDisplay( 'none' );

		}

		for ( var property in properties ) {

			properties[ property ].setDisplay( material[ property ] !== undefined ? '' : 'none' );

		}

	}

	function updateConnectionUI() {

		var connection = currentObject.userData.connection;

		materialOpacityLabel.setValue( connection && connection[ 'opacity' ] ? 'Opacity*' : 'Opacity' )

	}

	function refreshUI( resetTextureSelectors ) {

		if ( ! currentObject ) return;

		var material = currentObject.material;

		if ( Array.isArray( material ) ) {

			var slotOptions = {};

			currentMaterialSlot = Math.max( 0, Math.min( material.length, currentMaterialSlot ) );

			for ( var i = 0; i < material.length; i ++ ) {

				slotOptions[ i ] = String( i + 1 ) + ': ' + material[ i ].name;

			}

			materialSlotSelect.setOptions( slotOptions ).setValue( currentMaterialSlot );

		}

		updateConnectionUI();

		material = editor.getObjectMaterial( currentObject, currentMaterialSlot );

		if ( material.name !== undefined ) {

			materialName.setValue( material.name );

		}

		if ( currentObject.isMesh ) {

			materialClass.setOptions( meshMaterialOptions );

		} else if ( currentObject.isSprite ) {

			materialClass.setOptions( spriteMaterialOptions );

		} else if ( currentObject.isPoints ) {

			materialClass.setOptions( pointsMaterialOptions );

		} else if ( currentObject.isLine ) {

			lineMaterialOptions.setOptions( lineMaterialOptions );

		}

		materialClass.setValue( material.type );

		if(material.type in MaterialDefinitionMap)
			materialDefinition.setValue(MaterialDefinitionMap[material.type]);
		else
		materialDefinition.setValue("");


		if ( material.color !== undefined ) {

			materialColor.setHexValue( material.color.getHexString() );

		}

		if ( material.roughness !== undefined ) {

			materialRoughness.setValue( material.roughness );

		}

		if ( material.metalness !== undefined ) {

			materialMetalness.setValue( material.metalness );

		}

		if(material.sheen !== undefined) {
			materialSheen.setValue(material.sheen);
		}

		if(material.sheenRoughness !== undefined) {
			materialSheenRoughness.setValue(material.sheenRoughness);
		}

		if ( material.sheenColor !== undefined ) {

			materialSheenColor.setHexValue( material.sheenColor.getHexString() );

		}

		/*
		if ( material.sheen !== undefined && material.sheen !== null ) {

			materialSheenEnabled.setValue( true );
			materialSheen.setHexValue( material.sheen.getHexString() );

		}
		*/

		if ( material.transmission !== undefined ) {

			materialTransmission.setValue( material.transmission );

		}

		if ( material.emissive !== undefined ) {

			materialEmissive.setHexValue( material.emissive.getHexString() );

		}
		if (material.emissiveIntensity !== undefined){
			materialEmissiveIntensity.setValue( material.emissiveIntensity );
		}

		if ( material.specular !== undefined ) {

			materialSpecular.setHexValue( material.specular.getHexString() );

		}

		if ( material.shininess !== undefined ) {

			materialShininess.setValue( material.shininess );

		}

		if ( material.clearcoat !== undefined ) {

			materialClearcoat.setValue( material.clearcoat );

		}

		if ( material.clearcoatRoughness !== undefined ) {

			materialClearcoatRoughness.setValue( material.clearcoatRoughness );

		}

		if ( material.vertexColors !== undefined ) {

			materialVertexColors.setValue( material.vertexColors );

		}

		if ( material.depthPacking !== undefined ) {

			materialDepthPacking.setValue( material.depthPacking );

		}

		if ( material.skinning !== undefined ) {

			materialSkinning.setValue( material.skinning );

		}

		if ( material.map !== undefined ) {

			materialMapEnabled.setValue( material.map !== null );

			if ( material.map !== null || resetTextureSelectors ) {

				materialMap.setValue( material.map );

			}

		}

		if ( material.matcap !== undefined ) {

			materialMatcapMapEnabled.setValue( material.matcap !== null );

			if ( material.matcap !== null || resetTextureSelectors ) {

				materialMatcapMap.setValue( material.matcap );

			}

		}

		if ( material.alphaMap !== undefined ) {

			materialAlphaMapEnabled.setValue( material.alphaMap !== null );

			if ( material.alphaMap !== null || resetTextureSelectors ) {

				materialAlphaMap.setValue( material.alphaMap );

			}

		}

		if ( material.bumpMap !== undefined ) {

			materialBumpMapEnabled.setValue( material.bumpMap !== null );

			if ( material.bumpMap !== null || resetTextureSelectors ) {

				materialBumpMap.setValue( material.bumpMap );

			}

			materialBumpScale.setValue( material.bumpScale );

		}

		if ( material.normalMap !== undefined ) {

			materialNormalMapEnabled.setValue( material.normalMap !== null );

			if ( material.normalMap !== null || resetTextureSelectors ) {

				materialNormalMap.setValue( material.normalMap );

			}

			materialNormalScaleX.setValue( material.normalScale.x );
			materialNormalScaleY.setValue( material.normalScale.y );

		}

		if ( material.clearcoatNormalMap !== undefined ) {

			materialClearcoatNormalMapEnabled.setValue( material.clearcoatNormalMap !== null );

			if ( material.clearcoatNormalMap !== null || resetTextureSelectors ) {

				materialClearcoatNormalMap.setValue( material.clearcoatNormalMap );

			}

			materialClearcoatNormalScaleX.setValue( material.clearcoatNormalScale.x );
			materialClearcoatNormalScaleY.setValue( material.clearcoatNormalScale.y );

		}

		if ( material.displacementMap !== undefined ) {

			materialDisplacementMapEnabled.setValue( material.displacementMap !== null );

			if ( material.displacementMap !== null || resetTextureSelectors ) {

				materialDisplacementMap.setValue( material.displacementMap );

			}

			materialDisplacementScale.setValue( material.displacementScale );

		}

		if ( material.roughnessMap !== undefined ) {

			materialRoughnessMapEnabled.setValue( material.roughnessMap !== null );

			if ( material.roughnessMap !== null || resetTextureSelectors ) {

				materialRoughnessMap.setValue( material.roughnessMap );

			}

		}

		if ( material.metalnessMap !== undefined ) {

			materialMetalnessMapEnabled.setValue( material.metalnessMap !== null );

			if ( material.metalnessMap !== null || resetTextureSelectors ) {

				materialMetalnessMap.setValue( material.metalnessMap );

			}

		}

		if ( material.specularMap !== undefined ) {

			materialSpecularMapEnabled.setValue( material.specularMap !== null );

			if ( material.specularMap !== null || resetTextureSelectors ) {

				materialSpecularMap.setValue( material.specularMap );

			}

		}

		if ( material.envMap !== undefined ) {

			materialEnvMapEnabled.setValue( material.envMap !== null );

			if ( material.envMap !== null || resetTextureSelectors ) {

				materialEnvMap.setValue( material.envMap );

			}

		}

		if ( material.gradientMap !== undefined ) {

			materialGradientMapEnabled.setValue( material.gradientMap !== null );

			if ( material.gradientMap !== null || resetTextureSelectors ) {

				materialGradientMap.setValue( material.gradientMap );

			}

		}

		// if ( material.reflectivity !== undefined ) {

		// 	materialReflectivity.setValue( material.reflectivity );

		// }

		if ( material.lightMap !== undefined ) {

			materialLightMapEnabled.setValue( material.lightMap !== null );

			if ( material.lightMap !== null || resetTextureSelectors ) {

				materialLightMap.setValue( material.lightMap );

			}

		}

		if ( material.transmissionMap !== undefined ) {

			materialTransmissionMapEnabled.setValue( material.transmissionMap !== null );

			if ( material.transmissionMap !== null || resetTextureSelectors ) {

				materialTransmissionMap.setValue( material.transmissionMap );

			}

		}

		if ( material.thicknessMap !== undefined ) {

			materialThicknessMapEnabled.setValue( material.thicknessMap !== null );

			if ( material.thicknessMap !== null || resetTextureSelectors ) {

				materialThicknessMap.setValue( material.thicknessMap );

			}

		}

		if ( material.aoMap !== undefined ) {

			materialAOMapEnabled.setValue( material.aoMap !== null );

			if ( material.aoMap !== null || resetTextureSelectors ) {

				materialAOMap.setValue( material.aoMap );

			}

			materialAOScale.setValue( material.aoMapIntensity );

		}

		if ( material.emissiveMap !== undefined ) {

			materialEmissiveMapEnabled.setValue( material.emissiveMap !== null );

			if ( material.emissiveMap !== null || resetTextureSelectors ) {

				materialEmissiveMap.setValue( material.emissiveMap );

			}

		}

		if ( material.side !== undefined ) {

			materialSide.setValue( material.side );

		}

		if ( material.size !== undefined ) {

			materialSize.setValue( material.size );

		}

		if ( material.sizeAttenuation !== undefined ) {

			materialSizeAttenuation.setValue( material.sizeAttenuation );

		}

		if ( material.flatShading !== undefined ) {

			materialShading.setValue( material.flatShading );

		}

		if ( material.blending !== undefined ) {

			materialBlending.setValue( material.blending );

		}

		if ( material.opacity !== undefined ) {

			materialOpacity.setValue( material.opacity );

		}

		if ( material.transparent !== undefined ) {

			materialTransparent.setValue( material.transparent );

		}

		if ( material.alphaTest !== undefined ) {

			materialAlphaTest.setValue( material.alphaTest );

		}

		if ( material.depthTest !== undefined ) {

			materialDepthTest.setValue( material.depthTest );

		}

		if ( material.depthWrite !== undefined ) {

			materialDepthWrite.setValue( material.depthWrite );

		}

		if ( material.wireframe !== undefined ) {

			materialWireframe.setValue( material.wireframe );

		}

		// if ( material.reflectivity !== undefined ) {

		// 	materialPhysicalReflectivity.setValue( material.reflectivity );

		// }

		setRowVisibility();

	}

	// events

	signals.objectSelected.add( function ( object ) {

		var hasMaterial = false;

		if ( object && object.type != 'Particle' && object.material ) {

			hasMaterial = true;

			if ( Array.isArray( object.material ) && object.material.length === 0 ) {

				hasMaterial = false;

			}

		}

		if ( hasMaterial ) {

			var objectChanged = object !== currentObject;

			currentObject = object;
			refreshUI( objectChanged );
			container.setDisplay( '' );

		} else {

			currentObject = null;
			container.setDisplay( 'none' );

		}

	} );

	signals.materialChanged.add( function () {

		refreshUI();

	} );

	var vertexShaderVariables = [
		'uniform mat4 projectionMatrix;',
		'uniform mat4 modelViewMatrix;\n',
		'attribute vec3 position;\n\n',
	].join( '\n' );

	var meshMaterialOptions = {
		'MeshBasicMaterial': 'MeshBasicMaterial',
		'MeshDepthMaterial': 'MeshDepthMaterial',
		'MeshNormalMaterial': 'MeshNormalMaterial',
		'MeshLambertMaterial': 'MeshLambertMaterial',
		'MeshMatcapMaterial': 'MeshMatcapMaterial',
		'MeshPhongMaterial': 'MeshPhongMaterial',
		'MeshToonMaterial': 'MeshToonMaterial',
		'MeshStandardMaterial': 'MeshStandardMaterial',
		'MeshPhysicalMaterial': 'MeshPhysicalMaterial',
		'RawShaderMaterial': 'RawShaderMaterial',
		'ShaderMaterial': 'ShaderMaterial',
		'ShadowMaterial': 'ShadowMaterial'
	};

	var lineMaterialOptions = {
		'LineBasicMaterial': 'LineBasicMaterial',
		'LineDashedMaterial': 'LineDashedMaterial',
		'RawShaderMaterial': 'RawShaderMaterial',
		'ShaderMaterial': 'ShaderMaterial'
	};

	var spriteMaterialOptions = {
		'SpriteMaterial': 'SpriteMaterial',
		'RawShaderMaterial': 'RawShaderMaterial',
		'ShaderMaterial': 'ShaderMaterial'
	};

	var pointsMaterialOptions = {
		'PointsMaterial': 'PointsMaterial',
		'RawShaderMaterial': 'RawShaderMaterial',
		'ShaderMaterial': 'ShaderMaterial'
	};

	return container;

}

export { SidebarMaterial };
