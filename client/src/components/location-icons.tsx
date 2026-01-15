import { Building2, TreePine, Mountain, Snowflake, Building } from "lucide-react";
import type { LocationType } from "@shared/schema";

interface LocationTypeConfig {
  icon: typeof Building2;
  color: string;
  bgColor: string;
  borderColor: string;
  labelRu: string;
  labelTj: string;
  labelEn: string;
}

export const LOCATION_TYPE_CONFIG: Record<string, LocationTypeConfig> = {
  kmz: {
    icon: Building2,
    color: "text-green-600",
    bgColor: "bg-green-100",
    borderColor: "border-green-500",
    labelRu: "КМЗ (Головное управление)",
    labelTj: "КМЗ (Идоракунии асосӣ)",
    labelEn: "CEP (Headquarters)",
  },
  branch: {
    icon: Building,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-500",
    labelRu: "Шуъбахо (Филиалы)",
    labelTj: "Шуъбаҳо",
    labelEn: "Branch offices",
  },
  reserve: {
    icon: TreePine,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
    borderColor: "border-emerald-500",
    labelRu: "Мамнунгох (Заповедники)",
    labelTj: "Мамнунгоҳ",
    labelEn: "Nature reserves",
  },
  glacier: {
    icon: Snowflake,
    color: "text-cyan-500",
    bgColor: "bg-cyan-100",
    borderColor: "border-cyan-400",
    labelRu: "Пиряххо (Ледники)",
    labelTj: "Пиряххо",
    labelEn: "Glaciers",
  },
};

interface LocationMarkerProps {
  locationType?: string | null;
  size?: "sm" | "md" | "lg";
}

export function LocationMarker({ locationType = "kmz", size = "md" }: LocationMarkerProps) {
  const config = LOCATION_TYPE_CONFIG[locationType || "kmz"] || LOCATION_TYPE_CONFIG.kmz;
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };
  
  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <div className={`relative z-10 flex ${sizeClasses[size]} items-center justify-center rounded-full ${config.bgColor} shadow-lg border-2 ${config.borderColor} transition-transform group-hover:scale-110`}>
      <Icon className={`${iconSizes[size]} ${config.color}`} />
    </div>
  );
}

export function getLocationTypeLabel(locationType: string | null | undefined, language: string = "ru"): string {
  const config = LOCATION_TYPE_CONFIG[locationType || "kmz"] || LOCATION_TYPE_CONFIG.kmz;
  
  switch (language) {
    case "tj":
      return config.labelTj;
    case "en":
      return config.labelEn;
    default:
      return config.labelRu;
  }
}
