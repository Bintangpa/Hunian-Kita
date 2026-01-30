import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  MapPin,
  Home,
  Bath,
  Maximize,
  Calendar,
  Building2,
  Zap,
  Star,
  Edit,
  Trash2,
  Phone,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Property {
  id: number;
  nama: string;
  type: string;
  alamat: string;
  city: string;
  district: string;
  harga: number;
  priceUnit: string;
  description: string;
  facilities: string[];
  images: string[];
  ownerName: string;
  whatsappNumber: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  status: string;
  views: number;
  whatsappClicks: number;
  createdAt: string;
  is_boosted: number;
  is_featured: number;
  boost_days_remaining: number;
  boosted_until: string;
}

export default function Propertydetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [boostTimeRemaining, setBoostTimeRemaining] = useState<string>('');

  useEffect(() => {
    fetchPropertyDetail();
  }, [id]);

  // ✅ REALTIME BOOST COUNTDOWN
  useEffect(() => {
    if (!property || !property.boosted_until || property.is_boosted !== 1) {
      setBoostTimeRemaining('');
      return;
    }

    const updateCountdown = () => {
      const now = new Date().getTime();
      const boostEnd = new Date(property.boosted_until).getTime();
      const distance = boostEnd - now;

      if (distance < 0) {
        setBoostTimeRemaining('Boost telah berakhir');
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      
      setBoostTimeRemaining(`${days} hari ${hours} jam ${minutes} menit ${seconds} detik`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000); // Update setiap 1 detik

    return () => clearInterval(interval);
  }, [property]);

  const fetchPropertyDetail = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/properties/${id}`);
      const data = await response.json();
      
      if (data) {
        // ✅ Parse facilities dengan validasi ketat
        let facilitiesArray: string[] = [];
        try {
          const facilitiesData = data.facilities;
          
          if (Array.isArray(facilitiesData)) {
            facilitiesArray = facilitiesData;
          } else if (typeof facilitiesData === 'string' && facilitiesData.trim()) {
            const parsed = JSON.parse(facilitiesData);
            if (Array.isArray(parsed)) {
              facilitiesArray = parsed;
            }
          }
        } catch (e) {
          console.error('Error parsing facilities:', e);
          facilitiesArray = [];
        }
        
        // ✅ Final check
        if (!Array.isArray(facilitiesArray)) {
          facilitiesArray = [];
        }

        // ✅ Parse images dengan validasi ketat
        let imagesArray: string[] = [];
        try {
          const imagesData = data.images;
          
          if (Array.isArray(imagesData)) {
            imagesArray = imagesData;
          } else if (typeof imagesData === 'string' && imagesData.trim()) {
            const parsed = JSON.parse(imagesData);
            if (Array.isArray(parsed)) {
              imagesArray = parsed;
            }
          }
        } catch (e) {
          console.error('Error parsing images:', e);
          imagesArray = [];
        }
        
        // ✅ Final check
        if (!Array.isArray(imagesArray)) {
          imagesArray = [];
        }

        const parsedProperty = {
          ...data,
          facilities: facilitiesArray,
          images: imagesArray
        };
        
        setProperty(parsedProperty);
      }
    } catch (error) {
      console.error('Error fetching property:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat detail properti',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProperty = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`http://localhost:3000/api/properties/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Sukses',
          description: 'Properti berhasil dihapus',
        });
        navigate('/mitra/dashboard');
      } else {
        throw new Error('Gagal menghapus properti');
      }
    } catch (error) {
      console.error('Error deleting property:', error);
      toast({
        title: 'Error',
        description: 'Gagal menghapus properti',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getImageUrl = (imagePath: string): string => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/uploads/')) {
      return `http://localhost:3000${imagePath}`;
    }
    return `http://localhost:3000/uploads/${imagePath}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Properti tidak ditemukan</h2>
          <Button onClick={() => navigate('/mitra/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/mitra/dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate(`/mitra/dashboard/edit/${property.id}`)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Hapus
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content - LAYOUT 1 KOLOM */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          
          {/* Image Gallery */}
          <Card>
            <CardContent className="p-0">
              <div className="relative aspect-video bg-secondary">
                {property.images.length > 0 ? (
                  <>
                    <img
                      src={getImageUrl(property.images[currentImageIndex])}
                      alt={property.nama}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    
                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
                      {property.is_boosted === 1 && (
                        <Badge className="bg-yellow-500 hover:bg-yellow-600">
                          <Zap className="w-3 h-3 mr-1" />
                          Boost
                        </Badge>
                      )}
                      {property.is_featured === 1 && (
                        <Badge className="bg-orange-500 hover:bg-orange-600">
                          <Star className="w-3 h-3 mr-1" />
                          Promosi
                        </Badge>
                      )}
                      <Badge variant={property.status === 'active' ? 'default' : 'secondary'}>
                        {property.status === 'available' ? 'Tersedia' : 'Tidak Tersedia'}
                      </Badge>
                    </div>

                    {/* Image Navigation */}
                    {property.images.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {property.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-2 h-2 rounded-full transition-all ${
                              index === currentImageIndex
                                ? 'bg-white w-8'
                                : 'bg-white/50 hover:bg-white/75'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="w-20 h-20 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Thumbnail Grid */}
              {property.images.length > 1 && (
                <div className="p-4 grid grid-cols-4 gap-2">
                  {property.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                        index === currentImageIndex
                          ? 'border-primary'
                          : 'border-transparent hover:border-primary/50'
                      }`}
                    >
                      <img
                        src={getImageUrl(image)}
                        alt={`${property.nama} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ✅ REALTIME BOOST STATUS (jika ada) */}
          {property.is_boosted === 1 && boostTimeRemaining && (
            <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Zap className="w-8 h-8 text-yellow-500" />
                  <div className="flex-1">
                    <p className="font-semibold text-yellow-700 dark:text-yellow-300">
                      Status Boost Aktif
                    </p>
                    <p className="text-sm text-yellow-600 dark:text-yellow-400 font-mono">
                      Sisa: {boostTimeRemaining}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Property Info */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-3xl">{property.nama}</CardTitle>
                  <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{property.city}</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-lg px-4 py-2">
                  {property.type === 'kost' ? 'Kost' : 
                   property.type === 'villa' ? 'Villa' : 'Guest House'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Price */}
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-primary">
                  {formatPrice(property.harga)}
                </span>
                <span className="text-lg text-muted-foreground">
                  / {property.priceUnit}
                </span>
              </div>

              {/* Key Features */}
              <div className="grid grid-cols-3 gap-4 py-4 border-y border-border">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Home className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Kamar Tidur</p>
                    <p className="font-semibold">{property.bedrooms}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Bath className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Kamar Mandi</p>
                    <p className="font-semibold">{property.bathrooms}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Maximize className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Luas</p>
                    <p className="font-semibold">{property.area} m²</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Deskripsi</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {property.description || 'Tidak ada deskripsi'}
                </p>
              </div>

              {/* Address */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Alamat Lengkap</h3>
                <p className="text-muted-foreground">{property.alamat}</p>
              </div>

              {/* Facilities */}
              {Array.isArray(property.facilities) && property.facilities.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Fasilitas</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {property.facilities.map((facility, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg"
                      >
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-sm">{facility}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Owner Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informasi Pemilik</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Nama</p>
                <p className="font-medium">{property.ownerName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">WhatsApp</p>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <p className="font-medium">{property.whatsappNumber}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Diupload pada {formatDate(property.createdAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Properti?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus properti <strong>{property.nama}</strong>?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProperty}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}