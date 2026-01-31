import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MobileNav } from '@/components/MobileNav';
import { PropertyCard } from '@/components/PropertyCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Home, Search } from 'lucide-react';

export default function Kost() {
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

  useEffect(() => {
    fetch('http://localhost:3000/api/properties')
      .then(res => res.json())
      .then(data => {
        console.log('📦 Data fetched for Kost:', data);
        const kostOnly = data.filter((item: any) => 
          item.type?.toLowerCase() === 'kost'
        );
        console.log('✅ Kost filtered:', kostOnly.length);
        setProperties(kostOnly);
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

      <div className={`transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}>
        <section className="bg-primary/10 py-12 px-4 border-b border-border">
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
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center">
                <Home className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-foreground">Kost</h1>
                <p className="text-lg text-muted-foreground mt-1">Kost nyaman dengan fasilitas lengkap</p>
              </div>
            </div>
            
            <div className="mt-6">
              <p className="text-muted-foreground mb-4">
                Menampilkan <span className="font-semibold text-foreground">{filteredProperties.length}</span> dari {properties.length} kost
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

        <main className="container mx-auto max-w-6xl px-4 py-8">
            {filteredProperties.length === 0 ? (
              <div className="text-center py-16 bg-card rounded-lg border border-border">
                <div className="mx-auto w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Search className="w-10 h-10 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {properties.length === 0 ? 'Belum Ada Kost' : 'Tidak Ada Hasil'}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {properties.length === 0 
                    ? 'Saat ini belum ada kost yang tersedia.'
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
              <>
                {/* Grid Layout dengan PropertyCard */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentProperties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
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
                          return page === 1 || 
                                 page === totalPages || 
                                 (page >= currentPage - 2 && page <= currentPage + 2);
                        })
                        .map((page, index, array) => {
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
              </>
            )}
          </main>
      </div>

      <Footer />
      <MobileNav />
    </div>
  );
}