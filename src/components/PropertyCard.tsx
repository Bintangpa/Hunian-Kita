import { Button } from '@/components/ui/button';
import { MapPin, MessageCircle } from 'lucide-react';
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
  
  // Ambil lokasi hanya dari field city
  let address = '';
  if (property.location) {
    // Format dari Index.tsx (nested location object)
    address = property.location.city || '';
  } else {
    // Format dari API langsung - hanya ambil city
    address = property.city || '';
  }
  
  // Parse facilities
  let facilities = [];
  try {
    facilities = typeof property.facilities === 'string' 
      ? JSON.parse(property.facilities) 
      : (property.facilities || []);
  } catch (e) {
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
              e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-muted-foreground"><span class="text-6xl">🏠</span></div>';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <span className="text-6xl">🏠</span>
          </div>
        )}
        
        <div className="absolute top-3 left-3 flex gap-2">
          {property.is_featured === 1 && (
            <span className="px-3 py-1 bg-yellow-500 text-white text-xs font-semibold rounded-full">⭐ Promosi</span>
          )}
          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
            propertyType === 'kost' ? 'bg-blue-500 text-white' :
            propertyType === 'villa' ? 'bg-green-500 text-white' :
            'bg-purple-500 text-white'
          }`}>
            {typeLabel}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-lg text-foreground line-clamp-1">
            {title}
          </h3>
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