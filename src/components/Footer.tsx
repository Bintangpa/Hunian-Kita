import { Building2, Instagram, Facebook, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
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
                Hunian<span className="text-primary">Kita</span>
              </span>
            </Link>
            <p className="text-background/70 text-sm mb-4">
              Platform pencarian hunian terlengkap di Indonesia. Temukan kost, guest house, dan villa impianmu.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 bg-background/10 rounded-full flex items-center justify-center hover:bg-background/20 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-background/10 rounded-full flex items-center justify-center hover:bg-background/20 transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-background/10 rounded-full flex items-center justify-center hover:bg-background/20 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
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
              <li><Link to="/jakarta" className="hover:text-background transition-colors">Jakarta</Link></li>
              <li><Link to="/bandung" className="hover:text-background transition-colors">Bandung</Link></li>
              <li><Link to="/bali" className="hover:text-background transition-colors">Bali</Link></li>
              <li><Link to="/yogyakarta" className="hover:text-background transition-colors">Yogyakarta</Link></li>
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
          <p>© 2026 HunianKita. Hak cipta dilindungi.</p>
        </div>
      </div>
    </footer>
  );
}

