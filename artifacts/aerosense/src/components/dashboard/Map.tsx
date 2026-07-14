import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useListWards } from "@workspace/api-client-react";
import { getAqiHex } from "@/lib/utils";

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export function DashboardMap({
  onSelectWard,
  selectedWardId,
}: {
  onSelectWard: (id: number) => void;
  selectedWardId: number | null;
}) {
  const { data: wards = [], isLoading } = useListWards({ city: "Chennai" });

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-card">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground font-mono text-sm">LOADING SENSOR MESH...</p>
        </div>
      </div>
    );
  }

  const center: [number, number] = [13.0827, 80.2707]; // Chennai

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        center={center}
        zoom={11}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <MapUpdater center={center} />

        {wards.map((ward) => {
          const isSelected = ward.id === selectedWardId;
          const color = getAqiHex(ward.aqiCategory);
          return (
            <CircleMarker
              key={ward.id}
              center={[ward.lat, ward.lng]}
              radius={isSelected ? 16 : 10}
              pathOptions={{
                fillColor: color,
                color: isSelected ? "#fff" : color,
                weight: isSelected ? 3 : 1,
                opacity: 1,
                fillOpacity: isSelected ? 0.9 : 0.7,
              }}
              eventHandlers={{
                click: () => onSelectWard(ward.id),
              }}
            >
              <Popup className="font-sans">
                <div className="font-medium">{ward.name}</div>
                <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                  AQI: <span className="font-mono font-bold" style={{ color }}>{ward.currentAqi}</span> ({ward.aqiCategory})
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
