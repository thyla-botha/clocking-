export type Coords = {
  lat: number;
  lng: number;
  accuracy: number;
};

export class GeoError extends Error {
  code: 'denied' | 'unavailable' | 'timeout' | 'unsupported';
  constructor(code: GeoError['code'], message: string) {
    super(message);
    this.code = code;
  }
}

export function getPosition(): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new GeoError('unsupported', 'Geolocation is not supported on this device.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new GeoError('denied', 'Location permission is required to clock in or out.'));
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          reject(new GeoError('unavailable', 'Could not determine your location.'));
        } else {
          reject(new GeoError('timeout', 'Timed out trying to read your location.'));
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  });
}

export function mapsLink(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}
