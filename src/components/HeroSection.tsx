import { Search, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface HeroSectionProps {
  onSearch: (query: string) => void;
}

export function HeroSection({ onSearch }: HeroSectionProps) {
  return (
    <section className="hero-gradient text-primary-foreground py-12 px-4 md:py-20">
      <div className="container max-w-4xl mx-auto text-center space-y-6">
        <div className="animate-slide-up">
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-3">
            Temukan Hunian Impian
            <br />
            <span className="text-primary-foreground/90">di Seluruh Indonesia</span>
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            Kost, Guest House, dan Villa terbaik dengan harga transparan. 
            Hubungi langsung pemilik via WhatsApp!
          </p>
        </div>

        <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="bg-card rounded-2xl p-2 md:p-3 shadow-card-hover max-w-xl mx-auto">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Cari kota atau lokasi..."
                  className="pl-10 h-12 border-0 bg-secondary/50 text-foreground placeholder:text-muted-foreground rounded-xl"
                  onChange={(e) => onSearch(e.target.value)}
                />
              </div>
              <Button size="lg" className="h-12 px-6">
                <Search className="w-5 h-5" />
                <span className="hidden md:inline ml-2">Cari</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          {['Jakarta', 'Bali', 'Yogyakarta', 'Bandung'].map((city) => (
            <Button
              key={city}
              variant="hero"
              size="sm"
              onClick={() => onSearch(city)}
              className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20 hover:border-primary-foreground/40"
            >
              <MapPin className="w-4 h-4" />
              {city}
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}
