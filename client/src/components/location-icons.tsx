import { Building2, TreePine, Snowflake, Building, Fish, Leaf } from "lucide-react";
import type { LocationType } from "@shared/schema";

interface LocationTypeConfig {
  icon: typeof Building2;
  color: string;
  bgColor: string;
  borderColor: string;
  pulseClass: string;
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
    pulseClass: "marker-pulse-kmz",
    labelRu: "КМЗ (Головное управление)",
    labelTj: "КМЗ (Идоракунии асосӣ)",
    labelEn: "CEP (Headquarters)",
  },
  branch: {
    icon: Building,
    color: "text-gray-500",
    bgColor: "bg-gray-100",
    borderColor: "border-gray-400",
    pulseClass: "marker-pulse-branch",
    labelRu: "Филиалы",
    labelTj: "Шуъбаҳо",
    labelEn: "Branch offices",
  },
  reserve: {
    icon: TreePine,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
    borderColor: "border-emerald-500",
    pulseClass: "marker-pulse-reserve",
    labelRu: "Заповедники",
    labelTj: "Мамнунгоҳ",
    labelEn: "Nature reserves",
  },
  glacier: {
    icon: Snowflake,
    color: "text-cyan-500",
    bgColor: "bg-cyan-100",
    borderColor: "border-cyan-400",
    pulseClass: "marker-pulse-glacier",
    labelRu: "Ледники",
    labelTj: "Пиряххо",
    labelEn: "Glaciers",
  },
  fishery: {
    icon: Fish,
    color: "text-blue-500",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-400",
    pulseClass: "marker-pulse-fishery",
    labelRu: "Рыбоводство",
    labelTj: "Моҳипарварӣ",
    labelEn: "Fish farms",
  },
  nursery: {
    icon: Leaf,
    color: "text-lime-600",
    bgColor: "bg-lime-100",
    borderColor: "border-lime-500",
    pulseClass: "marker-pulse-nursery",
    labelRu: "Питомники",
    labelTj: "Ниҳолхона",
    labelEn: "Tree nurseries",
  },
};

interface LocationMarkerProps {
  locationType?: string | null;
  size?: "sm" | "md" | "lg";
  showPulse?: boolean;
}

export function LocationMarker({ locationType = "kmz", size = "md", showPulse = false }: LocationMarkerProps) {
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
    <div className="relative">
      {showPulse && <div className={`absolute inset-0 ${config.pulseClass}`}></div>}
      <div className={`relative z-10 flex ${sizeClasses[size]} items-center justify-center rounded-full ${config.bgColor} shadow-lg border-2 ${config.borderColor} transition-transform group-hover:scale-110`}>
        <Icon className={`${iconSizes[size]} ${config.color}`} />
      </div>
    </div>
  );
}

export function getPulseClass(locationType: string | null | undefined): string {
  const config = LOCATION_TYPE_CONFIG[locationType || "kmz"] || LOCATION_TYPE_CONFIG.kmz;
  return config.pulseClass;
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
