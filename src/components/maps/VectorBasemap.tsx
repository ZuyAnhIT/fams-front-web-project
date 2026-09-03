"use client";

import { useEffect, useState } from "react";
import type { MaplibreGL as MaplibreGLLayer } from "leaflet";
import { TileLayer, useMap } from "react-leaflet";
import "maplibre-gl/dist/maplibre-gl.css";
import { mapConfig } from "@/config/map";

const VECTOR_LOAD_TIMEOUT_MS = 12_000;

/**
 * Renders the OpenFreeMap vector style inside an existing Leaflet map.
 *
 * The raster layer stays visible until MapLibre has rendered its first frame.
 * If WebGL, the style, or the vector service is unavailable, the existing
 * CARTO raster layer remains active so map-based business flows still work.
 */
export default function VectorBasemap() {
  const map = useMap();
  const [vectorReady, setVectorReady] = useState(false);

  useEffect(() => {
    let disposed = false;
    let layer: MaplibreGLLayer | undefined;
    let loaded = false;

    const loadTimeout = window.setTimeout(() => {
      if (disposed || loaded) return;
      console.warn("OpenFreeMap vector layer timed out; keeping raster fallback.");
      if (layer && map.hasLayer(layer)) map.removeLayer(layer);
    }, VECTOR_LOAD_TIMEOUT_MS);

    const mountVectorLayer = async () => {
      try {
        const [{ maplibreGL }, { setWorkerUrl }] = await Promise.all([
          import("@maplibre/maplibre-gl-leaflet"),
          import("maplibre-gl"),
        ]);
        if (disposed) return;

        // Next/Turbopack cannot infer MapLibre's module-worker URL after bundling.
        // Point it at the matching ESM worker explicitly before creating the map.
        setWorkerUrl(mapConfig.workerUrl);

        const vectorLayer = maplibreGL({
          style: mapConfig.styleUrl,
          interactive: false,
        });
        layer = vectorLayer;
        vectorLayer.addTo(map);
        const glMap = vectorLayer.getMaplibreMap();

        glMap.on("error", (event) => {
          if (!loaded) console.warn("OpenFreeMap vector resource failed to load.", event.error);
        });
        glMap.once("load", () => {
          if (disposed) return;
          loaded = true;
          window.clearTimeout(loadTimeout);
          setVectorReady(true);
        });
      } catch (error) {
        if (disposed) return;
        window.clearTimeout(loadTimeout);
        console.warn("Unable to initialize OpenFreeMap; keeping raster fallback.", error);
        if (layer && map.hasLayer(layer)) map.removeLayer(layer);
      }
    };

    void mountVectorLayer();

    return () => {
      disposed = true;
      window.clearTimeout(loadTimeout);
      if (layer && map.hasLayer(layer)) map.removeLayer(layer);
    };
  }, [map]);

  return vectorReady ? null : (
    <TileLayer
      attribution={mapConfig.attribution}
      url={mapConfig.tileUrl}
    />
  );
}
