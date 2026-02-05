import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useCreateBook, useUpdateBook } from "@/hooks/use-books";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X } from "lucide-react";
import type { Book } from "@shared/schema";
import { useState, useRef } from "react";

const bookFormSchema = z.object({
  title: z.string().min(1, "Название обязательно"),
  titleRu: z.string().optional(),
  titleEn: z.string().optional(),
  author: z.string().optional(),
  description: z.string().optional(),
  descriptionRu: z.string().optional(),
  descriptionEn: z.string().optional(),
  coverUrl: z.string().optional(),
  documentUrl: z.string().optional(),
  category: z.string().optional(),
  year: z.number().optional(),
  sortOrder: z.number().optional(),
});

type BookFormValues = z.infer<typeof bookFormSchema>;

interface BookFormProps {
  book?: Book;
  onSuccess?: () => void;
}

export function BookForm({ book, onSuccess }: BookFormProps) {
  const { toast } = useToast();
  const createMutation = useCreateBook();
  const updateMutation = useUpdateBook();
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookFormSchema),
    defaultValues: {
      title: book?.title || "",
      titleRu: book?.titleRu || "",
      titleEn: book?.titleEn || "",
      author: book?.author || "",
      description: book?.description || "",
      descriptionRu: book?.descriptionRu || "",
      descriptionEn: book?.descriptionEn || "",
      coverUrl: book?.coverUrl || "",
      documentUrl: book?.documentUrl || "",
      category: book?.category || "general",
      year: book?.year || undefined,
      sortOrder: book?.sortOrder || 0,
    },
  });

  const uploadFile = async (file: File, type: "cover" | "document") => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    const data = await response.json();
    return data.url;
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    try {
      const url = await uploadFile(file, "cover");
      form.setValue("coverUrl", url);
      toast({ title: "Обложка загружена" });
    } catch (error) {
      toast({ title: "Ошибка загрузки", variant: "destructive" });
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingDocument(true);
    try {
      const url = await uploadFile(file, "document");
      form.setValue("documentUrl", url);
      toast({ title: "Документ загружен" });
    } catch (error) {
      toast({ title: "Ошибка загрузки", variant: "destructive" });
    } finally {
      setIsUploadingDocument(false);
    }
  };

  const onSubmit = async (values: BookFormValues) => {
    try {
      const submitData = {
        ...values,
        titleRu: values.titleRu || null,
        titleEn: values.titleEn || null,
        author: values.author || null,
        description: values.description || null,
        descriptionRu: values.descriptionRu || null,
        descriptionEn: values.descriptionEn || null,
        coverUrl: values.coverUrl || null,
        documentUrl: values.documentUrl || null,
        category: values.category || "general",
        year: values.year || null,
        sortOrder: values.sortOrder || 0,
      };

      if (book) {
        await updateMutation.mutateAsync({ id: book.id, data: submitData });
        toast({ title: "Книга обновлена" });
      } else {
        await createMutation.mutateAsync(submitData);
        toast({ title: "Книга добавлена" });
      }
      onSuccess?.();
    } catch (error) {
      toast({ title: "Ошибка сохранения", variant: "destructive" });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const coverUrl = form.watch("coverUrl");
  const documentUrl = form.watch("documentUrl");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-black">Название (TJ)</FormLabel>
              <FormControl>
                <Input {...field} className="text-black" data-testid="input-book-title" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="titleRu"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-black">Название (RU)</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ""} className="text-black" data-testid="input-book-title-ru" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="titleEn"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-black">Название (EN)</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ""} className="text-black" data-testid="input-book-title-en" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="author"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-black">Автор</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ""} className="text-black" data-testid="input-book-author" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="year"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-black">Год</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  {...field} 
                  value={field.value || ""} 
                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                  className="text-black" 
                  data-testid="input-book-year" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-black">Описание (TJ)</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value || ""} className="text-black" rows={3} data-testid="input-book-description" />
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
              <FormLabel className="text-black">Описание (RU)</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value || ""} className="text-black" rows={3} data-testid="input-book-description-ru" />
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
              <FormLabel className="text-black">Описание (EN)</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value || ""} className="text-black" rows={3} data-testid="input-book-description-en" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <FormLabel className="text-black">Обложка</FormLabel>
          <div className="flex items-center gap-2">
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverUpload}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => coverInputRef.current?.click()}
              disabled={isUploadingCover}
              className="text-black"
              data-testid="button-upload-cover"
            >
              {isUploadingCover ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
              Загрузить
            </Button>
            {coverUrl && (
              <div className="flex items-center gap-2">
                <img src={coverUrl} alt="Cover" className="h-10 w-8 object-cover rounded" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => form.setValue("coverUrl", "")}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <FormLabel className="text-black">Документ</FormLabel>
          <div className="flex items-center gap-2">
            <input
              ref={documentInputRef}
              type="file"
              accept="*/*"
              className="hidden"
              onChange={handleDocumentUpload}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => documentInputRef.current?.click()}
              disabled={isUploadingDocument}
              className="text-black"
              data-testid="button-upload-document"
            >
              {isUploadingDocument ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
              Загрузить файл
            </Button>
            {documentUrl && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 truncate max-w-[150px]">{documentUrl.split('/').pop()}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => form.setValue("documentUrl", "")}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <FormField
          control={form.control}
          name="sortOrder"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-black">Порядок сортировки</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  {...field} 
                  value={field.value || 0}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  className="text-black" 
                  data-testid="input-book-sort-order" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          disabled={isPending} 
          className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white"
          data-testid="button-save-book"
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {book ? "Сохранить" : "Добавить"}
        </Button>
      </form>
    </Form>
  );
}