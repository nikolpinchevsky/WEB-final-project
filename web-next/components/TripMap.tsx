"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";

type Props = {
  geoJson: any;
  center?: [number, number]; // [lat, lon]
  zoom?: number;
};

function Recenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);

  return null;
}

export default function TripMap({ geoJson, center = [52.52, 13.405], zoom = 11 }: Props) {
  return (
    <div
      style={{
        height: 420,
        width: "100%",
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid #ddd",
      }}
    >
      <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }}>
        <Recenter center={center} zoom={zoom} />

        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {geoJson ? <GeoJSON data={geoJson} /> : null}
      </MapContainer>
    </div>
  );
}