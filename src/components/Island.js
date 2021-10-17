import React, { useRef, useState, useEffect, Suspense } from "react";
import { useLoader } from "react-three-fiber";
import * as THREE from "three";
import { Noise } from "noisejs";
import "./style.css";
import { useTexture } from "@react-three/drei";

const Plane = () => {
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

  const heightSelector = (_noiseValue) => {
    let multplier = 30;
    if (_noiseValue > 0.5) multplier = 40;
    return _noiseValue * multplier;
  };

  const water_texture = useTexture("assets/water_texture.jpeg");

  const textureSelector = (_noiseValue) => {
    const roundedVal = _noiseValue.toFixed(1);
    if (roundedVal <= 0.2 && roundedVal >= 0.0) return <meshStandardMaterial map={water_texture} attach="material" />;
  };

  return (
    <React.Fragment>
      {noiseMatrix.map((noiseArr, x) => {
        return noiseArr.map((noiseValue, y) => {
          return (
            <React.Fragment>
              {calcDistance(x * 5, y * 5, 50, 50) <= 50 ? (
                <mesh position={[x * 5, y * 5, heightSelector(noiseValue) / 2]}>
                  <boxGeometry args={[5, 5, heightSelector(noiseValue)]} />
                  <meshStandardMaterial color={depthColorSelector(noiseValue)} />

                  {textureSelector(noiseValue)}
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
                  <meshStandardMaterial color="#A0A291" />
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
