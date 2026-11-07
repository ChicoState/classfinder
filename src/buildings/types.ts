//Structs that are used in the other files like App.tsx

export type FloorPlan = {
  floor: number;
  imageOffset?: { x: number; y: number };
  continuation?: { belowPdfY: number; translation: { x: number; y: number } };
  image: string;
  imageWidth: number;
  imageHeight: number;
  pdfOrigin: { x: number; y: number };
  pdfPointToImageScale: number;
  feetPerPdfPoint: number;
};

export type Building = {
  id: string;
  graphBuildingId: string;
  name: string;
  floors: FloorPlan[];
  demoRoute: {
    startNodeId: string;
    destinationNodeId: string;
  };
};
