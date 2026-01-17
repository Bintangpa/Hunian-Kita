import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Building2, Users, Home, LogOut, BarChart } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    
    if (!userData) {
      console.log('❌ No user data, redirecting to login...');
      navigate('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    
    if (parsedUser.role !== 'admin') {
      console.log('❌ Not admin, redirecting to home...');
      navigate('/');
      return;
    }
    
    console.log('✅ Admin authenticated:', parsedUser);
    setUser(parsedUser);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    console.log('👋 Logged out');
    navigate('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">
                Hunian<span className="text-primary">Kita</span>
              </span>
              <span className="ml-4 text-sm bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                Admin Panel
              </span>
            </Link>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard Admin</h1>
          <p className="text-muted-foreground mt-1">Kelola seluruh properti dan mitra</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <Home className="w-8 h-8 text-primary" />
              <BarChart className="w-5 h-5 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Properti</h3>
            <p className="text-3xl font-bold text-foreground">150</p>
            <p className="text-xs text-green-600 mt-2">↑ 12% dari bulan lalu</p>
          </div>

          <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-accent" />
              <BarChart className="w-5 h-5 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Mitra</h3>
            <p className="text-3xl font-bold text-foreground">45</p>
            <p className="text-xs text-green-600 mt-2">↑ 8% dari bulan lalu</p>
          </div>

          <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <Building2 className="w-8 h-8 text-villa" />
              <BarChart className="w-5 h-5 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Pending Review</h3>
            <p className="text-3xl font-bold text-foreground">12</p>
            <p className="text-xs text-yellow-600 mt-2">Perlu ditinjau</p>
          </div>

          <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">📊</span>
              <BarChart className="w-5 h-5 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Views</h3>
            <p className="text-3xl font-bold text-foreground">24.5K</p>
            <p className="text-xs text-green-600 mt-2">↑ 23% dari bulan lalu</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card p-6 rounded-xl border border-border">
            <h2 className="text-lg font-semibold mb-4">Aksi Cepat</h2>
            <div className="space-y-2">
              <Button className="w-full justify-start" variant="outline">
                <Home className="w-4 h-4 mr-2" />
                Kelola Properti
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Users className="w-4 h-4 mr-2" />
                Kelola Mitra
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <BarChart className="w-4 h-4 mr-2" />
                Lihat Laporan
              </Button>
            </div>
          </div>

          <div className="bg-card p-6 rounded-xl border border-border">
            <h2 className="text-lg font-semibold mb-4">Aktivitas Terbaru</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3 pb-3 border-b border-border">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                <div>
                  <p className="font-medium">Properti baru ditambahkan</p>
                  <p className="text-muted-foreground text-xs">Villa Mewah di Bali • 2 jam yang lalu</p>
                </div>
              </div>
              <div className="flex items-start gap-3 pb-3 border-b border-border">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                <div>
                  <p className="font-medium">Mitra baru bergabung</p>
                  <p className="text-muted-foreground text-xs">Pak Budi • 5 jam yang lalu</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5"></div>
                <div>
                  <p className="font-medium">Properti menunggu review</p>
                  <p className="text-muted-foreground text-xs">Kost Dekat Kampus • 1 hari yang lalu</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}