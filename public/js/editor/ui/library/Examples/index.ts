import { UIElement } from '../../components/ui.js';
import { UIAccordion } from '../../components/ui.openstudio.js';
import './ExampleItem/styles.scss';
import { IExampleProject, IProject } from '../../../types/index';
import Example from './ExampleItem/index';
import { createExampleProject, fetchExampleProjects } from './utils/exampleProjectApis';
import sortExampleProjects from './utils/sortExampleProjects';
import SpinningLoader from '../../SpinningLoader/index';
import isSuperAdmin from '../../utils/isSuperAdmin';

function ExamplesFolder(editor: any) {
	var container = new UIAccordion(String(Math.random())).setTitle('Examples');
	container.dom.classList.add('examples-container');
	container.dom.style.position = 'relative';

	fetchExampleProjects().then((res) => {
		sortExampleProjects(res);
		res.forEach((exampleProject) => {
			let newExample = new UIElement(new Example({ editor, exampleProject }).dom);
			container.body.dom.appendChild(newExample.dom);
		});
	});

	container.title.dom.addEventListener('drop', (e: DragEvent) => {
		if (!isSuperAdmin) return;
		if (!e.dataTransfer) return;

		const exampleData = JSON.parse(e.dataTransfer.getData('exampleData')) as any;

		const project = JSON.parse(e.dataTransfer.getData('project')) as IProject;

		if (!project || !project.id || !exampleData) return;

		let firstChild = container.body.dom.children[0] as HTMLElement;
		if (!firstChild) {
			exampleData.order = 1;
		} else {
			let exampleProject = JSON.parse(
				firstChild.dataset['exampleProject'] || ''
			) as IExampleProject;
			if (exampleProject) {
				exampleData.order = exampleProject.order - 1;
			}
		}

		const loader = SpinningLoader();
		container.dom.appendChild(loader);

		let thumbnail = (window as any).exampleProjectThumbnail;
		(window as any).exampleProjectThumbnail = null;

		createExampleProject({ exampleData, project, thumbnail })
			.then((res) => {
				let newExample = new UIElement(new Example({ editor, exampleProject: res }).dom);
				container.body.dom.insertAdjacentElement('afterbegin', newExample.dom);
			})
			.catch((err) => {
				alert('Failed to create example');
				throw new Error(err);
			})
			.finally(() => {
				loader.remove();
			});
	});

	// container.title.dom.click();

	return container;
}

export { ExamplesFolder };