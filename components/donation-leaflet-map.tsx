"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

/** Enquadramento mínimo ao focar um local clicado (nível de rua/bairro). */
const FOCUS_ZOOM = 15;

function allPoints(centers: CenterWithDistance[], reference: PositionReference | null): [number, number][] {
  const points: [number, number][] = centers.map((c) => [c.coordinates.latitude, c.coordinates.longitude]);
  if (reference) points.push([reference.latitude, reference.longitude]);
  return points;
}

/**
 * Controla o enquadramento do mapa:
 * - mostra todos os locais visíveis quando a lista muda (filtros, nova busca);
 * - aproxima no local escolhido quando o usuário clica num card ou num pino;
 * - reajusta o mapa quando ele muda de tamanho — em especial no celular, onde
 *   o mapa nasce escondido atrás da aba "Lista" (tamanho zero) e só aparece
 *   ao tocar em "Mapa". Sem esse reajuste o Leaflet acha que o mapa tem 0×0 px
 *   e desenha todos os pinos fora da área visível.
 */
function MapController({
  centers,
  reference,
  selectedCenter,
}: {
  centers: CenterWithDistance[];
  reference: PositionReference | null;
  selectedCenter: CenterWithDistance | undefined;
}) {
  const map = useMap();
  // Só aproxima no selecionado depois que o usuário escolheu algum local —
  // na abertura da página o mapa mostra a região inteira.
  const userPicked = useRef(false);
  const firstSelection = useRef(true);
  const latest = useRef({ centers, reference, selectedCenter });
  useEffect(() => {
    latest.current = { centers, reference, selectedCenter };
  });

  const frame = () => {
    const { centers: cs, reference: ref, selectedCenter: sel } = latest.current;
    const size = map.getSize();
    if (size.x === 0 || size.y === 0) return; // ainda escondido
    if (userPicked.current && sel) {
      map.setView([sel.coordinates.latitude, sel.coordinates.longitude], Math.max(map.getZoom(), FOCUS_ZOOM), { animate: false });
      return;
    }
    const points = allPoints(cs, ref);
    if (points.length === 0) return;
    if (points.length === 1) map.setView(points[0], 14, { animate: false });
    else map.fitBounds(L.latLngBounds(points), { padding: [28, 28], maxZoom: 15, animate: false });
  };

  // Lista de locais ou referência mudaram → volta a mostrar todos.
  useEffect(() => {
    userPicked.current = false;
    frame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centers, reference]);

  // Usuário escolheu um local → aproxima nele.
  useEffect(() => {
    if (firstSelection.current) {
      firstSelection.current = false;
      return;
    }
    if (!selectedCenter) return;
    userPicked.current = true;
    const size = map.getSize();
    if (size.x === 0 || size.y === 0) return; // mapa escondido: enquadra quando aparecer
    map.flyTo([selectedCenter.coordinates.latitude, selectedCenter.coordinates.longitude], Math.max(map.getZoom(), FOCUS_ZOOM), { duration: 0.6 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCenter?.id]);

  // Mapa mudou de tamanho (apareceu, girou a tela, redimensionou a janela).
  useEffect(() => {
    const container = map.getContainer();
    let wasHidden = container.clientWidth === 0 || container.clientHeight === 0;
    const observer = new ResizeObserver(() => {
      const hidden = container.clientWidth === 0 || container.clientHeight === 0;
      if (hidden) {
        wasHidden = true;
        return;
      }
      map.invalidateSize({ animate: false });
      if (wasHidden) {
        wasHidden = false;
        frame();
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

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
      <MapController centers={centers} reference={reference} selectedCenter={selectedCenter} />
      {centers.map((c, i) => (
        <Marker
          key={c.id}
          position={[c.coordinates.latitude, c.coordinates.longitude]}
          icon={buildCenterIcon(i, c.id === selected)}
          // O pino selecionado fica sempre por cima dos vizinhos.
          zIndexOffset={c.id === selected ? 1000 : 0}
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
