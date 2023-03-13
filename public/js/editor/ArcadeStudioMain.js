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
import { FollowControls } from "./controls/FollowControls.js";
import { VRButton } from "./core/webxr/VRButton.js";

import { AnimationControls } from "./controls/AnimationControls.js";
import { Editor } from "./ui/Editor.js";
import { Splash } from "./ui/Splash.js";
import { Viewport } from "./ui/Viewport.js";
import { Workspace } from "./ui/Workspace.js";
import { Player } from "./ui/Player.js";
import { LibraryGeometryFolderItem } from './ui/library/Library.Geometry.Folder.Item.js';
import { LibraryGeometryFolder } from './ui/library/Library.Geometry.Folder.js';
import debounce from 'debounce';

window.URL = window.URL || window.webkitURL;
window.BlobBuilder =
  window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;

Number.prototype.format = function () {
  return this.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
};

RectAreaLightUniformsLib.init();

var editor = new Editor(project);

window.editor = editor;
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
window.FirstPersonControls = FirstPersonControls;
window.DragControls = DragControls;
window.TransformControls = TransformControls;
window.FollowControls = FollowControls;
window.AudioContext = window.AudioContext || window.webkitAudioContext;
window.VRButton = VRButton;
window.AnimationControls = AnimationControls;

editor.storage.initIndexedDB();

let beforeUnloadListening = false;

const beforeUnloadListener = (event) => {
  editor.storage.save();
}

const setBeforeUnloadListener = (set) => {
  if(set)
    window.addEventListener("beforeunload", beforeUnloadListener);
  else
    window.removeEventListener("beforeunload", beforeUnloadListener);  
  
  beforeUnloadListening = set;
}

const syncstate = () => {
  editor.storage.save(project.id, () => {
    setBeforeUnloadListener(false);
  });
};

const saveState = () => {
  editor.storage.saveToIndexedDb(project.id, () => {
    if(!beforeUnloadListening) {
      setTimeout(() => {
        syncstate();
      }, 90000);
      setBeforeUnloadListener(true);
    }
  });
}

function onWindowFullScreen() {
  if (editor.isFullscreen) {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  } else {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) {
      document.documentElement.msRequestFullscreen();
    }
  }
}

var signals = editor.signals;

var splash = new Splash(editor, project);
document.body.appendChild(splash.dom);


signals.loadingFinished.add(function () {
  editor.config.setKey("project/name", project.name);
  editor.config.setKey("project/thumbnail", project.thumbUrl);

  var viewport = new Viewport(editor);
  document.body.appendChild(viewport.dom);

  var player = new Player(editor);
  document.body.appendChild(player.dom);

  var workspace = new Workspace(editor);
  document.body.appendChild(workspace.dom);

  editor.logicBlock = new LogicBlock(editor);
  editor.logicBlock.init();

  editor.loadState();
  onWindowResize();
});

signals.sceneLoaded.add( function () {
  splash.delete();
});
const dSaveState = debounce(saveState, 3000);
signals.geometryChanged.add(dSaveState);
signals.objectAdded.add(dSaveState);
signals.objectChanged.add(dSaveState);
signals.objectRemoved.add(dSaveState);
signals.materialChanged.add(dSaveState);
signals.filterChanged.add(dSaveState);
signals.filterRemoved.add(dSaveState);
signals.sceneBackgroundChanged.add(dSaveState);
signals.sceneEnvironmentChanged.add(dSaveState);
signals.sceneFogChanged.add(dSaveState);
signals.sceneUserDataChanged.add(dSaveState);
signals.sceneGraphChanged.add(dSaveState);
signals.scriptChanged.add(dSaveState);
signals.historyChanged.add(dSaveState);
signals.timelineChanged.add(dSaveState);
signals.toggleFullscreen.add(onWindowFullScreen);

document.addEventListener(
  "dragover",
  function (event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  },
  false
);

// document.addEventListener( 'drop', function ( event ) {
//   event.preventDefault();
//   if ( event.dataTransfer.types[ 0 ] === 'text/plain' ) return; // Outliner drop

//     if ( event.dataTransfer.files ) {
//       var { files } = event.dataTransfer;
//       Promise.all( editor.loader.loadFiles( event.dataTransfer.files, null, 'Geometry' ) ).then( function ( results ) {
//         var assets = {};
//         var items = {};

//         for ( var result of results ) {

//           var name = result.filename.split('.').slice(0, -1).join('.');
//           var ext = result.filename.split( '.' ).pop().toLowerCase();
//           var asset = editor.assets.uploadGeometry( name, ext, result.object );
//           assets[result.filename] = asset;
//           var scope = editor.libraryGeometryFolderRef;
//           var item = new LibraryGeometryFolderItem( editor, 0, asset );
//           item.setLoading( true );
//           items[result.filename] = item;

//           scope.items.push( item );
//           scope.folders[ 0 ].add( item.container );
          
//         }

