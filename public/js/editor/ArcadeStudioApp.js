import * as THREE from "./libs/three.module.js";
window.THREE = THREE;
import { RectAreaLightUniformsLib } from "./core/lights/RectAreaLightUniformsLib.js";
import { APP } from "./libs/app.js";
import { VRButton } from "./core/webxr/VRButton.js";
import "./libs/logicblock/index";
import "./helpers/index";
import { EffectComposer } from "./core/postprocessing/EffectComposer.js";
import { RenderPass } from "./core/postprocessing/RenderPass.js";
import { ShaderPass } from "./core/postprocessing/ShaderPass.js";
import { GlitchPass } from "./core/postprocessing/GlitchPass.js";
import { UnrealBloomPass } from "./core/postprocessing/UnrealBloomPass.js";
import { AfterimagePass } from "./core/postprocessing/AfterimagePass.js";
import { SSAOPass } from "./core/postprocessing/SSAOPass.js";
import { BokehPass } from "./core/postprocessing/BokehPass.js";
import { NodePass } from "./core/nodes/postprocessing/NodePass.js";
import * as Nodes from "./core/nodes/Nodes.js";
import { DotScreenShader } from "./core/shaders/DotScreenShader.js";
import { RGBShiftShader } from "./core/shaders/RGBShiftShader.js";
import { LuminosityShader } from "./core/shaders/LuminosityShader.js";
import { SobelOperatorShader } from "./core/shaders/SobelOperatorShader.js";

import { OrbitControls, MapControls } from "./core/controls/OrbitControls.js";
import { DragControls } from "./core/controls/DragControls.js";
import { TransformControls } from "./core/controls/TransformControls.js";
import { PointerLockControls } from "./core/controls/PointerLockControls.js";

import { AnimationControls } from "./controls/AnimationControls.js";

window.EffectComposer = EffectComposer;
window.RenderPass = RenderPass;
window.ShaderPass = ShaderPass;
window.GlitchPass = GlitchPass;
window.UnrealBloomPass = UnrealBloomPass;
window.AfterimagePass = AfterimagePass;
window.SSAOPass = SSAOPass;
window.BokehPass = BokehPass;
window.NodePass = NodePass;
window.DotScreenShader = DotScreenShader;
window.RGBShiftShader = RGBShiftShader;
window.LuminosityShader = LuminosityShader;
window.SobelOperatorShader = SobelOperatorShader;
window.Nodes = Nodes;

window.OrbitControls = OrbitControls;
window.MapControls = MapControls;
window.PointerLockControls = PointerLockControls;
window.DragControls = DragControls;
window.TransformControls = TransformControls;

window.AnimationControls = AnimationControls;
window.THREE = THREE; // Used by APP Scripts.
window.VRButton = VRButton; // Used by APP Scripts.
import "./controls/ObjectControls";

var loader = new THREE.FileLoader();
loader.load("app.json", function (text) {
  RectAreaLightUniformsLib.init();

  var player = new APP.Player();
  player.load(JSON.parse(text));
  player.setSize(window.innerWidth, window.innerHeight);
  player.play();

  document.body.appendChild(player.dom);

  window.addEventListener("resize", function () {
    player.setSize(window.innerWidth, window.innerHeight);
  });
});
