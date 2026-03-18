import { onBeforeUnmount, shallowRef, type ShallowRef } from "vue";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import type { Map as MapLibreMap } from "maplibre-gl";
import type {
  Feature,
  Geometry,
  Point,
  LineString,
  Polygon,
} from "geojson";
import { DRAW_STYLES } from "./styles";

type DrawMode = "draw_point" | "draw_line_string" | "draw_polygon";

type DrawResult =
  | Feature<Point>
  | Feature<LineString>
  | Feature<Polygon>;

type StartOptions = {
  mode: DrawMode;
  addControl?: boolean;
  controlPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
};

export function useMapDraw(mapRef: ShallowRef<MapLibreMap | null>) {
  const drawRef = shallowRef<MapboxDraw | null>(null);
  let currentCleanup: (() => void) | null = null;
  let currentReject: ((reason?: unknown) => void) | null = null;

  function ensureMap(): MapLibreMap {
    const map = mapRef.value;
    if (!map) {
      throw new Error("Map is not available");
    }
    if (!map.isStyleLoaded()) {
      throw new Error("Map style is not loaded yet");
    }
    return map;
  }

  function ensureDraw(options?: StartOptions) {
    const map = ensureMap();

    if (drawRef.value) return drawRef.value;

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      styles: DRAW_STYLES,
    });

    drawRef.value = draw;

    const hasControl =
      (map as any)._controls?.includes?.(draw) ?? false;

    if ((options?.addControl ?? true) && !hasControl) {
      map.addControl(draw as any, options?.controlPosition ?? "top-left");
    }

    return draw;
  }

  function stop() {
    currentCleanup?.();
    currentCleanup = null;
    currentReject = null;

    const map = mapRef.value;
    const draw = drawRef.value;

    if (map && draw) {
      try {
        draw.changeMode("simple_select");
      } catch { }
    }
  }

  function destroy() {
    stop();

    const map = mapRef.value;
    const draw = drawRef.value;

    if (map && draw) {
      try {
        map.removeControl(draw as any);
      } catch { }
    }

    drawRef.value = null;
  }

  function start(options: StartOptions): Promise<DrawResult> {
    stop();

    const map = ensureMap();
    const draw = ensureDraw(options);

    return new Promise<DrawResult>((resolve, reject) => {
      currentReject = reject;

      const cleanup = () => {
        map.off("draw.create", onCreate);
        map.off("draw.modechange", onModeChange);
        currentCleanup = null;
        currentReject = null;
      };

      const finish = (feature: DrawResult) => {
        cleanup();
        try {
          draw.changeMode("simple_select");
        } catch { }
        resolve(feature);
      };

      const cancel = (reason = new Error("Drawing cancelled")) => {
        cleanup();
        try {
          draw.changeMode("simple_select");
        } catch { }
        reject(reason);
      };

      const onCreate = (e: { features?: Feature<Geometry>[] }) => {
        const feature = e.features?.[0];
        if (!feature) return;

        if (
          feature.geometry.type === "Point" ||
          feature.geometry.type === "LineString" ||
          feature.geometry.type === "Polygon"
        ) {
          finish(feature as DrawResult);
        }
      };

      const onModeChange = (e: { mode: string }) => {
        // если пользователь вышел из draw-mode до create — считаем отменой
        if (e.mode !== options.mode && e.mode === "simple_select") {
          cancel();
        }
      };

      currentCleanup = cleanup;

      map.on("draw.create", onCreate);
      map.on("draw.modechange", onModeChange);

      console.log(draw)
      draw.changeMode(options.mode as any);
    });
  }

  onBeforeUnmount(() => {
    destroy();
  });

  return {
    draw: drawRef,
    start,
    stop,
    destroy,
  };
}
