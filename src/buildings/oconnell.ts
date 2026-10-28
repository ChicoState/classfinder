import floor1 from '../data/ocon/floor-1-preview.png';
import floor2 from '../data/ocon/floor-2-preview.png';
import floor3 from '../data/ocon/floor-3-preview.png';
import floor4 from '../data/ocon/floor-4-preview.png';
import type { Building } from './types';

//These values will likely have to be individually made for each building, but I was able to get ChatGPT to generate these values without trouble.
//I am currently unsure if te pdfOrigin values need to be that exact, will check later.
const imageWidth = 1377;
const imageHeight = 1782;
const feetPerPdfPoint = 30 / 72;

export const oconnellBuilding: Building = 
{
	id: 'oconnell',
	graphBuildingId: 'ocon',
	name: "O'Connell Technology Center",
	demoRoute: {
		startNodeId: 'ocon-1-exit-lower-ao',
		destinationNodeId: 'ocon-1-room-114',
	},
	floors: [
		{
			floor: 1,
			image: floor1,
			imageWidth,
			imageHeight,
			pdfOrigin: {x: 443.4, y: 552.6},
			pdfPointToImageScale: 2.25,
			feetPerPdfPoint,
		},
		{
      			floor: 2,
      			image: floor2,
      			imageWidth,
      			imageHeight,
      			pdfOrigin: {x: 386.06666666666666, y: 568.6},
      			pdfPointToImageScale: 2.25,
      			feetPerPdfPoint,
    		},
    		{
      			floor: 3,
      			image: floor3,
      			imageWidth,
      			imageHeight,
      			pdfOrigin: { x: 387.84444444444443, y: 560.1555555555556 },
      			pdfPointToImageScale: 2.25,
      			feetPerPdfPoint,
    		},
    		{
      			floor: 4,
      			image: floor4,
      			imageWidth,
      			imageHeight,
      			pdfOrigin: {x: 388.73333333333335, y: 561.4888888888888},
      			pdfPointToImageScale: 2.25,
      			feetPerPdfPoint,
    		},
  		],
}
