import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MobileNav } from '@/components/MobileNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Building, Search, Clock } from 'lucide-react';

export default function GuestHouse() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State untuk filter dan search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  
  // State untuk pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Format timestamp upload - SAMA SEPERTI DI PropertyCard.tsx
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

  useEffect(() => {
    // ✅ FIXED: Ganti dari /api/rumah ke /api/properties
    fetch('http://localhost:3000/api/properties')
      .then(res => res.json())
      .then(data => {
        console.log('📦 Data fetched for Guest House:', data);
        const guestHouseOnly = data.filter((item: any) => {
          const type = item.type?.toLowerCase();
          return type === 'guesthouse' || type === 'guest house';
        });
        console.log('✅ Guest House filtered:', guestHouseOnly.length);
        setProperties(guestHouseOnly);
        setLoading(false);
      })
      .catch(err => {
        console.error('❌ Error fetching properties:', err);
        setLoading(false);
      });
  }, []);

  // Ambil list kota unik
  const cities = ['all', ...new Set(properties.map(p => p.city).filter(Boolean))];

  // Filter dan sort properties
  const filteredProperties = properties
    .filter(property => {
      // ✅ Support both 'title' and 'nama' field
      const name = property.title || property.nama || '';
      const matchSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.city?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCity = selectedCity === 'all' || property.city === selectedCity;
      return matchSearch && matchCity;
    })
    .sort((a, b) => {
      const priceA = a.price || a.harga || 0;
      const priceB = b.price || b.harga || 0;
      if (sortBy === 'price-low') return priceA - priceB;
      if (sortBy === 'price-high') return priceB - priceA;
      if (sortBy === 'name') {
        const nameA = a.title || a.nama || '';
        const nameB = b.title || b.nama || '';
        return nameA.localeCompare(nameB);
      }
      // Default: urutkan dari yang terbaru ke terlama
      const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
      const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
      return dateB - dateA;
    });

  // Pagination logic
  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProperties = filteredProperties.slice(startIndex, endIndex);

  // Reset ke halaman 1 jika filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCity, sortBy]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Content - Always render, hidden saat loading */}
      <div className={`transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}>
        <section className="bg-purple-50 py-12 px-4 border-b border-border">
          <div className="container mx-auto max-w-6xl">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="mb-4 gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </Button>
            
            <div className="flex items-center gap-4 mb-3">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center">
                <Building className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-foreground">Guest House</h1>
                <p className="text-lg text-muted-foreground mt-1">Guest house dengan suasana tenang dan asri</p>
              </div>
            </div>
            
            <div className="mt-6">
              <p className="text-muted-foreground mb-4">
                Menampilkan <span className="font-semibold text-foreground">{filteredProperties.length}</span> dari {properties.length} guest house
              </p>
              
              {/* Filter & Search */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari nama atau kota..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Filter Kota */}
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Kota" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kota</SelectItem>
                    {cities.filter(c => c !== 'all').map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Urutkan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="price-low">Harga Terendah</SelectItem>
                    <SelectItem value="price-high">Harga Tertinggi</SelectItem>
                    <SelectItem value="name">Nama A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </section>

        <main className="min-h-screen py-8 px-4">
          <div className="container mx-auto max-w-7xl">
            {filteredProperties.length === 0 ? (
              <div className="text-center py-16">
                <Building className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">
                  {properties.length === 0 ? 'Belum Ada Guest House' : 'Tidak Ada Hasil'}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {properties.length === 0 
                    ? 'Saat ini belum ada guest house yang tersedia.'
                    : 'Coba ubah filter atau kata kunci pencarian.'}
                </p>
                <Button onClick={() => {
                  if (properties.length === 0) {
                    navigate('/');
                  } else {
                    setSearchTerm('');
                    setSelectedCity('all');
                    setSortBy('default');
                  }
                }}>
                  {properties.length === 0 ? 'Kembali ke Beranda' : 'Reset Filter'}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {currentProperties.map((property) => {
                  // ✅ Support both field names
                  const title = property.title || property.nama;
                  const price = property.price || property.harga;
                  const priceUnit = property.price_unit || property.priceUnit;
                  const ownerName = property.owner_name || property.ownerName;
                  const whatsappNumber = property.owner_whatsapp || property.whatsappNumber;
                  
                  return (
                    <div 
                      key={property.id}
                      className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => navigate(`/property/${property.id}`)}
                    >
                      <div className="flex gap-4 p-3">
                        {/* Image - Pentok Kiri */}
                        <div className="flex-shrink-0">
                          <img
                            src={
                              property.images && property.images.length > 0 
                                ? `http://localhost:3000${property.images[0]}`
                                : 'https://placehold.co/140x100'
                            }
                            alt={title}
                            className="w-36 h-24 object-cover rounded"
                            onError={(e) => {
                              console.log('❌ Gagal load foto:', title, property.images);
                              e.currentTarget.src = 'https://placehold.co/140x100';
                            }}
                          />
                        </div>

                        {/* Content - Kanan */}
                        <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                          <div className="space-y-1">
                            <h3 className="text-lg font-bold line-clamp-1">{title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {property.city}
                            </p>
                            {formatTimeAgo(property.created_at || property.createdAt) && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span>{formatTimeAgo(property.created_at || property.createdAt)}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-end justify-between gap-4">
                            <div>
                              <p className="text-xl font-bold text-primary leading-tight">
                                {new Intl.NumberFormat('id-ID', {
                                  style: 'currency',
                                  currency: 'IDR',
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                }).format(price || 0)}
                              </p>
                              <span className="text-xs text-muted-foreground">/ {priceUnit}</span>
                            </div>
                            
                            <Button 
                              size="sm" 
                              className="h-8 px-4"
                              onClick={(e) => {
                                e.stopPropagation();
                                const propertyUrl = `${window.location.origin}/property/${property.id}`;
                                const message = encodeURIComponent(
                                  `Halo ${ownerName || 'Pemilik'}, saya tertarik dengan ${title} di ${property.city}. Apakah masih tersedia? ${propertyUrl}`
                                );
                                window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
                              }}
                            >
                              Hubungi
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {filteredProperties.length > 0 && totalPages > 1 && (
              <div className="mt-8 flex flex-col items-center gap-4">
                <p className="text-sm text-muted-foreground">
                  Halaman {currentPage} dari {totalPages} ({filteredProperties.length} total properti)
                </p>
                <div className="flex gap-2 flex-wrap justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    Pertama
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Sebelumnya
                  </Button>
                  
                  {/* Page Numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      // Tampilkan halaman saat ini, 2 sebelum, dan 2 sesudah
                      return page === 1 || 
                             page === totalPages || 
                             (page >= currentPage - 2 && page <= currentPage + 2);
                    })
                    .map((page, index, array) => {
                      // Tambahkan ellipsis jika ada gap
                      const prevPage = array[index - 1];
                      const showEllipsis = prevPage && page - prevPage > 1;
                      
                      return (
                        <div key={page} className="flex gap-2">
                          {showEllipsis && (
                            <span className="px-3 py-1 text-muted-foreground">...</span>
                          )}
                          <Button
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        </div>
                      );
                    })}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Berikutnya
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    Terakhir
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <Footer />
      <MobileNav />
    </div>
  );
}