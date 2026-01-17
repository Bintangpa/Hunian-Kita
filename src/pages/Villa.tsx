import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MobileNav } from '@/components/MobileNav';
import { PropertyCard } from '@/components/PropertyCard';
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

        <main className="min-h-screen container mx-auto py-8 px-4">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </main>
      </div>

      <Footer />
      <MobileNav />
    </div>
  );
}