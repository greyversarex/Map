import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertLocationSchema, LOCATION_TYPES } from "@shared/schema";
import type { Location, InsertLocation } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateLocation, useUpdateLocation } from "@/hooks/use-locations";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X, Image, Video, MapPin } from "lucide-react";
import { LOCATION_TYPE_CONFIG, LocationMarker } from "./location-icons";

interface LocationFormProps {
  location?: Location;
  onSuccess?: () => void;
}

export function LocationForm({ location, onSuccess }: LocationFormProps) {
  const { toast } = useToast();
  const createMutation = useCreateLocation();
  const updateMutation = useUpdateLocation();
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(location?.imageUrl || null);
  const [videoPreview, setVideoPreview] = useState<string | null>(location?.videoUrl || null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!location;

  const form = useForm<InsertLocation>({
    resolver: zodResolver(insertLocationSchema),
    defaultValues: {
      name: location?.name ?? "",
      description: location?.description ?? "",
      lat: location?.lat ?? 38.8610,
      lng: location?.lng ?? 71.2761,
      imageUrl: location?.imageUrl ?? "",
      videoUrl: location?.videoUrl ?? "",
      locationType: location?.locationType ?? "kmz",
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

      if (isEditing && location) {
        await updateMutation.mutateAsync({ id: location.id, ...submitData });
        toast({ title: "Успешно", description: "Локация обновлена" });
      } else {
        await createMutation.mutateAsync(submitData);
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
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-black">Название</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Флагшток Душанбе" 
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
                  {Object.entries(LOCATION_TYPE_CONFIG).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                      <SelectItem key={key} value={key} data-testid={`option-type-${key}`}>
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${config.color}`} />
                          <span>{config.labelRu}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
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
          className="w-full"
          data-testid="button-get-location"
        >
          {isGettingLocation ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <MapPin className="h-4 w-4 mr-2" />
          )}
          Определить моё местоположение
        </Button>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-black">Описание</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Опишите это место..." 
                  className="resize-none bg-white border-gray-300 text-black placeholder:text-gray-400" 
                  {...field} 
                  value={field.value || ""} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <FormLabel className="text-black">Фотография</FormLabel>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          
          {imagePreview ? (
            <div className="relative">
              <img 
                src={imagePreview} 
                alt="Превью" 
                className="w-full h-32 object-cover rounded-lg border border-gray-300"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={removeImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full h-24 border-dashed border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
              onClick={() => imageInputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-2">
                <Image className="h-6 w-6" />
                <span>Загрузить фото</span>
              </div>
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <FormLabel className="text-black">Видео</FormLabel>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={handleVideoSelect}
            className="hidden"
          />
          
          {videoPreview ? (
            <div className="relative">
              <video 
                src={videoPreview} 
                className="w-full h-32 object-cover rounded-lg border border-gray-300"
                controls
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={removeVideo}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full h-24 border-dashed border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
              onClick={() => videoInputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-2">
                <Video className="h-6 w-6" />
                <span>Загрузить видео</span>
              </div>
            </Button>
          )}
        </div>

        <Button type="submit" className="w-full bg-gray-700 hover:bg-gray-800 text-white" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isUploadingImage ? "Загрузка фото..." : isUploadingVideo ? "Загрузка видео..." : isEditing ? "Сохранить" : "Добавить локацию"}
        </Button>
      </form>
    </Form>
  );
}
