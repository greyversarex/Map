import { useState, useMemo } from "react";
import Map, { Marker, Popup, NavigationControl, FullscreenControl, ScaleControl, Source, Layer } from "react-map-gl/maplibre";
import type { LineLayer } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useLocations } from "@/hooks/use-locations";
import { NavUser } from "@/components/nav-user";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, MapPin, Map as MapIcon, Layers } from "lucide-react";
import { type Location } from "@shared/schema";
import { tajikistanOSMBorder } from "@/data/tajikistan-accurate";

type MapStyleType = 'osm' | 'minimal';

const MAP_STYLES = {
  osm: {
    name: 'Цветная',
    style: {
      version: 8 as const,
      sources: {
        'osm': {
          type: 'raster' as const,
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors'
        }
      },
      layers: [{
        id: 'osm-layer',
        type: 'raster' as const,
        source: 'osm',
        minzoom: 0,
        maxzoom: 19
      }]
    }
  },
  minimal: {
    name: 'Минимал',
    style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
  }
};

const TAJIKISTAN_VIEWSTATE = {
  longitude: 71.2761,
  latitude: 38.8610,
  zoom: 6.5,
  pitch: 45,
  bearing: 0
};

const borderLineLayer: LineLayer = {
  id: 'tajikistan-border-line',
  type: 'line',
  source: 'tajikistan-border',
  paint: {
    'line-color': '#dc2626',
    'line-width': 3,
    'line-opacity': 1
  }
};

export default function MapPage() {
  const { data: locations, isLoading } = useLocations();
  const [popupInfo, setPopupInfo] = useState<Location | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [mapStyle, setMapStyle] = useState<MapStyleType>('osm');

  const markers = useMemo(() => locations?.map((location) => (
    <Marker
      key={location.id}
      longitude={location.lng}
      latitude={location.lat}
      anchor="bottom"
      onClick={e => {
        // Prevent map click
        e.originalEvent.stopPropagation();
        setSelectedLocation(location);
        setPopupInfo(null);
      }}
    >
      <div 
        className="group relative cursor-pointer"
        onMouseEnter={() => setPopupInfo(location)}
        onMouseLeave={() => setPopupInfo(null)}
      >
        <div className="marker-pulse absolute -inset-4 z-0"></div>
        <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background shadow-lg border-2 border-primary transition-transform group-hover:scale-110">
          <MapPin className="h-4 w-4 text-foreground" />
        </div>
      </div>
    </Marker>
  )), [locations]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <h2 className="text-xl font-display tracking-widest">LOADING MAP</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      {/* Header Overlay */}
      <div className="pointer-events-none absolute left-0 top-0 z-50 flex w-full items-center justify-between p-6 bg-gradient-to-b from-black/80 to-transparent">
        <div className="pointer-events-auto">
          <h1 className="font-display text-4xl font-bold text-white tracking-wider drop-shadow-lg">
            TAJIKISTAN
          </h1>
          <p className="text-white/60 text-sm font-light tracking-widest mt-1">INTERACTIVE 3D MAP</p>
        </div>
        <div className="pointer-events-auto">
          <NavUser />
        </div>
      </div>

      {/* Map Style Switcher */}
      <div className="absolute right-4 top-24 z-50 flex flex-col gap-1 rounded-lg bg-background/90 backdrop-blur-sm p-1 shadow-lg border border-border">
        <button
          onClick={() => setMapStyle('osm')}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            mapStyle === 'osm' 
              ? 'bg-primary text-primary-foreground' 
              : 'hover:bg-muted text-foreground'
          }`}
          data-testid="button-style-osm"
        >
          <MapIcon className="h-4 w-4" />
          Цветная
        </button>
        <button
          onClick={() => setMapStyle('minimal')}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            mapStyle === 'minimal' 
              ? 'bg-primary text-primary-foreground' 
              : 'hover:bg-muted text-foreground'
          }`}
          data-testid="button-style-minimal"
        >
          <Layers className="h-4 w-4" />
          Минимал
        </button>
      </div>

      <Map
        initialViewState={TAJIKISTAN_VIEWSTATE}
        style={{ width: "100%", height: "100%" }}
        mapStyle={MAP_STYLES[mapStyle].style}
        mapLib={maplibregl}
        terrain={{ source: 'terrain', exaggeration: 1.5 }}
      >
        <NavigationControl position="bottom-right" />
        <FullscreenControl position="bottom-right" />
        <ScaleControl position="bottom-left" />

        <Source id="tajikistan-border" type="geojson" data={tajikistanOSMBorder}>
          <Layer {...borderLineLayer} />
        </Source>

        {markers}

        {popupInfo && (
          <Popup
            anchor="top"
            longitude={popupInfo.lng}
            latitude={popupInfo.lat}
            closeButton={false}
            closeOnClick={false}
            offset={40}
            className="z-50"
          >
            <div className="bg-background px-3 py-2 rounded shadow-xl border border-border">
              <p className="font-bold text-sm text-foreground">{popupInfo.name}</p>
            </div>
          </Popup>
        )}
      </Map>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLocation} onOpenChange={(open) => !open && setSelectedLocation(null)}>
        <DialogContent className="max-w-3xl bg-background/95 backdrop-blur-xl border-white/10 text-foreground">
          <DialogHeader>
            <DialogTitle className="font-display text-3xl tracking-wide">{selectedLocation?.name}</DialogTitle>
            <DialogDescription className="text-base text-muted-foreground/80">
              {selectedLocation?.lat.toFixed(4)}° N, {selectedLocation?.lng.toFixed(4)}° E
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 space-y-6">
            {selectedLocation?.imageUrl && (
              <div className="overflow-hidden rounded-lg border border-white/10 shadow-2xl">
                 {/* Scenic landscape of Tajikistan mountains */}
                <img 
                  src={selectedLocation.imageUrl} 
                  alt={selectedLocation.name} 
                  className="w-full h-[300px] object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
            )}
            
            {selectedLocation?.videoUrl && (
              <div className="aspect-video w-full overflow-hidden rounded-lg border border-white/10 shadow-2xl bg-black">
                {selectedLocation.videoUrl.includes('youtube') || selectedLocation.videoUrl.includes('youtu.be') ? (
                  <iframe 
                    src={selectedLocation.videoUrl.replace('watch?v=', 'embed/')} 
                    className="w-full h-full"
                    allowFullScreen 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                ) : (
                  <video controls className="w-full h-full" src={selectedLocation.videoUrl}>
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            )}

            <div className="prose prose-invert max-w-none">
              <p className="text-lg leading-relaxed text-muted-foreground">
                {selectedLocation?.description || "No description available for this location."}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
