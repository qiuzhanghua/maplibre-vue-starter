<script setup lang="ts">
import {onMounted} from 'vue';
import 'maplibre-gl/dist/maplibre-gl.css';
import mapboxgl, {NavigationControl} from 'maplibre-gl';
import 'maplibre-gl-opacity/dist/maplibre-gl-opacity.css';
// import * as deck from 'deck.gl'; // not working
import {MapboxOverlay} from '@deck.gl/mapbox/typed';
import {PathLayer, ScatterplotLayer} from '@deck.gl/layers/typed';
import {randomData, toLngLats, toTracks} from "../lib";
import {FeatureCollection} from "@turf/turf";

let tracksCount = 20000;
let pointPerTrack = 200;
let mockTracks: FeatureCollection = null;
const top = 20.031143432239205;
const left = 109.85781435455979;
const bottom = 20.25952390955198;
const right = 110.560852396297;

onMounted(() => {
  let start = new Date().getTime();
  mockTracks = randomData(tracksCount, pointPerTrack, [left, top, right, bottom]);
  let end = new Date().getTime();
  console.log("mock data in " + (end - start) + 'ms');

  let container = document.getElementById('map')!;
  // see https://github.com/mug-jp/maplibre-gl-opacity for more maps
  let map = new mapboxgl.Map({
    container,
    style: 'https://demotiles.maplibre.org/style.json',
    center: [(left + right) / 2, (top + bottom) / 2],
    zoom: 10
  });
  map.addControl(new NavigationControl(), 'top-right');

  // Add the overlay as a control
  map.on('load', async () => {
    const scatterLayer = new ScatterplotLayer({
      id: 'scatterplot-layer',
      data: toLngLats(mockTracks),
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
  console.log(toTracks(mockTracks)[0]);
    const pathLayer = new PathLayer({
      id: 'path-layer',
      data: toTracks(mockTracks),
      pickable: true,
      widthScale: 1,
      widthMinPixels: 0.25,
      getPath: d => d.path,
      getColor: () => [255, 0, 0],
      getWidth: 1,
      capRounded: true,
      jointRounded: true,
    });
    const overlay = new MapboxOverlay({
      layers: [scatterLayer, pathLayer],
    });
    map.addControl(overlay);
  });
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
