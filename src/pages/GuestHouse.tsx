import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MobileNav } from '@/components/MobileNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Building, Search } from 'lucide-react';

export default function GuestHouse() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State untuk filter dan search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [sortBy, setSortBy] = useState('default');

  useEffect(() => {
    fetch('http://localhost:3000/api/rumah')
      .then(res => res.json())
      .then(data => {
        const guestHouseOnly = data.filter((item: any) => {
          const type = item.type?.toLowerCase();
          return type === 'guesthouse' || type === 'guest house';
        });
        setProperties(guestHouseOnly);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching properties:', err);
        setLoading(false);
      });
  }, []);

  // Ambil list kota unik
  const cities = ['all', ...new Set(properties.map(p => p.city).filter(Boolean))];

  // Filter dan sort properties
  const filteredProperties = properties
    .filter(property => {
      const matchSearch = property.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.city?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCity = selectedCity === 'all' || property.city === selectedCity;
      return matchSearch && matchCity;
    })
    .sort((a, b) => {
      if (sortBy === 'price-low') return (a.harga || 0) - (b.harga || 0);
      if (sortBy === 'price-high') return (b.harga || 0) - (a.harga || 0);
      if (sortBy === 'name') return (a.nama || '').localeCompare(b.nama || '');
      return 0;
    });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Content - Always render, hidden saat loading */}
      <div className={`transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}>
        <section className="bg-guesthouse/10 py-12 px-4 border-b border-border">
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
              <div className="w-16 h-16 bg-guesthouse/20 rounded-2xl flex items-center justify-center">
                <Building className="w-8 h-8 text-guesthouse" />
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
                {filteredProperties.map((property) => (
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
                          alt={property.nama}
                          className="w-36 h-24 object-cover rounded"
                          onError={(e) => {
                            console.log('❌ Gagal load foto:', property.nama, property.images);
                            e.currentTarget.src = 'https://placehold.co/140x100';
                          }}
                        />
                      </div>

                      {/* Content - Kanan */}
                      <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                        <div className="space-y-1">
                          <h3 className="text-lg font-bold line-clamp-1">{property.nama}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {property.city}
                          </p>
                        </div>
                        <div className="flex items-end justify-between gap-4">
                          <div>
                            <p className="text-xl font-bold text-primary leading-tight">
                              Rp {property.harga?.toLocaleString('id-ID')}
                            </p>
                            <span className="text-xs text-muted-foreground">/ {property.priceUnit}</span>
                          </div>
                          
                          <Button 
                            size="sm" 
                            className="h-8 px-4"
                            onClick={(e) => {
                              e.stopPropagation();
                              const propertyUrl = `${window.location.origin}/property/${property.id}`;
                              const message = encodeURIComponent(
                                `Halo ${property.ownerName || 'Pemilik'}, saya tertarik dengan ${property.nama} di ${property.city}. Apakah masih tersedia? ${propertyUrl}`
                              );
                              window.open(`https://wa.me/${property.whatsappNumber}?text=${message}`, '_blank');
                            }}
                          >
                            Hubungi
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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