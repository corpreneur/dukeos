import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

export const statusColors: Record<string, string> = {
  scheduled: "hsl(142, 71%, 45%)",
  in_progress: "hsl(38, 92%, 50%)",
  completed: "hsl(215, 20%, 65%)",
  cancelled: "hsl(0, 84%, 60%)",
};

const createNumberedIcon = (num: number, color: string) =>
  L.divIcon({
    className: "custom-marker",
    html: `<div style="background:${color};color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:13px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);">${num}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

interface RouteMapProps {
  defaultCenter: [number, number];
  positions: [number, number][];
  displayJobs: any[];
  optimizedRoute: {
    legs: { distance: number; duration: number }[];
    geometry: [number, number][];
  } | null;
  getTechName: (id: string) => string;
  techColorMap: Record<string, string>;
}

const RouteMap = ({ defaultCenter, positions, displayJobs, optimizedRoute, getTechName, techColorMap }: RouteMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return; // already initialized

    // Always initialize centered on DFW area
    const DFW_CENTER: [number, number] = [33.10, -96.75];
    mapRef.current = L.map(containerRef.current).setView(DFW_CENTER, 10);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update markers and route line when data changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing layers (markers + polylines)
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    // Add markers
    displayJobs.forEach((job: any, idx: number) => {
      const marker = L.marker(
        [Number(job.service_addresses.lat), Number(job.service_addresses.lng)],
        { icon: createNumberedIcon(idx + 1, techColorMap[job.technician_id] || statusColors[job.status] || "#666") }
      ).addTo(map);

      let popupHtml = `<div style="font-size:13px;">
        <div style="font-weight:bold;">Stop ${idx + 1}</div>
        <div>${job.service_addresses.street}</div>
        <div>${job.service_addresses.city}, ${job.service_addresses.state}</div>
        <div style="margin-top:4px;font-size:11px;">Plan: ${job.subscriptions?.plan || "—"}</div>
        <div style="font-size:11px;">Tech: ${getTechName(job.technician_id)}</div>`;

      if (optimizedRoute?.legs[idx]) {
        popupHtml += `<div style="margin-top:4px;font-size:11px;color:#888;">→ Next: ${(optimizedRoute.legs[idx].distance / 1609.34).toFixed(1)} mi, ${Math.round(optimizedRoute.legs[idx].duration / 60)} min</div>`;
      }
      popupHtml += `</div>`;
      marker.bindPopup(popupHtml);
    });

    // Add route polyline
    if (optimizedRoute?.geometry && optimizedRoute.geometry.length > 0) {
      L.polyline(optimizedRoute.geometry, {
        color: "hsl(142, 71%, 45%)",
        weight: 4,
        opacity: 0.8,
      }).addTo(map);
    }

    // Fit bounds
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions.map(([lat, lng]) => [lat, lng] as L.LatLngExpression));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [displayJobs, optimizedRoute, positions, getTechName, techColorMap]);

  return <div ref={containerRef} style={{ height: 500, width: "100%" }} />;
};

export default RouteMap;
