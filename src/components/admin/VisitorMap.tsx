import { useEffect, useRef } from "react";
import L from "leaflet";

// Fix default marker icon paths broken by bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface VisitorMapProps {
  lat: number;
  lon: number;
  label?: string;
  isGps?: boolean;
  accuracy?: number;
}

const VisitorMap = ({ lat, lon, label, isGps, accuracy }: VisitorMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || instanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [lat, lon],
      zoom: isGps ? 16 : 11,
      scrollWheelZoom: true,
      zoomControl: true,
    });

    instanceRef.current = map;

    // OpenStreetMap tiles — free, no API key
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Accuracy circle if GPS
    if (isGps && accuracy && accuracy > 0) {
      L.circle([lat, lon], {
        radius: accuracy,
        color: "#6366f1",
        fillColor: "#6366f1",
        fillOpacity: 0.12,
        weight: 2,
      }).addTo(map);
    }

    // Custom pulsing marker
    const pulseIcon = L.divIcon({
      html: `
        <div style="
          position: relative;
          width: 20px;
          height: 20px;
        ">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 20px;
            height: 20px;
            background: ${isGps ? "#10b981" : "#6366f1"};
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            z-index: 2;
          "></div>
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 36px;
            height: 36px;
            background: ${isGps ? "rgba(16,185,129,0.25)" : "rgba(99,102,241,0.25)"};
            border-radius: 50%;
            animation: pulse-ring 1.6s ease-out infinite;
          "></div>
        </div>
        <style>
          @keyframes pulse-ring {
            0% { transform: translate(-50%,-50%) scale(0.5); opacity: 1; }
            100% { transform: translate(-50%,-50%) scale(2); opacity: 0; }
          }
        </style>
      `,
      className: "",
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    const marker = L.marker([lat, lon], { icon: pulseIcon }).addTo(map);

    if (label) {
      marker.bindPopup(
        `<div style="font-family: Inter, sans-serif; font-size: 12px; min-width: 160px;">
          <div style="font-weight: 700; margin-bottom: 4px; color: #1e293b;">${label}</div>
          <div style="color: #64748b; font-size: 11px;">${lat.toFixed(5)}, ${lon.toFixed(5)}</div>
          ${isGps ? `<div style="margin-top: 4px; color: #10b981; font-size: 10px; font-weight: 600;">📡 GPS Precise ${accuracy ? `±${Math.round(accuracy)}m` : ""}</div>` : `<div style="margin-top: 4px; color: #6366f1; font-size: 10px; font-weight: 600;">🌐 IP-based location</div>`}
        </div>`,
        { closeButton: false }
      ).openPopup();
    }

    return () => {
      map.remove();
      instanceRef.current = null;
    };
  }, [lat, lon, isGps, accuracy, label]);

  return (
    <div
      ref={mapRef}
      style={{ height: "260px", width: "100%", borderRadius: "10px", overflow: "hidden" }}
    />
  );
};

export default VisitorMap;
