import { useState, useMemo, useEffect } from "react";
import Map, { Marker, Popup, NavigationControl, FullscreenControl, ScaleControl, Source, Layer } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useLocations } from "@/hooks/use-locations";
import { useLocationTypes } from "@/hooks/use-location-types";
import { useLocationMedia } from "@/hooks/use-location-media";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Map as MapIcon, Layers, Filter, ChevronDown, ChevronUp, Navigation, ExternalLink, MapPin } from "lucide-react";
import { type Location } from "@shared/schema";
import { tajikistanOSMBorder } from "@/data/tajikistan-accurate";
import { useLanguage } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LocationMarker, getLocationTypeLabel, LOCATION_TYPE_CONFIG, getPulseClass, getMarkerEffectClass, DEFAULT_ICONS } from "@/components/location-icons";
import { MediaCarousel } from "@/components/media-carousel";

function getLocalizedName(location: Location, language: string): string {
  if (language === 'ru' && location.nameRu) return location.nameRu;
  if (language === 'en' && location.nameEn) return location.nameEn;
  return location.name;
}

function getLocalizedDescription(location: Location, language: string): string | null {
  if (language === 'ru' && location.descriptionRu) return location.descriptionRu;
  if (language === 'en' && location.descriptionEn) return location.descriptionEn;
  return location.description;
}

