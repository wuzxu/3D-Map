<script setup>
import ThreeMap from "@/components/ThreeMap.vue";
// import customMapJson from "./assets/Json/GuangDong.json"; // 可选的自定义地图数据
import customMapJson from "./assets/Json/sichuan.json"; // 可选的自定义地图数据

// 自定义颜色配置
const mapColors = {
  topColor: "#56fffd",
  sideColor: "#0aa09e",
  lineColor: "#bff7ff",
  glowLineColor: "#bff7ff",
  outerGlowColor: "#7cfffd",
};

const activeColors = {
  topColor: "#ffc64d",
  sideColor: "#c87a16",
};

// 相机配置
const cameraConfig = {
  position: { x: 0, y: 1, z: 1 },
  fov: 35,
  near: 0.1,
  far: 1000,
  minDistance: 0.5,
  maxDistance: 3,
  minPolarAngle: 0,
  maxPolarAngle: Math.PI / 2,
  enablePan: false,
  dampingFactor: 0.1,
  autoRotate: false,
  autoRotateSpeed: 2.0,
};

// 处理地图点击事件
const handleRegionClick = (regionInfo) => {
  console.log("Region clicked:", regionInfo);
  // regionInfo 包含: { name, code, isActive }
};
</script>

<template>
  <ThreeMap
    :mapJson="customMapJson"
    :mapColors="mapColors"
    :activeColors="activeColors"
    :cameraConfig="cameraConfig"
    backgroundImage="/src/assets/images/scene-bg2.png"
    @regionClick="handleRegionClick"
  />
</template>
