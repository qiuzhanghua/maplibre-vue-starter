import {explode, FeatureCollection, randomLineString} from "@turf/turf";

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

export type Track = { id: string, path: number[][], direction: number };

export function toTracks(data: FeatureCollection): Track[] {
    let tracks: Track[] = [];
    for (let i = 0; i < data.features.length; i++) {
        let feature = data.features[i];
        let path: number[][] = [];
        for (let j = 0; j < feature.geometry.coordinates.length; j++) {
            let point = [feature.geometry.coordinates[j][0], feature.geometry.coordinates[j][1]];
            path.push(point);
        }
        tracks.push({
            id: feature.properties.id,
            path: path,
            direction: feature.properties.direction
        });
    }
    return tracks;
}

export function mergePoints(data: FeatureCollection): FeatureCollection {
    let points = explode(data);
    for (let i = 0; i < data.features.length; i++) {
        points.features.push(data.features[i])
    }
    return points;
}
