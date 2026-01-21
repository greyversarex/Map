import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocationTypes, useCreateLocationType, useUpdateLocationType, useDeleteLocationType } from "@/hooks/use-location-types";
import type { LocationType, InsertLocationType } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ImageCropper } from "@/components/image-cropper";
import { Loader2, Plus, Pencil, Trash2, Upload, ArrowLeft, MapPin } from "lucide-react";
import { Link } from "wouter";
import { DEFAULT_ICONS } from "@/components/location-icons";

const locationTypeFormSchema = z.object({
  slug: z.string().min(1, "Обязательное поле").regex(/^[a-z0-9_-]+$/, "Только латинские буквы, цифры, - и _"),
  name: z.string().min(1, "Обязательное поле"),
  nameRu: z.string().optional(),
  nameEn: z.string().optional(),
  color: z.string().default("#22c55e"),
  bgColor: z.string().default("#dcfce7"),
  borderColor: z.string().default("#22c55e"),
  sortOrder: z.number().default(0),
});

type LocationTypeFormData = z.infer<typeof locationTypeFormSchema>;

export default function AdminLocationTypesPage() {
  const { data: locationTypes, isLoading } = useLocationTypes();
  const createMutation = useCreateLocationType();
  const updateMutation = useUpdateLocationType();
  const deleteMutation = useDeleteLocationType();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<LocationType | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [iconFile, setIconFile] = useState<Blob | null>(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<LocationTypeFormData>({
    resolver: zodResolver(locationTypeFormSchema),
    defaultValues: {
      slug: "",
      name: "",
      nameRu: "",
      nameEn: "",
      color: "#22c55e",
      bgColor: "#dcfce7",
      borderColor: "#22c55e",
      sortOrder: 0,
    },
  });

  const openCreate = () => {
    setEditingType(null);
    setIconPreview(null);
    setIconFile(null);
    form.reset({
      slug: "",
      name: "",
      nameRu: "",
      nameEn: "",
      color: "#22c55e",
      bgColor: "#dcfce7",
      borderColor: "#22c55e",
      sortOrder: locationTypes?.length || 0,
    });
    setIsDialogOpen(true);
  };

  const openEdit = (type: LocationType) => {
    setEditingType(type);
    setIconPreview(type.iconUrl);
    setIconFile(null);
    form.reset({
      slug: type.slug,
      name: type.name,
      nameRu: type.nameRu || "",
      nameEn: type.nameEn || "",
      color: type.color || "#22c55e",
      bgColor: type.bgColor || "#dcfce7",
      borderColor: type.borderColor || "#22c55e",
      sortOrder: type.sortOrder || 0,
    });
    setIsDialogOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageToCrop(reader.result as string);
        setCropperOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    setIconFile(croppedBlob);
    setIconPreview(URL.createObjectURL(croppedBlob));
  };

  const uploadIcon = async (): Promise<string | null> => {
    if (!iconFile) return iconPreview;
    
    const formData = new FormData();
    formData.append("file", iconFile, "icon.png");
    
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    
    if (!response.ok) {
      throw new Error("Failed to upload icon");
    }
    
    const { url } = await response.json();
    return url;
  };

  const onSubmit = async (data: LocationTypeFormData) => {
    try {
      let iconUrl = editingType?.iconUrl || null;
      
      if (iconFile) {
        iconUrl = await uploadIcon();
      }

      const submitData: InsertLocationType = {
        ...data,
        iconUrl,
      };

      if (editingType) {
        await updateMutation.mutateAsync({ id: editingType.id, ...submitData });
        toast({ title: "Успешно", description: "Тип локации обновлён" });
      } else {
        await createMutation.mutateAsync(submitData);
        toast({ title: "Успешно", description: "Тип локации создан" });
      }
      
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Что-то пошло не так",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (type: LocationType) => {
    if (!confirm(`Удалить тип "${type.nameRu || type.name}"?`)) return;
    
    try {
      await deleteMutation.mutateAsync(type.id);
      toast({ title: "Успешно", description: "Тип локации удалён" });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить тип",
        variant: "destructive",
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin">
            <Button variant="outline" size="icon" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Управление типами локаций</h1>
        </div>

        <div className="flex justify-end mb-4">
          <Button onClick={openCreate} data-testid="button-add-type">
            <Plus className="h-4 w-4 mr-2" />
            Добавить тип
          </Button>
        </div>

        <div className="grid gap-4">
          {locationTypes?.map((type) => {
            const Icon = DEFAULT_ICONS[type.slug] || MapPin;
            return (
              <Card key={type.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div 
                      className="h-12 w-12 rounded-full flex items-center justify-center border-2"
                      style={{ 
                        backgroundColor: type.bgColor || "#dcfce7",
                        borderColor: type.borderColor || "#22c55e"
                      }}
                    >
                      {type.iconUrl ? (
                        <img src={type.iconUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <Icon className="h-6 w-6" style={{ color: type.color || "#22c55e" }} />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{type.name}</p>
                      <p className="text-sm text-gray-500">{type.nameRu} | {type.slug}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openEdit(type)}
                      data-testid={`button-edit-type-${type.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(type)}
                      className="text-red-500 hover:text-red-600"
                      data-testid={`button-delete-type-${type.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px] bg-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-black">
                {editingType ? "Редактировать тип" : "Новый тип локации"}
              </DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="flex flex-col items-center gap-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <div 
                    className="h-24 w-24 rounded-full flex items-center justify-center border-2 cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ 
                      backgroundColor: form.watch("bgColor"),
                      borderColor: form.watch("borderColor")
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {iconPreview ? (
                      <img src={iconPreview} alt="" className="h-20 w-20 rounded-full object-cover" />
                    ) : (
                      <Upload className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="button-upload-icon"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Загрузить иконку
                  </Button>
                </div>

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-black">Код (slug)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="my_type" 
                          disabled={!!editingType}
                          className="bg-white border-gray-300 text-black"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-black">Название (Таджикский)</FormLabel>
                      <FormControl>
                        <Input {...field} className="bg-white border-gray-300 text-black" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nameRu"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-black">Название (Русский)</FormLabel>
                      <FormControl>
                        <Input {...field} className="bg-white border-gray-300 text-black" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nameEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-black">Название (English)</FormLabel>
                      <FormControl>
                        <Input {...field} className="bg-white border-gray-300 text-black" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-black">Цвет иконки</FormLabel>
                        <FormControl>
                          <Input {...field} type="color" className="h-10 p-1 cursor-pointer" />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bgColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-black">Цвет фона</FormLabel>
                        <FormControl>
                          <Input {...field} type="color" className="h-10 p-1 cursor-pointer" />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="borderColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-black">Цвет рамки</FormLabel>
                        <FormControl>
                          <Input {...field} type="color" className="h-10 p-1 cursor-pointer" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="sortOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-black">Порядок сортировки</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          className="bg-white border-gray-300 text-black"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter className="gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="text-black border-gray-300"
                  >
                    Отмена
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="bg-gray-700 hover:bg-gray-800 text-white"
                    data-testid="button-save-type"
                  >
                    {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingType ? "Сохранить" : "Создать"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {imageToCrop && (
          <ImageCropper
            open={cropperOpen}
            onClose={() => setCropperOpen(false)}
            imageSrc={imageToCrop}
            onCropComplete={handleCropComplete}
            cropShape="round"
            aspectRatio={1}
          />
        )}
      </div>
    </div>
  );
}
