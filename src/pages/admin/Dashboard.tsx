import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Building2, Users, Home, LogOut, Search, Mail, 
  Phone, Calendar, Trash2, UserCheck, UserX, Settings, Lock, Eye, EyeOff,
  PlusCircle, Coins, Menu, X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  role: string;
  is_active: number;
  created_at: string;
}

interface Stats {
  totalProperties: number;
  totalMitra: number;
  totalUsers: number;
  activeMitra: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalProperties: 0,
    totalMitra: 0,
    totalUsers: 0,
    activeMitra: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // State untuk sidebar & halaman aktif
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState('kelola-user');
  
  // State untuk modal pengaturan
  const [showSettings, setShowSettings] = useState(false);
  
  // State untuk form ubah password
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // State untuk toggle visibility password
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    
    if (!userData) {
      navigate('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    
    if (parsedUser.role !== 'admin') {
      navigate('/');
      return;
    }
    
    setUser(parsedUser);
    fetchUsers();
    fetchStats();
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        toast({
          title: 'Error',
          description: 'Gagal memuat data users',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat memuat data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleToggleActive = async (userId: number, currentStatus: number) => {
    try {
      const response = await fetch(`http://localhost:3000/api/admin/users/${userId}/toggle-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: currentStatus === 1 ? 0 : 1 })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: 'Berhasil',
          description: currentStatus === 1 ? 'User dinonaktifkan' : 'User diaktifkan',
        });
        fetchUsers();
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Gagal mengubah status',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus user ini? Semua properti user akan ikut terhapus.')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: 'Berhasil',
          description: 'User berhasil dihapus',
        });
        fetchUsers();
        fetchStats();
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Gagal menghapus user',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan',
        variant: 'destructive',
      });
    }
  };

  // Handler untuk mengubah password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi input
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Semua field harus diisi',
        variant: 'destructive',
      });
      return;
    }

    // Validasi panjang password
    if (passwordForm.newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password baru minimal 6 karakter',
        variant: 'destructive',
      });
      return;
    }

    // Validasi konfirmasi password
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Password baru dan konfirmasi tidak cocok',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsChangingPassword(true);
      
      const response = await fetch('http://localhost:3000/api/admin/change-password', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: 'Berhasil',
          description: 'Password berhasil diubah',
        });
        
        // Reset form
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        // Tutup modal setelah berhasil
        setTimeout(() => {
          setShowSettings(false);
        }, 1500);
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Gagal mengubah password',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat mengubah password',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Menu items untuk sidebar
  const menuItems = [
    { 
      id: 'kelola-user', 
      label: 'Kelola User', 
      icon: Users,
      action: 'page' // Tetap di halaman ini
    },
    { 
      id: 'pasang-iklan', 
      label: 'Pasang Iklan', 
      icon: PlusCircle,
      action: 'page' // Halaman placeholder
    },
    { 
      id: 'isi-token', 
      label: 'Isi Token', 
      icon: Coins,
      action: 'page' // Halaman placeholder
    },
    { 
      id: 'pengaturan', 
      label: 'Pengaturan', 
      icon: Settings,
      action: 'navigate' // Navigate ke halaman AdminSettings
    },
  ];

  // Handler untuk klik menu
  const handleMenuClick = (item: typeof menuItems[0]) => {
    if (item.action === 'navigate' && item.id === 'pengaturan') {
      // Navigate ke halaman AdminSettings
      navigate('/admin/settings');
    } else {
      // Set active page untuk halaman lainnya
      setActivePage(item.id);
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    }
  };

  // Render konten berdasarkan halaman aktif
  const renderContent = () => {
    switch (activePage) {
      case 'kelola-user':
        return (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Properti</CardTitle>
                  <Home className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalProperties}</div>
                  <p className="text-xs text-muted-foreground">Semua properti di sistem</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Mitra</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalMitra}</div>
                  <p className="text-xs text-muted-foreground">{stats.activeMitra} aktif</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">Semua pengguna</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Mitra Aktif</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeMitra}</div>
                  <p className="text-xs text-green-600">Status aktif</p>
                </CardContent>
              </Card>
            </div>

            {/* User Management */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Kelola User & Mitra</CardTitle>
                    <CardDescription>Daftar semua user dan mitra yang terdaftar</CardDescription>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari nama atau email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Tidak ada data user
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-sm">Nama</th>
                          <th className="text-left py-3 px-4 font-medium text-sm">Email</th>
                          <th className="text-left py-3 px-4 font-medium text-sm">Kontak</th>
                          <th className="text-left py-3 px-4 font-medium text-sm">Role</th>
                          <th className="text-left py-3 px-4 font-medium text-sm">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-sm">Terdaftar</th>
                          <th className="text-left py-3 px-4 font-medium text-sm">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((u) => (
                          <tr key={u.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4">
                              <div className="font-medium">{u.name}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="w-4 h-4" />
                                {u.email}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="w-4 h-4" />
                                {u.phone || u.whatsapp || '-'}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                u.role === 'admin' 
                                  ? 'bg-purple-100 text-purple-700' 
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {u.role === 'admin' ? 'Admin' : 'Mitra'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                u.is_active === 1 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {u.is_active === 1 ? 'Aktif' : 'Nonaktif'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                {formatDate(u.created_at)}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleToggleActive(u.id, u.is_active)}
                                  disabled={u.role === 'admin'}
                                >
                                  {u.is_active === 1 ? (
                                    <UserX className="w-4 h-4" />
                                  ) : (
                                    <UserCheck className="w-4 h-4" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteUser(u.id)}
                                  disabled={u.role === 'admin'}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        );
      
      case 'pasang-iklan':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Pasang Iklan</CardTitle>
              <CardDescription>Kelola iklan dan promosi di platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <PlusCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Fitur Pasang Iklan</p>
                <p className="text-sm">Halaman ini sedang dalam pengembangan</p>
              </div>
            </CardContent>
          </Card>
        );
      
      case 'isi-token':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Isi Token</CardTitle>
              <CardDescription>Kelola token dan saldo pengguna</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Coins className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Fitur Isi Token</p>
                <p className="text-sm">Halaman ini sedang dalam pengembangan</p>
              </div>
            </CardContent>
          </Card>
        );
      
      default:
        return null;
    }
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
      <header className="bg-card border-b border-border fixed top-0 left-0 right-0 z-40">
        <div className="px-4 py-4">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="flex-shrink-0"
    >
                      {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </Button>
    
    <Link to="/" className="flex items-center gap-2">
      <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
        <Building2 className="w-6 h-6 text-primary-foreground" />
      </div>
      <span className="font-bold text-xl">
        Hunian<span className="text-primary">Kita</span>
      </span>
      <span className="ml-4 text-sm bg-primary/10 text-primary px-3 py-1 rounded-full font-medium hidden sm:inline-block">
        Admin Panel
      </span>
    </Link>
  </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Modal Pengaturan - TETAP ADA untuk backward compatibility */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Pengaturan Admin</CardTitle>
                  <CardDescription>Kelola akun administrator Anda</CardDescription>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
>
                    {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </Button>

              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Ubah Password
                  </h3>
                  
                  <div className="space-y-3">
                    {/* Password Saat Ini */}
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Password Saat Ini
                      </label>
                      <div className="relative">
                        <Input
                          type={showPasswords.current ? "text" : "password"}
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({
                            ...passwordForm,
                            currentPassword: e.target.value
                          })}
                          placeholder="Masukkan password saat ini"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({
                            ...showPasswords,
                            current: !showPasswords.current
                          })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPasswords.current ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Password Baru */}
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Password Baru
                      </label>
                      <div className="relative">
                        <Input
                          type={showPasswords.new ? "text" : "password"}
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({
                            ...passwordForm,
                            newPassword: e.target.value
                          })}
                          placeholder="Minimal 6 karakter"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({
                            ...showPasswords,
                            new: !showPasswords.new
                          })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPasswords.new ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Konfirmasi Password Baru */}
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Konfirmasi Password Baru
                      </label>
                      <div className="relative">
                        <Input
                          type={showPasswords.confirm ? "text" : "password"}
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({
                            ...passwordForm,
                            confirmPassword: e.target.value
                          })}
                          placeholder="Ulangi password baru"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({
                            ...showPasswords,
                            confirm: !showPasswords.confirm
                          })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPasswords.confirm ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowSettings(false);
                      setPasswordForm({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      });
                    }}
                    className="flex-1"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={isChangingPassword}
                    className="flex-1"
                  >
                    {isChangingPassword ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Menyimpan...
                      </>
                    ) : (
                      'Simpan Password'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex pt-[73px]">
        {/* Sidebar */}
        <aside className={`
          fixed lg:sticky top-[73px] left-0 h-[calc(100vh-73px)] bg-card border-r border-border
          transition-all duration-300 z-30
          ${sidebarOpen ? 'w-64' : 'w-0 lg:w-20'}
          overflow-hidden
        `}>
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                    ${isActive 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className={`font-medium whitespace-nowrap ${!sidebarOpen && 'lg:hidden'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Overlay untuk mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-20 lg:hidden top-[73px]"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className={`
          flex-1 p-4 sm:p-8 transition-all duration-300
        `}>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">
              {menuItems.find(item => item.id === activePage)?.label}
            </h1>
            <p className="text-muted-foreground mt-1">
              {activePage === 'kelola-user' && 'Kelola seluruh user dan mitra'}
              {activePage === 'pasang-iklan' && 'Kelola iklan dan promosi di platform'}
              {activePage === 'isi-token' && 'Kelola token dan saldo pengguna'}
            </p>
          </div>

          {renderContent()}
        </main>
      </div>
    </div>
  );
}