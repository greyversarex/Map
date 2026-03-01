import { useState } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LocationMedia } from "@shared/schema";

interface MediaCarouselProps {
  media: LocationMedia[];
  fallbackImageUrl?: string | null;
  fallbackVideoUrl?: string | null;
  className?: string;
}

export function MediaCarousel({ media, fallbackImageUrl, fallbackVideoUrl, className = "" }: MediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const allMedia: { type: "photo" | "video"; url: string; id?: number }[] = [];
  
  if (media && media.length > 0) {
    const sortedMedia = [...media].sort((a, b) => {
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      return (a.sortOrder || 0) - (b.sortOrder || 0);
    });
    
    sortedMedia.forEach((m) => {
      allMedia.push({
        type: m.mediaType as "photo" | "video",
        url: m.url,
        id: m.id,
      });
    });
  } else {
    if (fallbackImageUrl) {
      allMedia.push({ type: "photo", url: fallbackImageUrl });
    }
    if (fallbackVideoUrl) {
      allMedia.push({ type: "video", url: fallbackVideoUrl });
    }
  }

  if (allMedia.length === 0) {
    return null;
  }

  const currentMedia = allMedia[currentIndex];
  const hasMultiple = allMedia.length > 1;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? allMedia.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === allMedia.length - 1 ? 0 : prev + 1));
  };

  const isYouTube = (url: string) => {
    return url.includes("youtube") || url.includes("youtu.be");
  };

  const getYouTubeEmbedUrl = (url: string) => {
    if (url.includes("watch?v=")) {
      return url.replace("watch?v=", "embed/");
    }
    if (url.includes("youtu.be/")) {
      const id = url.split("youtu.be/")[1];
      return `https://www.youtube.com/embed/${id}`;
    }
    return url;
  };

  return (
    <div className={`relative overflow-hidden rounded-xl border border-gray-200 shadow-xl ${className}`}>
      <div className="relative aspect-video bg-black">
        {currentMedia.type === "photo" ? (
          <img
            src={currentMedia.url}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : isYouTube(currentMedia.url) ? (
          <iframe
            src={getYouTubeEmbedUrl(currentMedia.url)}
            className="w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        ) : (
          <video
            src={currentMedia.url}
            controls
            className="w-full h-full object-contain"
          >
            Your browser does not support the video tag.
          </video>
        )}

        {hasMultiple && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg z-10"
              onClick={goToPrevious}
              data-testid="button-media-prev"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg z-10"
              onClick={goToNext}
              data-testid="button-media-next"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>

      {hasMultiple && (
        <div className="flex justify-center gap-2 p-3 bg-white/80">
          {allMedia.map((m, index) => (
            <button
              key={m.id || index}
              onClick={() => setCurrentIndex(index)}
              className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? "border-gray-700 ring-2 ring-gray-400"
                  : "border-gray-200 hover:border-gray-400"
              }`}
              data-testid={`media-thumb-${index}`}
            >
              {m.type === "photo" ? (
                <img src={m.url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <Play className="h-4 w-4 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