//         var formData = new FormData();
//         formData.append( 'type', 'Geometry' );
//         formData.append( 'projectId', editor.projectId );

//         for (const [key, value] of Object.entries(files)) {
//           formData.append('file', value);
//         }
  
//         editor.api.post( '/asset/my-geometry/upload', formData ).then( res => {
  
//           for ( var file of res.files ) {

//             assets[ file.name ].id = file.id;
//             assets[ file.name ].geometryId = file.geometryId;
//             items[ file.name ].setLoading( false );
            
//           } 
//         } );

//       } );

//     }

// });

document.addEventListener(
  "fullscreenchange",
  function (event) {
    editor.isFullscreen = !editor.isFullscreen;
  },
  false
);

document.addEventListener(
  "mousedown",
  function (e) {
    var scriptList = $(e.target).closest(".dropdown-list");
    var workspaceList = $(e.target).closest(".DropdownList");
    var dropdownList = $(e.target).closest(".Dropdown");
    var dropdown = $(".Dropdown");
    if (
      scriptList.length == 0 &&
      workspaceList.length == 0 &&
      (dropdownList.length == 0)
    ) {
      $(".w--open").removeClass("w--open");
    }else{
      for(var i=0; i<dropdown.length; i++){
        if(dropdownList.length>0 && dropdown[i]!=dropdownList[0]){
          $(dropdown[i]).find(".w--open").removeClass("w--open");
        }
      }
    }

    var connectionLabel = $(e.target).closest(".connectionLabel");
    var styledRadioButtons = $(e.target).closest(".StyledRadioButtons");
    if(connectionLabel.length == 0 && styledRadioButtons.length == 0){
      $(".markSelected").removeClass("markSelected");
      $(".StyledRadioButtons").hide();
    }

    /*
    var accordionList = $(e.target).closest(".AccordionList");
    if(accordionList.length == 0){
      var scenePanel = $("#scene-panel");
      if(scenePanel.length){
        var accordionList = scenePanel.find( '.AccordionList' );
        var activeBody = accordionList.find( '.AccordionBody.active' );
        var activeTitle = accordionList.find( '.AccordionTitle.active' );
        activeTitle.removeClass("active");
        activeBody.removeClass("active");
        activeBody.slideUp();
      }
    }
    */

  },
  false
);

/*
document.addEventListener(
  "mousedown",
  function (e) {
    var accordionList = $(e.target).closest(".AccordionList");
    if(accordionList.length == 0){
      var scenePanel = $("#scene-panel");
      if(scenePanel.length){
        var accordionList = scenePanel.find( '.AccordionList' );
        var activeBody = accordionList.find( '.AccordionBody.active' );
        var activeTitle = accordionList.find( '.AccordionTitle.active' );
        activeTitle.removeClass("active");
        activeBody.removeClass("active");
        activeBody.slideUp();
      }
    }
  }, false
);
*/

document.addEventListener(
  "click",
  function (e) {
    $(".FolderItemMenu").hide();
  },
  false
);

function onWindowResize() {
  editor.signals.windowResize.dispatch();
}

window.addEventListener("resize", onWindowResize, false);

document.addEventListener( 'drop', function ( event ) {
  event.preventDefault();
  if ( event.dataTransfer.types[ 0 ] === 'text/plain' ) return; // Outliner drop

    if ( event.dataTransfer.files ) {
      var { files } = event.dataTransfer;
      Promise.all( editor.loader.loadFiles( event.dataTransfer.files, null, 'Geometry' ) ).then( function ( results ) {
        var assets = {};
        var items = {};

        for ( var result of results ) {

          var name = result.filename.split('.').slice(0, -1).join('.');
          var ext = result.filename.split( '.' ).pop().toLowerCase();
          var asset = editor.assets.uploadGeometry( name, ext, result.object );
          assets[result.filename] = asset;
          var scope = editor.libraryGeometryFolderRef;
          var item = new LibraryGeometryFolderItem( editor, 0, asset );
          item.setLoading( true );
          items[result.filename] = item;

          scope.items.push( item );
          scope.folders[ 0 ].add( item.container );
          
        }

        var formData = new FormData();
        formData.append( 'type', 'Geometry' );
        formData.append( 'projectId', editor.projectId );

        for (const [key, value] of Object.entries(files)) {
          formData.append('file', value);
        }
  
        editor.api.post( '/asset/my-geometry/upload', formData ).then( res => {
  
          for ( var file of res.files ) {

            assets[ file.name ].id = file.id;
            assets[ file.name ].geometryId = file.geometryId;
            items[ file.name ].setLoading( false );
            
          } 
        } );

      } );

    }
  })
signals.startPlayer.add(() => {
	document.querySelector('#viewport').style.display = 'none';
	document.querySelector('#workspace').style.display = 'none';
});

signals.stopPlayer.add(() => {
	document.querySelector('#viewport').style.display = '';
	document.querySelector('#workspace').style.display = '';
});