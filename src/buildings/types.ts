export type FloorPlan = 
{	
	floor: number;
	image: string;
	imageWidth: number;
	imageHeight: number;
	pdfOrigin: {x: number, y: number};
	pdfPointToImageScale: number;
	feetPerPdfPoint: number;
};

export type Building =
{
	id: string;
	graphBuildingId: string;
	name: string;
	floors: FloorPlan[];
	demoRoute: {
		startNodeId: string;
		destinationNodeId: string;
		};
};
