import { onBeforeUnmount, watch, type ShallowRef, type Ref } from "vue";
import type { Feature, FeatureCollection, Polygon } from "geojson";
import type { LngLatBoundsLike, Map, FitBoundsOptions } from "maplibre-gl";

export type PolygonItem = {
  id: string;
  coordinates: number[][][]; // Polygon coordinates
};

type UseMapPolygonsOptions = {
  sourceId?: string;
  fillLayerId?: string;
  lineLayerId?: string;
  fitBoundsOptions?: FitBoundsOptions;
};

export function useMapPolygons(
  mapRef: ShallowRef<Map | null>,
  itemsSource: Ref<PolygonItem[]>,
  options: UseMapPolygonsOptions = {}
) {
  const sourceId = options.sourceId ?? "polygons-source";
  const fillLayerId = options.fillLayerId ?? "polygons-fill";
  const lineLayerId = options.lineLayerId ?? "polygons-line";


  function toFeature(item: PolygonItem): Feature<Polygon> {
    return {
      type: "Feature",
      id: item.id,
      properties: {
        id: item.id,
      },
      geometry: {
        type: "Polygon",
        coordinates: item.coordinates,
      },
    };
  }

  function toFeatureCollection(list: PolygonItem[]): FeatureCollection<Polygon> {
    return {
      type: "FeatureCollection",
      features: list.map(toFeature),
    };
  }

  function ensureLayers(map: Map) {
    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: "geojson",
        data: toFeatureCollection(itemsSource.value),
      });
    }

    if (!map.getLayer(fillLayerId)) {
      map.addLayer({
        id: fillLayerId,
        type: "fill",
        source: sourceId,
        paint: {
          "fill-color": "#3b82f6",
          "fill-opacity": 0.2,
        },
      });
    }

    if (!map.getLayer(lineLayerId)) {
      map.addLayer({
        id: lineLayerId,
        type: "line",
        source: sourceId,
        paint: {
          "line-color": "#2563eb",
          "line-width": 2,
        },
      });
    }
  }

  function updateSourceData() {
    const map = mapRef.value;
    if (!map || !map.isStyleLoaded()) return;

    ensureLayers(map);

    const source = map.getSource(sourceId) as
      | { setData: (data: FeatureCollection<Polygon>) => void }
      | undefined;

    source?.setData(toFeatureCollection(itemsSource.value));
  }

  function getBoundsById(id: string): LngLatBoundsLike | null {
    const item = itemsSource.value.find((x) => x.id === id);
    if (!item) return null;

    let minLng = Infinity;
    let minLat = Infinity;
    let maxLng = -Infinity;
    let maxLat = -Infinity;

    for (const ring of item.coordinates) {
      for (const point of ring) {
        const [lng, lat] = point;
        if (lng < minLng) minLng = lng;
        if (lat < minLat) minLat = lat;
        if (lng > maxLng) maxLng = lng;
        if (lat > maxLat) maxLat = lat;
      }
    }

    if (
      !Number.isFinite(minLng) ||
      !Number.isFinite(minLat) ||
      !Number.isFinite(maxLng) ||
      !Number.isFinite(maxLat)
    ) {
      return null;
    }

    return [
      [minLng, minLat],
      [maxLng, maxLat],
    ];
  }

  function fitTo(id: string, fitOptions?: FitBoundsOptions) {
    const map = mapRef.value;
    if (!map) return false;

    const bounds = getBoundsById(id);
    console.log(bounds, map)
    if (!bounds) return false;

    map.fitBounds(bounds, {
      padding: 40,
      duration: 500,
      ...options.fitBoundsOptions,
      ...fitOptions,
    });

    return true;
  }

  function remove() {
    const map = mapRef.value;
    if (!map) return;

    if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId);
    if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  }

  function onStyleReady() {
    updateSourceData();
  }

  watch(
    () => mapRef.value,
    (map, prevMap) => {
      if (prevMap) {
        prevMap.off("load", onStyleReady);
        prevMap.off("styledata", onStyleReady);
      }

      if (!map) return;

      if (map.isStyleLoaded()) {
        updateSourceData();
      } else {
        map.once("load", onStyleReady);
      }

      map.on("styledata", onStyleReady);
    },
    { immediate: true }
  );

  watch(itemsSource, () => {
    updateSourceData();
  }, { deep: true });

  onBeforeUnmount(() => {
    const map = mapRef.value;
    if (map) {
      map.off("load", onStyleReady);
      map.off("styledata", onStyleReady);
    }
    remove();
  });

  return {
    fitTo,
    getBoundsById,
    refresh: updateSourceData,
    remove,
  };
}
