import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { MapPin, Bed, Bath, Maximize, MessageCircle, ArrowLeft, User, AlertCircle, Home } from 'lucide-react';

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    fetch(`http://localhost:3000/api/rumah/${id}`)
      .then(res => res.json())
      .then(data => {
        console.log('📦 Property detail received:', data);
        setProperty(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching property:', err);
        setLoading(false);
      });
  }, [id]);

  // Support both old (camelCase) and new (snake_case) field names
  const title = property?.title || property?.nama || 'Properti';
  // Ambil nama kota untuk ditampilkan di bawah judul
  const cityName = property?.city || property?.location?.city || 'Lokasi';
  // Ambil alamat lengkap untuk ditampilkan di section Lokasi (FIXED: pakai 'alamat' dari backend)
  const fullAddress = property?.alamat || property?.address || cityName;
  const ownerName = property?.owner_name || property?.ownerName || 'Pemilik';
  const ownerWhatsapp = property?.owner_whatsapp || property?.whatsappNumber || '';
  const views = property?.views || 0;
  const whatsappClicks = property?.whatsapp_clicks || property?.whatsappClicks || 0;
  const description = property?.description || '';
  const bedrooms = property?.bedrooms;
  const bathrooms = property?.bathrooms;
  const area = property?.area;
  const propertyType = property?.type?.toLowerCase() || 'kost';
  const uploaderName = property?.uploaderName || property?.uploader_name || '';
  const uploaderRole = property?.uploaderRole || property?.uploader_role || '';
  
  // Parse price safely
  const getPrice = () => {
    const priceValue = property?.price || property?.harga;
    if (!priceValue) return 0;
    if (typeof priceValue === 'number') return priceValue;
    if (typeof priceValue === 'string') {
      const cleaned = priceValue.replace(/[^0-9.]/g, '');
      return parseFloat(cleaned) || 0;
    }
    return 0;
  };
  
  const price = getPrice();
  const priceUnit = property?.price_unit || property?.priceUnit || 'bulan';

  const typeLabels: Record<string, string> = {
    'kost': 'Kost',
    'guesthouse': 'Guest House',
    'guest house': 'Guest House',
    'villa': 'Villa',
  };

  const typeBadgeColors: Record<string, string> = {
  'kost': 'bg-blue-100 text-blue-700 border-blue-200',
  'guesthouse': 'bg-purple-100 text-purple-700 border-purple-200', // ✅ UNGU
  'guest house': 'bg-purple-100 text-purple-700 border-purple-200', // ✅ UNGU
  'villa': 'bg-green-100 text-green-700 border-green-200', // ✅ HIJAU
};

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

  
  const handleWhatsAppClick = () => {
  const propertyUrl = `${window.location.origin}/property/${id}`;
  const message = encodeURIComponent(
    `Halo ${ownerName}, saya tertarik dengan ${title} di ${cityName}. Apakah masih tersedia? ${propertyUrl}`
  );
  if (ownerWhatsapp) {
    window.open(`https://wa.me/${ownerWhatsapp}?text=${message}`, '_blank');
  }
};

  // Parse facilities dari JSON string atau array
  let facilities = [];
  if (property) {
    try {
      const facilitiesData = property.facilities;
      if (typeof facilitiesData === 'string') {
        facilities = JSON.parse(facilitiesData);
      } else if (Array.isArray(facilitiesData)) {
        facilities = facilitiesData;
      }
    } catch (e) {
      facilities = [];
    }
  }

  // Parse images dengan logic yang sama seperti PropertyCard
  let imagesList = [];
  
  if (property) {
    try {
      if (property.images) {
        if (typeof property.images === 'string') {
          imagesList = JSON.parse(property.images);
        } else if (Array.isArray(property.images)) {
          imagesList = property.images;
        }
      }
      
      if (imagesList.length === 0 && property.image) {
        if (typeof property.image === 'string') {
          if (property.image.startsWith('[')) {
            imagesList = JSON.parse(property.image);
          } else {
            imagesList = [property.image];
          }
        }
      }
    } catch (e) {
      console.error('Error parsing images:', e);
      imagesList = [];
    }
    
    // Process each image to handle relative paths
    imagesList = imagesList.map((img: string) => {
      if (!img) return '';
      
      if (img.startsWith('http')) {
        return img;
      }
      
      if (!img.startsWith('/uploads/')) {
        img = `/uploads/${img}`;
      }
      
      return `http://localhost:3000${img}`;
    }).filter(Boolean);
  }
  
  if (imagesList.length === 0) {
    imagesList = ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80'];
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Content - Always render but hidden saat loading */}
      <div className={`transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}>
        {/* Property Not Found */}
        {!loading && !property ? (
          <main className="flex-1 flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Properti Tidak Ditemukan</h2>
              <p className="text-muted-foreground mb-4">Properti yang Anda cari tidak tersedia.</p>
              <Button onClick={() => navigate('/')}>Kembali ke Beranda</Button>
            </div>
          </main>
        ) : (
          <>
            {/* Back Button */}
            <div className="container mx-auto max-w-4xl px-4 pt-4">
              <Button 
                variant="outline" 
                onClick={() => navigate(-1)} 
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali
              </Button>
            </div>

            {/* Main Content */}
            <div className="container mx-auto max-w-4xl px-4 py-6">
              <div className="space-y-6">
                {/* Image Gallery */}
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <img
                    src={imagesList[currentImageIndex]}
                    alt={title}
                    className="w-full h-[500px] object-cover"
                    onError={(e) => {
                      console.error('Image load error:', imagesList[currentImageIndex]);
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80';
                    }}
                  />
                  
                  {/* Image Navigation Dots */}
                  {imagesList.length > 1 && (
                    <div className="flex justify-center gap-2 py-3 bg-card">
                      {imagesList.map((_: any, index: number) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`h-2 rounded-full transition-all ${
                            index === currentImageIndex 
                              ? 'bg-primary w-8' 
                              : 'bg-muted w-2 hover:bg-muted-foreground/50'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Property Title & Badge */}
                <div className="flex items-start justify-between gap-6">
                  {/* Left: Title, Type, Address */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${
                        typeBadgeColors[propertyType] || typeBadgeColors.kost
                      }`}>
                        {typeLabels[propertyType] || 'Properti'}
                      </span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">{title}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-5 h-5" />
                      <span>{cityName}</span>
                    </div>
                  </div>
                  
                  {/* Right: Uploader Information */}
                  {uploaderName && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground mb-1">Diupload oleh</p>
                      <p className="text-lg font-semibold text-foreground">{uploaderName}</p>
                      {uploaderRole && (
                        <p className="text-xs text-muted-foreground capitalize">
                          {uploaderRole === 'mitra' ? 'Mitra' : 'User'}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Price & Quick Info */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-end justify-between mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Harga Sewa</p>
                      <p className="text-4xl font-bold text-primary">
                        {formatPrice(price)}
                      </p>
                      <p className="text-muted-foreground">/ {priceUnit}</p>
                    </div>
                    <Button
                      onClick={handleWhatsAppClick}
                      size="lg"
                      className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                      disabled={!ownerWhatsapp}
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span className="hidden md:inline">Hubungi Pemilik</span>
                      <span className="md:hidden">Hubungi</span>
                    </Button>
                  </div>
                  
                  {/* Specs Icons */}
                  {(bedrooms || bathrooms || area) && (
                    <div className="flex items-center gap-6 pt-4 border-t border-border">
                      {bedrooms && (
                        <div className="flex items-center gap-2 text-foreground">
                          <Bed className="w-5 h-5 text-primary" />
                          <div>
                            <p className="text-xl font-bold">{bedrooms}</p>
                            <p className="text-xs text-muted-foreground">Kamar</p>
                          </div>
                        </div>
                      )}
                      {bathrooms && (
                        <div className="flex items-center gap-2 text-foreground">
                          <Bath className="w-5 h-5 text-primary" />
                          <div>
                            <p className="text-xl font-bold">{bathrooms}</p>
                            <p className="text-xs text-muted-foreground">K. Mandi</p>
                          </div>
                        </div>
                      )}
                      {area && (
                        <div className="flex items-center gap-2 text-foreground">
                          <Maximize className="w-5 h-5 text-primary" />
                          <div>
                            <p className="text-xl font-bold">{area}</p>
                            <p className="text-xs text-muted-foreground">m²</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Description */}
                {description && (
                  <div className="bg-card border border-border rounded-xl p-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Home className="w-5 h-5 text-primary" />
                      Tentang Properti
                    </h2>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                      {description}
                    </p>
                  </div>
                )}

                {/* Location */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Lokasi
                  </h2>
                  <p className="text-foreground font-medium">{fullAddress}</p>
                </div>

                {/* Facilities */}
                {facilities.length > 0 && (
                  <div className="bg-card border border-border rounded-xl p-6">
                    <h2 className="text-xl font-bold mb-4">Fasilitas</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {facilities.map((facility: string, index: number) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 px-4 py-3 bg-secondary/50 rounded-lg text-sm font-medium"
                        >
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          {facility}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Owner Card */}
                <div className="bg-card border border-border rounded-xl overflow-hidden shadow-lg">
                  <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-6 border-b border-border">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Dihubungi oleh</p>
                        <p className="text-lg font-bold text-foreground">{ownerName}</p>
                        <p className="text-xs text-muted-foreground">Pemilik Properti</p>
                      </div>
                    </div>
                    
                    <Button
                      onClick={handleWhatsAppClick}
                      className="w-full h-12 gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold"
                      disabled={!ownerWhatsapp}
                    >
                      <MessageCircle className="w-5 h-5" />
                      Hubungi via WhatsApp
                    </Button>
                  </div>

                  <div className="p-6">
                    <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                      <p className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>Hubungi pemilik untuk info lebih lanjut dan jadwal kunjungan</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}