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
  const [noiseMatrix, setNoiseMatrix] = useState([]);
  const [bottomRockMatrix, setBottomRockMatrix] = useState([]);

  useEffect(() => {
    // perlin generation
    var noise = new Noise(Math.random());

    const scale = (val, min, max) => {
      return (val - min) / (max - min);
    };

    let _noiseMatrix = [];
    for (var x = 0; x < 100; x = x + 5) {
      let newArr = [];
      for (var y = 0; y < 100; y = y + 5) {
        var value = noise.simplex2(x / 100, y / 100);
        newArr.push(Math.abs(scale(value, 0, 1)));
      }
      _noiseMatrix.push(newArr);
    }
    setNoiseMatrix(_noiseMatrix);

    // generate noise for bottom rocks
    var noise1 = new Noise(Math.random());

    let bottomMatrix = [];
    for (var i = 0; i < 100; i = i + 1) {
      let arr1 = [];
      for (var j = 0; j < 100; j = j + 1) {
        var val1 = noise1.simplex2(i / 100, j / 100);
        arr1.push(Math.abs(scale(val1, 0, 1)));
      }
      bottomMatrix.push(arr1);
    }
    console.log(bottomMatrix);
    setBottomRockMatrix(bottomMatrix);
  }, []);

  const depthColorSelector = (_noiseValue) => {
    const roundedVal = _noiseValue.toFixed(1);
    if (roundedVal > 0.8) return "#637D3D";
    if (roundedVal > 0.6) return "#455F22";
    if (roundedVal > 0.4) return "#83764C";
    if (roundedVal > 0.2) return "#A19469";
    if (roundedVal >= 0.0) return "#2355BF";
  };

  const calcDistance = (x1, y1, x2, y2) => {
    return Math.hypot(x2 - x1, y2 - y1);
  };

  return (
    <React.Fragment>
      {noiseMatrix.map((noiseArr, x) => {
        return noiseArr.map((noiseValue, y) => {
          return (
            <React.Fragment>
              {calcDistance(x * 5, y * 5, 50, 50) <= 50 ? (
                <mesh position={[x * 5, y * 5, (noiseValue * 30) / 2]}>
                  <boxGeometry args={[5, 5, noiseValue * 30]} />
                  <meshStandardMaterial color={depthColorSelector(noiseValue)} />
                </mesh>
              ) : null}
            </React.Fragment>
          );
        });
      })}

      {bottomRockMatrix.map((noiseArr, x) => {
        return noiseArr.map((noiseValue, y) => {
          return (
            <React.Fragment>
              {calcDistance(x * 5, y * 5, 50, 50) <= 50 ? (
                <mesh position={[x * 5, y * 5, -(noiseValue * 20) / 2]}>
                  <boxGeometry args={[5, 5, noiseValue * 20]} />
                  <meshStandardMaterial color="black" />
                </mesh>
              ) : null}
            </React.Fragment>
          );
        });
      })}
    </React.Fragment>
  );
};

export default Plane;
