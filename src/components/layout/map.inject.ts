import type { InjectionKey, Ref, ShallowRef } from "vue";

type MapContext = {
  map: ShallowRef<maplibregl.Map | null>;
  styleReady: Ref<boolean>;
};
export const mapKey: InjectionKey<MapContext> = Symbol("map");
