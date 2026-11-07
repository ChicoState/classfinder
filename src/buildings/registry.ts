import { oconnellBuilding } from './oconnell';
import type { Building } from './types';
import acker1 from '../data/acker/floor-1-preview.png';
import acker2 from '../data/acker/floor-2-preview.png';
import ayres1 from '../data/ayres/floor-1-preview.png';
import ayres2 from '../data/ayres/floor-2-preview.png';
import butte1 from '../data/butte/floor-1-preview.png';
import butte2 from '../data/butte/floor-2-preview.png';
import butte3 from '../data/butte/floor-3-preview.png';
import butte4 from '../data/butte/floor-4-preview.png';
import butte5 from '../data/butte/floor-5-preview.png';
import glenn1 from '../data/glenn/floor-1-preview.png';
import glenn2 from '../data/glenn/floor-2-preview.png';
import glenn3 from '../data/glenn/floor-3-preview.png';
import holt1 from '../data/holt/floor-1-preview.png';
import holt2 from '../data/holt/floor-2-preview.png';
import holt3 from '../data/holt/floor-3-preview.png';
import langdon1 from '../data/langdon/floor-1-preview.png';
import langdon2 from '../data/langdon/floor-2-preview.png';
import langdon3 from '../data/langdon/floor-3-preview.png';
import modoc1 from '../data/modoc/floor-1-preview.png';
import modoc2 from '../data/modoc/floor-2-preview.png';
import plumas1 from '../data/plumas/floor-1-preview.png';
import plumas2 from '../data/plumas/floor-2-preview.png';
import plumas3 from '../data/plumas/floor-3-preview.png';
import tehama1 from '../data/tehama/floor-1-preview.png';
import tehama2 from '../data/tehama/floor-2-preview.png';
import tehama3 from '../data/tehama/floor-3-preview.png';
import trinity1 from '../data/trinity/floor-1-preview.png';
import trinity2 from '../data/trinity/floor-2-preview.png';
import yolo1 from '../data/yolo/floor-1-preview.png';
import yolo2 from '../data/yolo/floor-2-preview.png';

