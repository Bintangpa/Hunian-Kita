import { Menu, X, Building2, User, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
}

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Cek status login saat component mount
  useEffect(() => {
    const checkLoginStatus = () => {
      const isLoggedIn = localStorage.getItem('isLoggedIn');
      const userData = localStorage.getItem('user');
      
      if (isLoggedIn === 'true' && userData) {
        try {
          setUser(JSON.parse(userData));
        } catch (error) {
          console.error('Error parsing user data:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('isLoggedIn');
        }
      }
    };

    checkLoginStatus();
    window.addEventListener('storage', checkLoginStatus);
    return () => window.removeEventListener('storage', checkLoginStatus);
  }, []);

  // Handle navigasi - timing diperpanjang untuk semua halaman
  const handleNavigate = (path: string) => {
    if (location.pathname === path) return;
    
    setIsMenuOpen(false);
    setIsTransitioning(true);
    
    // Tunggu fade out selesai baru navigate
    setTimeout(() => {
      navigate(path);
      window.scrollTo(0, 0);
      
      // Tunggu render + data loading selesai baru fade in
      setTimeout(() => {
        setIsTransitioning(false);
      }, 900); // Perpanjang lagi untuk property detail
    }, 500); // Perpanjang fade out
  };

  const handleLogout = () => {
    setIsTransitioning(true);
    
    setTimeout(() => {
      localStorage.removeItem('user');
      localStorage.removeItem('isLoggedIn');
      setUser(null);
      setIsMenuOpen(false);
      navigate('/login');
      window.scrollTo(0, 0);
      
      setTimeout(() => {
        setIsTransitioning(false);
      }, 900);
    }, 500);
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'mitra') return '/mitra/dashboard';
    return '/';
  };

  const handleDashboardClick = () => {
    handleNavigate(getDashboardLink());
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Simple Fade Overlay - Professional & Effective */}
      <div
        className={`fixed inset-0 bg-background z-[999] transition-opacity duration-500 ${
          isTransitioning ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      <header className="sticky top-0 bg-card/95 backdrop-blur-md border-b border-border z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button 
              onClick={() => handleNavigate('/')} 
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl text-foreground">
                Hunian<span className="text-primary">Kita</span>
              </span>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <button
                onClick={() => handleNavigate('/')}
                className={`text-sm font-medium transition-colors ${
                  isActive('/') 
                    ? 'text-primary font-bold' 
                    : 'text-foreground hover:text-primary'
                }`}
              >
                Beranda
              </button>
              <button
                onClick={() => handleNavigate('/kost')}
                className={`text-sm font-medium transition-colors ${
                  isActive('/kost') 
                    ? 'text-primary font-bold' 
                    : 'text-muted-foreground hover:text-primary'
                }`}
              >
                Kost
              </button>
              <button
                onClick={() => handleNavigate('/guesthouse')}
                className={`text-sm font-medium transition-colors ${
                  isActive('/guesthouse') 
                    ? 'text-primary font-bold' 
                    : 'text-muted-foreground hover:text-primary'
                }`}
              >
                Guest House
              </button>
              <button
                onClick={() => handleNavigate('/villa')}
                className={`text-sm font-medium transition-colors ${
                  isActive('/villa') 
                    ? 'text-primary font-bold' 
                    : 'text-muted-foreground hover:text-primary'
                }`}
              >
                Villa
              </button>
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  {user.role === 'mitra' && (
                    <Button 
                      size="sm" 
                      onClick={() => handleNavigate('/pasang-iklan')}
                    >
                      Pasang Iklan
                    </Button>
                  )}
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleDashboardClick}
                    className="gap-2 hover:bg-green-50 hover:text-green-600"
                  >
                    <User className="w-4 h-4" />
                    {user.name}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleLogout}
                    className="gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" onClick={() => handleNavigate('/pasang-iklan')}>
                    Pasang Iklan
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleNavigate('/login')}>
                    Masuk
                  </Button>
                </>
              )}
            </div>
            
            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 hover:bg-secondary rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-6 h-6 text-foreground" />
              ) : (
                <Menu className="w-6 h-6 text-foreground" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-border">
              <nav className="flex flex-col gap-2">
                <button
                  onClick={() => handleNavigate('/')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors text-left ${
                    isActive('/') 
                      ? 'bg-primary/10 text-primary font-bold' 
                      : 'text-foreground hover:bg-secondary'
                  }`}
                >
                  Beranda
                </button>
                <button
                  onClick={() => handleNavigate('/kost')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors text-left ${
                    isActive('/kost') 
                      ? 'bg-primary/10 text-primary font-bold' 
                      : 'text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  Kost
                </button>
                <button
                  onClick={() => handleNavigate('/guesthouse')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors text-left ${
                    isActive('/guesthouse') 
                      ? 'bg-primary/10 text-primary font-bold' 
                      : 'text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  Guest House
                </button>
                <button
                  onClick={() => handleNavigate('/villa')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors text-left ${
                    isActive('/villa') 
                      ? 'bg-primary/10 text-primary font-bold' 
                      : 'text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  Villa
                </button>
                
                {/* Mobile Actions */}
                <div className="flex gap-2 px-4 pt-2 mt-2 border-t border-border">
                  {user ? (
                    <>
                      {user.role === 'mitra' && (
                        <Button 
                          size="sm" 
                          className="flex-1" 
                          onClick={() => handleNavigate('/pasang-iklan')}
                        >
                          Pasang Iklan
                        </Button>
                      )}
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex-1 hover:bg-green-50 hover:text-green-600" 
                        onClick={handleDashboardClick}
                      >
                        Dashboard
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 hover:bg-red-50 hover:text-red-600 hover:border-red-300" 
                        onClick={handleLogout}
                      >
                        Logout
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        size="sm" 
                        className="flex-1" 
                        onClick={() => handleNavigate('/pasang-iklan')}
                      >
                        Pasang Iklan
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex-1" 
                        onClick={() => handleNavigate('/login')}
                      >
                        Masuk
                      </Button>
                    </>
                  )}
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>
    </>
  );
}