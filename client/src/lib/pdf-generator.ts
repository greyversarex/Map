import jsPDF from "jspdf";
import type { Location, LocationType } from "@shared/schema";
import { notoSansRegular } from "./noto-font";

interface PDFGeneratorOptions {
  locations: Location[];
  locationTypes: LocationType[];
  language: string;
}

async function getLocationImageUrl(location: Location): Promise<string | null> {
  if (location.imageUrl && location.imageUrl.trim() !== '') {
    return location.imageUrl;
  }
  
  try {
    const response = await fetch(`/api/locations/${location.id}/media`);
    if (response.ok) {
      const media = await response.json();
      const primaryPhoto = media.find((m: any) => m.mediaType === 'photo' && m.isPrimary);
      if (primaryPhoto?.url) return primaryPhoto.url;
      const anyPhoto = media.find((m: any) => m.mediaType === 'photo');
      if (anyPhoto?.url) return anyPhoto.url;
    }
  } catch (e) {
    console.log('Could not fetch media for location:', location.id);
  }
  
  return null;
}

function getLocalizedName(location: Location, language: string): string {
  if (language === 'ru' && location.nameRu) return location.nameRu;
  if (language === 'en' && location.nameEn) return location.nameEn;
  return location.name;
}

function getLocalizedDescription(location: Location, language: string): string | null {
  if (language === 'ru' && location.descriptionRu) return location.descriptionRu;
  if (language === 'en' && location.descriptionEn) return location.descriptionEn;
  return location.description;
}

function getLocalizedTypeName(locationType: LocationType | undefined, language: string): string {
  if (!locationType) return "";
  if (language === 'ru' && locationType.nameRu) return locationType.nameRu;
  if (language === 'en' && locationType.nameEn) return locationType.nameEn;
  return locationType.name;
}

async function loadImageAsBase64(url: string): Promise<string | null> {
  if (!url || url.trim() === '') return null;
  
  try {
    const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
    
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(dataUrl);
        } catch (e) {
          console.log('Canvas error for:', url);
          resolve(null);
        }
      };
      
      img.onerror = () => {
        console.log('Image load failed:', url);
        resolve(null);
      };
      
      setTimeout(() => resolve(null), 5000);
      
      img.src = fullUrl;
    });
  } catch (e) {
    console.error('Image load error:', e);
    return null;
  }
}

