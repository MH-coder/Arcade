let htmlObj = require('./index.html');
import './styles.scss';
let html = htmlObj.default as string;
import type { ExampleData } from '../types';
import replaceHtmlValues from '../utils/replaceHtmlValues';
import { IExampleProject } from '../../../../types/index';
import axios from 'axios';
import SpinningLoader from '../../../SpinningLoader';

function ViewExample(exampleData: IExampleProject) {
	exampleData.thumbUrl = exampleData.thumbUrl || '';
	
	const image = new Image()
	image.src = exampleData.thumbUrl || '';

	const newHTML = replaceHtmlValues({ text: html, values: exampleData });

	document.body.insertAdjacentHTML('beforeend', newHTML);
	let viewExample = document.body.lastElementChild! as HTMLDivElement;

	//const playBtn = viewExample.querySelector('.play-btn') as HTMLButtonElement;
	const launchBtn = viewExample.querySelector('.purple-btn') as HTMLButtonElement;

	const iframeVideo = viewExample.querySelector('iframe')! as HTMLIFrameElement;
	//const thumbnailImg = viewExample.querySelector('img')! as HTMLImageElement;

	// loading using fetch because otherwise it is slow
	// thumbnailImg.src && fetch(thumbnailImg.src).then(response => response.blob()).then(imageBlob => {
	// 	const imageObjectURL = URL.createObjectURL(imageBlob);
	// 	thumbnailImg.src = imageObjectURL
	// });


	// playBtn.addEventListener('click', () => {
	// 	iframeVideo.style.display = 'block';
	// 	thumbnailImg.style.display = 'none';
	// });

	viewExample.addEventListener('click', (e: MouseEvent) => {
		e.target === viewExample && viewExample.remove();
	});
	const loader = SpinningLoader();
	launchBtn.addEventListener('click', () => {
		viewExample.appendChild(loader);

		axios
			.post(`/asset/example-project/create-normal-project/${exampleData.id}`)
			.then((res) => {
				const data = res.data as { id: number };
				window.location.href = `/asset/projects/${data.id}`;
			})
			.catch((err) => {
				alert('Error launching project');
				throw new Error(err);
			})
			.finally(() => {
				viewExample.remove();
			});
	});
}

export { ViewExample };