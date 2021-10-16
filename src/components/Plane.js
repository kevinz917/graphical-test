import React, { useRef, useState, useEffect } from "react";
import { useSpring } from "@react-spring/three";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import Voronoi from "voronoi";
import { Noise } from "noisejs";
import { processCell } from "./helper";
import "./style.css";

function area(contour) {
  const n = contour.length;
  let a = 0.0;

  for (let p = n - 1, q = 0; q < n; p = q++) {
    a += contour[p].x * contour[q].y - contour[q].x * contour[p].y;
  }

  return a * 0.5;
}

function isClockWise(pts) {
  return area(pts) < 0;
}

// constants
var radius = 100;
var pointsCount = 500;
var temp = new THREE.Vector2();
var all2DPoints = [];

let voronoiMeshMat = new THREE.MeshLambertMaterial({ color: 0x2b2b2b, side: THREE.DoubleSide });

const Plane = (props) => {
  const mesh = useRef();

  const [points, setPoints] = useState([]);
  const [voronoiPoints, setVoronoiPoints] = useState([]);

  const [lineMaterial, setLineMaterial] = useState(new THREE.LineBasicMaterial({ vertexColors: true }));
  const [lineGeometry, setLineGeometry] = useState(new THREE.BufferGeometry());
  const [lines, setLines] = useState([]);
  const [noiseMatrix, setNoiseMatrix] = useState([]);

  const [walMeshGeometry, setMeshGeometry] = useState(new THREE.BufferGeometry());

  useEffect(() => {
    // voronoi points
    for (let i = 0; i < pointsCount; i++) {
      temp
        .random()
        .subScalar(0.5)
        .multiplyScalar(radius * 2);
      if (temp.length() < radius) {
        all2DPoints.push({ x: temp.x, y: temp.y });
      }
    }

    setPoints(all2DPoints);

    var voronoi = new Voronoi();
    var bbox = { xl: 0, xr: 100, yt: 0, yb: 100 }; // xl is x-left, xr is x-right, yt is y-top, and yb is y-bottom
    const diagram = voronoi.compute(all2DPoints, bbox);

    setVoronoiPoints(diagram.vertices);

    // voronoi points

    var voronoiPoints = diagram.vertices;
    var voronoiPointsGeom = new THREE.BufferGeometry().setFromPoints(voronoiPoints);
    var voronoiPointsMat = new THREE.PointsMaterial({ color: "magenta", size: 3 });
    voronoiPoints = new THREE.Points(voronoiPointsGeom, voronoiPointsMat);

    var voronoiLinesPoints = [];
    var voronoiLinesColors = [];
    diagram.edges.forEach((ed) => {
      if (Math.max(Math.hypot(ed.va.x, ed.va.y), Math.hypot(ed.vb.x, ed.vb.y)) < radius) {
        voronoiLinesPoints.push(ed.va.x, ed.va.y, 0, ed.vb.x, ed.vb.y, 0, ed.va.x, ed.va.y, 10, ed.vb.x, ed.vb.y, 10);
        voronoiLinesColors.push(1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1);
      }
    });

    var voronoiLinesGeom = new THREE.BufferGeometry();
    voronoiLinesGeom.setAttribute("position", new THREE.Float32BufferAttribute(voronoiLinesPoints, 3));
    voronoiLinesGeom.setAttribute("color", new THREE.Float32BufferAttribute(voronoiLinesColors, 3));
    var voronoiLinesMat = new THREE.LineBasicMaterial({ vertexColors: true });

    // console.log(voronoiLinesPoints);
    setLineMaterial(voronoiLinesMat);
    setLineGeometry(voronoiLinesGeom);

    // walls
    var voronoiMeshPoints = [];
    var voronoiMeshIndex = [];
    var vIdx = 0;
    diagram.edges.forEach((ed) => {
      if (Math.max(Math.hypot(ed.va.x, ed.va.y), Math.hypot(ed.vb.x, ed.vb.y)) < radius) {
        voronoiMeshPoints.push(ed.va.x, ed.va.y, 0, ed.vb.x, ed.vb.y, 0, ed.va.x, ed.va.y, 1, ed.vb.x, ed.vb.y, 1);
        voronoiMeshIndex.push(vIdx + 2, vIdx + 0, vIdx + 3, vIdx + 0, vIdx + 1, vIdx + 3);
        vIdx += 4;
      }
    });

    var voronoiMeshGeom = new THREE.BufferGeometry();
    voronoiMeshGeom.setAttribute("position", new THREE.Float32BufferAttribute(voronoiMeshPoints, 3));
    voronoiMeshGeom.setIndex(voronoiMeshIndex);
    voronoiMeshGeom.computeVertexNormals();
    setMeshGeometry(voronoiMeshGeom);

    // Build extrusions
    let vCells = [];
    let cellHolder = new THREE.Group();

    function buildHull(cd, height, lidShift) {
      let basePoints = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];

      let geomPoints = [];

      for (let i = 0; i < cd.edgesCount; i++) {
        basePoints[0].set(0, 0, 0);
        basePoints[1].copy(cd.centeredPoints[i * 2 + 0]);
        basePoints[2].copy(cd.centeredPoints[i * 2 + 1]);

        if (isClockWise(basePoints)) {
          basePoints[1].copy(cd.centeredPoints[i * 2 + 1]);
          basePoints[2].copy(cd.centeredPoints[i * 2 + 0]);
        }

        // segment parts (top lid, bottom lid, side)
        geomPoints.push(
          // top lid
          basePoints[0].clone().setZ(height + lidShift),
          basePoints[1].clone().setZ(height),
          basePoints[2].clone().setZ(height),
          // bottom lid
          basePoints[0].clone().setZ(-lidShift),
          basePoints[2].clone(),
          basePoints[1].clone(),
          // side
          basePoints[2].clone().setZ(height),
          basePoints[1].clone().setZ(height),
          basePoints[2].clone(),

          basePoints[2].clone(),
          basePoints[1].clone().setZ(height),
          basePoints[1].clone()
        );
      }

      let g = new THREE.BufferGeometry().setFromPoints(geomPoints);
      g.computeVertexNormals();
      let m = new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff });
      let o = new THREE.Mesh(g, m);
      o.position.copy(cd.center);
      o.userData = {
        initPhase: Math.random() * Math.PI * 2,
      };
      cellHolder.add(o);
      vCells.push(o);
    }

    diagram.cells.forEach((cell) => {
      let cellData = processCell(cell, radius);
      if (cellData.isInside) {
        buildHull(cellData, 10, 2);
      }
    });

    // perlin generation
    var noise = new Noise(Math.random());

    let _noiseMatrix = [];
    for (var x = 0; x < 100; x = x + 5) {
      let newArr = [];
      for (var y = 0; y < 100; y = y + 5) {
        // All noise functions return values in the range of -1 to 1.
        var value = noise.simplex2(x / 100, y / 100);
        newArr.push(Math.abs(value));
      }
      _noiseMatrix.push(newArr);
    }

    setNoiseMatrix(_noiseMatrix);
  }, []);

  const depthColorSelector = (_noiseValue) => {
    const roundedVal = _noiseValue.toFixed(1);
    console.log(roundedVal);
    if (roundedVal > 0.8) return "#637D3D";
    if (roundedVal > 0.6) return "#455F22";
    if (roundedVal > 0.4) return "#83764C";
    if (roundedVal > 0.2) return "#A19469";
    if (roundedVal >= 0.0) return "#2355BF";
  };

  return (
    <React.Fragment>
      {noiseMatrix.map((noiseArr, x) => {
        return noiseArr.map((noiseValue, y) => {
          return (
            <React.Fragment>
              <mesh position={[x * 5, y * 5, (noiseValue * 30) / 2]}>
                <boxGeometry args={[5, 5, noiseValue * 30]} />
                <meshStandardMaterial color={depthColorSelector(noiseValue)} />
              </mesh>
            </React.Fragment>
          );
        });
      })}
    </React.Fragment>
  );
};

