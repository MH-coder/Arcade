export default function replaceHtmlValues({ text, values }: { text: string; values: any }) {
	let newHTML = text;
	for (let key in values) {
		// const regex = new RegExp(`{\\s*${key}(\s*)}`, 'g');
		const regex = new RegExp(`{${key}}`, 'g');
		newHTML = newHTML.replace(regex, values[key]);
	}
	return newHTML;
}