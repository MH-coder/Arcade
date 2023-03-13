export default function showSidebar(){
    const sidebar = document.querySelector("#sidebar") as HTMLDivElement;
    if (sidebar.style.display==="none"){
        document.dispatchEvent(new KeyboardEvent('keydown', {key: '3'}));    }
}