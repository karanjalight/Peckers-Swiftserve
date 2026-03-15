"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import type { MapVisit } from "@/app/api/mr/map-visits/route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Clock, Building2, User, ExternalLink, Loader2 } from "lucide-react";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER: [number, number] = [-1.2921, 36.782]; // Kenya
const DEFAULT_ZOOM = 6;

function createMarkerIcon(status: string) {
  const color = status === "SUBMITTED" ? "#0ea5e9" : "#f59e0b";
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width: 28px; height: 28px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { dateStyle: "medium" }) + " " + d.toLocaleTimeString(undefined, { timeStyle: "short" });
}

function VisitsMap({ visits }: { visits: MapVisit[] }) {
  const hasVisits = visits.length > 0;
  const center: [number, number] = hasVisits
    ? [visits[0].gps_lat, visits[0].gps_lng]
    : DEFAULT_CENTER;

  return (
    <MapContainer
      center={center}
      zoom={DEFAULT_ZOOM}
      className="h-full w-full min-h-[420px] rounded-2xl z-[1]"
      scrollWheelZoom={true}
      style={{ background: "var(--map-bg, #e0e7ef)" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {visits.map((v) => (
        <Marker
          key={v.id}
          position={[v.gps_lat, v.gps_lng]}
          icon={createMarkerIcon(v.status)}
        >
          <Popup maxWidth={320} minWidth={260} className="visit-popup">
            <div className="space-y-2 text-left">
              <p className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                {v.pharmacy_name}
              </p>
              {v.pharmacy_region && (
                <p className="text-sm text-slate-600 dark:text-slate-400">{v.pharmacy_region}</p>
              )}
              <p className="text-xs text-slate-500 dark:text-slate-500 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {formatDate(v.check_in_time)}
              </p>
              {v.visit_duration_minutes != null && (
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  Duration: {v.visit_duration_minutes} min
                </p>
              )}
              {v.mr_name && (
                <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  {v.mr_name}
                </p>
              )}
              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                {v.status}
              </span>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-600">
                <Button asChild size="sm" className="w-full">
                  <Link href={`/mr/visit/${v.id}`} className="inline-flex items-center gap-2">
                    <ExternalLink className="h-3.5 w-3.5" />
                    View visit
                  </Link>
                </Button>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export function MrVisitsMapClient() {
  const [visits, setVisits] = useState<MapVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    fetch("/api/mr/map-visits")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.visits) setVisits(data.visits);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mounted]);

  if (!mounted) {
    return (
      <Card className="overflow-hidden border-slate-200 dark:border-slate-700 rounded-2xl">
        <CardContent className="flex items-center justify-center min-h-[420px] bg-slate-100 dark:bg-slate-800/50">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="overflow-hidden border-slate-200 dark:border-slate-700 rounded-2xl">
        <CardContent className="flex flex-col items-center justify-center min-h-[420px] gap-3 bg-slate-50 dark:bg-slate-800/50">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-slate-600 dark:text-slate-400">Loading visits…</p>
        </CardContent>
      </Card>
    );
  }

  const withCoords = visits.filter((v) => v.gps_lat != null && v.gps_lng != null);

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 text-white py-5 dark:from-slate-900 dark:to-slate-950">
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            <MapPin className="h-5 w-5 text-blue-300" />
            Visit map
          </CardTitle>
          <p className="text-sm text-slate-300 dark:text-slate-400">
            {withCoords.length} visit{withCoords.length !== 1 ? "s" : ""} with coordinates. Click a marker to see details and open the visit.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative h-[min(70vh,560px)] w-full">
            <VisitsMap visits={withCoords} />
          </div>
        </CardContent>
      </Card>
      {withCoords.length === 0 && (
        <Card className="rounded-2xl border-slate-200 dark:border-slate-700">
          <CardContent className="py-12 text-center">
            <MapPin className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
            <p className="mt-3 font-medium text-slate-700 dark:text-slate-300">No visits with location yet</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Visits with GPS coordinates will appear here when reps check in from the field.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
