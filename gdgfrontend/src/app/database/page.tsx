"use client";

import { useEffect, useRef, useState } from "react";
import type L from "leaflet";

/* ================= TYPES ================= */
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;

export interface ReportedItem {
  id: string;
  itemName: string;
  location: string;
  locationDescription?: string;
  images: string[];
  timestamp: string;
  type: "lost" | "found";
}

interface ApiItem {
  name?: string;
  thumbnail?: string;
}

interface ItemsApiResponse {
  items?: ApiItem[];
}

/* ================= ITEM CARD ================= */

function ItemCard({
  image,
  title,
  description,
  onSeeMore,
}: {
  image: string;
  title: string;
  description: string;
  onSeeMore: () => void;
}) {
  return (
    <div
      onClick={onSeeMore}
      className="bg-[#0F172A] w-full max-w-sm rounded-[20px] overflow-hidden shadow-lg border border-white/10 cursor-pointer hover:scale-[1.02] transition-transform active:scale-[0.98]"
    >
      <img
        src={image}
        alt={title}
        className="w-full h-[180px] object-cover bg-slate-800"
        onError={(e) => {
          e.currentTarget.src =
            "https://via.placeholder.com/400x300?text=No+Image";
        }}
      />
      <div className="p-4 space-y-2">
        <h3 className="font-[family-name:var(--font-jersey-10)] text-[22px] text-white">
          {title}
        </h3>
        <p className="text-sm text-white/60">{description}</p>
        <p className="text-xs text-emerald-400 uppercase tracking-wide">
          Tap to view details
        </p>
      </div>
    </div>
  );
}

/* ================= ITEM DETAIL MODAL ================= */

function ItemDetailModal({
  item,
  onClose,
}: {
  item: ReportedItem;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-[#1E293B] w-full max-w-lg rounded-[20px] shadow-2xl border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="font-[family-name:var(--font-jersey-10)] text-[26px] text-white">
            {item.itemName}
          </h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto p-4">
          {item.images.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`item-${i}`}
              className="h-[140px] w-[140px] object-cover rounded-[12px] bg-slate-700"
            />
          ))}
        </div>

        <div className="p-4 space-y-2 text-white/80 text-sm">
          <p>
            <span className="text-white font-semibold">Status:</span>{" "}
            {item.type === "lost" ? "Lost" : "Found"}
          </p>
          <p>
            <span className="text-white font-semibold">Location:</span>{" "}
            {item.location}
          </p>
          <p className="text-xs text-white/40">
            Reported on {new Date(item.timestamp).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ================= DASHBOARD ================= */

export default function Dashboard() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  const [items, setItems] = useState<ReportedItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ReportedItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* -------- FETCH DATA -------- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/items-list`);

        const data: ItemsApiResponse = await res.json();

        const transformed: ReportedItem[] = (data.items ?? []).map(
          (item, index) => ({
            id: item.name ?? `item-${index}`,
            itemName: item.name ?? "Unknown Item",
            location: "RV University",
            images: [
              item.thumbnail ??
                "https://via.placeholder.com/400x300?text=No+Image",
            ],
            timestamp: new Date().toISOString(),
            type: "found",
          })
        );

        setItems(transformed);
      } catch (e) {
        setError("Failed to load items");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /* -------- MAP INIT (ONCE) -------- */
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    import("leaflet").then((L) => {
      interface LeafletIconPrototype {
        _getIconUrl?: () => string;
      }

      const iconProto = L.Icon.Default
        .prototype as unknown as LeafletIconPrototype;

      delete iconProto._getIconUrl;

      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
      });

      const map = L.map(mapContainerRef.current!, {
        center: [12.9249, 77.498],
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        { subdomains: "abcd", maxZoom: 20 }
      ).addTo(map);

      markersRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  /* -------- MARKERS UPDATE -------- */
  useEffect(() => {
    if (!mapRef.current || !markersRef.current) return;

    import("leaflet").then((L) => {
      markersRef.current!.clearLayers();

      items.forEach((item) => {
        const lat = 12.9249 + (Math.random() - 0.5) * 0.01;
        const lng = 77.498 + (Math.random() - 0.5) * 0.01;

        L.marker([lat, lng])
          .addTo(markersRef.current!)
          .on("click", () => setSelectedItem(item));
      });
    });
  }, [items]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1E293B] text-white">
        Loading campus database…
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1E293B] text-red-400">
        {error}
      </div>
    );

  return (
    <div className="bg-[#1E293B] min-h-screen overflow-y-auto">
      <div className="relative h-[400px] w-full">
        <div
          ref={mapContainerRef}
          className="absolute inset-0 rounded-b-[20px]"
        />
      </div>

      <div className="px-6 flex flex-col items-center space-y-6 pb-32 -mt-20">
        {items.map((item) => (
          <ItemCard
            key={item.id}
            image={item.images[0]}
            title={item.itemName}
            description={`Found at ${item.location}`}
            onSeeMore={() => setSelectedItem(item)}
          />
        ))}
      </div>

      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}
