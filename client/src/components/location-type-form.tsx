import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { LocationType } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateLocationType, useUpdateLocationType } from "@/hooks/use-location-types";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";
import { ImageCropper } from "./image-cropper";

const formSchema = z.object({
  slug: z.string().min(1, "Обязательное поле").regex(/^[a-z0-9_]+$/, "Только латинские буквы, цифры и _"),
  name: z.string().min(1, "Обязательное поле"),
  nameRu: z.string().optional(),
  nameEn: z.string().optional(),
  color: z.string().default("#10b981"),
  bgColor: z.string().default("#ecfdf5"),
  borderColor: z.string().default("#10b981"),
  sortOrder: z.number().default(0),
});

type FormData = z.infer<typeof formSchema>;

interface LocationTypeFormProps {
  locationType?: LocationType;
  onSuccess?: () => void;
}

export function LocationTypeForm({ locationType, onSuccess }: LocationTypeFormProps) {
  const { toast } = useToast();
  const createMutation = useCreateLocationType();
  const updateMutation = useUpdateLocationType();
  
  const [iconUrl, setIconUrl] = useState<string>(locationType?.iconUrl || "");
  const [isUploading, setIsUploading] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!locationType;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      slug: locationType?.slug ?? "",
      name: locationType?.name ?? "",
      nameRu: locationType?.nameRu ?? "",
      nameEn: locationType?.nameEn ?? "",
      color: locationType?.color ?? "#10b981",
      bgColor: locationType?.bgColor ?? "#ecfdf5",
      borderColor: locationType?.borderColor ?? "#10b981",
      sortOrder: locationType?.sortOrder ?? 0,
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageToCrop(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setShowCropper(false);
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("file", croppedBlob, "icon.png");
      
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) throw new Error("Ошибка загрузки");
      
      const { url } = await response.json();
      setIconUrl(url);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить иконку",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      const submitData = { ...data, iconUrl };
      
      if (isEditing && locationType) {
        await updateMutation.mutateAsync({ id: locationType.id, ...submitData });
        toast({ title: "Успешно", description: "Тип обновлён" });
      } else {
        await createMutation.mutateAsync(submitData);
        toast({ title: "Успешно", description: "Тип создан" });
      }
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Что-то пошло не так",
        variant: "destructive",
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending || isUploading;

  return (
    <>
      {showCropper && imageToCrop && (
        <ImageCropper
          open={showCropper}
          imageSrc={imageToCrop}
          onCropComplete={handleCropComplete}
          onClose={() => {
            setShowCropper(false);
            setImageToCrop(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
          cropShape="round"
        />
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex justify-center mb-4">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center border-2 overflow-hidden"
              style={{ 
                backgroundColor: form.watch("bgColor"),
                borderColor: form.watch("borderColor"),
              }}
            >
              {iconUrl ? (
                <img src={iconUrl} alt="Icon" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl" style={{ color: form.watch("color") }}>?</span>
              )}
            </div>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full text-gray-700"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending}
          >
            <Upload className="h-4 w-4 mr-2" />
            Загрузить иконку
          </Button>

          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">Код (slug)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="my_type" className="bg-white text-black" disabled={isEditing} />
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
                <FormLabel className="text-gray-700">Название (Таджикский)</FormLabel>
                <FormControl>
                  <Input {...field} className="bg-white text-black" />
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
                <FormLabel className="text-gray-700">Название (Русский)</FormLabel>
                <FormControl>
                  <Input {...field} className="bg-white text-black" />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nameEn"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">Название (English)</FormLabel>
                <FormControl>
                  <Input {...field} className="bg-white text-black" />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="grid grid-cols-3 gap-2">
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 text-xs">Цвет иконки</FormLabel>
                  <FormControl>
                    <Input type="color" {...field} className="h-10 p-1 cursor-pointer" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bgColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 text-xs">Цвет фона</FormLabel>
                  <FormControl>
                    <Input type="color" {...field} className="h-10 p-1 cursor-pointer" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="borderColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 text-xs">Цвет рамки</FormLabel>
                  <FormControl>
                    <Input type="color" {...field} className="h-10 p-1 cursor-pointer" />
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
                <FormLabel className="text-gray-700">Порядок сортировки</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    className="bg-white text-black" 
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full bg-gray-700 hover:bg-gray-800 text-white" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Сохранить" : "Создать"}
          </Button>
        </form>
      </Form>
    </>
  );
}
