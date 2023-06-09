import {
	Color
} from '../../../src/Three';

import { Pass } from './Pass';

export default class ClearPass extends Pass {

	constructor( clearColor?: Color | string | number, clearAlpha?: number );
	clearColor: Color | string | number;
	clearAlpha: number;

}
