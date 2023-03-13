export default function refreshLogicBlock() {

    let editor = (window as any).editor; 
    let lastscriptIndex = editor.logicBlock.getLastScriptIndex();

    document.dispatchEvent(new KeyboardEvent('keydown', {key: '1'}));


    // let lastscript = editor.scripts[lastscriptIndex];

    document.dispatchEvent(new KeyboardEvent('keydown', {'key': '1'}));

    let tabDoms = document.querySelectorAll("#script .script-top-bar .StyledTab") as unknown as HTMLDivElement[];
    

    Array.from(tabDoms)[lastscriptIndex].click();


}