const additionalBuildings: Building[] = [
  {
    id: 'acker',
    graphBuildingId: 'acker',
    name: 'Acker Gymnasium',
    floors: [
      {
        floor: 1,
        image: acker1,
        imageWidth: 2448,
        imageHeight: 1584,
        pdfOrigin: {
          x: 427,
          y: 329.5
        },
        pdfPointToImageScale: 2.0,
        feetPerPdfPoint: 0.5555555555555556,
        continuation: {
          belowPdfY: 672,
          translation: {
            x: 609,
            y: -499
          }
        }
      },
      {
        floor: 2,
        image: acker2,
        imageWidth: 1224,
        imageHeight: 1584,
        pdfOrigin: {
          x: 413.5,
          y: 322.5
        },
        pdfPointToImageScale: 2.0,
        feetPerPdfPoint: 0.5555555555555556
      }
    ],
    demoRoute: {
      startNodeId: 'acker-1-exit-lobby-east-ao',
      destinationNodeId: 'acker-1-lobby-east-approach'
    }
  },
  {
    id: 'ayres',
    graphBuildingId: 'ayres',
    name: 'Ayres Hall',
    floors: [
      {
        floor: 1,
        image: ayres1,
        imageWidth: 1836,
        imageHeight: 2376,
        pdfOrigin: {
          x: 161.5,
          y: 70.5
        },
        pdfPointToImageScale: 3.0,
        feetPerPdfPoint: 0.4166666666666667
      },
      {
        floor: 2,
        image: ayres2,
        imageWidth: 1836,
        imageHeight: 2376,
        pdfOrigin: {
          x: 191,
          y: 69.5
        },
        pdfPointToImageScale: 3.0,
        feetPerPdfPoint: 0.4166666666666667
      }
    ],
    demoRoute: {
      startNodeId: 'ayres-1-entrance-northwest',
      destinationNodeId: 'ayres-1-hall-northwest'
    }
  },
  {
    id: 'butte',
    graphBuildingId: 'butte',
    name: 'Butte Hall',
    floors: [
      {
        floor: 1,
        image: butte1,
        imageWidth: 1224,
        imageHeight: 1584,
        pdfOrigin: {
          x: 291.0,
          y: 135.0
        },
        pdfPointToImageScale: 2.0,
        feetPerPdfPoint: 0.2777777777777778
      },
      {
        floor: 2,
        image: butte2,
        imageWidth: 1224,
        imageHeight: 1584,
        pdfOrigin: {
          x: 345.0,
          y: 134.0
        },
        pdfPointToImageScale: 2.0,
        feetPerPdfPoint: 0.2777777777777778
      },
      {
        floor: 3,
        image: butte3,
        imageWidth: 1224,
        imageHeight: 1584,
        pdfOrigin: {
          x: 326.0,
          y: 135.0
        },
        pdfPointToImageScale: 2.0,
        feetPerPdfPoint: 0.2777777777777778
      },
      {
        floor: 4,
        image: butte4,
        imageWidth: 1224,
        imageHeight: 1584,
        pdfOrigin: {
          x: 330.0,
          y: 134.0
        },
        pdfPointToImageScale: 2.0,
        feetPerPdfPoint: 0.2777777777777778
      },
      {
        floor: 5,
        image: butte5,
        imageWidth: 1224,
        imageHeight: 1584,
        pdfOrigin: {
          x: 334.0,
          y: 138.0
        },
        pdfPointToImageScale: 2.0,
        feetPerPdfPoint: 0.2777777777777778
      }
    ],
    demoRoute: {
      startNodeId: 'butte-1-exit-north-east-ao',
      destinationNodeId: 'butte-1-hall-north-east'
    }
  },
  {
    id: 'glenn',
    graphBuildingId: 'glenn',
    name: 'Glenn Hall',
    floors: [
      {
        floor: 1,
        image: glenn1,
        imageWidth: 1836,
        imageHeight: 2376,
        pdfOrigin: {
          x: 319.0,
          y: 66.5
        },
        pdfPointToImageScale: 3.0,
        feetPerPdfPoint: 0.4166666666666667
      },
      {
        floor: 2,
        image: glenn2,
        imageWidth: 1836,
        imageHeight: 2376,
        pdfOrigin: {
          x: 323.5,
          y: 67.0
        },
        pdfPointToImageScale: 3.0,
        feetPerPdfPoint: 0.4166666666666667
      },
      {
        floor: 3,
        image: glenn3,
        imageWidth: 1836,
        imageHeight: 2376,
        pdfOrigin: {
          x: 319.5,
          y: 71.5
        },
        pdfPointToImageScale: 3.0,
        feetPerPdfPoint: 0.4166666666666667
      }
    ],
    demoRoute: {
      startNodeId: 'glenn-1-entrance-north',
      destinationNodeId: 'glenn-1-hall-north'
    }
  },
  {
    id: 'holt',
    graphBuildingId: 'holt',
    name: 'Holt Hall',
    floors: [
      {
        floor: 1,
        image: holt1,
        imageWidth: 1224,
        imageHeight: 1584,
        pdfOrigin: {
          x: 355,
          y: 682
        },
        pdfPointToImageScale: 2,
        feetPerPdfPoint: 0.5555555555555556
      },
      {
        floor: 2,
        image: holt2,
        imageWidth: 1400,
        imageHeight: 1800,
        pdfOrigin: {
          x: 355,
          y: 682
        },
        pdfPointToImageScale: 2.287581699346405,
        feetPerPdfPoint: 0.5555555555555556
      },
      {
        floor: 3,
        image: holt3,
        imageWidth: 1020,
        imageHeight: 1320,
        pdfOrigin: {
          x: 355,
          y: 682
        },
        pdfPointToImageScale: 1.6666666666666667,
        feetPerPdfPoint: 0.5555555555555556
      }
    ],
    demoRoute: {
      startNodeId: 'holt-1-exit-south-ao',
      destinationNodeId: 'holt-1-south-entry'
    }
  },
  {
    id: 'langdon',
    graphBuildingId: 'langdon',
    name: 'Langdon Engineering Center',
    floors: [
      {
        floor: 1,
        image: langdon1,
        imageWidth: 1224,
        imageHeight: 1584,
        pdfOrigin: {
          x: 216.5,
          y: 508.5
        },
        pdfPointToImageScale: 2.0,
        feetPerPdfPoint: 0.4166666666666667
      },
      {
        floor: 2,
        image: langdon2,
        imageWidth: 1224,
        imageHeight: 1584,
        pdfOrigin: {
          x: 215.0,
          y: 337.0
        },
        pdfPointToImageScale: 2.0,
        feetPerPdfPoint: 0.4166666666666667
      },
      {
        floor: 3,
        image: langdon3,
        imageWidth: 1224,
        imageHeight: 1584,
        pdfOrigin: {
          x: 215.0,
          y: 114.5
        },
        pdfPointToImageScale: 2.0,
        feetPerPdfPoint: 0.4166666666666667
      }
    ],
    demoRoute: {
      startNodeId: 'langdon-1-exit-north-wing',
      destinationNodeId: 'langdon-1-hall-north-south'
    }
  },
  {
    id: 'modoc',
    graphBuildingId: 'modoc',
    name: 'Modoc Hall',
    floors: [
      {
        floor: 1,
        image: modoc1,
        imageWidth: 2448,
        imageHeight: 3168,
        pdfOrigin: {
          x: 192.0,
          y: 521.5
        },
        pdfPointToImageScale: 4.0,
        feetPerPdfPoint: 0.4166666666666667
      },
      {
        floor: 2,
        image: modoc2,
        imageWidth: 2448,
        imageHeight: 3168,
        pdfOrigin: {
          x: 189.0,
          y: 524.5
        },
        pdfPointToImageScale: 4.0,
        feetPerPdfPoint: 0.4166666666666667
      }
    ],
    demoRoute: {
      startNodeId: 'modoc-1-exit-southwest-ao',
      destinationNodeId: 'modoc-1-hall-west-980'
    }
  },
  {
    id: 'plumas',
    graphBuildingId: 'plumas',
    name: 'Plumas Hall',
    floors: [
      {
        floor: 1,
        image: plumas1,
        imageWidth: 1020,
        imageHeight: 1320,
        pdfOrigin: {
          x: 480,
          y: 496.2
        },
        pdfPointToImageScale: 1.6666666666666667,
        feetPerPdfPoint: 0.4166666666666667
      },
      {
        floor: 2,
        image: plumas2,
        imageWidth: 1020,
        imageHeight: 1320,
        pdfOrigin: {
          x: 483.6,
          y: 497.4
        },
        pdfPointToImageScale: 1.6666666666666667,
        feetPerPdfPoint: 0.4166666666666667
      },
      {
        floor: 3,
        image: plumas3,
        imageOffset: { x: 0, y: 43 },
        imageWidth: 1020,
        imageHeight: 1320,
        pdfOrigin: {
          x: 483.3,
          y: 499.8
        },
        pdfPointToImageScale: 1.6666666666666667,
        feetPerPdfPoint: 0.4166666666666667
      }
    ],
    demoRoute: {
      startNodeId: 'plumas-1-exit-east-ao',
      destinationNodeId: 'plumas-1-hall-east'
    }
  },
  {
    id: 'tehama',
    graphBuildingId: 'tehama',
    name: 'Tehama Hall',
    floors: [
      {
        floor: 1,
        image: tehama1,
        imageWidth: 1224,
        imageHeight: 1584,
        pdfOrigin: {
          x: 362.0,
          y: 139.0
        },
        pdfPointToImageScale: 2.0,
        feetPerPdfPoint: 0.4166666666666667
      },
      {
        floor: 2,
        image: tehama2,
        imageWidth: 1224,
        imageHeight: 1584,
        pdfOrigin: {
          x: 394.0,
          y: 155.0
        },
        pdfPointToImageScale: 2.0,
        feetPerPdfPoint: 0.4166666666666667
      },
      {
        floor: 3,
        image: tehama3,
        imageWidth: 1224,
        imageHeight: 1584,
        pdfOrigin: {
          x: 374.5,
          y: 132.5
        },
        pdfPointToImageScale: 2.0,
        feetPerPdfPoint: 0.4166666666666667
      }
    ],
    demoRoute: {
      startNodeId: 'tehama-1-exit-north-ao',
      destinationNodeId: 'tehama-1-hall-north-724'
    }
  },
  {
    id: 'trinity',
    graphBuildingId: 'trinity',
    name: 'Trinity Hall',
    floors: [
      {
        floor: 1,
        image: trinity1,
        imageWidth: 1224,
        imageHeight: 1584,
        pdfOrigin: {
          x: 349.5,
          y: 655.5
        },
        pdfPointToImageScale: 2.0,
        feetPerPdfPoint: 0.2777777777777778
      },
      {
        floor: 2,
        image: trinity2,
        imageWidth: 1224,
        imageHeight: 1584,
        pdfOrigin: {
          x: 349.5,
          y: 655.5
        },
        pdfPointToImageScale: 2.0,
        feetPerPdfPoint: 0.2777777777777778
      }
    ],
    demoRoute: {
      startNodeId: 'trinity-1-exit-south-ao',
      destinationNodeId: 'trinity-1-south-stair-approach'
    }
  },
  {
    id: 'yolo',
    graphBuildingId: 'yolo',
    name: 'Yolo Hall',
    floors: [
      {
        floor: 1,
        image: yolo1,
        imageWidth: 2448,
        imageHeight: 3168,
        pdfOrigin: {
          x: 237.0,
          y: 637.0
        },
        pdfPointToImageScale: 4.0,
        feetPerPdfPoint: 0.5555555555555556
      },
      {
        floor: 2,
        image: yolo2,
        imageWidth: 2448,
        imageHeight: 3168,
        pdfOrigin: {
          x: 223.0,
          y: 635.0
        },
        pdfPointToImageScale: 4.0,
        feetPerPdfPoint: 0.5555555555555556
      }
    ],
    demoRoute: {
      startNodeId: 'yolo-1-exit-south-ao',
      destinationNodeId: 'yolo-1-lobby-south'
    }
  }
];

export const buildings: Record<string, Building> = {
  [oconnellBuilding.id]: oconnellBuilding,
  ...Object.fromEntries(
    additionalBuildings.map((building) => [building.id, building])
  )
};
