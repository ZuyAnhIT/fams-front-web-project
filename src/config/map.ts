import { publicEnv } from "@/config/env";

export const mapConfig = Object.freeze({
  styleUrl: publicEnv.NEXT_PUBLIC_MAP_STYLE_URL,
  workerUrl: publicEnv.NEXT_PUBLIC_MAP_WORKER_URL,
  tileUrl: publicEnv.NEXT_PUBLIC_MAP_TILE_URL,
  attribution: publicEnv.NEXT_PUBLIC_MAP_ATTRIBUTION,
});
