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
    const fillColor = metricField
      ? buildFillColorExpression(metricField, metadata, sourceLayer)
      : '#22c55e';

    map.addLayer({
      id: layerId,
      type: 'fill',
      source: sourceId,
      'source-layer': sourceLayer,
      paint: {
        'fill-color': fillColor as any,
        'fill-opacity': 0.9,
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
      const textValue = formatMetricValueForMapTooltip(metricField ?? null, value);
      const metricTitle = escapeHtml(selectedMetricLabel.value || metricField || 'н/д');
      const safeValue = escapeHtml(textValue);
      const safeTile = escapeHtml(tileId != null && tileId !== '' ? String(tileId) : 'н/д');
      const safeDate = escapeHtml(date != null && date !== '' ? String(date) : 'н/д');

      popup?.remove();
      popup = new maplibregl.Popup({ closeButton: true, closeOnClick: true })
        .setLngLat(event.lngLat)
        .setHTML(`
          <div style="font-size:12px;line-height:1.35">
            <div><strong>Метрика:</strong> ${metricTitle}</div>
            <div><strong>Значение:</strong> ${safeValue}</div>
            <div><strong>Тайл:</strong> ${safeTile}</div>
            <div><strong>Дата:</strong> ${safeDate}</div>
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

/** Categorical / enum properties from predicted PMTiles (ml worker contract). */
export const CATEGORICAL_PALETTES: Record<string, Record<string, string>> = {
  degradation_class: {
    none: '#16a34a',
    mild: '#eab308',
    moderate: '#f97316',
    severe: '#dc2626',
  },
  degradation_level: {
    none: '#16a34a',
    low: '#eab308',
    medium: '#f97316',
    severe: '#dc2626',
  },
  irrigation_status: {
    irrigated: '#2563eb',
    rainfed: '#94a3b8',
    unknown: '#cbd5e1',
  },
  water_balance_status: {
    balanced: '#16a34a',
    under_irrigation_risk: '#dc2626',
    over_irrigated: '#2563eb',
    unknown: '#cbd5e1',
  },
  water_balance_risk: {
    low: '#16a34a',
    medium: '#eab308',
    high: '#f97316',
    critical: '#dc2626',
  },
  trend: {
    improving: '#16a34a',
    stable: '#94a3b8',
    degrading: '#dc2626',
  },
  alert_level: {
    none: '#16a34a',
    low: '#eab308',
    medium: '#f97316',
    high: '#dc2626',
  },
  forecast_direction: {
    improving: '#16a34a',
    stable: '#94a3b8',
    degrading: '#dc2626',
  },
  forecast_direction_m0: {
    improving: '#16a34a',
    stable: '#94a3b8',
    degrading: '#dc2626',
  },
  forecast_direction_m1: {
    improving: '#16a34a',
    stable: '#94a3b8',
    degrading: '#dc2626',
  },
  forecast_direction_m2: {
    improving: '#16a34a',
    stable: '#94a3b8',
    degrading: '#dc2626',
  },
};

/** Keys that use match() coloring (not tilestats min/max). */
export const PMTILES_CATEGORICAL_METRIC_KEYS = new Set(Object.keys(CATEGORICAL_PALETTES));

/** Русские подписи значений категориальных метрик для попапа на карте. */
const CATEGORICAL_VALUE_LABELS_RU: Record<string, Record<string, string>> = {
  degradation_class: {
    none: 'Нет',
    mild: 'Слабая',
    moderate: 'Умеренная',
    severe: 'Сильная',
  },
  degradation_level: {
    none: 'Нет',
    low: 'Низкая',
    medium: 'Средняя',
    severe: 'Сильная',
  },
  irrigation_status: {
    irrigated: 'Орошаемое',
    rainfed: 'Дождевое',
    unknown: 'Неизвестно',
  },
  water_balance_status: {
    balanced: 'Сбалансирован',
    under_irrigation_risk: 'Риск недоорошения',
    over_irrigated: 'Переорошение',
    unknown: 'Неизвестно',
  },
  water_balance_risk: {
    low: 'Низкий',
    medium: 'Средний',
    high: 'Высокий',
    critical: 'Критический',
  },
  trend: {
    improving: 'Улучшается',
    stable: 'Стабильно',
    degrading: 'Ухудшается',
  },
  alert_level: {
    none: 'Нет',
    low: 'Низкий',
    medium: 'Средний',
    high: 'Высокий',
  },
  forecast_direction: {
    improving: 'Улучшается',
    stable: 'Стабильно',
    degrading: 'Ухудшается',
  },
  forecast_direction_m0: {
    improving: 'Улучшается',
    stable: 'Стабильно',
    degrading: 'Ухудшается',
  },
  forecast_direction_m1: {
    improving: 'Улучшается',
    stable: 'Стабильно',
    degrading: 'Ухудшается',
  },
  forecast_direction_m2: {
    improving: 'Улучшается',
    stable: 'Стабильно',
    degrading: 'Ухудшается',
  },
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Текст для попапа: категории — по-русски, числа — через ru-RU.
 */
export function formatMetricValueForMapTooltip(metricField: string | null, raw: unknown): string {
  if (raw === undefined || raw === null || raw === '') return 'н/д';
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    if (metricField === 'confidence' || metricField === 'forecast_confidence' || metricField === 'forecast_confidence_m0' || metricField === 'forecast_confidence_m1' || metricField === 'forecast_confidence_m2') {
      if (raw >= 0 && raw <= 1) {
        return `${(raw * 100).toLocaleString('ru-RU', { maximumFractionDigits: 1 })}%`;
      }
      if (raw > 1 && raw <= 100) {
        return `${raw.toLocaleString('ru-RU', { maximumFractionDigits: 1 })}%`;
      }
    }
    return raw.toLocaleString('ru-RU', { maximumFractionDigits: 6 });
  }
  if (typeof raw === 'boolean') return raw ? 'да' : 'нет';
  const s = String(raw).trim();
  if (!s) return 'н/д';
  if (metricField && CATEGORICAL_VALUE_LABELS_RU[metricField]?.[s]) {
    return CATEGORICAL_VALUE_LABELS_RU[metricField][s]!;
  }
  return s;
}

function isCategoricalMetric(field: string | null): boolean {
  return Boolean(field && field in CATEGORICAL_PALETTES);
}

/** Метадата PMTiles для легенды и стиля (совместимо с getMetadata()). */
export type PmtilesTilestatsMetadata = {
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

export async function loadPmtilesMetadataForLegend(
  url: string,
): Promise<{ sourceLayer: string; metadata: PmtilesTilestatsMetadata } | null> {
  try {
    const pmtiles = new PMTiles(url);
    const metadata = (await pmtiles.getMetadata()) as PmtilesTilestatsMetadata;
    const vectorLayers = metadata.vector_layers ?? [];
    const sourceLayer = vectorLayers.find((layer) => layer.id === 'tiles')?.id ?? vectorLayers[0]?.id ?? 'tiles';
    return { sourceLayer, metadata };
  } catch {
    return null;
  }
}

export type MapLegend =
  | { mode: 'categorical'; items: Array<{ color: string; label: string }> }
  | { mode: 'gradient'; min: number; max: number; gradientCss: string };

/**
 * Описание легенды для полоски под картой (как на слое: категории или градиент min→max).
 */
export function buildMapLegend(
  metricField: string | null,
  metadata: PmtilesTilestatsMetadata | null,
  sourceLayer: string,
): MapLegend | null {
  if (!metricField) return null;
  if (isCategoricalMetric(metricField)) {
    const palette = CATEGORICAL_PALETTES[metricField];
    const labels = CATEGORICAL_VALUE_LABELS_RU[metricField] ?? {};
    const items = Object.entries(palette).map(([key, color]) => ({
      color,
      label: labels[key] ?? key,
    }));
    return { mode: 'categorical', items };
  }
  const { min, max } = resolveMetricRange(metadata, sourceLayer, metricField);
  const gradientCss = 'linear-gradient(to right, #dc2626 0%, #facc15 33%, #16a34a 100%)';
  return { mode: 'gradient', min, max, gradientCss };
}

/**
 * MapLibre fill-color: numeric (tilestats) or categorical match().
 */
function buildFillColorExpression(
  metricField: string,
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
): maplibregl.ExpressionSpecification | string {
  if (isCategoricalMetric(metricField)) {
    const palette = CATEGORICAL_PALETTES[metricField];
    const pairs: (string | maplibregl.ExpressionSpecification)[] = [];
    for (const [k, color] of Object.entries(palette)) {
      pairs.push(k, color);
    }
    return [
      'match',
      ['coalesce', ['to-string', ['get', metricField]], ''],
      ...pairs,
      '#cbd5e1',
    ];
  }

  const metricRange = resolveMetricRange(metadata, sourceLayer, metricField);
  return [
    'interpolate',
    ['linear'],
    ['coalesce', ['to-number', ['get', metricField]], 0],
    metricRange.min, '#dc2626',
    metricRange.min + metricRange.span * 0.33, '#facc15',
    metricRange.max, '#16a34a',
  ];
}

function resolveMetricRange(
  metadata: PmtilesTilestatsMetadata | null,
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
