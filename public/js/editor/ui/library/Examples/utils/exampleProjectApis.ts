import { IExampleProject, IProject } from '../../../../types/index';
import axios from 'axios';
const defaultNewExampleData = {
	title: '',
	vimeoId: '',
	description: '',
	thumbUrl: 'https://i.imgur.com/9Y1yzik.png',
	order: 0,
};

export async function createExampleProject({
	project,
	exampleData,
	thumbnail,
}: {
	project: IProject;
	exampleData: typeof defaultNewExampleData;
	thumbnail?: File;
}): Promise<IExampleProject> {
	for (let key in defaultNewExampleData) {
		let exampleData2 = exampleData as any;
		if (!exampleData2[key as any]) {
			exampleData2[key as any] = (defaultNewExampleData as any)[key as any] as any;
		}
	}

	const res = await axios.post('/asset/example-project', {
		projectId: project.id,
		title: exampleData.title,
		name: project.name,
		configUrl: project.configUrl,
		stateUrl: project.stateUrl,
		description: exampleData.description,
		vimeoId: exampleData.vimeoId,
		thumbnail: exampleData.thumbUrl,
		originalProjectId: project.id,
		order: exampleData.order,
	});
	let thumbUrl = res.data.thumbUrl;
	if (thumbnail) {
		thumbUrl = await updateExampleProjectThumbnail(res.data, thumbnail);
	}
	return { ...res.data, thumbUrl };
}

export async function fetchExampleProjects(): Promise<IExampleProject[]> {
	const res = await axios.get('/asset/example-project/list');
	return res.data;
}

export async function duplicateExampleProject(
	exampleProject: IExampleProject
): Promise<IExampleProject> {
	const res = await axios.post(`/asset/example-project/duplicate/${exampleProject.id}`);
	return res.data;
}

export async function deleteExampleProject(exampleProject: IExampleProject): Promise<any> {
	const res = await axios.post(`/asset/example-project/${exampleProject.id}/delete`);
	return res.data;
}

export async function updateExampleProject(
	exampleProject: IExampleProject
): Promise<IExampleProject> {
	const res = await axios.put(`/asset/example-project/${exampleProject.id}`, { ...exampleProject });
	return res.data;
}

export async function updateExampleProjectThumbnail(
	exampleProject: IExampleProject,
	thumbnail: File
): Promise<string> {
	var formData = new FormData();
	formData.append('id', String(exampleProject.id));
	formData.append('thumbnail', thumbnail);

	const { data } = await axios.post('/asset/example-project/thumbnail', formData);
	return data.url as string;
}