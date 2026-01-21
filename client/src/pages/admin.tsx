import { useState, useEffect, useRef, useMemo } from "react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useLocations, useDeleteLocation } from "@/hooks/use-locations";
import { useLocationTypes, useDeleteLocationType } from "@/hooks/use-location-types";
import earthBackground from "@assets/earth-depicted-anime-style_1769019104987.jpg";
import { LocationForm } from "@/components/location-form";
import { LocationTypeForm } from "@/components/location-type-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus, Pencil, Trash2, Map as MapIcon, Search, LogOut, User, Image, Video, Settings, ChevronDown, ChevronUp } from "lucide-react";
import { Link, useLocation as useWouterLocation } from "wouter";
import type { Location, LocationType as LocationTypeDB } from "@shared/schema";
import { LocationMarker, LOCATION_TYPE_CONFIG, DEFAULT_ICONS } from "@/components/location-icons";
import { MapPin } from "lucide-react";

export default function AdminPage() {
  const { isAdmin, user, isLoading: authLoading, logout } = useAdminAuth();
  const { data: locations, isLoading: locationsLoading } = useLocations();
  const { data: dbLocationTypes, isLoading: typesLoading } = useLocationTypes();
  const deleteMutation = useDeleteLocation();
  const deleteTypeMutation = useDeleteLocationType();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useWouterLocation();
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<LocationTypeDB | null>(null);
  const [typeManagementExpanded, setTypeManagementExpanded] = useState(false);
  
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      setLocation("/admin/login");
    }
  }, [authLoading, isAdmin, setLocation]);

  if (authLoading || locationsLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const filteredLocations = locations?.filter(loc => 
    loc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Build locationsByType dynamically from database location types
  const locationsByType = useMemo(() => {
    if (!dbLocationTypes) return {} as Record<string, Location[]>;
    return dbLocationTypes.reduce((acc, locType) => {
      acc[locType.slug] = filteredLocations?.filter(loc => loc.locationType === locType.slug) || [];
      return acc;
    }, {} as Record<string, Location[]>);
  }, [dbLocationTypes, filteredLocations]);

  // Create a lookup map for location types
  const locationTypeMap = useMemo(() => {
    if (!dbLocationTypes) return {};
    return dbLocationTypes.reduce((acc, type) => {
      acc[type.slug] = type;
      return acc;
    }, {} as Record<string, typeof dbLocationTypes[0]>);
  }, [dbLocationTypes]);

  const scrollToSection = (type: string) => {
    sectionRefs.current[type]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openEdit = (location: Location) => {
    setEditingLocation(location);
    setIsDialogOpen(true);
  };

  const openCreate = () => {
    setEditingLocation(null);
    setIsDialogOpen(true);
  };

  return (
    <div 
      className="min-h-screen flex bg-gray-100"
    >
      <aside className="w-64 bg-white shadow-xl hidden md:flex flex-col sticky top-0 h-screen z-10">
        <div className="p-6 border-b border-gray-100">
          <Link href="/">
            <h1 className="text-2xl font-bold text-black cursor-pointer hover:text-gray-600 transition-colors tracking-wide">
              ADMIN
            </h1>
          </Link>
          <p className="text-xs text-gray-500 mt-1 font-medium">МЕНЕДЖЕР ЛОКАЦИЙ</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link href="/">
            <Button variant="ghost" className="w-full justify-start text-black hover:bg-gray-100 hover:text-gray-700 mb-2">
              <MapIcon className="mr-2 h-4 w-4" />
              Открыть карту
            </Button>
          </Link>
          
          <div className="pt-2 border-t border-gray-100">
            <button
              onClick={() => setTypeManagementExpanded(!typeManagementExpanded)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-400 uppercase tracking-wider font-semibold hover:bg-gray-50 rounded-lg"
            >
              <span>Типы локаций</span>
              {typeManagementExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            
            {typeManagementExpanded && (
              <div className="px-3 py-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mb-2 text-gray-700 border-gray-300"
                  onClick={() => {
                    setEditingType(null);
                    setIsTypeDialogOpen(true);
                  }}
                  data-testid="button-add-type"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Добавить тип
                </Button>
                
                {dbLocationTypes?.map((dbType) => (
                  <div
                    key={dbType.id}
                    className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-100 group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div 
                        className="w-6 h-6 rounded-full flex-shrink-0 border"
                        style={{ 
                          backgroundColor: dbType.bgColor || "#f0f0f0",
                          borderColor: dbType.borderColor || "#ccc"
                        }}
                      >
                        {dbType.iconUrl && (
                          <img src={dbType.iconUrl} alt="" className="w-full h-full rounded-full object-cover" />
                        )}
                      </div>
                      <span className="text-sm text-gray-700 truncate">{dbType.nameRu || dbType.name}</span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          setEditingType(dbType);
                          setIsTypeDialogOpen(true);
                        }}
                        data-testid={`button-edit-type-${dbType.id}`}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-500 hover:text-red-700"
                            data-testid={`button-delete-type-${dbType.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-black">Удалить тип?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Это действие нельзя отменить. Тип "{dbType.nameRu || dbType.name}" будет удалён.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="text-gray-700">Отмена</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700 text-white"
                              onClick={() => deleteTypeMutation.mutate(dbType.id)}
                            >
                              Удалить
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {(dbLocationTypes || []).map((locType) => {
              const staticConfig = LOCATION_TYPE_CONFIG[locType.slug];
              const Icon = staticConfig?.icon || DEFAULT_ICONS[locType.slug] || MapPin;
              const count = locationsByType[locType.slug]?.length || 0;
              return (
                <button
                  key={locType.slug}
                  onClick={() => scrollToSection(locType.slug)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  data-testid={`nav-type-${locType.slug}`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" style={{ color: locType.color || '#6b7280' }} />
                    <span>{locType.nameRu || locType.name}</span>
                  </div>
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{count}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gray-500 to-gray-600 shadow-lg shadow-gray-300">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold text-black truncate">{user?.username || "Admin"}</span>
              <span className="text-xs text-gray-500">Администратор</span>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full border-gray-200 text-black hover:bg-red-50 hover:text-red-600 hover:border-red-200" 
            onClick={() => logout()} 
            data-testid="button-logout"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Выйти
          </Button>
        </div>
      </aside>
      <main 
        className="flex-1 p-6 md:p-8 lg:p-12 overflow-auto relative"
        style={{
          backgroundImage: `url(${earthBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: '60% center',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="absolute inset-0 bg-black/30 pointer-events-none"></div>
        <div className="max-w-6xl mx-auto space-y-8 relative z-10">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold text-white drop-shadow-lg">Локации</h2>
              <p className="text-gray-200">Управление точками на 3D карте</p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={openCreate} 
                  className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white shadow-lg shadow-gray-400/50"
                >
                  <Plus className="mr-2 h-4 w-4" /> Добавить
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-white">
                <DialogHeader>
                  <DialogTitle className="text-black">{editingLocation ? "Редактировать" : "Новая локация"}</DialogTitle>
                </DialogHeader>
                <LocationForm 
                  location={editingLocation || undefined} 
                  onSuccess={() => setIsDialogOpen(false)} 
                />
              </DialogContent>
            </Dialog>
            
            <Dialog open={isTypeDialogOpen} onOpenChange={setIsTypeDialogOpen}>
              <DialogContent className="sm:max-w-[400px] max-h-[90vh] overflow-y-auto bg-white">
                <DialogHeader>
                  <DialogTitle className="text-black">{editingType ? "Редактировать тип" : "Новый тип локации"}</DialogTitle>
                </DialogHeader>
                <LocationTypeForm 
                  locationType={editingType || undefined} 
                  onSuccess={() => setIsTypeDialogOpen(false)} 
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Поиск локаций..." 
                className="pl-10 h-11 bg-gray-50 border-gray-200 text-black placeholder:text-gray-400 focus:border-gray-500 focus:ring-gray-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {(dbLocationTypes || []).map((locType) => {
            const staticConfig = LOCATION_TYPE_CONFIG[locType.slug];
            const Icon = staticConfig?.icon || DEFAULT_ICONS[locType.slug] || MapPin;
            const typeLocations = locationsByType[locType.slug] || [];
            
            if (typeLocations.length === 0) return null;
            
            return (
              <section 
                key={locType.slug} 
                ref={(el) => { sectionRefs.current[locType.slug] = el; }}
                className="scroll-mt-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: locType.bgColor || '#f3f4f6' }}
                  >
                    <Icon className="h-5 w-5" style={{ color: locType.color || '#6b7280' }} />
                  </div>
                  <h3 className="text-xl font-bold text-white drop-shadow-lg">{locType.nameRu || locType.name}</h3>
                  <span className="text-sm text-gray-300">({typeLocations.length})</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {typeLocations.map((location) => (
                    <Card key={location.id} className="bg-white shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                      {location.imageUrl && (
                        <div className="h-32 overflow-hidden">
                          <img 
                            src={location.imageUrl} 
                            alt={location.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <LocationMarker 
                                locationType={location.locationType} 
                                size="sm" 
                                customColor={locationTypeMap[location.locationType || 'kmz']?.color}
                                customBgColor={locationTypeMap[location.locationType || 'kmz']?.bgColor}
                                customBorderColor={locationTypeMap[location.locationType || 'kmz']?.borderColor}
                              />
                              <h4 className="font-semibold text-black truncate">{location.name}</h4>
                            </div>
                            <p className="text-xs text-gray-500 mb-2">
                              {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                            </p>
                            {location.description && (
                              <p className="text-sm text-gray-600 line-clamp-2">{location.description}</p>
                            )}
                            <div className="flex gap-2 mt-2">
                              {location.imageUrl && (
                                <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                  <Image className="h-3 w-3" />
                                  Фото
                                </span>
                              )}
                              {location.videoUrl && (
                                <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                  <Video className="h-3 w-3" />
                                  Видео
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => openEdit(location)}
                              className="h-8 w-8 text-black bg-gray-100 hover:bg-gray-200"
                              data-testid={`button-edit-${location.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-gray-600 hover:text-red-600 hover:bg-red-50"
                                  data-testid={`button-delete-${location.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-white">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-black">Удалить локацию?</AlertDialogTitle>
                                  <AlertDialogDescription className="text-gray-600">
                                    Локация "{location.name}" будет удалена с карты навсегда.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="text-black">Отмена</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => deleteMutation.mutate(location.id)}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                  >
                                    Удалить
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            );
          })}

          {filteredLocations?.length === 0 && (
            <div className="text-center py-12 text-white">
              Локации не найдены
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
