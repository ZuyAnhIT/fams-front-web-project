import { publicEnv } from "@/config/env";

export const mapConfig = Object.freeze({
  tileUrl: publicEnv.NEXT_PUBLIC_MAP_TILE_URL,
  attribution: publicEnv.NEXT_PUBLIC_MAP_ATTRIBUTION,
});
