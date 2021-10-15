import React, { useRef, useState, useEffect } from "react";
import { useSpring } from "@react-spring/three";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import Voronoi from "voronoi";

// constants
var radius = 100;
var pointsCount = 500;
var temp = new THREE.Vector2();
var all2DPoints = [];

let voronoiMeshMat = new THREE.MeshLambertMaterial({ color: 0x448888, side: THREE.DoubleSide });

const Plane = (props) => {
  const [points, setPoints] = useState([]);
  const [voronoiPoints, setVoronoiPoints] = useState([]);

  const [lineMaterial, setLineMaterial] = useState(new THREE.LineBasicMaterial({ vertexColors: true }));
  const [lineGeometry, setLineGeometry] = useState(new THREE.BufferGeometry());
  const [lines, setLines] = useState([]);

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
    var bbox = { xl: -50, xr: 50, yt: -50, yb: 50 }; // xl is x-left, xr is x-right, yt is y-top, and yb is y-bottom
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

    console.log(voronoiLinesColors);

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
        voronoiMeshPoints.push(ed.va.x, ed.va.y, 0, ed.vb.x, ed.vb.y, 0, ed.va.x, ed.va.y, 10, ed.vb.x, ed.vb.y, 10);
        voronoiMeshIndex.push(vIdx + 2, vIdx + 0, vIdx + 3, vIdx + 0, vIdx + 1, vIdx + 3);
        vIdx += 4;
      }
    });

    var voronoiMeshGeom = new THREE.BufferGeometry();
    voronoiMeshGeom.setAttribute("position", new THREE.Float32BufferAttribute(voronoiMeshPoints, 3));
    voronoiMeshGeom.setIndex(voronoiMeshIndex);
    voronoiMeshGeom.computeVertexNormals();
    setMeshGeometry(voronoiMeshGeom);
  }, []);

  const mesh = useRef();
  return (
    <React.Fragment>
      <mesh>
        <lineSegments args={[lineGeometry, lineMaterial]} />
        <meshStandardMaterial color="black" transparent />
      </mesh>
      <mesh args={[walMeshGeometry, voronoiMeshMat]} />
    </React.Fragment>
  );
};

export default Plane;

// {points.map((point) => (
//     <mesh position={[point.x, point.y, 0]}>
//       <sphereGeometry args={[1, 16, 16]} />
//       <meshStandardMaterial color="hotpink" transparent />
//     </mesh>
//   ))}

//   {voronoiPoints.map((point) => (
//     <mesh position={[point.x, point.y, 0]}>
//       <sphereGeometry args={[1, 16, 16]} />
//       <meshStandardMaterial color="black" transparent />
//     </mesh>
//   ))}
