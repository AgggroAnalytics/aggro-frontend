import type { Ref } from 'vue';
import { watch } from 'vue';
import maplibregl from 'maplibre-gl';
import { PMTiles, Protocol } from 'pmtiles';

let protocolRegistered = false;
let protocolInstance: Protocol | null = null;

function ensureProtocol() {
  if (!protocolRegistered) {
    protocolInstance = new Protocol();
    maplibregl.addProtocol('pmtiles', protocolInstance.tile);
    protocolRegistered = true;
  }
}

export function usePmtilesRenderer(
  mapRef: Ref<maplibregl.Map | null>,
  styleReady: Ref<boolean>,
  selectedPmtilesUrl: Ref<string | null>,
  selectedMetricField: Ref<string | null>,
  selectedMetricLabel: Ref<string>,
) {
  const sourceId = 'field-pmtiles-source';
  const layerId = 'field-pmtiles-layer';
  const lineLayerId = 'field-pmtiles-outline';
  let popup: maplibregl.Popup | null = null;
  let clickHandler: ((event: maplibregl.MapLayerMouseEvent) => void) | null = null;
  let enterHandler: (() => void) | null = null;
  let leaveHandler: (() => void) | null = null;

  watch([mapRef, styleReady, selectedPmtilesUrl, selectedMetricField, selectedMetricLabel], async () => {
    const map = mapRef.value;
    if (!map || !styleReady.value) return;

    ensureProtocol();

    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);

    if (!selectedPmtilesUrl.value) return;

    let sourceLayer = 'tiles';
    let metadata: {
      vector_layers?: Array<{ id?: string }>;
      tilestats?: {
        layers?: Array<{
          layer?: string;
          attributes?: Array<{
            attribute?: string;
            min?: number;
            max?: number;
          }>;
        }>;
      };
    } | null = null;
    try {
      const pmtiles = new PMTiles(selectedPmtilesUrl.value);
      metadata = await pmtiles.getMetadata() as {
        vector_layers?: Array<{ id?: string }>;
        tilestats?: {
          layers?: Array<{
            layer?: string;
            attributes?: Array<{
              attribute?: string;
              min?: number;
              max?: number;
            }>;
          }>;
        };
      };
      const vectorLayers = metadata.vector_layers ?? [];
      sourceLayer = vectorLayers.find((layer) => layer.id === 'tiles')?.id ?? vectorLayers[0]?.id ?? 'tiles';
    } catch {
      sourceLayer = 'tiles';
    }

    map.addSource(sourceId, {
      type: 'vector',
      url: `pmtiles://${selectedPmtilesUrl.value}`,
    });

    const metricField = selectedMetricField.value;
    const metricRange = resolveMetricRange(metadata, sourceLayer, metricField);
    const fillColor = metricField
      ? [
          'interpolate',
          ['linear'],
          ['coalesce', ['to-number', ['get', metricField]], 0],
          metricRange.min, '#dc2626',
          metricRange.min + metricRange.span * 0.33, '#facc15',
          metricRange.max, '#16a34a',
        ]
      : '#22c55e';

    map.addLayer({
      id: layerId,
      type: 'fill',
      source: sourceId,
      'source-layer': sourceLayer,
      paint: {
        'fill-color': fillColor as any,
        'fill-opacity': 0.45,
      },
    });

    map.addLayer({
      id: lineLayerId,
      type: 'line',
      source: sourceId,
      'source-layer': sourceLayer,
      paint: {
        'line-color': '#166534',
        'line-width': 1,
      },
    });

    if (clickHandler) {
      map.off('click', layerId, clickHandler);
      clickHandler = null;
    }
    if (enterHandler) {
      map.off('mouseenter', layerId, enterHandler);
      enterHandler = null;
    }
    if (leaveHandler) {
      map.off('mouseleave', layerId, leaveHandler);
      leaveHandler = null;
    }

    clickHandler = (event) => {
      const feature = event.features?.[0];
      if (!feature) return;
      const value = metricField ? feature.properties?.[metricField] : undefined;
      const tileId = feature.properties?.tile_id;
      const date = feature.properties?.date;
      const textValue = value === undefined || value === null || value === '' ? 'н/д' : String(value);

      popup?.remove();
      popup = new maplibregl.Popup({ closeButton: true, closeOnClick: true })
        .setLngLat(event.lngLat)
        .setHTML(`
          <div style="font-size:12px;line-height:1.35">
            <div><strong>Метрика:</strong> ${selectedMetricLabel.value || metricField || 'н/д'}</div>
            <div><strong>Значение:</strong> ${textValue}</div>
            <div><strong>Тайл:</strong> ${tileId ?? 'н/д'}</div>
            <div><strong>Дата:</strong> ${date ?? 'н/д'}</div>
          </div>
        `)
        .addTo(map);
    };
    enterHandler = () => {
      map.getCanvas().style.cursor = 'pointer';
    };
    leaveHandler = () => {
      map.getCanvas().style.cursor = '';
    };

    map.on('click', layerId, clickHandler);
    map.on('mouseenter', layerId, enterHandler);
    map.on('mouseleave', layerId, leaveHandler);
  }, { immediate: true });
}

function resolveMetricRange(
  metadata: {
    tilestats?: {
      layers?: Array<{
        layer?: string;
        attributes?: Array<{
          attribute?: string;
          min?: number;
          max?: number;
        }>;
      }>;
    };
  } | null,
  sourceLayer: string,
  metricField: string | null,
) {
  if (!metadata || !metricField) {
    return { min: 0, max: 100, span: 100 };
  }

  const tilestatsLayer = metadata.tilestats?.layers?.find((layer) => layer.layer === sourceLayer)
    ?? metadata.tilestats?.layers?.[0];
  const attribute = tilestatsLayer?.attributes?.find((attr) => attr.attribute === metricField);

  const min = Number.isFinite(attribute?.min) ? Number(attribute?.min) : 0;
  const max = Number.isFinite(attribute?.max) ? Number(attribute?.max) : 100;
  const span = max > min ? (max - min) : 1;

  return { min, max: max > min ? max : min + 1, span };
}
