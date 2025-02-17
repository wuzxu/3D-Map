<script setup>
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { onMounted, onUnmounted } from "vue";
// 使用动态导入
import defaultBg from "../assets/images/scene-bg2.png";
import cn from "../assets/json/China.json";
import gd from "../assets/json/GuangDong.json";
import gsap from "gsap";

// 定义props
const props = defineProps({
  // 地图JSON数据
  mapJson: {
    type: Object,
    default: () => gd,
  },
  // 地图基础颜色配置
  mapColors: {
    type: Object,
    default: () => ({
      topColor: "#56fffd", // 顶面颜色
      sideColor: "#0aa09e", // 侧面颜色
      lineColor: "#bff7ff", // 线条颜色
      glowLineColor: "#bff7ff", // 发光线条颜色
      outerGlowColor: "#7cfffd", // 外发光颜色
    }),
  },
  // 选中状态颜色配置
  activeColors: {
    type: Object,
    default: () => ({
      topColor: "#ffc64d", // 选中时顶面颜色
      sideColor: "#c87a16", // 选中时侧面颜色
    }),
  },
  // 背景图片
  backgroundImage: {
    type: String,
    default: defaultBg, // 使用导入的默认背景
  },
  // 相机配置
  cameraConfig: {
    type: Object,
    default: () => ({
      position: { x: 0, y: 1, z: 1 }, // 相机位置
      fov: 35, // 视场角
      near: 0.1, // 近裁剪面
      far: 1000, // 远裁剪面
      minDistance: 0.5, // 最小缩放距离
      maxDistance: 3, // 最大缩放距离
      minPolarAngle: 0, // 最小仰角（弧度）
      maxPolarAngle: Math.PI / 2, // 最大仰角（弧度）
      enablePan: false, // 是否启用平移
      dampingFactor: 0.1, // 阻尼系数
      autoRotate: false, // 是否自动旋转
      autoRotateSpeed: 2.0, // 自动旋转速度
    }),
  },
});

// 定义emit
const emit = defineEmits(["regionClick"]);

// 声明全局变量
let scene, camera, renderer, controls, particles, scanLine, energyWave;

// 防抖函数
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 当组件挂载完成后执行初始化
onMounted(() => {
  init();
  animate();
});

