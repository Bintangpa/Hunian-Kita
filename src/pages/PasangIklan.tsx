import { Check, Sparkles, Zap, Crown, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MobileNav } from '@/components/MobileNav';

const subscriptionPlans = [
  {
    name: 'Starter',
    price: 99000,
    period: 'bulan',
    description: 'Cocok untuk pemilik properti baru',
    features: [
      '2 iklan gratis per properti',
      'Statistik dasar',
      'Dukungan WhatsApp',
      'Listing selama 30 hari',
    ],
    icon: Zap,
    popular: false,
  },
  {
    name: 'Professional',
    price: 249000,
    period: 'bulan',
    description: 'Untuk pemilik dengan banyak properti',
    features: [
      '5 iklan gratis per properti',
      'Statistik lengkap',
      'Badge "Verified Owner"',
      'Prioritas di hasil pencarian',
      '50 token gratis/bulan',
      'Dukungan prioritas',
    ],
    icon: Sparkles,
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 499000,
    period: 'bulan',
    description: 'Untuk agen properti dan developer',
    features: [
      'Iklan unlimited',
      'Dashboard analytics premium',
      'Badge "Premium Partner"',
      'Posisi teratas di pencarian',
      '150 token gratis/bulan',
      'Account manager dedicated',
      'API access',
    ],
    icon: Crown,
    popular: false,
  },
];

const tokenPackages = [
  { tokens: 50, price: 50000, bonus: 0 },
  { tokens: 100, price: 90000, bonus: 10 },
  { tokens: 250, price: 200000, bonus: 25 },
  { tokens: 500, price: 350000, bonus: 75 },
];

const PasangIklan = () => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent(
      'Halo Admin HunianKita, saya tertarik untuk memasang iklan properti. Mohon informasi lebih lanjut.'
    );
    window.open(`https://wa.me/628123456789?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pb-20 md:pb-0">
        {/* Hero */}
        <section className="hero-gradient text-primary-foreground py-12 px-4 md:py-16">
          <div className="container max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 animate-slide-up">
              Pasang Iklan Properti Anda
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Jangkau ribuan pencari hunian di seluruh Indonesia.
              Mulai dari Rp99.000/bulan!
            </p>
          </div>
        </section>

        {/* How it Works */}
        <section className="py-12 px-4 bg-card">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold text-center mb-8">Cara Kerja</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { step: '1', title: 'Daftar & Pilih Paket', desc: 'Buat akun dan pilih paket langganan sesuai kebutuhan Anda' },
                { step: '2', title: 'Upload Properti', desc: 'Tambahkan foto, deskripsi, dan detail fasilitas properti Anda' },
                { step: '3', title: 'Terima Lead via WhatsApp', desc: 'Calon penyewa akan langsung menghubungi Anda via WhatsApp' },
              ].map((item, index) => (
                <div
                  key={item.step}
                  className="text-center p-6 animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Subscription Plans */}
        <section className="py-12 px-4">
          <div className="container mx-auto">
            <h2 className="text-2xl font-bold text-center mb-2">Paket Langganan</h2>
            <p className="text-muted-foreground text-center mb-8">
              Pilih paket yang sesuai dengan kebutuhan Anda
            </p>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {subscriptionPlans.map((plan, index) => {
                const Icon = plan.icon;
                return (
                  <div
                    key={plan.name}
                    className={`relative bg-card rounded-2xl p-6 border-2 transition-all duration-300 hover:shadow-card-hover animate-slide-up ${
                      plan.popular
                        ? 'border-primary shadow-lg scale-105'
                        : 'border-border hover:border-primary/50'
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="badge-sponsored text-xs">Paling Populer</span>
                      </div>
                    )}

                    <div className="text-center mb-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                        plan.popular ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
                      }`}>
                        <Icon className="w-7 h-7" />
                      </div>
                      <h3 className="text-xl font-bold">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                    </div>

                    <div className="text-center mb-6">
                      <span className="text-3xl font-bold">{formatPrice(plan.price)}</span>
                      <span className="text-muted-foreground">/{plan.period}</span>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm">
                          <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      variant={plan.popular ? 'default' : 'outline'}
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

        {/* Token Packages */}
        <section className="py-12 px-4 bg-card">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold text-center mb-2">Paket Token</h2>
            <p className="text-muted-foreground text-center mb-4">
              Token digunakan untuk promosi iklan dan fitur tambahan
            </p>

            <div className="bg-secondary/50 rounded-xl p-4 mb-8 max-w-md mx-auto">
              <h4 className="font-semibold mb-2 text-center">Kegunaan Token:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>10 Token</strong> - Push iklan ke posisi atas (1 hari)</li>
                <li>• <strong>25 Token</strong> - Badge "Promosi" selama 7 hari</li>
                <li>• <strong>50 Token</strong> - Highlight iklan selama 14 hari</li>
                <li>• <strong>5 Token</strong> - Tambahan 1 slot iklan</li>
              </ul>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {tokenPackages.map((pkg, index) => (
                <div
                  key={pkg.tokens}
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

        {/* CTA */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold mb-4">Siap Memasang Iklan?</h2>
            <p className="text-muted-foreground mb-6">
              Hubungi kami via WhatsApp untuk konsultasi gratis dan bantuan pendaftaran
            </p>
            <Button variant="whatsapp" size="xl" onClick={handleWhatsAppContact}>
              <MessageCircle className="w-5 h-5" />
              Hubungi via WhatsApp
            </Button>
          </div>
        </section>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
};

export default PasangIklan;
