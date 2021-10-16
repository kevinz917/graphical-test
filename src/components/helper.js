import * as THREE from "three";

export function processCell(cell, radius) {
  let res = false;
  let maxVal = 0;
  let contourPoints = [];
  cell.halfedges.forEach((he) => {
    let a = he.edge.va;
    let b = he.edge.vb;
    let val = Math.max(Math.hypot(a.x, a.y), Math.hypot(b.x, b.y));
    maxVal = Math.max(maxVal, val);
    contourPoints.push(a, b);
  });
  let center = new THREE.Vector3(cell.site.x, cell.site.y, 0);
  let basePoints = contourPoints.map((cp) => {
    return new THREE.Vector3(cp.x, cp.y, 0);
  });
  let centeredPoints = basePoints.map((bp) => {
    return bp.clone().sub(center);
  });
  return {
    center: center,
    contourPoints: basePoints,
    centeredPoints: centeredPoints,
    edgesCount: cell.halfedges.length,
    isInside: maxVal <= radius,
  };
}
