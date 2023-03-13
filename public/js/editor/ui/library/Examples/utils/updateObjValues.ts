interface updateObjValues {
	newObj: any;
	oldObj: any;
}
export default function updateObjValues({ newObj, oldObj }: updateObjValues) {
	for (let objKey in oldObj) {
		let key = objKey as any;
		if (newObj[key as any]) oldObj[key as any] = newObj[key as any];
	}
}