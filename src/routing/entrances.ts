// Explicit handoffs: floor-plan drawing axes are not geographic coordinates.
// Entrance matches are approximate and require on-site verification.
export const entrances: Record<
  string,
  {
    indoorId: string;
    osmId: string;
    position: [number, number];
    approachId?: string;
  }
> = {
  oconnell: {
    indoorId: 'ocon-1-exit-lower-ao',
    osmId: '5849825682',
    position: [39.7275422, -121.8473296]
  },
  acker: {
    indoorId: 'acker-1-exit-lobby-east-ao',
    osmId: '5849828196',
    position: [39.7300723, -121.8496037]
  },
  ayres: {
    indoorId: 'ayres-1-entrance-northwest',
    osmId: '5849825626',
    position: [39.7306337, -121.8436568]
  },
  butte: {
    indoorId: 'butte-1-exit-north-east-ao',
    osmId: '5447422336',
    position: [39.7301596, -121.8470547]
  },
  glenn: {
    indoorId: 'glenn-1-entrance-north',
    osmId: '5849825643',
    position: [39.7293674, -121.8460368]
  },
  holt: {
    indoorId: 'holt-1-exit-south-ao',
    osmId: '5849779141',
    position: [39.7307538, -121.8458457]
  },
  langdon: {
    indoorId: 'langdon-1-exit-east-vestibule',
    osmId: '11938244695',
    position: [39.7272765, -121.8474139]
  },
  modoc: {
    indoorId: 'modoc-1-exit-southwest-ao',
    osmId: '5849825637',
    position: [39.7320142, -121.8447411]
  },
  plumas: {
    indoorId: 'plumas-1-exit-east-ao',
    osmId: '5849825661',
    position: [39.7295423, -121.8479378]
  },
  tehama: {
    indoorId: 'tehama-1-exit-north-ao',
    osmId: '5849825674',
    position: [39.730237, -121.8482752],
    approachId: '5447257029'
  },
  trinity: {
    indoorId: 'trinity-1-exit-south-ao',
    osmId: '5849825648',
    position: [39.7287602, -121.8457135]
  },
  yolo: {
    indoorId: 'yolo-1-exit-south-ao',
    osmId: '5849828192',
    position: [39.7284615, -121.8498606],
    approachId: '7701180205'
  }
};
