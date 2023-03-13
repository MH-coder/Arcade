import * as THREE from "./libs/three.module.js";
window.THREE = THREE;

import "./libs/logicblock/index";
import "./helpers/index";
import { RectAreaLightUniformsLib } from "./core/lights/RectAreaLightUniformsLib.js";
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
import { FirstPersonControls } from "./core/controls/FirstPersonControls.js";
import { VRButton } from "./core/webxr/VRButton.js";

import { FollowControls } from "./controls/FollowControls.js";
import { AnimationControls } from "./controls/AnimationControls.js";
import { Editor } from "./ui/Editor.js";
import { AppSplash } from "./ui/AppSplash.js";
import { APP } from "./libs/app.js";

window.URL = window.URL || window.webkitURL;
window.BlobBuilder =
  window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;

Number.prototype.format = function () {
  return this.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
};

RectAreaLightUniformsLib.init();

var editor = new Editor();

window.THREE = THREE;
import "./controls/ObjectControls";

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
window.FollowControls = FollowControls;
window.FirstPersonControls = FirstPersonControls;
window.AudioContext = window.AudioContext || window.webkitAudioContext;
window.VRButton = VRButton;
window.AnimationControls = AnimationControls;

var signals = editor.signals;

var splash = new AppSplash(editor, app);
document.body.appendChild(splash.dom);

if (!app) {
  signals.loadingFinished.dispatch();
}

signals.loadingFinished.add(function () {
  splash.delete();

  var player = new APP.Player(editor.assets);
  document.body.appendChild(player.dom);

  player.load(editor.storage.state);
  player.autostart = editor.storage.state.autostart;
  player.setSize(window.innerWidth, window.innerHeight);
  player.play();

  window.addEventListener("resize", function () {
    player.setSize(window.innerWidth, window.innerHeight);
  });


  //try to start animation here;

  for(var i in player.actions){
    for(var j in player.actions[i]){
      if(player.autostart && player.autostart[i]){
        if(player.autostart[i][j]){
          player.actions[ i ][ j ].play();
        }
      }
    }
  }
});
