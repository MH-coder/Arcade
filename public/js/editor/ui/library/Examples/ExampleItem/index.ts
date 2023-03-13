import { IProject, IExampleProject } from '../../../../types/index';
import { UIRow } from '../../../components/ui';
import createExample from '../addExample/addExampleModal';
import {
	createExampleProject,
	deleteExampleProject,
	duplicateExampleProject,
	updateExampleProject,
	updateExampleProjectThumbnail,
} from '../utils/exampleProjectApis';
import sortExampleProjects from '../utils/sortExampleProjects';
import { ViewExample } from '../viewExample/view';
import axios from 'axios';
import SpinningLoader from '../../../SpinningLoader';
import isSuperAdmin from '../../../utils/isSuperAdmin';

export default class ExampleProjectItem {
	dom: HTMLDivElement;
	constructor({ editor, exampleProject }: { editor: any; exampleProject: IExampleProject }) {

		

		const row = new UIRow();
		row.dom.draggable = isSuperAdmin;
		row.dom.classList.add('example-row');
		row.dom.dataset['exampleProject'] = JSON.stringify(exampleProject);

		const titleDOM = document.createElement('div');
		titleDOM.innerText = exampleProject.name;
		titleDOM.contentEditable=`${isSuperAdmin}`;

		titleDOM.classList.add('example-name');
		titleDOM.title = exampleProject.name;
		titleDOM.addEventListener("keydown",e=>{
			e.stopPropagation()
			e.stopImmediatePropagation()
		})
		row.dom.appendChild(titleDOM);

		titleDOM.addEventListener("blur", ()=>{
			if (exampleProject.name === titleDOM.innerText) return;
			if (!isSuperAdmin) return;
			titleDOM.contentEditable='false';
			updateExampleProject({...exampleProject, name: titleDOM.innerText}).then(()=>{
				exampleProject.name=titleDOM.innerText;
			}).catch(err=>{
				alert("Error updating name")
				console.error(err)
			}).finally(()=>{
				titleDOM.contentEditable='true';
			})
		})

		const actions = document.createElement('div');
		actions.classList.add('example-actions');

		[
			'settings.svg',
			'play-btn.svg',
			//'duplicate-btn.svg',
			//'add-btn.svg',
			'close-delete-btn.svg',
		].forEach((action) => {
			if (action !== 'play-btn.svg' && !isSuperAdmin) return;

			const { config } = editor;
			const img = document.createElement('img');
			img.classList.add('icon-button');
			img.style.boxSizing = 'content-box';
			img.style.width = '13px';
			img.style.height = '14px';
			img.style.padding = '8px';
			img.src = config.getImage(`engine-ui/${action}`);

			actions.appendChild(img);

			if (action === 'play-btn.svg') {
				img.addEventListener('click', () => {
					ViewExample(exampleProject);
				});
			}

			if (action === 'close-delete-btn.svg') {
				img.addEventListener('click', () => {
					row.dom.remove();
					deleteExampleProject(exampleProject)
						.then((res) => {
					
						})
						.catch((err) => {
							alert('Error deleting project');
							throw new Error(err);
						});
				});
			}
			if (action === 'settings.svg') {
				img.style.opacity = '1';
				img.addEventListener('click', () => {
					delete (exampleProject as any).thumbnail;
					createExample({
						data: exampleProject,
						onSubmit: (data) => {
							let newProject = new ExampleProjectItem({
								editor,
								exampleProject: { ...exampleProject, ...data },
							});
							this.dom.insertAdjacentElement(
								'beforebegin',
								newProject.dom
							);

							this.dom.remove();
							if (data.thumbnail) {
								updateExampleProjectThumbnail(data, data.thumbnail)
									.then((res) => {
										let newProjectExampleData = JSON.parse(
											newProject.dom.dataset['exampleProject'] || ''
										) as IExampleProject;
										newProject.dom.insertAdjacentElement(
											'beforebegin',
											new ExampleProjectItem({
												editor,
												exampleProject: { ...newProjectExampleData, thumbUrl: res },
											}).dom
										);
										newProject.dom.remove();
									})
									.catch((err) => {
										alert('Error uploading image');
									});
							}

							updateExampleProject(data)
								.then(() => {})
								.catch((err) => {
									alert('Error updating project');
									throw new Error(err);
								});
						},
					});
				});
			}
			if (action === 'duplicate-btn.svg') {
				img.style.opacity = '0.6';
				// img.addEventListener('click', () => {
				// 	duplicateExampleProject(exampleProject)
				// 		.then((res) => {
				// 			this.dom.parentElement?.appendChild(
				// 				new ExampleProjectItem({ editor, exampleProject: res }).dom
				// 			);
				// 		})
				// 		.catch((err) => {
				// 			console.log('Unsuccessfull in duplicating project');
				// 		});
				// });
			}
			if (action === 'add-btn.svg') {
				img.style.opacity = '0.6';
			}
		});

		row.dom.appendChild(actions);

		this.dom = row.dom;
		// handle self dragging

		this.dom.addEventListener('dragstart', (e: DragEvent) => {
			if (!isSuperAdmin) return;

			let parent = this.dom.parentElement!;
			let index = Array.from(parent.childNodes).findIndex((elem) => elem === this.dom);

			if (e.dataTransfer) {
				e.dataTransfer.setData('isExample', String(true));
				e.dataTransfer.setData('index', String(index));
				e.dataTransfer.setData('exampleProject', JSON.stringify(exampleProject));
			}
		});

		// handle dragging of other elements
		this.dom.addEventListener('dragover', (event: DragEvent) => {
			if (!isSuperAdmin) return;

			const target = this.dom;
			var bounding = target.getBoundingClientRect();
			var offset = bounding.y + bounding.height / 2;
			if (event.clientY - offset > 0) {
				target.style['border-bottom' as any] = 'solid 2px blue';
				target.style['border-top' as any] = '';
			} else {
				target.style['border-top' as any] = 'solid 2px blue';
				target.style['border-bottom' as any] = '';
			}
		});

		this.dom.addEventListener('dragleave', (event: DragEvent) => {
			if (!isSuperAdmin) return;

			const target = this.dom;
			target.style['border-bottom' as any] = '';
			target.style['border-top' as any] = '';
		});

		// handle drop
		this.dom.addEventListener('drop', (e: DragEvent) => {
			if (!isSuperAdmin) return;

			e.stopImmediatePropagation();
			e.stopPropagation();
			const target = this.dom;

			const dropCatchingExampleProject = JSON.parse(
				target.dataset['exampleProject'] || ''
			) as IExampleProject;

			const droppedAbove = target.style['border-top' as any] !== '';
			target.style['border-bottom' as any] = '';
			target.style['border-top' as any] = '';

			if (!e.dataTransfer) return;

			const isExampleProject = e.dataTransfer.getData('isExample');
			const isNormalProject = !isExampleProject;

			let container = this.dom.parentElement!;

			let exampleProjects = (Array.from(container.children) as HTMLElement[]).map((childNode) => {
				return JSON.parse(childNode.dataset['exampleProject'] || '') as IExampleProject;
			});

			exampleProjects.forEach((exampleProject) => {
				if (exampleProject.order < dropCatchingExampleProject.order) {
					exampleProject.order -= 1;
				} else if (exampleProject.order > dropCatchingExampleProject.order) {
					exampleProject.order += 1;
				}

				if (exampleProject.id === dropCatchingExampleProject.order) {
					if (droppedAbove) {
						exampleProject.order += 1;
					} else {
						exampleProject.order -= 1;
					}
				}
			});

			if (isNormalProject) {
				const exampleData = JSON.parse(e.dataTransfer.getData('exampleData') || '') as any;
				const project = JSON.parse(e.dataTransfer.getData('project')) as IProject;

				if (!project || !project.id) return;

				if (droppedAbove) {
					exampleData.order = dropCatchingExampleProject.order - 1;
				} else {
					exampleData.order = dropCatchingExampleProject.order + 1;
				}
				reorderExampleProjects(exampleProjects);
				container.parentElement!.style.position = 'relative';
				let loader = SpinningLoader()!;
				container.parentElement?.appendChild(loader);

				let thumbnail = (window as any).exampleProjectThumbnail;
				(window as any).exampleProjectThumbnail = null;

				createExampleProject({ exampleData, project, thumbnail })
					.then((res) => {
						exampleProjects.push(res);
						Array.from(container.children).forEach((child) => {
							child.remove();
						});
						sortExampleProjects(exampleProjects);
						exampleProjects.forEach((exampleProject) => {
							let projectElem = new ExampleProjectItem({ editor, exampleProject }).dom;
							container.appendChild(projectElem);
						});
					})
					.catch((err) => {
						alert('Error creating project');
						throw new Error(err);
					})
					.finally(() => {
						loader.remove();
					});
			} else {
				const droppedExampleProjectId = (
					JSON.parse(e.dataTransfer.getData('exampleProject')) as IExampleProject
				)?.id;

				const droppedExampleProject = exampleProjects.find(
					(pro) => pro.id === droppedExampleProjectId
				)!;

				if (droppedAbove) {
					droppedExampleProject.order = dropCatchingExampleProject.order - 1;
				} else {
					droppedExampleProject.order = dropCatchingExampleProject.order + 1;
				}

				reorderExampleProjects(exampleProjects);

				Array.from(container.children).forEach((child) => {
					child.remove();
				});
				sortExampleProjects(exampleProjects);
				exampleProjects.forEach((exampleProject) => {
					let projectElem = new ExampleProjectItem({ editor, exampleProject }).dom;
					container.appendChild(projectElem);
				});
			}
		});
	}
}

function reorderExampleProjects(exampleProjects: IExampleProject[]) {
	axios
		.put('/asset/example-projects/update-orders', exampleProjects)
		.then(() => {})
		.catch((err: any) => {
			alert('Error reordering projects');
			throw new Error(err);
		});
}