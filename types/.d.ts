declare module "*"
declare module "*.html"
declare var require: any
import * as THREE4 from "../public/js/editor/libs/three.module.js";

import {Editor} from "../public/js/editor/ui/Editor.js";


declare global {
    var THREE: typeof THREE4;
    interface Window {
        // THREE: typeof THREE;
        editor: Editor;
    }
}


export {};