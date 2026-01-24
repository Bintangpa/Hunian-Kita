import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MobileNav } from '@/components/MobileNav';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TreePalm } from 'lucide-react';

export default function Villa() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3000/api/rumah')
      .then(res => res.json())
      .then(data => {
        const villaOnly = data.filter((item: any) => 
          item.type?.toLowerCase() === 'villa'
        );
        setProperties(villaOnly);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching properties:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Content - Always render, hidden saat loading */}
      <div className={`transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}>
        <section className="bg-villa/10 py-12 px-4 border-b border-border">
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
              <div className="w-16 h-16 bg-villa/20 rounded-2xl flex items-center justify-center">
                <TreePalm className="w-8 h-8 text-villa" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-foreground">Villa</h1>
                <p className="text-lg text-muted-foreground mt-1">Villa mewah untuk liburan tak terlupakan</p>
              </div>
            </div>
            
            <div className="mt-6">
              <p className="text-muted-foreground">
                Menampilkan <span className="font-semibold text-foreground">{properties.length}</span> villa
              </p>
            </div>
          </div>
        </section>

        <main className="min-h-screen py-8 px-4">
          <div className="container mx-auto max-w-7xl">
            {properties.length === 0 ? (
              <div className="text-center py-16">
                <TreePalm className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Belum Ada Villa</h2>
                <p className="text-muted-foreground mb-6">
                  Saat ini belum ada villa yang tersedia.
                </p>
                <Button onClick={() => navigate('/')}>
                  Kembali ke Beranda
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {properties.map((property) => (
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