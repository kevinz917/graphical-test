import React, { useEffect } from "react";
import "./App.css";
import Box from "./components/Box";
import { OrbitControls, Stats } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import NewBox from "./components/NewBox";
import Plane from "./components/Plane";

const App = () => {
  return (
    <React.Fragment>
      <Canvas>
        <ambientLight />
        <pointLight position={[50, 50, 50]} />
        <OrbitControls />
        <Plane />
        <Stats />
      </Canvas>
    </React.Fragment>
  );
};

export default App;

// <NewBox />

// <Box position={[-1.2, 0, 0]} />
// <Box position={[1.2, 0, 0]} />
