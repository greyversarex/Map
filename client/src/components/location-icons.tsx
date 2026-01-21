import { Building2, TreePine, Snowflake, Building, Fish, Leaf, MapPin } from "lucide-react";
import type { LocationType as LocationTypeDB } from "@shared/schema";

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

// Default icons for fallback when no custom icon is set
export const DEFAULT_ICONS: Record<string, typeof Building2> = {
  kmz: Building2,
  branch: Building,
  reserve: TreePine,
  glacier: Snowflake,
  fishery: Fish,
  nursery: Leaf,
};

// Legacy config for backward compatibility (used when types not loaded from DB)
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

// Helper to get config from database type
export function getConfigFromDBType(dbType: LocationTypeDB): LocationTypeConfig {
  const fallback = LOCATION_TYPE_CONFIG[dbType.slug] || LOCATION_TYPE_CONFIG.kmz;
  return {
    icon: DEFAULT_ICONS[dbType.slug] || MapPin,
    color: `text-[${dbType.color}]`,
    bgColor: `bg-[${dbType.bgColor}]`,
    borderColor: `border-[${dbType.borderColor}]`,
    pulseClass: `marker-pulse-${dbType.slug}`,
    labelRu: dbType.nameRu || dbType.name,
    labelTj: dbType.name,
    labelEn: dbType.nameEn || dbType.name,
  };
}

interface LocationMarkerProps {
  locationType?: string | null;
  size?: "sm" | "md" | "lg";
  showPulse?: boolean;
  customColor?: string | null;
  customBgColor?: string | null;
  customBorderColor?: string | null;
  customIconUrl?: string | null;
}

export function LocationMarker({ 
  locationType = "kmz", 
  size = "md", 
  showPulse = false,
  customColor,
  customBgColor,
  customBorderColor,
  customIconUrl
}: LocationMarkerProps) {
  const config = LOCATION_TYPE_CONFIG[locationType || "kmz"];
  const Icon = config?.icon || DEFAULT_ICONS[locationType || "kmz"] || MapPin;
  
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

  const imgSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  // Use custom colors if provided, otherwise fall back to config or defaults
  const useInlineStyles = !config || customColor || customBgColor || customBorderColor;
  const bgColor = customBgColor || config?.bgColor?.replace('bg-', '') || '#f3f4f6';
  const borderColor = customBorderColor || config?.borderColor?.replace('border-', '') || '#9ca3af';
  const iconColor = customColor || '#6b7280';

  // Render custom icon image if provided
  const renderIcon = () => {
    if (customIconUrl) {
      return (
        <img 
          src={customIconUrl} 
          alt="" 
          className={`${imgSizes[size]} object-contain`}
        />
      );
    }
    return <Icon className={iconSizes[size]} style={{ color: iconColor }} />;
  };

  if (useInlineStyles && !config) {
    // For dynamic types without static config, use inline styles
    return (
      <div className="relative">
        {showPulse && <div className="absolute inset-0 animate-ping opacity-75 rounded-full" style={{ backgroundColor: bgColor }}></div>}
        <div 
          className={`relative z-10 flex ${sizeClasses[size]} items-center justify-center rounded-full shadow-lg border-2 transition-transform group-hover:scale-110`}
          style={{ backgroundColor: bgColor, borderColor: borderColor }}
        >
          {renderIcon()}
        </div>
      </div>
    );
  }

  // For static types, use class names (but still support custom icon)
  const fallbackConfig = config || LOCATION_TYPE_CONFIG.kmz;
  return (
    <div className="relative">
      {showPulse && <div className={`absolute inset-0 ${fallbackConfig.pulseClass}`}></div>}
      <div className={`relative z-10 flex ${sizeClasses[size]} items-center justify-center rounded-full ${fallbackConfig.bgColor} shadow-lg border-2 ${fallbackConfig.borderColor} transition-transform group-hover:scale-110`}>
        {customIconUrl ? (
          <img src={customIconUrl} alt="" className={`${imgSizes[size]} object-contain`} />
        ) : (
          <Icon className={`${iconSizes[size]} ${fallbackConfig.color}`} />
        )}
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