export async function generateLocationsPDF({ locations, locationTypes, language }: PDFGeneratorOptions): Promise<void> {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  pdf.addFileToVFS("NotoSans-Regular.ttf", notoSansRegular);
  pdf.addFont("NotoSans-Regular.ttf", "NotoSans", "normal");
  pdf.addFont("NotoSans-Regular.ttf", "NotoSans", "bold");

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  const locationTypeMap = locationTypes.reduce((acc, type) => {
    acc[type.slug] = type;
    return acc;
  }, {} as Record<string, LocationType>);

  const labels = {
    title: language === 'ru' ? 'Локации Таджикистана' : language === 'en' ? 'Locations of Tajikistan' : 'Ҷойҳои Тоҷикистон',
    type: language === 'ru' ? 'Тип' : language === 'en' ? 'Type' : 'Навъ',
    coordinates: language === 'ru' ? 'Координаты' : language === 'en' ? 'Coordinates' : 'Координатҳо',
    founded: language === 'ru' ? 'Год основания' : language === 'en' ? 'Founded' : 'Соли таъсис',
    workers: language === 'ru' ? 'Работников' : language === 'en' ? 'Workers' : 'Корбар',
    area: language === 'ru' ? 'Площадь' : language === 'en' ? 'Area' : 'Масоҳат',
    description: language === 'ru' ? 'Описание' : language === 'en' ? 'Description' : 'Тавсиф',
    page: language === 'ru' ? 'Страница' : language === 'en' ? 'Page' : 'Саҳифа',
    generatedOn: language === 'ru' ? 'Создано' : language === 'en' ? 'Generated on' : 'Сохта шуд',
  };

  pdf.setFont("NotoSans", "bold");
  pdf.setFontSize(24);
  pdf.setTextColor(33, 33, 33);
  pdf.text(labels.title, pageWidth / 2, 40, { align: "center" });
  
  pdf.setFontSize(12);
  pdf.setFont("NotoSans", "normal");
  pdf.setTextColor(100, 100, 100);
  const date = new Date().toLocaleDateString(language === 'ru' ? 'ru-RU' : language === 'en' ? 'en-US' : 'tg-TJ');
  pdf.text(`${labels.generatedOn}: ${date}`, pageWidth / 2, 50, { align: "center" });
  pdf.text(`${locations.length} ${language === 'ru' ? 'локаций' : language === 'en' ? 'locations' : 'ҷойҳо'}`, pageWidth / 2, 58, { align: "center" });

  for (let i = 0; i < locations.length; i++) {
    const location = locations[i];
    const locationType = locationTypeMap[location.locationType || 'kmz'];
    
    pdf.addPage();
    
    let yPos = margin;

    pdf.setFillColor(locationType?.color || '#22c55e');
    pdf.rect(0, 0, pageWidth, 8, 'F');

    yPos += 15;

    pdf.setFont("NotoSans", "bold");
    pdf.setFontSize(20);
    pdf.setTextColor(33, 33, 33);
    const name = getLocalizedName(location, language);
    pdf.text(name, margin, yPos);
    yPos += 8;

    pdf.setFont("NotoSans", "normal");
    pdf.setFontSize(11);
    pdf.setTextColor(100, 100, 100);
    const typeName = getLocalizedTypeName(locationType, language);
    if (typeName) {
      pdf.text(`${labels.type}: ${typeName}`, margin, yPos);
      yPos += 6;
    }
    pdf.text(`${labels.coordinates}: ${location.lat.toFixed(4)}° N, ${location.lng.toFixed(4)}° E`, margin, yPos);
    yPos += 12;

    const imageUrl = await getLocationImageUrl(location);
    if (imageUrl) {
      try {
        const imageData = await loadImageAsBase64(imageUrl);
        if (imageData) {
          const imgWidth = contentWidth;
          const imgHeight = 80;
          pdf.addImage(imageData, 'JPEG', margin, yPos, imgWidth, imgHeight, undefined, 'MEDIUM');
          yPos += imgHeight + 10;
        }
      } catch (e) {
        console.log('Could not load image:', imageUrl);
      }
    }

    const hasStats = location.foundedYear || location.workerCount || location.area;
    if (hasStats) {
      pdf.setFillColor(245, 245, 245);
      pdf.roundedRect(margin, yPos, contentWidth, 25, 3, 3, 'F');
      
      let statX = margin + 10;
      const statY = yPos + 10;
      
      if (location.foundedYear) {
        pdf.setFont("NotoSans", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(120, 120, 120);
        pdf.text(labels.founded, statX, statY);
        pdf.setFont("NotoSans", "bold");
        pdf.setFontSize(14);
        pdf.setTextColor(33, 33, 33);
        pdf.text(String(location.foundedYear), statX, statY + 8);
        statX += 50;
      }
      
      if (location.workerCount) {
        pdf.setFont("NotoSans", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(120, 120, 120);
        pdf.text(labels.workers, statX, statY);
        pdf.setFont("NotoSans", "bold");
        pdf.setFontSize(14);
        pdf.setTextColor(33, 33, 33);
        pdf.text(String(location.workerCount), statX, statY + 8);
        statX += 50;
      }
      
      if (location.area) {
        pdf.setFont("NotoSans", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(120, 120, 120);
        pdf.text(labels.area, statX, statY);
        pdf.setFont("NotoSans", "bold");
        pdf.setFontSize(14);
        pdf.setTextColor(33, 33, 33);
        pdf.text(`${location.area} м²`, statX, statY + 8);
      }
      
      yPos += 35;
    }

    const description = getLocalizedDescription(location, language);
    if (description) {
      pdf.setFont("NotoSans", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(33, 33, 33);
      pdf.text(labels.description, margin, yPos);
      yPos += 7;
      
      pdf.setFont("NotoSans", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);
      
      const lines = pdf.splitTextToSize(description, contentWidth);
      const maxLines = Math.floor((pageHeight - yPos - 30) / 5);
      const displayLines = lines.slice(0, maxLines);
      
      pdf.text(displayLines, margin, yPos);
    }

    pdf.setFont("NotoSans", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`${labels.page} ${i + 1} / ${locations.length}`, pageWidth / 2, pageHeight - 10, { align: "center" });
  }

  pdf.save(`tajikistan-locations-${Date.now()}.pdf`);
}