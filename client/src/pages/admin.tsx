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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2, Plus, Pencil, Trash2, Map as MapIcon, Search, LogOut, User } from "lucide-react";
import { Link, useLocation as useWouterLocation } from "wouter";
import type { Location } from "@shared/schema";

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
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-foreground flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <Link href="/">
            <h1 className="font-display text-2xl font-bold tracking-widest cursor-pointer hover:text-primary transition-colors">
              ADMIN
            </h1>
          </Link>
          <p className="text-xs text-muted-foreground mt-1">LOCATION MANAGER</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/">
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
              <MapIcon className="mr-2 h-4 w-4" />
              View Map
            </Button>
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate">{user?.username || "Admin"}</span>
              <span className="text-xs text-muted-foreground">Администратор</span>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={() => logout()} data-testid="button-logout">
            <LogOut className="mr-2 h-4 w-4" />
            Выйти
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 lg:p-12 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-3xl font-display font-semibold">Locations</h2>
              <p className="text-muted-foreground">Manage points of interest on the 3D map.</p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreate} className="shadow-lg shadow-primary/20">
                  <Plus className="mr-2 h-4 w-4" /> Add Location
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingLocation ? "Edit Location" : "New Location"}</DialogTitle>
                </DialogHeader>
                <LocationForm 
                  location={editingLocation || undefined} 
                  onSuccess={() => setIsDialogOpen(false)} 
                />
              </DialogContent>
            </Dialog>
          </div>

          <Card className="border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search locations..." 
                    className="pl-9 bg-background/50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden md:table-cell">Coordinates</TableHead>
                      <TableHead className="hidden sm:table-cell">Media</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLocations?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                          No locations found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLocations?.map((location) => (
                        <TableRow key={location.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>{location.name}</span>
                              <span className="md:hidden text-xs text-muted-foreground mt-0.5">
                                {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground">
                            {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <div className="flex gap-2">
                              {location.imageUrl && <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded">IMG</span>}
                              {location.videoUrl && <span className="text-xs bg-purple-500/10 text-purple-400 px-2 py-1 rounded">VID</span>}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => openEdit(location)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Location?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently remove "{location.name}" from the map.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => deleteMutation.mutate(location.id)}
                                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                    >
                                      Delete
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
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
