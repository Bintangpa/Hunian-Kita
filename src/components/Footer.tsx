import { useEffect, useState } from 'react';
import { Building2, Instagram, Facebook, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FooterSettings {
  footer_brand_name: string;
  footer_description: string;
  footer_instagram: string;
  footer_facebook: string;
  footer_twitter: string;
  footer_cities: string;
  footer_copyright: string;
}

// Cache di luar component — supaya kalau Footer re-mount nggak fetch ulang
let cachedSettings: FooterSettings | null = null;

export function Footer() {
  const [settings, setSettings] = useState<FooterSettings>(cachedSettings || {
    footer_brand_name: 'HunianKita',
    footer_description: 'Platform pencarian hunian terlengkap di Indonesia.',
    footer_instagram: '#',
    footer_facebook: '#',
    footer_twitter: '#',
    footer_cities: 'Jakarta,Bandung,Bali,Yogyakarta',
    footer_copyright: '© 2026 HunianKita. Hak cipta dilindungi.'
  });

  useEffect(() => {
    // Kalau sudah ada di cache, skip fetch
    if (cachedSettings) return;
    loadFooterSettings();
  }, []);

  const loadFooterSettings = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/settings/footer');
      if (response.ok) {
        const data = await response.json();
        cachedSettings = data; // Simpan ke cache
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading footer settings:', error);
      // Tetap gunakan default values jika gagal
    }
  };

  // Parse cities dari string ke array
  const cities = settings.footer_cities 
    ? settings.footer_cities.split(',').map(city => city.trim()) 
    : [];

  return (
    <footer className="bg-foreground text-background py-12 pb-24 md:pb-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">
                {settings.footer_brand_name.split(/(?=[A-Z][a-z])/)[0]}
                <span className="text-primary">
                  {settings.footer_brand_name.split(/(?=[A-Z][a-z])/)[1] || 'Kita'}
                </span>
              </span>
            </Link>
            <p className="text-background/70 text-sm mb-4">
              {settings.footer_description}
            </p>
            <div className="flex gap-3">
              {settings.footer_instagram && settings.footer_instagram !== '#' && (
                <a 
                  href={settings.footer_instagram} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-background/10 rounded-full flex items-center justify-center hover:bg-background/20 transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {settings.footer_facebook && settings.footer_facebook !== '#' && (
                <a 
                  href={settings.footer_facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-background/10 rounded-full flex items-center justify-center hover:bg-background/20 transition-colors"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {settings.footer_twitter && settings.footer_twitter !== '#' && (
                <a 
                  href={settings.footer_twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-background/10 rounded-full flex items-center justify-center hover:bg-background/20 transition-colors"
                >
                  <Twitter className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Properti</h4>
            <ul className="space-y-2 text-sm text-background/70">
              <li><Link to="/kost" className="hover:text-background transition-colors">Kost</Link></li>
              <li><Link to="/guesthouse" className="hover:text-background transition-colors">Guest House</Link></li>
              <li><Link to="/villa" className="hover:text-background transition-colors">Villa</Link></li>
            </ul>
          </div>

          {/* Cities */}
          <div>
            <h4 className="font-semibold mb-4">Kota Populer</h4>
            <ul className="space-y-2 text-sm text-background/70">
              {cities.slice(0, 4).map((city, index) => (
                <li key={index}>
                  <Link 
                    to={`/${city.toLowerCase()}`} 
                    className="hover:text-background transition-colors"
                  >
                    {city}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Bantuan</h4>
            <ul className="space-y-2 text-sm text-background/70">
              <li><Link to="/about" className="hover:text-background transition-colors">Tentang Kami</Link></li>
              <li><Link to="/contact" className="hover:text-background transition-colors">Hubungi Kami</Link></li>
              <li><Link to="/faq" className="hover:text-background transition-colors">FAQ</Link></li>
              <li><Link to="/terms" className="hover:text-background transition-colors">Syarat & Ketentuan</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-background/10 text-center text-sm text-background/50">
          <p>{settings.footer_copyright}</p>
        </div>
      </div>
    </footer>
  );
}