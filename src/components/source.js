console.clear();
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(60, 1, 1, 1000);
camera.position.set(0, 0, 200);
var renderer = new THREE.WebGLRenderer({
  antialias: true,
});
var canvas = renderer.domElement;
document.body.appendChild(canvas);

var controls = new THREE.OrbitControls(camera, canvas);

var light = new THREE.DirectionalLight(0xffffff, 1);
light.position.setScalar(100);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 1));

var size = { x: 200, z: 200 };
var radius = 100;
var pointsCount = 500;
var counter = 0;
var points2d = [];
var temp = new THREE.Vector2();

// get 2d center points
while (counter < pointsCount) {
  temp
    .random()
    .subScalar(0.5)
    .multiplyScalar(radius * 2);
  if (temp.length() < radius) {
    points2d.push({ x: temp.x, y: temp.y });
    counter++;
  }
}

var geom = new THREE.BufferGeometry().setFromPoints(points2d);
var cloud = new THREE.Points(geom, new THREE.PointsMaterial({ color: 0x99ccff, size: 2 }));
scene.add(cloud);

// voronoi generation
var voronoi = new Voronoi();
var bbox = { xl: -radius, xr: radius, yt: -radius, yb: radius };
var diagram = voronoi.compute(points2d, bbox);
console.log(diagram);

var voronoiPoints = diagram.vertices;
var voronoiPointsGeom = new THREE.BufferGeometry().setFromPoints(voronoiPoints);
var voronoiPointsMat = new THREE.PointsMaterial({ color: "magenta", size: 3 });
var voronoiPoints = new THREE.Points(voronoiPointsGeom, voronoiPointsMat);
scene.add(voronoiPoints);

var voronoiLinesPoints = [];
var voronoiLinesColors = [];
diagram.edges.forEach((ed) => {
  if (Math.max(Math.hypot(ed.va.x, ed.va.y), Math.hypot(ed.vb.x, ed.vb.y)) < radius) {
    voronoiLinesPoints.push(ed.va.x, ed.va.y, 0, ed.vb.x, ed.vb.y, 0, ed.va.x, ed.va.y, 10, ed.vb.x, ed.vb.y, 10);
    voronoiLinesColors.push(1, 1, 0, 1, 1, 0, 0, 0.25, 0.25, 0, 0.25, 0.25);
  }
});
var voronoiLinesGeom = new THREE.BufferGeometry();
voronoiLinesGeom.setAttribute("position", new THREE.Float32BufferAttribute(voronoiLinesPoints, 3));
voronoiLinesGeom.setAttribute("color", new THREE.Float32BufferAttribute(voronoiLinesColors, 3));
var voronoiLinesMat = new THREE.LineBasicMaterial({ vertexColors: true });
var voronoiLines = new THREE.LineSegments(voronoiLinesGeom, voronoiLinesMat);
scene.add(voronoiLines);

var voronoiMeshPoints = [];
var voronoiMeshIndex = [];
var vIdx = 0;
diagram.edges.forEach((ed) => {
  if (Math.max(Math.hypot(ed.va.x, ed.va.y), Math.hypot(ed.vb.x, ed.vb.y)) < radius) {
    voronoiMeshPoints.push(ed.va.x, ed.va.y, 0, ed.vb.x, ed.vb.y, 0, ed.va.x, ed.va.y, 10, ed.vb.x, ed.vb.y, 10);
    voronoiMeshIndex.push(vIdx + 2, vIdx + 0, vIdx + 3, vIdx + 0, vIdx + 1, vIdx + 3);
    vIdx += 4;
  }
});
var voronoiMeshGeom = new THREE.BufferGeometry();
voronoiMeshGeom.setAttribute("position", new THREE.Float32BufferAttribute(voronoiMeshPoints, 3));
voronoiMeshGeom.setIndex(voronoiMeshIndex);
voronoiMeshGeom.computeVertexNormals();
let voronoiMeshMat = new THREE.MeshLambertMaterial({ color: 0x448888, side: THREE.DoubleSide });
let voronoiMesh = new THREE.Mesh(voronoiMeshGeom, voronoiMeshMat);
scene.add(voronoiMesh);

var gui = new dat.GUI({ width: 400 });
gui.add(cloud, "visible").name("base points");
gui.add(voronoiPoints, "visible").name("voronoi points");
gui.add(voronoiLines, "visible").name("voronoi lines");
gui.add(voronoiMesh, "visible").name("voronoi mesh");
gui.add(voronoiMesh.material, "wireframe").name("voronoi mesh wireframe");

render();

function resize(renderer) {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}

function render() {
  if (resize(renderer)) {
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}
