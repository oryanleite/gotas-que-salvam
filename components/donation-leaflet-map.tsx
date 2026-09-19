"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { DonationCenter } from "@/lib/donation-centers";

type CenterWithDistance = DonationCenter & { distance: number | null };
type PositionReference = {
  latitude: number;
  longitude: number;
  label: string;
  neighborhood?: string;
  source: "gps" | "manual" | "cep";
};

// Centro aproximado da Região Metropolitana de São Paulo, usado quando ainda
// não há uma localização de referência do usuário.
const SP_CENTER: [number, number] = [-23.5613, -46.6565];

function buildCenterIcon(index: number, isSelected: boolean) {
  return L.divIcon({
    className: "leaflet-custom-icon",
    html: `<div class="leaflet-center-pin${isSelected ? " selected" : ""}"><span>${index + 1}</span></div>`,
    iconSize: [27, 33],
    iconAnchor: [13.5, 33],
    popupAnchor: [0, -30],
  });
}

const userIcon = L.divIcon({
  className: "leaflet-custom-icon",
  html: `<div class="leaflet-user-pin"><i></i></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -12],
});

/** Ajusta o enquadramento do mapa sempre que a lista de locais visíveis ou a
 * localização de referência mudarem (ex.: usuário aplicou um filtro). */
function FitBounds({
  centers,
  reference,
}: {
  centers: CenterWithDistance[];
  reference: PositionReference | null;
}) {
  const map = useMap();
  useEffect(() => {
    const points: [number, number][] = centers.map((c) => [
      c.coordinates.latitude,
      c.coordinates.longitude,
    ]);
    if (reference) points.push([reference.latitude, reference.longitude]);
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 14);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [28, 28], maxZoom: 15 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centers, reference]);
  return null;
}

/** Centraliza suavemente no local selecionado (clique na lista ou no mapa). */
function PanToSelected({ center }: { center: CenterWithDistance | undefined }) {
  const map = useMap();
  useEffect(() => {
    if (!center) return;
    map.panTo([center.coordinates.latitude, center.coordinates.longitude], { animate: true });
  }, [center, map]);
  return null;
}

export default function DonationLeafletMap({
  centers,
  selected,
  onSelect,
  onDetails,
  reference,
}: {
  centers: CenterWithDistance[];
  selected: string;
  onSelect: (id: string) => void;
  onDetails: (center: CenterWithDistance) => void;
  reference: PositionReference | null;
}) {
  const selectedCenter = useMemo(() => centers.find((c) => c.id === selected), [centers, selected]);
  // Leaflet só lê a prop `center` no primeiro render (o mapa é depois
  // controlado via FitBounds/PanToSelected), então um estado inicial
  // "congelado" com useState é suficiente e evita ler refs durante o render.
  const [initialCenter] = useState<[number, number]>(() =>
    reference ? [reference.latitude, reference.longitude] : SP_CENTER
  );

  return (
    <MapContainer
      center={initialCenter}
      zoom={12}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
        maxZoom={19}
      />
      <FitBounds centers={centers} reference={reference} />
      <PanToSelected center={selectedCenter} />
      {centers.map((c, i) => (
        <Marker
          key={c.id}
          position={[c.coordinates.latitude, c.coordinates.longitude]}
          icon={buildCenterIcon(i, c.id === selected)}
          eventHandlers={{ click: () => onSelect(c.id) }}
        >
          <Popup>
            <strong>{c.name}</strong>
            <br />
            {c.fullAddress}
            <br />
            <button
              type="button"
              onClick={() => onDetails(c)}
              className="leaflet-popup-details-button"
            >
              Ver detalhes
            </button>
          </Popup>
        </Marker>
      ))}
      {reference && (
        <Marker position={[reference.latitude, reference.longitude]} icon={userIcon}>
          <Popup>Referência aproximada: {reference.label}</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
