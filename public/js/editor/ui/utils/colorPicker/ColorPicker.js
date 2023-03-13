import "./styles.scss";
/** This funciton just repositions the colorPicker on the sidebar */
export default function showColorPicker(positioningElem){

    const containerWidth = 250;

    const picker = document.querySelector("#color-picker");
    const pickerParent = picker.parentElement;
    
    const container = document.createElement("div");
    container.id = "color-picker-container";
    document.body.appendChild(container);

    const backdrop = document.createElement("div");
    container.appendChild(backdrop);
    backdrop.classList.add("backdrop");

    const pickerContainer = document.createElement("div");
    pickerContainer.classList.add("color-picker-inner-container");
    container.appendChild(pickerContainer);

    pickerContainer.appendChild(picker);
    const rect = positioningElem.getBoundingClientRect(positioningElem);
    const {top, left, right} = rect;
    console.log({rect});
    pickerContainer.style.top = `${top}px`;
    pickerContainer.style.left = `${(left + right)/2 - containerWidth/2}px`;
    console.log(pickerContainer, pickerContainer.style)

    const closeBtn = picker.querySelector(".color-picker-title-bar img");

    backdrop.onclick= ()=>closeBtn.click();
    closeBtn.addEventListener("click", onClose);
    const elemsToHide=  picker.parentElement.querySelectorAll("#color-picker > .Row");

    const titleBar = picker.querySelector(".color-picker-title-bar > div");

    let titleBarInnerHTML = titleBar.innerHTML
    let titleBarStyleColor = titleBar.style.color;

    titleBar.innerHTML="Color Picker";
    titleBar.style.color="#6c8db8";




    function onClose(){
        pickerParent.appendChild(picker);
        container.remove();

        elemsToHide.forEach(elem=>{
            elem.style.display="flex";
        })
        titleBar.innerHTML= titleBarInnerHTML;
        titleBar.style.color = titleBarStyleColor;
    }


    elemsToHide.forEach(elem=>{
        elem.style.display="none"
    })

    

    
}