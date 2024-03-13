import {FeatureCollection, randomLineString} from "@turf/turf";

export function randomData(count: number, num_vertices: number, bbox: number[]): FeatureCollection {
    return randomLineString(count, {bbox, num_vertices});
}

export type LngLat = { lng: number, lat: number };

export function toLngLats(data: FeatureCollection): LngLat[] {
    let lnglats: LngLat[] = [];
    for (let i = 0; i < data.features.length; i++) {
        let feature = data.features[i];
        for (let j = 0; j < feature.geometry.coordinates.length; j++) {
            let point: LngLat = {lat: feature.geometry.coordinates[j][1], lng: feature.geometry.coordinates[j][0]};
            lnglats.push(point);
        }
    }
    return lnglats;
}
