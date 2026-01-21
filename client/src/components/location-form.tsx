import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertLocationSchema } from "@shared/schema";
import type { Location, InsertLocation, LocationType as LocationTypeDB } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateLocation, useUpdateLocation } from "@/hooks/use-locations";
import { useLocationTypes } from "@/hooks/use-location-types";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X, Image, Video, MapPin, Plus, GripVertical } from "lucide-react";
import { LOCATION_TYPE_CONFIG, LocationMarker, DEFAULT_ICONS } from "./location-icons";
import { MultiMediaUploader, type MediaItem } from "./multi-media-uploader";
import { useCreateLocationMedia, useLocationMedia, useDeleteLocationMedia } from "@/hooks/use-location-media";

interface LocationFormProps {
  location?: Location;
  onSuccess?: () => void;
}

export function LocationForm({ location, onSuccess }: LocationFormProps) {
  const { toast } = useToast();
  const createMutation = useCreateLocation();
  const updateMutation = useUpdateLocation();
  const createMediaMutation = useCreateLocationMedia();
  const deleteMediaMutation = useDeleteLocationMedia();
  const { data: locationTypes, isLoading: typesLoading } = useLocationTypes();
  const { data: existingMedia } = useLocationMedia(location?.id || 0);
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(location?.imageUrl || null);
  const [videoPreview, setVideoPreview] = useState<string | null>(location?.videoUrl || null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [mediaInitialized, setMediaInitialized] = useState(false);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!location;
  
  useEffect(() => {
    if (existingMedia && existingMedia.length > 0 && !mediaInitialized) {
      setMediaItems(existingMedia.map(m => ({
        id: m.id,
        url: m.url,
        mediaType: m.mediaType as "photo" | "video",
        isPrimary: m.isPrimary || false,
        sortOrder: m.sortOrder || 0,
      })));
      setMediaInitialized(true);
    }
  }, [existingMedia, mediaInitialized]);

  const form = useForm<InsertLocation>({
    resolver: zodResolver(insertLocationSchema),
    defaultValues: {
      name: location?.name ?? "",
      nameRu: location?.nameRu ?? "",
      nameEn: location?.nameEn ?? "",
      description: location?.description ?? "",
      descriptionRu: location?.descriptionRu ?? "",
      descriptionEn: location?.descriptionEn ?? "",
      lat: location?.lat ?? 38.8610,
      lng: location?.lng ?? 71.2761,
      imageUrl: location?.imageUrl ?? "",
      videoUrl: location?.videoUrl ?? "",
      locationType: location?.locationType ?? "kmz",
      foundedYear: location?.foundedYear ?? undefined,
      workerCount: location?.workerCount ?? undefined,
      area: location?.area ?? "",
    },
  });

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Не удалось загрузить файл");
    }

    const { url } = await response.json();
    return url;
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    form.setValue("imageUrl", "");
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const removeVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
    form.setValue("videoUrl", "");
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Ошибка",
        description: "Геолокация не поддерживается вашим браузером",
        variant: "destructive",
      });
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.setValue("lat", position.coords.latitude);
        form.setValue("lng", position.coords.longitude);
        setIsGettingLocation(false);
        toast({
          title: "Успешно",
          description: "Координаты определены",
        });
      },
      (error) => {
        setIsGettingLocation(false);
        let message = "Не удалось определить местоположение";
        if (error.code === error.PERMISSION_DENIED) {
          message = "Доступ к геолокации запрещён";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = "Информация о местоположении недоступна";
        } else if (error.code === error.TIMEOUT) {
          message = "Время ожидания истекло";
        }
        toast({
          title: "Ошибка",
          description: message,
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const onSubmit = async (data: InsertLocation) => {
    try {
      let imageUrl = data.imageUrl;
      let videoUrl = data.videoUrl;

      if (imageFile) {
        setIsUploadingImage(true);
        imageUrl = await uploadFile(imageFile);
        setIsUploadingImage(false);
      }

      if (videoFile) {
        setIsUploadingVideo(true);
        videoUrl = await uploadFile(videoFile);
        setIsUploadingVideo(false);
      }

      const submitData = { ...data, imageUrl, videoUrl };

      let locationId: number;

      if (isEditing && location) {
        await updateMutation.mutateAsync({ id: location.id, ...submitData });
        locationId = location.id;
        
        // Handle media updates - delete removed items and add new ones
        const existingIds = new Set(existingMedia?.map(m => m.id) || []);
        const currentIds = new Set(mediaItems.filter(m => m.id).map(m => m.id));
        
        // Delete removed media
        for (const existingId of existingIds) {
          if (!currentIds.has(existingId)) {
            await deleteMediaMutation.mutateAsync({ id: existingId, locationId });
          }
        }
        
        // Add new media
        for (const item of mediaItems) {
          if (item.isNew) {
            await createMediaMutation.mutateAsync({
              locationId,
              mediaType: item.mediaType,
              url: item.url,
              isPrimary: item.isPrimary,
              sortOrder: item.sortOrder,
            });
          }
        }
        
        toast({ title: "Успешно", description: "Локация обновлена" });
      } else {
        const newLocation = await createMutation.mutateAsync(submitData);
        locationId = newLocation.id;
        
        // Add media items for new location
        for (const item of mediaItems) {
          await createMediaMutation.mutateAsync({
            locationId,
            mediaType: item.mediaType,
            url: item.url,
            isPrimary: item.isPrimary,
            sortOrder: item.sortOrder,
          });
        }
        
        toast({ title: "Успешно", description: "Локация создана" });
      }
      onSuccess?.();
    } catch (error) {
      setIsUploadingImage(false);
      setIsUploadingVideo(false);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Что-то пошло не так",
        variant: "destructive",
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending || isUploadingImage || isUploadingVideo;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
          <p className="text-sm font-medium text-gray-700">Название локации</p>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-black">🇹🇯 Тоҷикӣ (основное)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Номи ҷой бо забони тоҷикӣ" 
                    {...field} 
                    className="bg-white border-gray-300 text-black placeholder:text-gray-400"
                  />
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
                <FormLabel className="text-black">🇷🇺 Русский</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Название на русском" 
                    {...field} 
                    value={field.value || ""}
                    className="bg-white border-gray-300 text-black placeholder:text-gray-400"
                  />
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
                <FormLabel className="text-black">🇬🇧 English</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Name in English" 
                    {...field} 
                    value={field.value || ""}
                    className="bg-white border-gray-300 text-black placeholder:text-gray-400"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="locationType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-black">Тип локации</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || "kmz"}>
                <FormControl>
                  <SelectTrigger className="bg-white border-gray-300 text-black" data-testid="select-location-type">
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {locationTypes && locationTypes.length > 0 ? (
                    locationTypes.map((type) => {
                      const Icon = DEFAULT_ICONS[type.slug] || MapPin;
                      const fallbackConfig = LOCATION_TYPE_CONFIG[type.slug];
                      return (
                        <SelectItem key={type.slug} value={type.slug} data-testid={`option-type-${type.slug}`}>
                          <div className="flex items-center gap-2">
                            {type.iconUrl ? (
                              <img src={type.iconUrl} alt="" className="h-4 w-4 rounded-full object-cover" />
                            ) : (
                              <Icon className={`h-4 w-4 ${fallbackConfig?.color || 'text-gray-500'}`} />
                            )}
                            <span>{type.nameRu || type.name}</span>
                          </div>
                        </SelectItem>
                      );
                    })
                  ) : (
                    Object.entries(LOCATION_TYPE_CONFIG).map(([key, config]) => {
                      const Icon = config.icon;
                      return (
                        <SelectItem key={key} value={key} data-testid={`option-type-${key}`}>
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${config.color}`} />
                            <span>{config.labelRu}</span>
                          </div>
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="lat"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-black">Широта</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="any" 
                    placeholder="38.8610" 
                    {...field} 
                    onChange={e => field.onChange(parseFloat(e.target.value))} 
                    className="bg-white border-gray-300 text-black placeholder:text-gray-400"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lng"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-black">Долгота</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="any" 
                    placeholder="71.2761" 
                    {...field} 
                    onChange={e => field.onChange(parseFloat(e.target.value))} 
                    className="bg-white border-gray-300 text-black placeholder:text-gray-400"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={getCurrentLocation}
          disabled={isGettingLocation}
          className="w-full text-black border-gray-300 hover:bg-gray-100"
          data-testid="button-get-location"
        >
          {isGettingLocation ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <MapPin className="h-4 w-4 mr-2" />
          )}
          Определить моё местоположение
        </Button>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="foundedYear"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-black">Год основания</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="1991" 
                    {...field} 
                    value={field.value ?? ""}
                    onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} 
                    className="bg-white border-gray-300 text-black placeholder:text-gray-400"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="workerCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-black">Кол-во работников</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="15" 
                    {...field} 
                    value={field.value ?? ""}
                    onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} 
                    className="bg-white border-gray-300 text-black placeholder:text-gray-400"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="area"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-black">Площадь</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="450 кв.м" 
                    {...field} 
                    value={field.value ?? ""}
                    className="bg-white border-gray-300 text-black placeholder:text-gray-400"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
          <p className="text-sm font-medium text-gray-700">Описание локации</p>
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-black">🇹🇯 Тоҷикӣ (основное)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Тавсифи ҷой бо забони тоҷикӣ..." 
                    className="resize-none bg-white border-gray-300 text-black placeholder:text-gray-400" 
                    {...field} 
                    value={field.value || ""} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="descriptionRu"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-black">🇷🇺 Русский</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Описание на русском..." 
                    className="resize-none bg-white border-gray-300 text-black placeholder:text-gray-400" 
                    {...field} 
                    value={field.value || ""} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="descriptionEn"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-black">🇬🇧 English</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Description in English..." 
                    className="resize-none bg-white border-gray-300 text-black placeholder:text-gray-400" 
                    {...field} 
                    value={field.value || ""} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-2">
          <FormLabel className="text-black">Галерея медиа (фото/видео)</FormLabel>
          <MultiMediaUploader
            media={mediaItems}
            onChange={setMediaItems}
            onUpload={uploadFile}
            disabled={isPending}
          />
        </div>

        <Button type="submit" className="w-full bg-gray-700 hover:bg-gray-800 text-white" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isUploadingImage ? "Загрузка фото..." : isUploadingVideo ? "Загрузка видео..." : isEditing ? "Сохранить" : "Добавить локацию"}
        </Button>
      </form>
    </Form>
  );
}
