import { useState, useEffect } from "react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useLocations, useDeleteLocation } from "@/hooks/use-locations";
import { LocationForm } from "@/components/location-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Loader2, Plus, Pencil, Trash2, Map as MapIcon, Search, LogOut, User } from "lucide-react";
import { Link, useLocation as useWouterLocation } from "wouter";
import type { Location } from "@shared/schema";
import { LocationMarker, LOCATION_TYPE_CONFIG } from "@/components/location-icons";

export default function AdminPage() {
  const { isAdmin, user, isLoading: authLoading, logout } = useAdminAuth();
  const { data: locations, isLoading: locationsLoading } = useLocations();
  const deleteMutation = useDeleteLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useWouterLocation();

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

  const openEdit = (location: Location) => {
    setEditingLocation(location);
    setIsDialogOpen(true);
  };

  const openCreate = () => {
    setEditingLocation(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 flex">
      <aside className="w-64 bg-white shadow-xl hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <Link href="/">
            <h1 className="text-2xl font-bold text-black cursor-pointer hover:text-gray-600 transition-colors tracking-wide">
              ADMIN
            </h1>
          </Link>
          <p className="text-xs text-gray-500 mt-1 font-medium">МЕНЕДЖЕР ЛОКАЦИЙ</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/">
            <Button variant="ghost" className="w-full justify-start text-black hover:bg-gray-100 hover:text-gray-700">
              <MapIcon className="mr-2 h-4 w-4" />
              Открыть карту
            </Button>
          </Link>
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

      <main className="flex-1 p-6 md:p-8 lg:p-12 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold text-black">Локации</h2>
              <p className="text-gray-600">Управление точками на 3D карте</p>
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
          </div>

          <div className="bg-white rounded-xl shadow-xl shadow-gray-200/50 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Поиск локаций..." 
                    className="pl-10 h-11 bg-gray-50 border-gray-200 text-black placeholder:text-gray-400 focus:border-gray-500 focus:ring-gray-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="text-black font-semibold">Название</TableHead>
                    <TableHead className="hidden lg:table-cell text-black font-semibold">Тип</TableHead>
                    <TableHead className="hidden md:table-cell text-black font-semibold">Координаты</TableHead>
                    <TableHead className="hidden sm:table-cell text-black font-semibold">Медиа</TableHead>
                    <TableHead className="text-right text-black font-semibold">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLocations?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                        Локации не найдены
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLocations?.map((location) => (
                      <TableRow key={location.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-black">
                          <div className="flex items-center gap-2">
                            <LocationMarker locationType={location.locationType} size="sm" />
                            <div className="flex flex-col">
                              <span>{location.name}</span>
                              <span className="md:hidden text-xs text-gray-500 mt-0.5">
                                {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-gray-600">
                          <span className="text-xs">
                            {LOCATION_TYPE_CONFIG[location.locationType || "kmz"]?.labelRu || "КМЗ"}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-gray-600">
                          {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex gap-2">
                            {location.imageUrl && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">IMG</span>
                            )}
                            {location.videoUrl && (
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">VID</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => openEdit(location)}
                              className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-gray-600 hover:text-red-600 hover:bg-red-50"
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
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