export default Plane;

// <mesh position={[x * 10 + 5, y * 10 + 5, (noiseValue * 30) / 2]}>
//   <boxGeometry args={[2, 2, noiseValue * 30 + 10]} />
//   <meshStandardMaterial color="black" />
// </mesh>;

// <sphereGeometry args={[noiseValue]} />

// <mesh>
// <lineSegments args={[lineGeometry, lineMaterial]} />
// <meshStandardMaterial color="black" transparent />
// </mesh>
// <mesh args={[walMeshGeometry, voronoiMeshMat]} />

// {noiseMatrix.map((noiseArr, x) => {
//     return noiseArr.map((noiseValue, y) => {
//       return <mesh position={[x * 5, y * 5, 0]} args={[blockTower(noiseValue)]} />;
//     });
//   })}

// const blockTower = (height) => {
//     var frame = new THREE.Shape();
//     frame.moveTo(-5, -3);
//     frame.lineTo(4, -3);
//     frame.lineTo(4, 3);
//     frame.lineTo(-4, 3);

//     //Extrude the shape into a geometry, and create a mesh from it:
//     console.log(height * 100);
//     var extrudeSettings = {
//       steps: 1,
//       depth: Math.abs(height * 100),
//       bevelEnabled: false,
//     };
//     var geom = new THREE.ExtrudeGeometry(frame, extrudeSettings);
//     return geom;
//   };

//   var frame = new THREE.Shape();
//   frame.moveTo(-5, -3);
//   frame.lineTo(4, -3);
//   frame.lineTo(4, 3);
//   frame.lineTo(-4, 3);

//   //Extrude the shape into a geometry, and create a mesh from it:
//   var extrudeSettings = {
//     steps: 1,
//     depth: 100,
//     bevelEnabled: false,
//   };
//   var geom = new THREE.ExtrudeGeometry(frame, extrudeSettings);
