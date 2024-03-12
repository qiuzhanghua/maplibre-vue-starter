<script setup lang="ts">
import {onMounted} from 'vue';
import 'maplibre-gl/dist/maplibre-gl.css';
import mapboxgl, {NavigationControl, Popup} from 'maplibre-gl';
import 'maplibre-gl-opacity/dist/maplibre-gl-opacity.css';
// import * as deck from 'deck.gl'; // not working
import {MapboxOverlay} from '@deck.gl/mapbox';
import {ScatterplotLayer} from '@deck.gl/layers';

const top = 20.031143432239205;
const left = 109.85781435455979;
const bottom = 20.25952390955198;
const right = 110.560852396297;

onMounted(() => {
  let container = document.getElementById('map')!;
  // see https://github.com/mug-jp/maplibre-gl-opacity for more maps
  let map = new mapboxgl.Map({
    container,
    style: 'https://demotiles.maplibre.org/style.json',
    center: [(left + right) / 2, (top + bottom) / 2],
    zoom: 10
  });
  map.addControl(new NavigationControl(), 'top-right');

  //from https://maplibre.org/maplibre-gl-js/docs/examples/add-deckgl-layer-using-rest-api/

  const colorPalette = [
    [255, 102, 51],
    [255, 179, 153],
    [255, 51, 255],
    [255, 255, 153],
    [0, 179, 230],
    [230, 179, 51],
    [51, 102, 230],
    [153, 153, 102],
    [153, 255, 153],
    [179, 77, 77],
    [128, 179, 0],
    [128, 153, 0],
    [230, 179, 179],
    [102, 128, 179],
    [102, 153, 26],
    [255, 153, 230],
    [204, 255, 26],
    [255, 26, 102],
    [230, 51, 26],
    [51, 255, 204],
    [102, 153, 77],
  ];

  const limit = 100;
  // Sample data source = https://data.iledefrance.fr
  const parisSights = `https://data.iledefrance.fr/api/explore/v2.1/catalog/datasets/principaux-sites-touristiques-en-ile-de-france0/records?limit=${limit}`;

  // Add the overlay as a control
  map.on('load', async () => {
    // Fetch the data
    const response = await fetch(parisSights);
    const responseJSON = await response.json();

    const layer = new ScatterplotLayer({
      id: 'scatterplot-layer',
      data: responseJSON.results,
      pickable: true,
      opacity: 0.7,
      stroked: true,
      filled: true,
      radiusMinPixels: 14,
      radiusMaxPixels: 100,
      lineWidthMinPixels: 5,
      // Using appropriate fields for coordinates from the dataset
      getPosition: (d) => [d.geo_point_2d.lon, d.geo_point_2d.lat],
      getFillColor: (d) => {
        // Filtering by postal code
        if ('insee' in d && d.insee.startsWith('75')) {
          // Districts in Paris
          return colorPalette[parseInt(d.insee.substring(3))];
        } else {
          // Out of Paris
          return colorPalette[20];
        }
      },
      getLineColor: (d) => [14, 16, 255],
      onClick: (info) => {
        const {coordinate, object} = info;
        const description = `<p>${object.nom_carto || 'Unknown'}</p>`;

        new  Popup()
            .setLngLat(coordinate)
            .setHTML(description)
            .addTo(map);
      },
    });

    // Create the overlay
    const overlay = new MapboxOverlay({
      layers: [layer],
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
