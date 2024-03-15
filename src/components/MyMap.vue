<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import "maplibre-gl/dist/maplibre-gl.css";
import mapboxgl, { NavigationControl } from "maplibre-gl";
import "maplibre-gl-opacity/dist/maplibre-gl-opacity.css";
// import * as deck from 'deck.gl'; // not working
import { MapboxOverlay } from "@deck.gl/mapbox/typed";
import {
  GeoJsonLayer,
  PathLayer,
  ScatterplotLayer,
} from "@deck.gl/layers/typed";
import { mergePoints, randomData, toLngLats, toTracks } from "../lib";
import { FeatureCollection } from "@turf/turf";

let mocking = true;
let allTracks: FeatureCollection = null;
let tracks: FeatureCollection = null;

function createInlineWorker(fn) {
  let blob = new Blob(["self.onmessage = ", fn.toString()], {
    type: "text/javascript",
  });
  let url = URL.createObjectURL(blob);
  return new Worker(url);
}

let fetchDataWorker: Worker | null = null;
let fetchDataJob: number | undefined = undefined;

let tracksCount = 2000;
let pointPerTrack = 200;
let mockTracks: FeatureCollection = null;
const top = 20.031143432239205;
const left = 109.85781435455979;
const bottom = 20.25952390955198;
const right = 110.560852396297;

onMounted(() => {
  fetchDataWorker = createInlineWorker(function (e) {
    // replace with your own fetch with e.data
    fetch(`${e.data.base}/tracks/1.json`, {
      method: "GET",
    })
      .then((res) => res.json())
      .then((data) => {
        self.postMessage(data);
      })
      .catch((err) => {
        // handle error here
        console.error(err);
      });
  });

  fetchDataWorker.onmessage = function (e) {
    // add your own data processing here
    allTracks = e.data;
    if (!mocking) {
      tracks = allTracks;
    }
  };

  fetchDataJob = setInterval(() => {
    // call fetchDataWorker.postMessage here
  }, 1000 * 10); // 10 seconds

  fetchDataWorker.postMessage({
    startTime: new Date().getTime(),
    duration: 1000 * 60 * 15, // 分钟
    left,
    top,
    right,
    bottom,
    base: document.baseURI, // for absolute path
    filters: {}, // Add filters here
  });

  if (mocking) {
    let start = new Date().getTime();
    mockTracks = randomData(tracksCount, pointPerTrack, [
      left,
      top,
      right,
      bottom,
    ]);
    let end = new Date().getTime();
    console.log("mock data in " + (end - start) + "ms");
    tracks = mockTracks;
  } else {
    tracks = allTracks;
  }
  let container = document.getElementById("map")!;
  // see https://github.com/mug-jp/maplibre-gl-opacity for more maps
  let map = new mapboxgl.Map({
    container,
    style: "https://demotiles.maplibre.org/style.json",
    center: [(left + right) / 2, (top + bottom) / 2],
    zoom: 10,
  });
  map.addControl(new NavigationControl(), "top-right");

  // Add the overlay as a control
  map.on("load", async () => {
    const scatterLayer = new ScatterplotLayer({
      id: "scatterplot-layer",
      data: toLngLats(tracks),
      pickable: true,
      opacity: 0.7,
      stroked: true,
      filled: false,
      radiusScale: 1,
      radiusMinPixels: 0.25,
      getRadius: 1,
      getPosition: (d) => [d.lng, d.lat],
      getFillColor: () => {
        return [14, 16, 255];
      },
      getLineColor: () => [14, 16, 255],
    });

    if (!tracks) {
      return;
    }
    const pathLayer = new PathLayer({
      id: "path-layer",
      data: toTracks(tracks),
      pickable: true,
      widthScale: 1,
      widthMinPixels: 0.25,
      getPath: (d) => d.path,
      getColor: () => [255, 0, 0],
      getWidth: 1,
      capRounded: true,
      jointRounded: true,
    });

    const jsonLayer = new GeoJsonLayer({
      id: "json-layer",
      data: mergePoints(tracks),
      // getLineColor: [255, 0, 0],
      getLineWidth: 1,
      lineWidthMinPixels: 0.25,
      lineWidthScale: 1,
      lineCapRounded: true,
      lineJointRounded: true,
      stroked: true,
      filled: false,
      pointType: "circle",
      pointRadiusScale: 1,
      pointRadiusMinPixels: 0.25,
      pointWidthScale: 1,
      // getText: (f) => f.properties.name,
      // getIcon: () => ({
      //   url: '/vite.svg',
      //   width: 128,
      //   height: 128,
      //   anchorY: 128,
      // }),
    });
    const overlay = new MapboxOverlay({
      layers: [jsonLayer],
      // layers: [scatterLayer, pathLayer],
    });
    map.addControl(overlay);
  });
});

onUnmounted(() => {
  clearInterval(fetchDataJob);
  fetchDataJob = undefined;
  fetchDataWorker?.terminate();
  fetchDataWorker = null;
});
</script>

<template>
  <div id="map"></div>
</template>

<style scoped>
body {
  margin: 0;
  padding: 0;
}

#map {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
}

.maplibregl-popup {
  z-index: 2;
}
</style>