function HoverPopup({ location, language }: { location: Location; language: string }) {
  const hasData = location.foundedYear || location.workerCount || location.area;
  const localizedName = getLocalizedName(location, language);
  const { data: media } = useLocationMedia(location.id);
  
  const primaryMedia = media?.find(m => m.isPrimary) || media?.[0];
  const primaryUrl = primaryMedia?.url || location.imageUrl;
  const isVideo = primaryMedia?.mediaType === 'video';
  
  return (
    <div className="flex bg-gradient-to-r from-white to-gray-50 rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
      {primaryUrl ? (
        isVideo ? (
          <div className="w-28 h-28 bg-gray-800 flex items-center justify-center flex-shrink-0 relative">
            <video 
              src={primaryUrl}
              className="w-full h-full object-cover"
              muted
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center">
                <div className="w-0 h-0 border-l-[12px] border-l-gray-800 border-y-[8px] border-y-transparent ml-1" />
              </div>
            </div>
          </div>
        ) : (
          <img 
            src={primaryUrl} 
            alt={localizedName}
            className="w-28 h-28 object-cover flex-shrink-0"
          />
        )
      ) : (
        <div className="w-28 h-28 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
          <MapIcon className="h-10 w-10 text-gray-400" />
        </div>
      )}
      <div className="p-4 flex flex-col justify-center min-w-[240px]">
        <p className="font-bold text-sm text-gray-900 leading-snug">{localizedName}</p>
        {hasData && (
          <div className="mt-2 space-y-1">
            {location.foundedYear && (
              <p className="text-xs text-gray-600">
                <span className="text-gray-400">{language === 'ru' ? 'Основан:' : language === 'tj' ? 'Ташкил:' : 'Founded:'}</span> <span className="font-medium">{location.foundedYear}</span>
              </p>
            )}
            {location.workerCount && (
              <p className="text-xs text-gray-600">
                <span className="text-gray-400">{language === 'ru' ? 'Работников:' : language === 'tj' ? 'Корбар:' : 'Workers:'}</span> <span className="font-medium">{location.workerCount}</span>
              </p>
            )}
            {location.area && (
              <p className="text-xs text-gray-600">
                <span className="text-gray-400">{language === 'ru' ? 'Площадь:' : language === 'tj' ? 'Масоҳат:' : 'Area:'}</span> <span className="font-medium">{location.area} м²</span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

type MapStyleType = 'osm' | 'minimal';

const MAP_STYLES = {
  osm: {
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

const borderLineLayer = {
  id: 'tajikistan-border-line',
  type: 'line' as const,
  source: 'tajikistan-border',
  paint: {
    'line-color': '#dc2626',
    'line-width': 3,
    'line-opacity': 1
  }
};

export default function MapPage() {
  const { data: locations, isLoading } = useLocations();
  const { data: dbLocationTypes } = useLocationTypes();
  const [popupInfo, setPopupInfo] = useState<Location | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [mapStyle, setMapStyle] = useState<MapStyleType>('osm');
  const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { t, language } = useLanguage();
  
  const { data: locationMedia } = useLocationMedia(selectedLocation?.id || 0);

  // Initialize filters when location types are loaded
  useEffect(() => {
    if (dbLocationTypes && dbLocationTypes.length > 0) {
      setActiveFilters(prev => {
        const newFilters: Record<string, boolean> = {};
        dbLocationTypes.forEach(type => {
          // Preserve existing filter state or default to true
          newFilters[type.slug] = prev[type.slug] !== undefined ? prev[type.slug] : true;
        });
        return newFilters;
      });
    }
  }, [dbLocationTypes]);

  const toggleFilter = (type: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const filteredLocations = useMemo(() => {
    return locations?.filter(loc => activeFilters[loc.locationType || "kmz"]) || [];
  }, [locations, activeFilters]);

  // Create a lookup map for location types
  const locationTypeMap = useMemo(() => {
    if (!dbLocationTypes) return {};
    return dbLocationTypes.reduce((acc, type) => {
      acc[type.slug] = type;
      return acc;
    }, {} as Record<string, typeof dbLocationTypes[0]>);
  }, [dbLocationTypes]);

  const markers = useMemo(() => filteredLocations.map((location) => {
    const locType = locationTypeMap[location.locationType || 'kmz'];
    return (
      <Marker
        key={location.id}
        longitude={location.lng}
        latitude={location.lat}
        anchor="bottom"
        onClick={e => {
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
          <div 
            className={`absolute -inset-4 z-0 ${locType?.markerEffect ? getMarkerEffectClass(locType.markerEffect) : getPulseClass(location.locationType)}`}
            style={{ '--marker-color': locType?.color || '#22c55e' } as React.CSSProperties}
          ></div>
          <LocationMarker 
            locationType={location.locationType} 
            size="md" 
            customColor={locType?.color}
            customBgColor={locType?.bgColor}
            customBorderColor={locType?.borderColor}
            customIconUrl={locType?.iconUrl}
          />
        </div>
      </Marker>
    );
  }), [filteredLocations, locationTypeMap]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <h2 className="text-xl font-display tracking-widest">{t("map.loading")}</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      <div className="pointer-events-none absolute left-0 top-0 z-50 flex w-full items-center justify-between p-6 bg-gradient-to-b from-black/80 to-transparent">
        <div className="pointer-events-auto">
          <h1 className="font-display text-4xl font-bold text-white tracking-wider drop-shadow-lg">
            TAJIKISTAN
          </h1>
          <p className="text-white/60 text-sm font-light tracking-widest mt-1">{t("map.title")}</p>
        </div>
        <div className="pointer-events-auto">
          <LanguageSwitcher />
        </div>
      </div>

      {/* Filter Panel - Top Left, Collapsible */}
      <div className="absolute left-4 top-28 z-50">
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="flex items-center gap-2 rounded-lg bg-background/90 backdrop-blur-sm px-3 py-2 shadow-lg border border-border hover:bg-muted/50 transition-colors"
          data-testid="button-toggle-filters"
        >
          <Filter className="h-4 w-4 text-foreground" />
          <span className="text-sm font-medium text-foreground">
            {t("filter.title")}
          </span>
          {filtersOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        
        {filtersOpen && (
          <div className="mt-2 rounded-lg bg-background/90 backdrop-blur-sm p-3 shadow-lg border border-border max-w-[220px]">
            <div className="space-y-2">
              {/* Select All checkbox */}
              <label 
                className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded p-1.5 transition-colors border-b border-border pb-2 mb-2"
                data-testid="filter-select-all"
              >
                <input 
                  type="checkbox"
                  checked={dbLocationTypes?.every(type => activeFilters[type.slug]) ?? false}
                  onChange={() => {
                    const allSelected = dbLocationTypes?.every(type => activeFilters[type.slug]) ?? false;
                    const newFilters: Record<string, boolean> = {};
                    dbLocationTypes?.forEach(type => {
                      newFilters[type.slug] = !allSelected;
                    });
                    setActiveFilters(newFilters);
                  }}
                  className="h-4 w-4 rounded border-muted-foreground accent-primary cursor-pointer"
                />
                <span className="text-xs font-medium text-foreground">
                  {language === "ru" ? "Выбрать все" : language === "tj" ? "Ҳамаро интихоб кунед" : "Select all"}
                </span>
              </label>
              
              {(dbLocationTypes || []).map((locType) => {
                const staticConfig = LOCATION_TYPE_CONFIG[locType.slug];
                const Icon = staticConfig?.icon || DEFAULT_ICONS[locType.slug] || MapPin;
                const count = locations?.filter(l => l.locationType === locType.slug).length || 0;
                return (
                  <label 
                    key={locType.slug} 
                    className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded p-1.5 transition-colors"
                    data-testid={`filter-${locType.slug}`}
                  >
                    <input 
                      type="checkbox"
                      checked={activeFilters[locType.slug] ?? true}
                      onChange={() => toggleFilter(locType.slug)}
                      className="h-4 w-4 rounded border-muted-foreground accent-primary cursor-pointer"
                    />
                    <div 
                      className="flex h-5 w-5 items-center justify-center rounded-full border"
                      style={{ 
                        backgroundColor: locType.bgColor || '#f3f4f6', 
                        borderColor: locType.borderColor || '#9ca3af' 
                      }}
                    >
                      <Icon className="h-3 w-3" style={{ color: locType.color || '#6b7280' }} />
                    </div>
                    <span className="text-xs text-foreground flex-1 truncate">
                      {language === "ru" ? (locType.nameRu || locType.name).split(" (")[0] : 
                       language === "tj" ? locType.name.split(" (")[0] : 
                       (locType.nameEn || locType.name).split(" (")[0]}
                    </span>
                    <span className="text-xs text-muted-foreground">({count})</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Map Style Switcher - Right Side */}
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
          {t("map.colorful")}
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
          {t("map.minimal")}
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

        <Source id="tajikistan-border" type="geojson" data={tajikistanOSMBorder as any}>
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
            maxWidth="400px"
            className="z-50"
          >
            <HoverPopup location={popupInfo} language={language} />
          </Popup>
        )}
      </Map>

      <Dialog open={!!selectedLocation} onOpenChange={(open) => !open && setSelectedLocation(null)}>
        <DialogContent className="max-w-3xl bg-gradient-to-br from-white via-gray-50 to-gray-200 border-gray-300 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <LocationMarker 
                locationType={selectedLocation?.locationType} 
                size="lg" 
                customColor={selectedLocation ? locationTypeMap[selectedLocation.locationType || 'kmz']?.color : undefined}
                customBgColor={selectedLocation ? locationTypeMap[selectedLocation.locationType || 'kmz']?.bgColor : undefined}
                customBorderColor={selectedLocation ? locationTypeMap[selectedLocation.locationType || 'kmz']?.borderColor : undefined}
                customIconUrl={selectedLocation ? locationTypeMap[selectedLocation.locationType || 'kmz']?.iconUrl : undefined}
              />
              <div>
                <DialogTitle className="font-display text-3xl tracking-wide text-gray-900">
                  {selectedLocation && getLocalizedName(selectedLocation, language)}
                </DialogTitle>
                <DialogDescription className="text-base text-gray-600">
                  {getLocationTypeLabel(selectedLocation?.locationType, language)} | {t("map.coordinates")}: {selectedLocation?.lat.toFixed(4)}° N, {selectedLocation?.lng.toFixed(4)}° E
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="mt-4 space-y-6">
            {selectedLocation && (locationMedia?.length || selectedLocation.imageUrl || selectedLocation.videoUrl) && (
              <MediaCarousel
                media={locationMedia || []}
                fallbackImageUrl={selectedLocation.imageUrl}
                fallbackVideoUrl={selectedLocation.videoUrl}
              />
            )}

            <div className="grid grid-cols-3 gap-4">
              {selectedLocation?.foundedYear && (
                <div className="bg-white/60 rounded-lg p-3 border border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{language === 'ru' ? 'Год основания' : language === 'tj' ? 'Соли таъсис' : 'Founded'}</p>
                  <p className="text-xl font-bold text-gray-900">{selectedLocation.foundedYear}</p>
                </div>
              )}
              {selectedLocation?.workerCount && (
                <div className="bg-white/60 rounded-lg p-3 border border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{language === 'ru' ? 'Работников' : language === 'tj' ? 'Корбар' : 'Workers'}</p>
                  <p className="text-xl font-bold text-gray-900">{selectedLocation.workerCount}</p>
                </div>
              )}
              {selectedLocation?.area && (
                <div className="bg-white/60 rounded-lg p-3 border border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{language === 'ru' ? 'Площадь' : language === 'tj' ? 'Масоҳат' : 'Area'}</p>
                  <p className="text-xl font-bold text-gray-900">{selectedLocation.area} м²</p>
                </div>
              )}
            </div>

            {selectedLocation && getLocalizedDescription(selectedLocation, language) && (
              <div className="bg-white/50 rounded-xl p-4 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("map.description")}</h3>
                <p className="text-base leading-relaxed text-gray-700">
                  {getLocalizedDescription(selectedLocation, language)}
                </p>
              </div>
            )}

            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${selectedLocation?.lat},${selectedLocation?.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg"
              data-testid="button-route"
            >
              <Navigation className="h-5 w-5" />
              {language === 'ru' ? 'Построить маршрут' : language === 'tj' ? 'Сохтани роҳ' : 'Get directions'}
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
