import { useEffect, useState } from 'react';
import { Check, Sparkles, Zap, Crown, MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MobileNav } from '@/components/MobileNav';

// Icon mapping
const iconMap: Record<string, any> = {
  Zap,
  Sparkles,
  Crown,
};

interface Hero {
  title: string;
  subtitle: string;
}

interface Step {
  id: number;
  step_number: number;
  title: string;
  description: string;
}

interface Plan {
  id: number;
  name: string;
  price: number;
  period: string;
  description: string;
  icon: string;
  is_popular: number;
  features: string[];
}

interface TokenPackage {
  id: number;
  tokens: number;
  price: number;
  bonus: number;
}

interface CTA {
  title: string;
  description: string;
  button_text: string;
  whatsapp_number: string;
  whatsapp_message: string;
}

interface PageContent {
  hero: Hero | null;
  steps: Step[];
  plans: Plan[];
  tokenPackages: TokenPackage[];
  cta: CTA | null;
}

const PasangIklan = () => {
  const [content, setContent] = useState<PageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPageContent();
  }, []);

  const fetchPageContent = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/pasang-iklan/content');
      const result = await response.json();
      
      if (result.success) {
        setContent(result.data);
      } else {
        setError('Gagal memuat konten halaman');
      }
    } catch (err) {
      console.error('Error fetching page content:', err);
      setError('Terjadi kesalahan saat memuat halaman');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent(
      content?.cta?.whatsapp_message || 
      'Halo Admin HunianKita, saya tertarik untuk memasang iklan properti. Mohon informasi lebih lanjut.'
    );
    const phone = content?.cta?.whatsapp_number || '628123456789';
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Memuat konten...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Error State
  if (error || !content) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <p className="text-destructive mb-4">{error || 'Konten tidak ditemukan'}</p>
            <Button onClick={fetchPageContent}>Coba Lagi</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pb-20 md:pb-0">
        {/* Hero */}
        {content.hero && (
          <section className="hero-gradient text-primary-foreground py-12 px-4 md:py-16">
            <div className="container max-w-4xl mx-auto text-center">
              <h1 className="text-3xl md:text-4xl font-bold mb-4 animate-slide-up">
                {content.hero.title}
              </h1>
              <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
                {content.hero.subtitle}
              </p>
            </div>
          </section>
        )}

        {/* How it Works */}
        {content.steps && content.steps.length > 0 && (
          <section className="py-12 px-4 bg-card">
            <div className="container mx-auto max-w-4xl">
              <h2 className="text-2xl font-bold text-center mb-8">Cara Kerja</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {content.steps.map((step, index) => (
                  <div
                    key={step.id}
                    className="text-center p-6 animate-slide-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                      {step.step_number}
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                    <p className="text-muted-foreground text-sm">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Subscription Plans */}
        {content.plans && content.plans.length > 0 && (
          <section className="py-12 px-4">
            <div className="container mx-auto">
              <h2 className="text-2xl font-bold text-center mb-2">Paket Langganan</h2>
              <p className="text-muted-foreground text-center mb-8">
                Pilih paket yang sesuai dengan kebutuhan Anda
              </p>

              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {content.plans.map((plan, index) => {
                  const Icon = iconMap[plan.icon] || Sparkles;
                  const isPopular = plan.is_popular === 1;
                  
                  return (
                    <div
                      key={plan.id}
                      className={`relative bg-card rounded-2xl p-6 border-2 transition-all duration-300 hover:shadow-card-hover animate-slide-up ${
                        isPopular
                          ? 'border-primary shadow-lg scale-105'
                          : 'border-border hover:border-primary/50'
                      }`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      {isPopular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="badge-sponsored text-xs">Paling Populer</span>
                        </div>
                      )}

                      <div className="text-center mb-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                          isPopular ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
                        }`}>
                          <Icon className="w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-bold">{plan.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                      </div>

                      <div className="text-center mb-6">
                        <span className="text-3xl font-bold">{formatPrice(plan.price)}</span>
                        {plan.period && (
                          <span className="text-muted-foreground">/{plan.period}</span>
                        )}
                      </div>

                      <ul className="space-y-3 mb-6">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        variant={isPopular ? 'default' : 'outline'}
                        className="w-full"
                        size="lg"
                        onClick={handleWhatsAppContact}
                      >
                        Pilih Paket
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Token Packages */}
        {content.tokenPackages && content.tokenPackages.length > 0 && (
          <section className="py-12 px-4 bg-card">
            <div className="container mx-auto max-w-4xl">
              <h2 className="text-2xl font-bold text-center mb-2">Paket Token</h2>
              <p className="text-muted-foreground text-center mb-4">
                Token digunakan untuk promosi iklan dan fitur tambahan
              </p>

              <div className="grid grid-cols-3 gap-4">
                {content.tokenPackages.map((pkg, index) => (
                  <div
                    key={pkg.id}
                    className="bg-card rounded-xl p-5 border border-border hover:border-primary transition-all duration-300 hover:shadow-card animate-slide-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-1">
                        {pkg.tokens}
                        {pkg.bonus > 0 && (
                          <span className="text-accent text-lg ml-1">+{pkg.bonus}</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">Token</p>
                      <p className="text-xl font-semibold mb-4">{formatPrice(pkg.price)}</p>
                      <Button variant="outline" size="sm" className="w-full" onClick={handleWhatsAppContact}>
                        Beli
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        {content.cta && (
          <section className="py-12 px-4">
            <div className="container mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold mb-4">{content.cta.title}</h2>
              <p className="text-muted-foreground mb-6">
                {content.cta.description}
              </p>
              <Button variant="whatsapp" size="xl" onClick={handleWhatsAppContact}>
                <MessageCircle className="w-5 h-5" />
                {content.cta.button_text}
              </Button>
            </div>
          </section>
        )}
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
};

export default PasangIklan;