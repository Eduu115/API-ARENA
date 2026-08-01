import { useEffect, useState } from "react";
import { getMyCapabilities } from "../../lib/adminApi";

const ALL_CAPS = ["MODERATION", "BI"];

/**
 * Capabilities of the signed-in admin. Fetched per mount (caps rarely change
 * mid-session; a reload refreshes them). `supreme` = holds every capability.
 * ponytail: no cross-page cache; two admin pages fetching once each is cheap.
 */
export function useAdminCaps() {
  const [caps, setCaps] = useState(null);
  useEffect(() => {
    getMyCapabilities()
      .then(setCaps)
      .catch(() => setCaps([]));
  }, []);
  const list = caps ?? [];
  return {
    loading: caps === null,
    canModerate: list.includes("MODERATION"),
    supreme: ALL_CAPS.every((c) => list.includes(c)),
  };
}
