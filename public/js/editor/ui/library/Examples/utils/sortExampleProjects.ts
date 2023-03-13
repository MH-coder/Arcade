import { IExampleProject } from '../../../../types';

export default function sortExampleProjects(projects: IExampleProject[]) {
	projects.sort((a, b) => {
		return a.order - b.order;
	});
}