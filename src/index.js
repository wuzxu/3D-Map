import ThreeMap from "./components/ThreeMap.vue";

export { ThreeMap };

export default {
  install: (app) => {
    app.component("ThreeMap", ThreeMap);
  },
};
