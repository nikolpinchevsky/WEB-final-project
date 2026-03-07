"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Polyline, useMap } from "react-leaflet";
import L from "leaflet";

type LatLng = { lat: number; lng: number };

function FitToRoute({ points }: { points: LatLng[] }) {
  const map = useMap();

  useEffect(() => {
    if (!points?.length) return;

    const latlngs = points.map((p) => L.latLng(p.lat, p.lng));
    const bounds = L.latLngBounds(latlngs);

    map.fitBounds(bounds, { padding: [30, 30] });
  }, [points, map]);

  return null;
}

export default function MapView({ points }: { points: LatLng[] }) {
  const center: [number, number] = points?.length
    ? [points[0].lat, points[0].lng]
    : [32.0853, 34.7818]; 

  const polyline: [number, number][] = (points || []).map((p) => [p.lat, p.lng]);

  return (
    <MapContainer center={center} zoom={12} scrollWheelZoom style={{ height: 420, width: "100%", borderRadius: 16 }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {polyline.length >= 2 && <Polyline positions={polyline} />}

      {points?.length ? <FitToRoute points={points} /> : null}
    </MapContainer>
  );
}