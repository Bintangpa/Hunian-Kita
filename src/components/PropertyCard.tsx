import { Button } from '@/components/ui/button';
import { MapPin, MessageCircle, Zap, Star, Clock, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PropertyCardProps {
  property: any;
}

const typeLabels: Record<string, string> = {
  'kost': 'Kost',
  'guesthouse': 'Guest House',
  'guest house': 'Guest House',
  'villa': 'Villa',
};

export function PropertyCard({ property }: PropertyCardProps) {
  const navigate = useNavigate();
  
  // ✅ PINDAHKAN KE SINI (di dalam function)
  const isBoosted = property.is_boosted === 1;
  const boostDaysRemaining = property.boost_days_remaining || 0;
  
  // Format timestamp upload
  const formatTimeAgo = (uploadDate: string | Date): string => {
    if (!uploadDate) return '';
    
    const now = new Date();
    const uploaded = new Date(uploadDate);
    const diffInMs = now.getTime() - uploaded.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    // Jika kurang dari 1 jam
    if (diffInMinutes < 60) {
      if (diffInMinutes < 1) return 'Baru saja';
      return `${diffInMinutes} menit yang lalu`;
    }
    
    // Jika kurang dari 24 jam (1 hari)
    if (diffInHours < 24) {
      return `${diffInHours} jam yang lalu`;
    }
    
    // Jika kurang dari atau sama dengan 7 hari
    if (diffInDays <= 7) {
      return `${diffInDays} hari yang lalu`;
    }
    
    // Jika lebih dari 7 hari, tampilkan tanggal
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    };
    return uploaded.toLocaleDateString('id-ID', options);
  };
  
  // Parse price safely
  const getPrice = () => {
    const priceValue = property.price || property.harga;
    if (!priceValue) return 0;
    
    if (typeof priceValue === 'number') return priceValue;
    
    if (typeof priceValue === 'string') {
      const cleaned = priceValue.replace(/[^0-9.]/g, '');
      return parseFloat(cleaned) || 0;
    }
    
    return 0;
  };
  
  const price = getPrice();
  const priceUnit = property.price_unit || property.priceUnit || 'bulan';
  const ownerName = property.owner_name || property.ownerName || 'Pemilik';
  const ownerWhatsapp = property.owner_whatsapp || property.whatsappNumber || '';
  const title = property.title || property.nama || 'Properti';
  const uploadedAt = property.created_at || property.createdAt || '';
  const timeAgo = formatTimeAgo(uploadedAt);
  
  // Ambil lokasi hanya dari field city
  let address = '';
  if (property.location) {
    // Format dari Index.tsx (nested location object)
    address = property.location.city || '';
  } else {
    // Format dari API langsung - hanya ambil city
    address = property.city || '';
  }
  
  // Parse facilities dengan validasi ketat
  let facilities: string[] = [];
  try {
    const facilitiesData = property.facilities;
    
    if (Array.isArray(facilitiesData)) {
      // Sudah array, langsung pakai
      facilities = facilitiesData;
    } else if (typeof facilitiesData === 'string' && facilitiesData.trim()) {
      // String, coba parse JSON
      const parsed = JSON.parse(facilitiesData);
      if (Array.isArray(parsed)) {
        facilities = parsed;
      }
    }
  } catch (e) {
    console.error('Error parsing facilities:', e);
    facilities = [];
  }
  
  // ✅ FINAL CHECK: Pastikan facilities adalah array
  if (!Array.isArray(facilities)) {
    facilities = [];
  }
  
  // ✅ FIXED: Handle image properly
  let imageUrl = property.image || property.images;
  
  // If it's images array from API response, get first one
  if (Array.isArray(property.images) && property.images.length > 0) {
    imageUrl = property.images[0];
  }
  // If image is JSON string array, parse and get first
  else if (typeof imageUrl === 'string' && imageUrl.startsWith('[')) {
    try {
      const parsed = JSON.parse(imageUrl);
      imageUrl = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : '';
    } catch (e) {
      imageUrl = '';
    }
  }
  
  // ✅ CRITICAL FIX: Handle filename without path
  if (imageUrl && typeof imageUrl === 'string') {
    // If it's just a filename (no path), prepend /uploads/
    if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/uploads/')) {
      imageUrl = `/uploads/${imageUrl}`;
    }
    
    // If it's a relative path /uploads/..., prepend backend URL
    if (imageUrl.startsWith('/uploads/')) {
      imageUrl = `http://localhost:3000${imageUrl}`;
    }
  }
  
  const hasImage = imageUrl && imageUrl.trim() !== '';
  const propertyType = property.type?.toLowerCase() || 'kost';
  const typeLabel = typeLabels[propertyType] || 'Properti';

  const formatPrice = (priceValue: number): string => {
    if (!priceValue || isNaN(priceValue) || priceValue === 0) {
      return 'Harga belum tersedia';
    }
    
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(priceValue);
  };

  
  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const propertyUrl = `${window.location.origin}/property/${property.id}`;
    const message = encodeURIComponent(
      `Halo ${ownerName}, saya tertarik dengan ${title} di ${address}. Apakah masih tersedia? ${propertyUrl}`
    );
    if (ownerWhatsapp) {
      window.open(`https://wa.me/${ownerWhatsapp}?text=${message}`, '_blank');
    }
  };

  const handleCardClick = () => {
    navigate(`/property/${property.id}`);
  };

  return (
    <article 
      className="bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-border"
      onClick={handleCardClick}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        {hasImage ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
            onError={(e) => {
              console.error('Image load error:', imageUrl);
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-muted-foreground"><svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></div>';
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Home className="w-16 h-16" />
          </div>
        )}
        
        {/* ✅ BADGES SECTION - FIXED CLOSING TAG */}
        <div className="absolute top-3 left-3 flex gap-2">
          {/* Badge Boost - Prioritas tertinggi */}
          {isBoosted && (
            <span className="px-3 py-1 bg-yellow-500 text-white text-xs font-semibold rounded-full flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Boost
            </span>
          )}
          
          {/* Badge Promosi - ✅ PAKAI ICON STAR */}
          {property.is_featured === 1 && (
            <span className="px-3 py-1 bg-orange-500 text-white text-xs font-semibold rounded-full flex items-center gap-1">
              <Star className="w-3 h-3 fill-white" />
              Promosi
            </span>
          )}
          
          {/* Badge Tipe */}
          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
            propertyType === 'kost' ? 'bg-blue-500 text-white' :
            propertyType === 'villa' ? 'bg-green-500 text-white' :
            'bg-purple-500 text-white'
          }`}>
            {typeLabel}
          </span>
        </div>
      </div>

      {/* ✅ CARD BODY - FIXED STRUCTURE */}
      <div className="p-4 space-y-3">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-lg text-foreground line-clamp-1 flex-1">
              {title}
            </h3>
            {timeAgo && (
              <div className="flex items-center gap-1 text-muted-foreground text-xs whitespace-nowrap">
                <Clock className="w-3 h-3" />
                <span>{timeAgo}</span>
              </div>
            )}
          </div>
          {address && (
            <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
              <MapPin className="w-4 h-4" />
              <span className="line-clamp-1">{address}</span>
            </div>
          )}
        </div>

        {facilities.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {facilities.slice(0, 3).map((facility: string, index: number) => (
              <span
                key={`${facility}-${index}`}
                className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-md"
              >
                {facility}
              </span>
            ))}
            {facilities.length > 3 && (
              <span className="text-xs text-muted-foreground px-2 py-1">
                +{facilities.length - 3} lainnya
              </span>
            )}
          </div>
        )}

        <div className="pt-2 border-t border-border">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold text-primary">
                {formatPrice(price)}
              </p>
              <p className="text-sm text-muted-foreground">
                / {priceUnit}
              </p>
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={handleWhatsAppClick}
              className="gap-1.5 bg-green-600 hover:bg-green-700"
              disabled={!ownerWhatsapp}
            >
              <MessageCircle className="w-4 h-4" />
              Hubungi
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}