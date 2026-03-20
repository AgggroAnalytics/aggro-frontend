<script setup lang="ts">
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import SelectCurrentOrganization from '../organization/SelectCurrentOrganization.vue';
import Sidebar from './Sidebar.vue';
import { onBeforeUnmount, onMounted, provide, ref, shallowRef, useTemplateRef } from 'vue';
import maplibregl from "maplibre-gl"
import { mapKey } from './map.inject';


const map = shallowRef<maplibregl.Map | null>(null);
const styleReady = ref(false);

provide(mapKey, { map, styleReady });
const mapEl = useTemplateRef("mapEl")
onMounted(() => {
  if (!mapEl.value) return;

  const instance = new maplibregl.Map({
    container: mapEl.value,
    style: {
      version: 8,
      sources: {
        "arcgis-imagery": {
          type: "raster",
          tiles: [
            "https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          ],
          tileSize: 256,
          attribution: "Tiles © Esri"
        }
      },
      layers: [
        {
          id: "arcgis-imagery-layer",
          type: "raster",
          source: "arcgis-imagery"
        }
      ]
    },
    center: [4.9, 52.37],
    zoom: 10
  });

  map.value = instance;

  const markReady = () => {
    if (instance.isStyleLoaded()) {
      styleReady.value = true;
    }
  };

  if (instance.isStyleLoaded()) {
    styleReady.value = true;
  } else {
    instance.once("load", markReady);
  }

  instance.on("styledata", markReady);
});

onBeforeUnmount(() => {
  styleReady.value = false;
  map.value?.remove();
  map.value = null;
});
</script>

<template>
  <SidebarProvider>
    <Sidebar />
    <SidebarInset class="h-screen overflow-hidden">
      <header class="shrink-0 px-4 py-1 border-y flex justify-between items-center">
        <SidebarTrigger class="-ml-1" />
        <div>
          <SelectCurrentOrganization />
        </div>
      </header>
      <main class="w-full min-h-0 flex-1 overflow-hidden grid grid-cols-[40vw_1fr]">
        <div class="min-h-0 overflow-y-auto px-4 py-2">
          <template v-if="styleReady && map">
            <slot />
          </template>
        </div>
        <div class="relative min-h-0 h-full w-full">
          <div id='map' ref="mapEl" class="h-full w-full"></div>
          <div id="map-overlay-root" class="pointer-events-none absolute left-4 top-4 z-10">
            <slot name="map-overlay" />
          </div>
        </div>
      </main>
    </SidebarInset>
  </SidebarProvider>
</template>
