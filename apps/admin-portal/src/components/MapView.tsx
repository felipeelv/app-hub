import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

interface MapViewProps {
  address: string;
  cep?: string | null;
}

export function MapView({ address, cep }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setError(null);
    setLoading(true);

    if (!MAPBOX_TOKEN) {
      setError("Token do Mapbox não configurado.");
      setLoading(false);
      return;
    }

    if (!address) {
      setError("Endereço não informado.");
      setLoading(false);
      return;
    }

    const query = cep ? `${address}, ${cep}, Brazil` : `${address}, Brazil`;

    let cancelled = false;
    const abortController = new AbortController();

    (async () => {
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=1`,
          { signal: abortController.signal }
        );
        if (!res.ok) throw new Error("Geocoding request failed");
        const data = await res.json();
        const feature = data.features?.[0];
        if (!feature) {
          if (!cancelled) {
            setError("Não foi possível localizar o endereço no mapa.");
            setLoading(false);
          }
          return;
        }

        const [lng, lat] = feature.center as [number, number];

        if (cancelled || !mapContainer.current) return;

        mapboxgl.accessToken = MAPBOX_TOKEN;
        const map = new mapboxgl.Map({
          container: mapContainer.current,
          style: "mapbox://styles/mapbox/streets-v12",
          center: [lng, lat],
          zoom: 15,
        });

        new mapboxgl.Marker({ color: "#e11d48" })
          .setLngLat([lng, lat])
          .addTo(map);

        map.addControl(new mapboxgl.NavigationControl(), "top-right");

        map.on("load", () => {
          if (!cancelled) setLoading(false);
        });

        map.on("error", () => {
          if (!cancelled) {
            setError("Erro ao carregar o mapa.");
            setLoading(false);
          }
        });

        mapRef.current = map;
      } catch (e) {
        if (!cancelled && !(e instanceof DOMException && e.name === "AbortError")) {
          setError("Erro ao carregar o mapa.");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      abortController.abort();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [address, cep]);

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-muted/50 p-4 text-sm text-muted-foreground text-center">
        {error}
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-border" style={{ height: 300 }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/60 z-10">
          <span className="text-sm text-muted-foreground">Carregando mapa…</span>
        </div>
      )}
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}
