# wzx-vue-map

一个基于 Vue 3 + Three.js 的 3D 地图可视化组件库，支持地图区域高亮、动画效果和粒子特效。

## 功能特点

- 🌍 支持中国地图和省份地图的 3D 展示
- 🎨 可自定义地图区域颜色和高亮效果
- ✨ 内置粒子系统和动态光效
- 🎮 支持轨道控制器，可自由调整视角
- 🔥 响应式属性更新
- ⚡️ 基于 Vue 3 + Vite + Three.js，性能出色

- ![image](https://github.com/user-attachments/assets/41806cf9-66fb-482c-9c01-9c956744fd0b)

## 安装

```bash
# 安装组件库
npm install vue-wzx-3dmap

# 安装必需的依赖
npm install three @types/three gsap@^3.12.0
```

## 使用方法

### 在 main.js 中配置

```js
import { createApp } from "vue";
import App from "./App.vue";
// 引入组件
import { WzxThreeMap } from "vue-wzx-3dmap";

const app = createApp(App);

// 全局注册组件
app.component("WzxThreeMap", WzxThreeMap);

app.mount("#app");
```

### 在组件中使用

```vue
<script setup>
// 局部引入（如果已经全局注册则不需要这行）
import { WzxThreeMap } from "vue-wzx-3dmap";

// 配置地图颜色
const colors = {
  topColor: "#56fffd", // 顶面颜色
  sideColor: "#0aa09e", // 侧面颜色
  lineColor: "#bff7ff", // 线条颜色
  glowLineColor: "#bff7ff", // 发光线条颜色
  outerGlowColor: "#7cfffd", // 外发光颜色
};

// 配置选中状态的颜色
const activeColors = {
  topColor: "#ffc64d", // 选中时顶面颜色
  sideColor: "#c87a16", // 选中时侧面颜色
};

// 相机配置
const cameraConfig = {
  position: { x: 0, y: 1, z: 1 }, // 相机位置
  fov: 35, // 视场角
  near: 0.1, // 近裁剪面
  far: 1000, // 远裁剪面
};

// 点击区域的处理函数
const handleRegionClick = (region) => {
  console.log("点击的区域：", region);
};
</script>

<template>
  <div class="map-container">
    <WzxThreeMap
      :mapJson="mapData"
      :mapColors="colors"
      :activeColors="activeColors"
      :cameraConfig="cameraConfig"
      @regionClick="handleRegionClick"
    />
  </div>
</template>

<style scoped>
.map-container {
  width: 100%;
  height: 600px;
}
</style>
```

## 开发指南

### 环境要求

- Node.js >= 16
- Vue >= 3.3
- Three.js >= 0.150.0
- GSAP >= 3.12.0

### 本地开发

```bash
# 克隆项目
git clone [项目地址]

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 打包构建
npm run build
```

## API 文档

### 组件属性

| 属性名          | 类型   | 默认值     | 说明              |
| --------------- | ------ | ---------- | ----------------- |
| mapJson         | Object | -          | 地图 GeoJSON 数据 |
| mapColors       | Object | 见下方说明 | 地图基础颜色配置  |
| activeColors    | Object | 见下方说明 | 选中状态颜色配置  |
| backgroundImage | String | -          | 背景图片路径      |
| cameraConfig    | Object | 见下方说明 | 相机配置项        |

### mapColors 配置项

```js
{
  topColor: "#56fffd",      // 顶面颜色
  sideColor: "#0aa09e",     // 侧面颜色
  lineColor: "#bff7ff",     // 线条颜色
  glowLineColor: "#bff7ff", // 发光线条颜色
  outerGlowColor: "#7cfffd" // 外发光颜色
}
```

### activeColors 配置项

```js
{
  topColor: "#ffc64d",      // 选中时顶面颜色
  sideColor: "#c87a16"      // 选中时侧面颜色
}
```

### cameraConfig 配置项

```js
{
  position: { x: 0, y: 1, z: 1 }, // 相机位置
  fov: 35,                        // 视场角
  near: 0.1,                      // 近裁剪面
  far: 1000                       // 远裁剪面
}
```

### 事件

| 事件名      | 说明               | 回调参数                                          |
| ----------- | ------------------ | ------------------------------------------------- |
| regionClick | 点击地图区域时触发 | { name: string, code: string, isActive: boolean } |

## 特效说明

1. 粒子系统：随机分布的动态粒子效果
2. 扫描线：网格状扫描动画
3. 区域高亮：点击区域时的颜色变化和高度动画
4. 发光边框：地图区域边界的发光效果

## License

[MIT](LICENSE)
