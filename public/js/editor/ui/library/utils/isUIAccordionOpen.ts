import { UIAccordion } from '../../components/ui.openstudio';

let accordionType = new UIAccordion();

export default function isUIAccordionOpen(accordion: typeof accordionType){
    return accordion.title.dom.classList.contains("active") && accordion.body.dom.classList.contains("active")
}