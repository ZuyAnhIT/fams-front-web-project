const DEVICE_ID_STORAGE_KEY = "fams_device_id";

/** Trả về deviceId ổn định cho cùng một trình duyệt, đúng contract auth backend. */
export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "web-server";

  const existing = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY);
  if (existing) return existing;

  const randomPart = typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const browser = /Edg\//.test(navigator.userAgent)
    ? "edge"
    : /Firefox\//.test(navigator.userAgent)
      ? "firefox"
      : /Chrome\//.test(navigator.userAgent)
        ? "chrome"
        : /Safari\//.test(navigator.userAgent)
          ? "safari"
          : "browser";
  const navigatorWithHints = navigator as Navigator & { userAgentData?: { platform?: string } };
  const platform = (navigatorWithHints.userAgentData?.platform || navigator.platform || "device")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "device";
  const deviceId = `web-${browser}-${platform}-${randomPart.slice(0, 8)}`;
  window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
  return deviceId;
}
