import { UIButton, UIDiv, UIInput, UITextArea } from '../../../components/ui';
import './styles.scss';
const html = require('./index.html');
import replaceHtmlValues from '../utils/replaceHtmlValues';
import { IExampleProject } from '../../../../types/index';
import { ExampleData } from '../types';

interface ExampleProjectData extends IExampleProject {
	thumbnail?: File;
}

export default function createExample({
	data,
	onSubmit,
}: {
	data: ExampleProjectData;
	onSubmit(exampleData: ExampleProjectData): any;
}): void {
	let uploadedThumbail = data.thumbnail;

	let newHTML = replaceHtmlValues({ text: html.default, values: data });
	document.body.insertAdjacentHTML('beforeend', newHTML);

	const modal = document.body.lastElementChild as HTMLDivElement;
	modal.addEventListener('click', (e: MouseEvent) => {
		if (e.target === modal) modal.remove();
	});
	modal.addEventListener('keydown', (e) => e.stopPropagation());

	const exampleTitle = modal.querySelector('.title-input') as HTMLInputElement;

	const exampleVideoId = modal.querySelector('.vimeo-input')! as HTMLInputElement;

	const exampleDescription = modal.querySelector('.description-input') as HTMLTextAreaElement;

	const submitBtn = modal.querySelector('.submit-btn') as HTMLButtonElement;

	const uploadThumbnailInput = modal.querySelector('#upload-example-thumbnail') as HTMLInputElement;
	const uploadThumbnailBtn = modal.querySelector('#upload-thumbnail-btn') as HTMLInputElement;

	uploadThumbnailBtn.addEventListener('click', () => {
		uploadThumbnailInput.click();
	});

	uploadedThumbail && updatePreview({uploadedThumbail, parentElement:uploadThumbnailBtn.parentElement!})

	uploadThumbnailInput.addEventListener('input', (e) => {
		if (uploadThumbnailInput.files) {
			const [file] = uploadThumbnailInput.files;
			if (file) {
				uploadThumbnailInput.value = '';
				uploadedThumbail = file;
				updatePreview({uploadedThumbail, parentElement:uploadThumbnailBtn.parentElement!})
			}
		}
	});

	submitBtn.addEventListener('click', (e: MouseEvent) => {
		onSubmit({
			...data,
			title: exampleTitle.value,
			description: exampleDescription.value,
			vimeoId: exampleVideoId.value,
			thumbnail: uploadedThumbail,
		});

		modal.remove();
	});

	const leftContainer = new UIDiv().dom;
	leftContainer.classList.add('left-container');
}

function updatePreview({uploadedThumbail, parentElement}:{uploadedThumbail
:File, parentElement:HTMLElement}){
	const imageURL = URL.createObjectURL(uploadedThumbail) 
	const randomId = "a-ver-random-id-for-this-image-1234"
	let existingPreview = parentElement.querySelector(`#${randomId}`) as HTMLImageElement | null;

	if (existingPreview){
		existingPreview.src = imageURL
	}else{
		const preview = new Image()
		preview.id=randomId;
		preview.src = imageURL;
		preview.style.height="30px";
		preview.style.width = "30px";
		parentElement.appendChild(preview)
	}

}