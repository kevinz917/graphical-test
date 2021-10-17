import React, { Suspense } from "react";
import * as THREE from "three";
import { OrbitControls, Stats } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import Plane from "./components/Island";
import Voronoi from "./components/Voronoi";
import "./App.css";

const App = () => {
  return (
    <React.Fragment>
      <Canvas
        onCreated={({ gl, scene }) => {
          scene.background = new THREE.Color("#080808");
        }}
      >
        <ambientLight />
        <pointLight position={[50, 50, 50]} />
        <OrbitControls />
        <Suspense fallback={null}>
          <Plane />
        </Suspense>

        <Stats />
      </Canvas>
    </React.Fragment>
  );
};

export default App;
