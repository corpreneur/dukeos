/**
 * Geocode an address using the free Nominatim (OpenStreetMap) API.
 * Returns { lat, lng } or null if not found.
 * Rate limit: max 1 req/sec — use only on address save, not in loops.
 */
export async function geocodeAddress(
  street: string,
  city: string,
  state: string,
  zip: string
): Promise<{ lat: number; lng: number } | null> {
  const query = encodeURIComponent(`${street}, ${city}, ${state} ${zip}`);
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
      { headers: { "User-Agent": "DukeOS/1.0" } }
    );
    const data = await res.json();
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    return null;
  } catch {
    return null;
  }
}
