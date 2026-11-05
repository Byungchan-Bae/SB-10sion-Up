/** 두 좌표 사이 거리(m) — 하버사인 공식 */
export function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export type PositionError = "unsupported" | "denied" | "unavailable" | "timeout";

/** 현재 위치 한 번 받기 */
export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject("unsupported" satisfies PositionError);
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, (err) => {
      const code: PositionError =
        err.code === err.PERMISSION_DENIED ? "denied" : err.code === err.TIMEOUT ? "timeout" : "unavailable";
      reject(code);
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 });
  });
}

/** 1234 → "1.2km", 340 → "340m" */
export function formatDistance(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)}km` : `${Math.round(m)}m`;
}
