export interface IProject {
	name: string;
	id: number;
	userId: number;
	category?:string;
	configUrl?: string;
	createdAt?: string;
	updatedAt?: string;
	stateUrl?: string;
	thumbUrl?: string;
}

export interface IExampleProject {
	id: number;
	name: string;
	title: string;
	// title: {
	// 	type: DataTypes.STRING,
	// 	allowNull: true,
	// },
	stateUrl?: string;
	configUrl?: string;
	thumbUrl?: string;
	description?: string;
	vimeoId?: string;
	order: number;
}