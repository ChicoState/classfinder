export function fit(anchors, evidence) {
  const average = (side, axis) =>
    anchors.reduce((sum, item) => sum + item[side][axis], 0) / anchors.length;
  const lx = average('localPosition', 'x');
  const ly = average('localPosition', 'y');
  const gx = average('globalPosition', 'x');
  const gy = average('globalPosition', 'y');
  let denominator = 0;
  let real = 0;
  let imaginary = 0;
  for (const anchor of anchors) {
    const x = anchor.localPosition.x - lx;
    const y = anchor.localPosition.y - ly;
    const u = anchor.globalPosition.x - gx;
    const v = anchor.globalPosition.y - gy;
    denominator += x * x + y * y;
    real += x * u + y * v;
    imaginary += x * v - y * u;
  }
  if (denominator === 0) throw new Error('Alignment needs separated landmarks');
  const a = real / denominator;
  const b = imaginary / denominator;
  const tx = gx - a * lx + b * ly;
  const ty = gy - b * lx - a * ly;
  const errors = anchors.map((anchor) =>
    Math.hypot(
      a * anchor.localPosition.x -
        b * anchor.localPosition.y +
        tx -
        anchor.globalPosition.x,
      b * anchor.localPosition.x +
        a * anchor.localPosition.y +
        ty -
        anchor.globalPosition.y
    )
  );
  return {
    a,
    b,
    tx,
    ty,
    scale: Math.hypot(a, b),
    rotationDegrees: (Math.atan2(b, a) * 180) / Math.PI,
    rmsResidualFeet: Math.sqrt(
      errors.reduce((sum, error) => sum + error * error, 0) / errors.length
    ),
    maxResidualFeet: Math.max(...errors),
    method:
      'Least-squares orientation-preserving similarity: xGlobal=a*xLocal-b*yLocal+tx; yGlobal=b*xLocal+a*yLocal+ty',
    evidence,
    anchors: anchors.map((anchor, i) => ({
      ...anchor,
      residualFeet: errors[i]
    }))
  };
}