// 初始化函数
function init() {
  // 创建场景
  scene = new THREE.Scene();
  scene.background = new THREE.Color("#01070d");

  // 加载背景纹理
  const textureLoader = new THREE.TextureLoader();
  textureLoader.load(props.backgroundImage, function (texture) {
    const aspectRatio = window.innerWidth / window.innerHeight;
    const bgGeometry = new THREE.PlaneGeometry(2 * aspectRatio, 2);
    const bgMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
    bgMesh.rotation.x = -Math.PI / 2;
    bgMesh.position.y = -0.05;
    bgMesh.renderOrder = -1;

    window.bgMesh = bgMesh;
    scene.add(bgMesh);
  });

  // 创建相机
  camera = new THREE.PerspectiveCamera(
    props.cameraConfig.fov,
    window.innerWidth / window.innerHeight,
    props.cameraConfig.near,
    props.cameraConfig.far
  );
  camera.position.set(
    props.cameraConfig.position.x,
    props.cameraConfig.position.y,
    props.cameraConfig.position.z
  );

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById("map-container").appendChild(renderer.domElement);

  // 添加控制器
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = props.cameraConfig.dampingFactor;
  controls.minDistance = props.cameraConfig.minDistance;
  controls.maxDistance = props.cameraConfig.maxDistance;
  controls.minPolarAngle = props.cameraConfig.minPolarAngle;
  controls.maxPolarAngle = props.cameraConfig.maxPolarAngle;
  controls.enablePan = props.cameraConfig.enablePan;
  controls.autoRotate = props.cameraConfig.autoRotate;
  controls.autoRotateSpeed = props.cameraConfig.autoRotateSpeed;

  // 创建材质
  const lineMaterial = new THREE.LineBasicMaterial({
    color: props.mapColors.lineColor,
    linewidth: 2,
  });

  const glowLineMaterial = new THREE.LineBasicMaterial({
    color: props.mapColors.glowLineColor,
    linewidth: 4,
    transparent: true,
    opacity: 0.8,
  });

  const outerGlowMaterial = new THREE.LineBasicMaterial({
    color: props.mapColors.outerGlowColor,
    linewidth: 4,
    transparent: true,
    opacity: 0.4,
  });

  // 创建组
  const lineGroup = new THREE.Group();
  const glowLineGroup = new THREE.Group();
  const outerGlowGroup = new THREE.Group();
  const meshGroup = new THREE.Group();

  // 添加名称显示
  const nameLabel = document.createElement("div");
  nameLabel.style.cssText = `
    position: fixed;
    padding: 8px 12px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    border-radius: 4px;
    font-size: 14px;
    pointer-events: none;
    display: none;
    z-index: 100;
  `;
  document.body.appendChild(nameLabel);

  // 创建地面
  const groundGeometry = new THREE.PlaneGeometry(5, 5);
  const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.001;
  ground.receiveShadow = true;
  scene.add(ground);

  // 添加光源
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(-3, 4, 2);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.1;
  directionalLight.shadow.camera.far = 10;
  directionalLight.shadow.camera.left = -2;
  directionalLight.shadow.camera.right = 2;
  directionalLight.shadow.camera.top = 2;
  directionalLight.shadow.camera.bottom = -2;
  directionalLight.shadow.radius = 4;
  scene.add(directionalLight);

  // 创建射线和鼠标向量
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  let activeRegion = null;

  // 计算地图边界和中心点
  function calculateMapBounds(features) {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    features.forEach((feature) => {
      feature.geometry.coordinates.forEach((polygon) => {
        polygon[0].forEach((point) => {
          minX = Math.min(minX, point[0]);
          maxX = Math.max(maxX, point[0]);
          minY = Math.min(minY, point[1]);
          maxY = Math.max(maxY, point[1]);
        });
      });
    });

    return {
      center: [(minX + maxX) / 2, (minY + maxY) / 2],
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  // 计算地图数据的边界
  const mapBounds = calculateMapBounds(props.mapJson.features);
  const scale = 0.1;

  // 处理点击事件
  const handleClick = (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(meshGroup.children);

    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object;

      // 发射点击事件
      emit("regionClick", {
        name: clickedMesh.userData.name,
        code: clickedMesh.userData.code,
        isActive: activeRegion !== clickedMesh,
      });

      if (activeRegion === clickedMesh) {
        resetRegion(clickedMesh);
        activeRegion = null;
        nameLabel.style.display = "none";
      } else {
        meshGroup.children.forEach(resetRegion);
        activateRegion(clickedMesh);
        activeRegion = clickedMesh;
        nameLabel.textContent = clickedMesh.userData.name;
        nameLabel.style.display = "block";
        nameLabel.style.left = event.clientX + 10 + "px";
        nameLabel.style.top = event.clientY + 10 + "px";
      }
    } else if (activeRegion) {
      meshGroup.children.forEach(resetRegion);
      activeRegion = null;
      nameLabel.style.display = "none";
    }
  };

  window.addEventListener("click", handleClick);

  // 遍历地图数据创建地图
  props.mapJson.features.forEach((feature) => {
    feature.geometry.coordinates.forEach((polygon) => {
      const points = [];

      polygon[0].forEach((point) => {
        // 使用地图中心点作为偏移基准
        points.push(
          (point[0] - mapBounds.center[0]) * scale,
          (point[1] - mapBounds.center[1]) * scale,
          0
        );
      });

      // 创建几何体
      const lineGeometry = new THREE.BufferGeometry();
      lineGeometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(points, 3)
      );

      // 创建线条
      const line = new THREE.LineLoop(lineGeometry, lineMaterial);
      line.position.set(0, 0.05, 0);
      line.rotation.x = -Math.PI / 2;
      lineGroup.add(line);

      // 创建发光线条
      const glowLine = new THREE.LineLoop(lineGeometry, glowLineMaterial);
      glowLine.position.set(0, 0.051, 0);
      glowLine.rotation.x = -Math.PI / 2;
      glowLine.scale.multiplyScalar(1.002);
      glowLineGroup.add(glowLine);

      // 创建外发光线条
      const outerGlow = new THREE.LineLoop(lineGeometry, outerGlowMaterial);
      outerGlow.position.set(0, 0.051, 0);
      outerGlow.rotation.x = -Math.PI / 2;
      outerGlow.scale.multiplyScalar(1.001);
      outerGlowGroup.add(outerGlow);

      // 创建区域
      const shape = new THREE.Shape();
      const firstPoint = polygon[0][0];
      shape.moveTo(
        (firstPoint[0] - mapBounds.center[0]) * scale,
        (firstPoint[1] - mapBounds.center[1]) * scale
      );
      for (let i = 1; i < polygon[0].length; i++) {
        const point = polygon[0][i];
        shape.lineTo(
          (point[0] - mapBounds.center[0]) * scale,
          (point[1] - mapBounds.center[1]) * scale
        );
      }

      const extrudeSettings = {
        depth: 0.05,
        bevelEnabled: true,
        bevelThickness: 0,
        bevelSize: 0,
        bevelOffset: 0,
        bevelSegments: 1,
      };

      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

      // 创建材质
      const materials = [
        new THREE.MeshStandardMaterial({
          color: props.mapColors.topColor,
          metalness: 0.1,
          roughness: 0.8,
        }),
        new THREE.MeshStandardMaterial({
          color: props.mapColors.sideColor,
          metalness: 0.1,
          roughness: 0.8,
        }),
      ];

      const mesh = new THREE.Mesh(geometry, materials);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0;
      mesh.castShadow = true;

      mesh.userData = {
        name: feature.properties.name,
        code: feature.properties.adcode,
        originalColor: [props.mapColors.topColor, props.mapColors.sideColor],
        activeColor: [
          props.activeColors.topColor,
          props.activeColors.sideColor,
        ],
        originalDepth: 0.05,
        currentDepth: 0.05,
        isAnimating: false,
      };

      meshGroup.add(mesh);
    });
  });

  // 添加所有组到场景之前，添加中国地图的渲染
  // 创建中国地图的线框
  const cnLineGroup = new THREE.Group(); // 创建专门的组存放中国地图线框

  // 创建中国地图线条材质，使用不同颜色区分
  const cnLineMaterial = new THREE.LineBasicMaterial({
    color: "#09223d",
    linewidth: 2,
    transparent: true,
    opacity: 0.45,
  });

  // 遍历中国地图数据创建线框
  cn.features.forEach((feature) => {
    feature.geometry.coordinates.forEach((polygon) => {
      if (!polygon[0] || !Array.isArray(polygon[0])) return;

      const points = [];

      // 使用相同的缩放和偏移
      polygon[0].forEach((point) => {
        if (
          Array.isArray(point) &&
          point.length >= 2 &&
          !isNaN(point[0]) &&
          !isNaN(point[1])
        ) {
          const x = (point[0] - mapBounds.center[0]) * scale;
          const y = (point[1] - mapBounds.center[1]) * scale;

          if (!isNaN(x) && !isNaN(y)) {
            points.push(x, y, 0);
          }
        }
      });

      if (points.length >= 6) {
        const lineGeometry = new THREE.BufferGeometry();
        lineGeometry.setAttribute(
          "position",
          new THREE.Float32BufferAttribute(points, 3)
        );

        lineGeometry.computeBoundingSphere();

        const line = new THREE.LineLoop(lineGeometry, cnLineMaterial);
        line.position.set(0, -0.0001, 0);
        line.rotation.x = -Math.PI / 2;

        cnLineGroup.add(line);
      }
    });
  });

  // 将中国地图线框组添加到场景
  scene.add(cnLineGroup);

  // 添加所有组到场景
  scene.add(lineGroup);
  scene.add(glowLineGroup);
  scene.add(outerGlowGroup);
  scene.add(meshGroup);

  // 创建粒子系统
  const createParticleSystem = () => {
    const particleCount = 100;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const opacities = new Float32Array(particleCount);
    const sizes = new Float32Array(particleCount);

    const bounds = {
      minX: -1,
      maxX: 1,
      minZ: -1,
      maxZ: 1,
      minY: 0.05,
      maxY: 0.2,
    };

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] =
        bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
      positions[i * 3 + 1] =
        bounds.minY + Math.random() * (bounds.maxY - bounds.minY);
      positions[i * 3 + 2] =
        bounds.minZ + Math.random() * (bounds.maxZ - bounds.minZ);
      opacities[i] = Math.random();
      sizes[i] = 0.003 + Math.random() * 0.005;
    }

    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );
    particleGeometry.setAttribute(
      "opacity",
      new THREE.BufferAttribute(opacities, 1)
    );
    particleGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const particleMaterial = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        time: { value: 0 },
        color1: { value: new THREE.Color("#56fffd") },
        color2: { value: new THREE.Color("#00ff87") },
      },
      vertexShader: `
        attribute float opacity;
        attribute float size;
        varying float vOpacity;
        varying vec3 vColor;
        uniform float time;
        
        void main() {
          vOpacity = opacity;
          vec3 pos = position;
          float t = time * 0.5;
          float yOffset = sin(t + position.x * 4.0) * 0.03;
          float xOffset = cos(t * 0.7 + position.z * 3.0) * 0.02;
          float zOffset = sin(t * 0.3 + position.x * 2.0) * 0.02;
          float spiral = sin(t * 2.0 + length(position.xz) * 5.0) * 0.01;
          
          pos.y += yOffset + spiral;
          pos.x += xOffset;
          pos.z += zOffset;
          
          float colorMix = sin(time + length(position) * 3.0) * 0.5 + 0.5;
          vColor = mix(vec3(0.337, 1.0, 0.992), vec3(0.0, 1.0, 0.533), colorMix);
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          
          float breath = sin(time + position.y * 2.0) * 0.3 + 0.7;
          float distanceToCamera = length(mvPosition.xyz);
          gl_PointSize = size * (1500.0 / distanceToCamera) * breath;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vOpacity;
        
        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          float alpha = smoothstep(0.5, 0.2, dist) * vOpacity;
          float innerGlow = 1.0 - smoothstep(0.1, 0.5, dist);
          float outerGlow = exp(-2.0 * dist);
          vec3 finalColor = mix(vColor, vColor * 1.5, innerGlow);
          float finalAlpha = (alpha + outerGlow * 0.5) * 0.7;
          gl_FragColor = vec4(finalColor, finalAlpha);
        }
      `,
    });

    particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);
  };

  // 创建扫描线效果
  const createScanLine = () => {
    const scanGeometry = new THREE.PlaneGeometry(2.5, 2.5);
    const scanMaterial = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color("#56fffd") },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color;
        varying vec2 vUv;
        
        void main() {
          float gridX = smoothstep(0.95, 0.98, mod(vUv.x * 40.0 + sin(time) * 0.2, 1.0));
          float gridY = smoothstep(0.95, 0.98, mod(vUv.y * 40.0 + cos(time) * 0.2, 1.0));
          float fadeEdge = (1.0 - length(vUv - 0.5) * 1.5);
          float grid = (gridX + gridY) * fadeEdge;
          gl_FragColor = vec4(color, grid * 0.05);
        }
      `,
    });

    scanLine = new THREE.Mesh(scanGeometry, scanMaterial);
    scanLine.rotation.x = -Math.PI / 2;
    scanLine.position.y = 0.001;
    scene.add(scanLine);
  };

  // 创建能量波纹效果
  const createEnergyWave = () => {
    const waveGeometry = new THREE.PlaneGeometry(2, 2, 32, 32);
    const waveMaterial = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color("#56fffd") },
      },
      vertexShader: `
        varying vec2 vUv;
        uniform float time;
        
        void main() {
          vUv = uv;
          vec3 pos = position;
          float wave = sin(length(uv - 0.5) * 10.0 - time * 2.0) * 0.02;
          pos.z += wave;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color;
        varying vec2 vUv;
        
        void main() {
          float dist = length(vUv - 0.5);
          float wave = sin(dist * 10.0 - time * 2.0) * 0.5 + 0.5;
          float alpha = smoothstep(0.8, 0.0, dist) * wave * 0.3;
          gl_FragColor = vec4(color, alpha);
        }
      `,
    });

    energyWave = new THREE.Mesh(waveGeometry, waveMaterial);
    energyWave.rotation.x = -Math.PI / 2;
    energyWave.position.y = 0.054;
    scene.add(energyWave);
  };

  // 创建特效
  createParticleSystem();
  createScanLine();
  // createEnergyWave();

  // 添加窗口大小改变监听
  window.addEventListener("resize", onWindowResize, false);
}

// 动画循环
function animate() {
  requestAnimationFrame(animate);
  controls.update();

  // 更新粒子系统
  if (particles && particles.material.uniforms) {
    particles.material.uniforms.time.value += 0.005;
  }

  // 更新扫描线
  if (scanLine && scanLine.material.uniforms) {
    scanLine.material.uniforms.time.value += 0.001;
  }

  // 更新能量波纹
  if (energyWave && energyWave.material.uniforms) {
    energyWave.material.uniforms.time.value += 0.02;
  }

  renderer.render(scene, camera);
}

// 窗口大小改变处理
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);

  if (window.bgMesh) {
    const aspectRatio = window.innerWidth / window.innerHeight;
    window.bgMesh.geometry.dispose();
    window.bgMesh.geometry = new THREE.PlaneGeometry(2 * aspectRatio, 2);
  }
}

// 重置区域状态
function resetRegion(mesh) {
  if (Array.isArray(mesh.material)) {
    mesh.material[0].color.set(mesh.userData.originalColor[0]);
    mesh.material[1].color.set(mesh.userData.originalColor[1]);
  }
  mesh.userData.isAnimating = true;
  gsap.to(mesh.userData, {
    currentDepth: mesh.userData.originalDepth,
    duration: 0.3,
    onUpdate: () => {
      updateGeometry(mesh, mesh.userData.currentDepth);
    },
    onComplete: () => {
      mesh.userData.isAnimating = false;
    },
  });
}

// 激活区域状态
function activateRegion(mesh) {
  if (Array.isArray(mesh.material)) {
    mesh.material[0].color.set(mesh.userData.activeColor[0]);
    mesh.material[1].color.set(mesh.userData.activeColor[1]);
  }
  mesh.userData.isAnimating = true;
  gsap.to(mesh.userData, {
    currentDepth: mesh.userData.originalDepth * 1.5,
    duration: 0.3,
    onUpdate: () => {
      updateGeometry(mesh, mesh.userData.currentDepth);
    },
    onComplete: () => {
      mesh.userData.isAnimating = false;
    },
  });
}

// 更新几何体
function updateGeometry(mesh, depth) {
  if (!mesh.geometry.parameters) return;

  const shapes = mesh.geometry.parameters.shapes;
  const oldGeometry = mesh.geometry;

  const options = {
    ...mesh.geometry.parameters.options,
    depth: depth,
    bevelSegments: 1,
  };

  mesh.geometry = new THREE.ExtrudeGeometry(shapes, options);
  oldGeometry.dispose();
}

// 组件卸载时清理
onUnmounted(() => {
  const nameLabel = document.querySelector(".region-name-label");
  if (nameLabel) {
    nameLabel.remove();
  }

  // 清理事件监听
  window.removeEventListener("resize", onWindowResize);

  // 清理Three.js资源
  if (renderer) {
    renderer.dispose();
  }
  if (scene) {
    scene.traverse((object) => {
      if (object.geometry) {
        object.geometry.dispose();
      }
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  }
});
</script>

<template>
  <div id="map-container"></div>
</template>

<style scoped lang="less">
#map-container {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>
