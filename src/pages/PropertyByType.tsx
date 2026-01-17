import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MobileNav } from '@/components/MobileNav';
import { PropertyCard } from '@/components/PropertyCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home, Building, TreePalm } from 'lucide-react';
import { Property } from '@/types/property';


const typeInfo = {
  kost: {
    title: 'Kost',
    icon: Home,
    description: 'Temukan kost nyaman dengan fasilitas lengkap',
    color: 'text-kost',
    bgColor: 'bg-kost/10'
  },
  guesthouse: {
    title: 'Guest House',
    icon: Building,
    description: 'Guest house dengan suasana tenang dan asri',
    color: 'text-guesthouse',
    bgColor: 'bg-guesthouse/10'
  },
  villa: {
    title: 'Villa',
    icon: TreePalm,
    description: 'Villa mewah untuk liburan tak terlupakan',
    color: 'text-villa',
    bgColor: 'bg-villa/10'
  }
};

export default function PropertyByType() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const normalizedType = type?.toLowerCase() || 'kost';
  const info = typeInfo[normalizedType as keyof typeof typeInfo] || typeInfo.kost;
  const Icon = info.icon;

  useEffect(() => {
    fetch('http://localhost:3000/api/rumah')
      .then(res => res.json())
      .then(data => {
        const filtered = data.filter((item: any) => {
          const itemType = item.type?.toLowerCase();
          return itemType === normalizedType || 
                 (normalizedType === 'guesthouse' && itemType === 'guest house');
        });
        
        setProperties(filtered);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching properties:', err);
        setLoading(false);
      });
  }, [normalizedType]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Memuat properti...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className={`${info.bgColor} py-12 px-4 border-b border-border`}>
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
            <div className={`w-16 h-16 ${info.bgColor} rounded-2xl flex items-center justify-center`}>
              <Icon className={`w-8 h-8 ${info.color}`} />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground">{info.title}</h1>
              <p className="text-lg text-muted-foreground mt-1">{info.description}</p>
            </div>
          </div>
          
          <div className="mt-6">
            <p className="text-muted-foreground">
              Menampilkan <span className="font-semibold text-foreground">{properties.length}</span> properti
            </p>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-8">
        {properties.length === 0 ? (
          <div className="text-center py-16">
            <Icon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Belum Ada {info.title}</h2>
            <p className="text-muted-foreground mb-6">
              Saat ini belum ada {info.title.toLowerCase()} yang tersedia.
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

      <Footer />
      <MobileNav />
    </div>
  );
}