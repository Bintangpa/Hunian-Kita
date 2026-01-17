export type PropertyType = 'kost' | 'guesthouse' | 'villa';

export interface Property {
  id: string;
  title: string;
  type: PropertyType;
  price: number;
  priceUnit: 'bulan' | 'malam' | 'tahun';
  location: {
    city: string;
    district: string;
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  images: string[];
  facilities: string[];
  description: string;
  whatsappNumber: string;
  ownerName: string;
  isSponsored: boolean;
  views: number;
  whatsappClicks: number;
  createdAt: Date;
  expiresAt?: Date;
}

export interface PropertyFilter {
  city?: string;
  type?: PropertyType;
  minPrice?: number;
  maxPrice?: number;
  facilities?: string[];
}
