const html = require('./index.html');
import './styles.scss';

export default function SpinningLoader() {
	document.body.insertAdjacentHTML('beforeend', html.default);
	let elem = document.body.lastElementChild!;
	document.body.removeChild(elem);
	return elem;
}