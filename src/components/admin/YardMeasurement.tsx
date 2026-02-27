import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ruler, Pencil, Save, RotateCcw, MapPin } from "lucide-react";
import { toast } from "sonner";
import L from "leaflet";

interface YardMeasurementProps {
  addressId: string;
  lat?: number | null;
  lng?: number | null;
  savedSqft?: number | null;
}

// Calculate polygon area in square feet using the Shoelace formula on lat/lng
function calcPolygonAreaSqft(points: L.LatLng[]): number {
  if (points.length < 3) return 0;
  // Convert to meters using a simple equirectangular projection
  const toMeters = (lat: number, lng: number, refLat: number, refLng: number) => {
    const latRad = (refLat * Math.PI) / 180;
    const x = (lng - refLng) * (Math.PI / 180) * 6371000 * Math.cos(latRad);
    const y = (lat - refLat) * (Math.PI / 180) * 6371000;
    return { x, y };
  };
  const refLat = points[0].lat;
  const refLng = points[0].lng;
  const meters = points.map(p => toMeters(p.lat, p.lng, refLat, refLng));

  // Shoelace
  let area = 0;
  for (let i = 0; i < meters.length; i++) {
    const j = (i + 1) % meters.length;
    area += meters[i].x * meters[j].y;
    area -= meters[j].x * meters[i].y;
  }
  area = Math.abs(area) / 2;
  // Convert m² to ft²
  return Math.round(area * 10.7639);
}

const YardMeasurement = ({ addressId, lat, lng, savedSqft }: YardMeasurementProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polygonRef = useRef<L.Polygon | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [points, setPoints] = useState<L.LatLng[]>([]);
  const [sqft, setSqft] = useState<number>(savedSqft || 0);
  const [saving, setSaving] = useState(false);

  const center: [number, number] = lat && lng ? [lat, lng] : [33.1972, -96.6397]; // default McKinney

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const map = L.map(mapRef.current, {
      center,
      zoom: 19,
      zoomControl: true,
    });
    // Use satellite-style tile (Esri World Imagery)
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      attribution: "Esri",
      maxZoom: 20,
    }).addTo(map);

    // Property marker
    L.marker(center).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  const handleMapClick = useCallback((e: L.LeafletMouseEvent) => {
    const newPoints = [...points, e.latlng];
    setPoints(newPoints);

    const map = mapInstanceRef.current!;

    // Add vertex marker
    const marker = L.circleMarker(e.latlng, {
      radius: 6,
      fillColor: "hsl(var(--primary))",
      color: "#fff",
      weight: 2,
      fillOpacity: 1,
    }).addTo(map);
    markersRef.current.push(marker);

    // Update polygon
    if (polygonRef.current) map.removeLayer(polygonRef.current);
    if (newPoints.length >= 3) {
      polygonRef.current = L.polygon(newPoints, {
        color: "hsl(var(--primary))",
        fillColor: "hsl(var(--primary))",
        fillOpacity: 0.25,
        weight: 2,
      }).addTo(map);
      setSqft(calcPolygonAreaSqft(newPoints));
    }
  }, [points]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (drawing) {
      map.getContainer().style.cursor = "crosshair";
      map.on("click", handleMapClick);
    } else {
      map.getContainer().style.cursor = "";
      map.off("click", handleMapClick);
    }
    return () => { map.off("click", handleMapClick); };
  }, [drawing, handleMapClick]);

  const startDrawing = () => {
    clearPolygon();
    setDrawing(true);
  };

  const clearPolygon = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (polygonRef.current) { map.removeLayer(polygonRef.current); polygonRef.current = null; }
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];
    setPoints([]);
    setSqft(0);
  };

  const stopDrawing = () => {
    setDrawing(false);
  };

  const saveMeasurement = async () => {
    if (sqft === 0) return toast.error("Draw a polygon first");
    setSaving(true);
    const { error } = await supabase
      .from("service_addresses")
      .update({ yard_size_sqft: sqft })
      .eq("id", addressId);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Yard size saved: ${sqft.toLocaleString()} sq ft`);
    }
    setSaving(false);
    setDrawing(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-base flex items-center gap-2">
          <Ruler className="h-4 w-4 text-primary" />
          Property Map & Yard Measurement
          {(savedSqft || sqft > 0) && (
            <Badge variant="outline" className="ml-auto gap-1">
              <MapPin className="h-3 w-3" />
              {(sqft || savedSqft || 0).toLocaleString()} sq ft
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div ref={mapRef} className="h-[300px] rounded-lg border border-border overflow-hidden" />

        <div className="flex items-center gap-2">
          {!drawing ? (
            <Button size="sm" variant="outline" onClick={startDrawing} className="gap-2">
              <Pencil className="h-3 w-3" /> Measure Yard
            </Button>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={stopDrawing} className="gap-2">
                Done Drawing
              </Button>
              <Button size="sm" variant="ghost" onClick={clearPolygon} className="gap-2">
                <RotateCcw className="h-3 w-3" /> Reset
              </Button>
            </>
          )}
          {sqft > 0 && (
            <Button size="sm" onClick={saveMeasurement} disabled={saving} className="gap-2 ml-auto">
              <Save className="h-3 w-3" /> Save ({sqft.toLocaleString()} ft²)
            </Button>
          )}
        </div>

        {drawing && (
          <p className="text-xs text-muted-foreground">
            Click on the map to place polygon vertices around the serviceable yard area. Place at least 3 points.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default YardMeasurement;
