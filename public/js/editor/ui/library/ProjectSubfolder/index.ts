import { UIAccordion } from '../../components/ui.openstudio';
import './styles.scss';
import { IProject, IExampleProject } from '../../../types/index';
import axios from 'axios';
const menuHtml = require("./menu.html").default;

let accordionType = new UIAccordion();

export default class ProjectSubfolder{
    dom:HTMLElement;
    accordion: typeof accordionType;
    name:string;
    deletable:boolean;
    projectSubfolders:string[];

    createDomIdFromName(name:string){
        return `projectSubFolder-${name}`
    }

    constructor(name:string, projectSubfolders:string[], nameEditable=true){
        var container = new UIAccordion(String(Math.random())).setTitle(name);
        this.name = name;
        this.projectSubfolders= projectSubfolders;
        this.dom=container.dom;
        this.accordion= container;
        this.dom.id = this.createDomIdFromName(name)
        this.deletable=true;
        this.dom.classList.add("projectSubFolder");

        (this.accordion.title.dom.querySelector(".AccordionTitleText")! as HTMLElement).contentEditable=`${nameEditable}`;


       
         if (nameEditable){
            const titleDOM= this.accordion.title.dom.querySelector(".AccordionTitleText")! as HTMLElement;

            const editName = () =>{
                if (this.name === titleDOM.innerText) return;
                titleDOM.contentEditable='true';
                if (!titleDOM.innerText || this.projectSubfolders.includes(titleDOM.innerText)){
                    alert("No name or name already taken");
                    return titleDOM.innerText=this.name;
                }
                const projects = this.getAllProjects();
    
                (window as any).editor.signals.projectsSubFolderAdded.dispatch(titleDOM.innerText);
                (window as any).editor.signals.projectsSubFolderRemoved.dispatch(this.name)

                this.name=titleDOM.innerText;


                projects.forEach(element=>{
                    let project = this.getProjectDataFromElem(element as HTMLDivElement);
                    if (!project) return;
                    (window as any).editor.signals.projectItemUpdated.dispatch({...project, category:this.name})
                        
                    axios.post("/asset/project/update", {id:project.id, data:{category:this.name}}).then(res=>{
                       
                    }).catch(err=>{
                        alert("Something went wrong")
                        console.error(err)
                    })
    
                })
            }
    

            titleDOM.addEventListener("keydown",(e:KeyboardEvent)=>{
                e.stopPropagation()
                e.stopImmediatePropagation()
                if (e.key.toLowerCase() ==="enter"){
                    titleDOM.blur()
                    return false;
                }
            })
    
            titleDOM.addEventListener("blur", ()=>{
                editName()
            })

          
         }



        this.dom.addEventListener("dragover", e=>{
            this.dom.style.opacity="0.7";
        })
        this.dom.addEventListener("dragleave", e=>{
            this.dom.style.opacity="1";
        })

        this.dom.addEventListener("drop", e=>{
            this.dom.style.opacity="1";
            if (!e.dataTransfer) return;
            const project = JSON.parse(e.dataTransfer.getData('project')) as IProject;
            if (!project) return;
            let projectDOM = document.querySelector(`#ProjectItem-${project.id}`)
            if (projectDOM){
                const {firstChild} =this.accordion.body.dom; 
                if (firstChild){
                    this.accordion.body.dom.insertBefore( projectDOM, firstChild)
                }else{
                    this.accordion.body.dom.appendChild( projectDOM)
                }
                
                axios.post("/asset/project/update", {id:project.id, data:{category:this.name}}).then(res=>{
                    (window as any).editor.signals.projectItemUpdated.dispatch({...project, category:this.name})
                }).catch(err=>{
                    alert("Something went wrong")
                    console.error(err)
                })
            }

        })
        this.accordion.title.dom.addEventListener("contextmenu", (e: MouseEvent)=>{
            if (!this.deletable) return;
            e.preventDefault();
            document.querySelector("#delete-folder-menu")?.remove()
            document.body.insertAdjacentHTML("beforeend", menuHtml)
            let menu = document.body.lastElementChild! as HTMLElement
            menu.style.top=`${e.clientY}px`
            menu.style.left=`${e.clientX}px`

            const deleteFolderBtn = menu.querySelector(".delete-folder")!
            const deleteFolderAndProjectsBtn = menu.querySelector(".delete-folder-and-projects")!


            deleteFolderBtn.addEventListener("click", ()=>{
                let projects = this.getAllProjects();
                projects.forEach((element2) => {
                    const elememt = element2 as HTMLDivElement;
                    
                    const project = this.getProjectDataFromElem(elememt)
                    if (!project) return;
                    (window as any).editor.signals.projectItemUpdated.dispatch({...project, category:"recent"})

                    let recentsFolderBody =document.querySelector(`#${this.createDomIdFromName("recent")} .AccordionBody`)! 

                    let firstChild = recentsFolderBody.firstChild;
                    if (firstChild){
                        recentsFolderBody.insertBefore( elememt, firstChild)

                    }else{
                        recentsFolderBody.appendChild(elememt)

                    }


                    axios.post("/asset/project/update", {id:project.id, data:{category:"recent"}}).then(res=>{
                       
                    }).catch(err=>{
                        alert("Something went wrong")
                        console.error(err)
                    })

                });
                this.dom.remove();
                (window as any).editor.signals.projectsSubFolderRemoved.dispatch(this.name);
                menu.remove()
            })

            deleteFolderAndProjectsBtn.addEventListener("click",e=>{
                const confirmed = confirm("Are you sure you want to delete the folder and all the projects in it?")

                if (confirmed){
                    let projects = this.accordion.body.dom.children;
                    Array.from(projects).forEach((element2) => {
                        const elememt = element2 as HTMLDivElement;
                        let unparsedProject = elememt.dataset['project'] 
                        const project = unparsedProject && JSON.parse(unparsedProject) as IProject
                        if (!project) return;
                      
                        axios.post("/asset/project/delete", {id:project.id, }).then(res=>{
                           
                        }).catch(err=>{
                            alert("Something went wrong")
                            console.error(err)
                        })
    
                    });
                    this.dom.remove();
                    (window as any).editor.signals.projectsSubFolderRemoved.dispatch(this.name);
                }
               
                menu.remove()
            })



            function detectCloseMenu(e:MouseEvent){
                if (menu.contains((e as any).target) || menu === e.target){
                    return;
                }else{
                    menu.remove()
                    window.removeEventListener("click",detectCloseMenu)
                }
            }
            window.addEventListener("click",detectCloseMenu )
            return false;
        }, false)
    };

    getAllProjects(){
        return Array.from(this.accordion.body.dom.children)
    }
    getProjectDataFromElem(element:HTMLElement){
        let unparsedProject = element.dataset['project'] 
        const project = unparsedProject && JSON.parse(unparsedProject) as IProject
        return project
    }

    
}