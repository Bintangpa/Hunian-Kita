import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { 
  Building2, LogOut, Lock, Eye, EyeOff, ArrowLeft, Save, User, Menu, X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('footer');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // State untuk Footer Settings
  const [footerSettings, setFooterSettings] = useState({
    footer_brand_name: '',
    footer_description: '',
    footer_instagram: '',
    footer_facebook: '',
    footer_twitter: '',
    footer_cities: '',
    footer_copyright: ''
  });

  // State untuk Password
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // State untuk Profile
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    whatsapp: ''
  });

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
    loadFooterSettings();
    loadAdminProfile(parsedUser.id);
  }, [navigate]);

  const loadFooterSettings = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/settings/footer');
      if (response.ok) {
        const data = await response.json();
        setFooterSettings(data);
      }
    } catch (error) {
      console.error('Error loading footer settings:', error);
    }
  };

  const loadAdminProfile = async (userId: number) => {
    try {
      const response = await fetch(`http://localhost:3000/api/admin/profile/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setProfileForm({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          whatsapp: data.whatsapp || ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleSaveFooter = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const response = await fetch('http://localhost:3000/api/admin/settings/footer', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          settings: footerSettings
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: 'Berhasil',
          description: 'Pengaturan footer berhasil disimpan',
        });
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Gagal menyimpan pengaturan',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving footer:', error);
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat menyimpan',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Semua field harus diisi',
        variant: 'destructive',
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password baru minimal 6 karakter',
        variant: 'destructive',
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Password baru dan konfirmasi tidak cocok',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('http://localhost:3000/api/admin/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
        
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
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
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const response = await fetch(`http://localhost:3000/api/admin/profile/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: 'Berhasil',
          description: 'Profil berhasil diperbarui',
        });
        
        // Update localStorage
        const updatedUser = { ...user, ...result.user };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Gagal memperbarui profil',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const menuTabs = [
    { id: 'footer', label: 'Footer Website', icon: Building2 },
    { id: 'profile', label: 'Profil Admin', icon: User },
    { id: 'security', label: 'Keamanan', icon: Lock }
  ];

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
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/admin/dashboard')}
                className="hidden sm:flex"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali
              </Button>
              
              <Link to="/admin/dashboard" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="font-bold text-lg">Pengaturan Admin</h1>
                  <p className="text-xs text-muted-foreground">Kelola konfigurasi sistem</p>
                </div>
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
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

      <div className="flex pt-[73px]">
        {/* Sidebar Navigation */}
        <aside className={`
          fixed lg:sticky top-[73px] left-0 h-[calc(100vh-73px)] bg-card border-r border-border
          transition-all duration-300 z-30
          ${sidebarOpen ? 'w-64' : 'w-0 lg:w-20'}
          overflow-hidden
        `}>
          <div className="p-4">
            <h3 className={`text-sm font-semibold mb-4 text-muted-foreground uppercase ${!sidebarOpen && 'lg:hidden'}`}>
              Menu Pengaturan
            </h3>
            <nav className="space-y-2">
              {menuTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (window.innerWidth < 1024) {
                        setSidebarOpen(false);
                      }
                    }}
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
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Overlay untuk mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-20 lg:hidden top-[73px]"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-8">
          {/* Tab: Footer Settings */}
          {activeTab === 'footer' && (
            <Card>
              <CardHeader>
                <CardTitle>Pengaturan Footer Website</CardTitle>
                <CardDescription>
                  Kelola konten yang ditampilkan di footer website
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveFooter} className="space-y-6">
                  {/* Brand */}
                  <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                    <h3 className="font-semibold text-sm">Brand & Deskripsi</h3>
                    
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Nama Brand
                      </label>
                      <Input
                        value={footerSettings.footer_brand_name}
                        onChange={(e) => setFooterSettings({
                          ...footerSettings,
                          footer_brand_name: e.target.value
                        })}
                        placeholder="HunianKita"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Deskripsi
                      </label>
                      <Textarea
                        value={footerSettings.footer_description}
                        onChange={(e) => setFooterSettings({
                          ...footerSettings,
                          footer_description: e.target.value
                        })}
                        placeholder="Platform pencarian hunian terlengkap..."
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Social Media */}
                  <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                    <h3 className="font-semibold text-sm">Media Sosial</h3>
                    
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Instagram URL
                      </label>
                      <Input
                        value={footerSettings.footer_instagram}
                        onChange={(e) => setFooterSettings({
                          ...footerSettings,
                          footer_instagram: e.target.value
                        })}
                        placeholder="https://instagram.com/huniankita"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Facebook URL
                      </label>
                      <Input
                        value={footerSettings.footer_facebook}
                        onChange={(e) => setFooterSettings({
                          ...footerSettings,
                          footer_facebook: e.target.value
                        })}
                        placeholder="https://facebook.com/huniankita"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Twitter URL
                      </label>
                      <Input
                        value={footerSettings.footer_twitter}
                        onChange={(e) => setFooterSettings({
                          ...footerSettings,
                          footer_twitter: e.target.value
                        })}
                        placeholder="https://twitter.com/huniankita"
                      />
                    </div>
                  </div>

                  {/* Cities */}
                  <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                    <h3 className="font-semibold text-sm">Kota Populer</h3>
                    
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Daftar Kota (pisahkan dengan koma)
                      </label>
                      <Input
                        value={footerSettings.footer_cities}
                        onChange={(e) => setFooterSettings({
                          ...footerSettings,
                          footer_cities: e.target.value
                        })}
                        placeholder="Jakarta,Bandung,Bali,Yogyakarta"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Contoh: Jakarta,Bandung,Bali,Yogyakarta
                      </p>
                    </div>
                  </div>

                  {/* Copyright */}
                  <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                    <h3 className="font-semibold text-sm">Copyright</h3>
                    
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Teks Copyright
                      </label>
                      <Input
                        value={footerSettings.footer_copyright}
                        onChange={(e) => setFooterSettings({
                          ...footerSettings,
                          footer_copyright: e.target.value
                        })}
                        placeholder="© 2026 HunianKita. Hak cipta dilindungi."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={loadFooterSettings}
                    >
                      Reset
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Simpan Perubahan
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Tab: Profile */}
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle>Profil Administrator</CardTitle>
                <CardDescription>
                  Kelola informasi profil Anda
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveProfile} className="space-y-4 max-w-2xl">
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Nama Lengkap
                    </label>
                    <Input
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({
                        ...profileForm,
                        name: e.target.value
                      })}
                      placeholder="Nama lengkap"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({
                        ...profileForm,
                        email: e.target.value
                      })}
                      placeholder="email@example.com"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      No. Telepon
                    </label>
                    <Input
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({
                        ...profileForm,
                        phone: e.target.value
                      })}
                      placeholder="081234567890"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      WhatsApp
                    </label>
                    <Input
                      value={profileForm.whatsapp}
                      onChange={(e) => setProfileForm({
                        ...profileForm,
                        whatsapp: e.target.value
                      })}
                      placeholder="081234567890"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => loadAdminProfile(user.id)}
                    >
                      Batal
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Simpan Profil
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Tab: Security (Password) */}
          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle>Keamanan Akun</CardTitle>
                <CardDescription>
                  Ubah password untuk keamanan akun Anda
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-2xl">
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

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-800">
                      <strong>Tips keamanan:</strong> Gunakan password yang kuat dengan kombinasi huruf besar, huruf kecil, angka, dan simbol.
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPasswordForm({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      })}
                    >
                      Batal
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          Ubah Password
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}