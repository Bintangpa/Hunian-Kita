import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Home, LogOut, Plus, Edit, Trash2, Upload, X, Check, ChevronsUpDown,Coins } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Property {
  id: number;
  nama: string;
  type: string;
  alamat: string;
  city: string;
  district: string;
  harga: number;
  priceUnit: string;
  description: string;
  facilities: string[];
  images: string[];
  ownerName: string;
  whatsappNumber: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  status: string;
  views: number;
  whatsappClicks: number;
  createdAt: string;
}

interface City {
  id: number;
  name: string;
  slug: string;
}

// Interface untuk API Indonesia
interface IndonesiaCity {
  id: string;
  name: string;
}

const FACILITIES_OPTIONS = [
  'AC',
  'WiFi',
  'Kamar Mandi Dalam',
  'Kamar Mandi Luar',
  'Parkir Motor',
  'Parkir Mobil',
  'Dapur',
  'TV',
  'Kasur',
  'Lemari',
  'Meja',
  'Kursi',
  'Sarapan',
  'Laundry',
  '24 Jam',
];

export default function MitraDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [cities, setCities] = useState<IndonesiaCity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [openCityCombo, setOpenCityCombo] = useState(false);
  const [userTokens, setUserTokens] = useState<number>(0);
  const [loadingTokens, setLoadingTokens] = useState(false);


  const [formData, setFormData] = useState({
    title: '',
    type: '',
    city: '',
    city_id: '',
    address: '',
    price: '',
    price_unit: 'bulan',
    description: '',
    facilities: [] as string[],
    images: [] as File[],
    owner_name: '',
    owner_whatsapp: '',
    bedrooms: '1',
    bathrooms: '1',
    area: '',
  });

  useEffect(() => {
  const userData = localStorage.getItem('user');
  
  if (!userData) {
    navigate('/login');
    return;
  }
  
  const parsedUser = JSON.parse(userData);
  
  if (parsedUser.role !== 'mitra') {
    navigate('/');
    return;
  }
  
  setUser(parsedUser);
  
  // ✅ SELALU FETCH TOKEN DARI API (tidak pakai localStorage)
  fetchUserTokens(parsedUser.id);
  
  fetchProperties(parsedUser.id);
  fetchIndonesiaCities();
}, [navigate]);

  // ✅ Fetch kota dari API Indonesia
  const fetchIndonesiaCities = async () => {
    setLoadingCities(true);
    try {
      // Menggunakan API Wilayah Indonesia
      const response = await fetch('https://www.emsifa.com/api-wilayah-indonesia/api/regencies/11.json');
      
      if (response.ok) {
        const data = await response.json();
        
        // Transform data untuk semua provinsi
        const allCities: IndonesiaCity[] = [];
        
        // Fetch kota dari beberapa provinsi populer
        const popularProvinces = [
          '11', // Aceh
          '12', // Sumatera Utara
          '13', // Sumatera Barat
          '14', // Riau
          '15', // Jambi
          '16', // Sumatera Selatan
          '17', // Bengkulu
          '18', // Lampung
          '19', // Kepulauan Bangka Belitung
          '21', // Kepulauan Riau
          '31', // DKI Jakarta
          '32', // Jawa Barat
          '33', // Jawa Tengah
          '34', // DI Yogyakarta
          '35', // Jawa Timur
          '36', // Banten
          '51', // Bali
          '52', // Nusa Tenggara Barat
          '53', // Nusa Tenggara Timur
          '61', // Kalimantan Barat
          '62', // Kalimantan Tengah
          '63', // Kalimantan Selatan
          '64', // Kalimantan Timur
          '65', // Kalimantan Utara
          '71', // Sulawesi Utara
          '72', // Sulawesi Tengah
          '73', // Sulawesi Selatan
          '74', // Sulawesi Tenggara
          '75', // Gorontalo
          '76', // Sulawesi Barat
          '81', // Maluku
          '82', // Maluku Utara
          '91', // Papua Barat
          '94', // Papua
        ];

        // Fetch semua kota sekaligus
        const promises = popularProvinces.map(provinceId =>
          fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provinceId}.json`)
            .then(res => res.json())
            .catch(() => [])
        );

        const results = await Promise.all(promises);
        results.forEach(cities => {
          allCities.push(...cities);
        });

        // Sort alphabetically
        const sortedCities = allCities.sort((a, b) => a.name.localeCompare(b.name));
        
        setCities(sortedCities);
        console.log('✅ Loaded', sortedCities.length, 'cities from Indonesia API');
      }
    } catch (error) {
      console.error('Error fetching Indonesia cities:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data kota. Menggunakan data lokal.',
        variant: 'destructive',
      });
      
      // Fallback ke API lokal jika gagal
      fetchLocalCities();
    } finally {
      setLoadingCities(false);
    }
  };

  // Fallback: fetch dari database lokal
  const fetchLocalCities = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/cities');
      if (response.ok) {
        const data = await response.json();
        setCities(data.map((city: City) => ({
          id: city.id.toString(),
          name: city.name
        })));
      }
    } catch (error) {
      console.error('Error fetching local cities:', error);
    }
  };

  const fetchUserTokens = async (userId: number) => {
  try {
    setLoadingTokens(true);
    const response = await fetch(`http://localhost:3000/api/users/${userId}/tokens`);
    if (response.ok) {
      const data = await response.json();
      setUserTokens(data.tokens);
      
      // ✅ UPDATE LOCALSTORAGE JUGA
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        parsedUser.tokens = data.tokens;
        localStorage.setItem('user', JSON.stringify(parsedUser));
        setUser(parsedUser);
      }
      
      console.log('✅ User tokens:', data.tokens);
    }
  } catch (error) {
    console.error('Error fetching tokens:', error);
  } finally {
    setLoadingTokens(false);
  }
};



  const fetchProperties = async (userId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/properties/mitra/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setProperties(data);
      } else {
        toast({
          title: 'Error',
          description: 'Gagal memuat properti',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat memuat properti',
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

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCitySelect = (cityId: string, cityName: string) => {
    setFormData(prev => ({ 
      ...prev, 
      city_id: '',
      city: cityName 
    }));
    setOpenCityCombo(false);
  };

  const handleFacilityToggle = (facility: string) => {
    setFormData(prev => {
      const facilities = prev.facilities.includes(facility)
        ? prev.facilities.filter(f => f !== facility)
        : [...prev.facilities, facility];
      return { ...prev, facilities };
    });
  };

  const handlePriceChange = (value: string) => {
    const numbersOnly = value.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, price: numbersOnly }));
  };

  const formatPriceDisplay = (value: string) => {
    if (!value) return '';
    return parseInt(value).toLocaleString('id-ID');
  };

  
const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(e.target.files || []);
  
  if (files.length === 0) return;
  
  // Cek total size
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (totalSize > maxSize) {
    const totalMB = (totalSize / (1024 * 1024)).toFixed(2);
    toast({
      title: 'Error',
      description: `Total ukuran foto ${totalMB}MB melebihi batas 5MB`,
      variant: 'destructive',
    });
    e.target.value = ''; // Reset input
    return;
  }
  
  setFormData(prev => ({ ...prev, images: files }));
  const previews = files.map(file => URL.createObjectURL(file));
  setImagePreviews(previews);
};

  const removeImage = (index: number) => {
    setFormData(prev => {
      const newImages = prev.images.filter((_, i) => i !== index);
      return { ...prev, images: newImages };
    });
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;


// ✅ TAMBAH VALIDASI TOKEN DI SINI (SEBELUM validasi field)
  if (userTokens < 15) {
    toast({
      title: 'Token Tidak Cukup! 🪙',
      description: `Anda hanya memiliki ${userTokens} token. Dibutuhkan 15 token untuk upload properti.`,
      variant: 'destructive',
    });
    return;
  }

    
// Validasi field wajib
if (!formData.title || !formData.type || !formData.city || !formData.address || !formData.price || !formData.owner_name || !formData.owner_whatsapp) {
  toast({
    title: 'Error',
    description: 'Mohon lengkapi semua field yang wajib diisi',
    variant: 'destructive',
  });
  return;
}

// Validasi foto wajib
if (formData.images.length === 0) {
  toast({
    title: 'Error',
    description: 'Minimal 1 foto properti harus diupload',
    variant: 'destructive',
  });
  return;
}

// Validasi total size foto max 5MB
const totalSize = formData.images.reduce((sum, file) => sum + file.size, 0);
const maxSize = 5 * 1024 * 1024; // 5MB in bytes
if (totalSize > maxSize) {
  const totalMB = (totalSize / (1024 * 1024)).toFixed(2);
  toast({
    title: 'Error',
    description: `Total ukuran foto ${totalMB}MB melebihi batas 5MB`,
    variant: 'destructive',
  });
  return;
}


    setIsSubmitting(true);

    try {
      const uploadData = new FormData();
      
      uploadData.append('title', formData.title);
      uploadData.append('type', formData.type);
      uploadData.append('city', formData.city);
      
      uploadData.append('address', formData.address);
      uploadData.append('price', formData.price);
      uploadData.append('price_unit', formData.price_unit);
      uploadData.append('description', formData.description);
      uploadData.append('facilities', JSON.stringify(formData.facilities));
      uploadData.append('owner_name', formData.owner_name);
      uploadData.append('owner_whatsapp', formData.owner_whatsapp);
      uploadData.append('bedrooms', formData.bedrooms);
      uploadData.append('bathrooms', formData.bathrooms);
      uploadData.append('area', formData.area || '0');
      uploadData.append('user_id', user.id.toString());
      
      const categoryMap: Record<string, number> = { 
        'kost': 1, 
        'guesthouse': 2, 
        'villa': 3 
      };
      const category_id = categoryMap[formData.type.toLowerCase()] || 1;
      uploadData.append('category_id', category_id.toString());
      
      formData.images.forEach((file) => {
        uploadData.append('images', file);
      });

      console.log('📤 Uploading property with', formData.images.length, 'images');

      const response = await fetch('http://localhost:3000/api/properties', {
        method: 'POST',
        body: uploadData,
      });

      const result = await response.json();

      
      if (response.ok && result.success) {
    const newTokens = userTokens - 15;
    setUserTokens(newTokens); // Update tokens di UI
    
    // ✅ UPDATE LOCALSTORAGE
    const updatedUser = { ...user, tokens: newTokens };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser); // Update state user juga
    
    toast({
      title: 'Berhasil! 🎉',
      description: `Properti berhasil diupload! Token Anda: ${newTokens} (dikurangi 15)`,
    });
    setIsDialogOpen(false);
    resetForm();
    fetchProperties(user.id);


      } else {
        toast({
          title: 'Error',
          description: result.message || 'Gagal mengupload properti',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error uploading property:', error);
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat mengupload properti',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus properti ini?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/properties/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: 'Berhasil',
          description: 'Properti berhasil dihapus',
        });
        if (user) {
          fetchProperties(user.id);
        }
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Gagal menghapus properti',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting property:', error);
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat menghapus properti',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      type: '',
      city: '',
      city_id: '',
      address: '',
      price: '',
      price_unit: 'bulan',
      description: '',
      facilities: [],
      images: [],
      owner_name: '',
      owner_whatsapp: '',
      bedrooms: '1',
      bathrooms: '1',
      area: '',
    });
    setImagePreviews([]);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      available: { label: 'Aktif', className: 'bg-green-100 text-green-800' },
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      sold: { label: 'Terjual', className: 'bg-gray-100 text-gray-800' },
    };
    const statusInfo = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalProperties = properties.length;
  const activeProperties = properties.filter(p => p.status === 'available').length;
  const pendingProperties = properties.filter(p => p.status === 'pending').length;

  return (
    <div className="min-h-screen bg-background">
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
              <span className="ml-4 text-sm bg-accent/10 text-accent px-3 py-1 rounded-full font-medium">
                Mitra Panel
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

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard Mitra</h1>
          <p className="text-muted-foreground mt-1">Kelola properti Anda</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Properti Saya</CardTitle>
                    <Home className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProperties}</div>
              <p className="text-xs text-muted-foreground">
                {activeProperties} aktif, {pendingProperties} pending
              </p>
          </CardContent>
          </Card>

  {/* ✅ TAMBAH CARD TOKEN INI */}
  <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">Token Saya</CardTitle>
      <Coins className="h-4 w-4 text-primary" />
    </CardHeader>
    <CardContent>
      {loadingTokens ? (
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      ) : (
        <>
          <div className="text-2xl font-bold text-primary">{userTokens}</div>
          <p className="text-xs text-muted-foreground">
            15 token per upload properti
          </p>
        </>
      )}
    </CardContent>
  </Card>
</div>

        
        <div className="mb-6">
  <Button 
    size="lg" 
    className="gap-2" 
    onClick={() => setIsDialogOpen(true)}
    disabled={userTokens < 15}
  >
    <Plus className="w-5 h-5" />
    Tambah Properti Baru
    {userTokens < 15 && (
      <span className="ml-2 text-xs">(Token tidak cukup)</span>
    )}
  </Button>
  
  {/* ✅ TAMBAH WARNING jika token < 15 */}
  {userTokens < 15 && (
    <p className="text-sm text-destructive mt-2 flex items-center gap-1">
      <Coins className="w-4 h-4" />
      Anda memiliki {userTokens} token. Butuh 15 token untuk upload properti.
    </p>
  )}
</div>


        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Properti Saya</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Home className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Belum ada properti</p>
              <p className="text-sm mt-1">Klik tombol "Tambah Properti Baru" untuk memulai</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {properties.map((property) => {
                let imageUrl = '';
                if (property.images && property.images.length > 0) {
                  imageUrl = property.images[0];
                  
                  if (imageUrl && typeof imageUrl === 'string') {
                    if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/uploads/')) {
                      imageUrl = `/uploads/${imageUrl}`;
                    }
                    
                    if (imageUrl.startsWith('/uploads/')) {
                      imageUrl = `http://localhost:3000${imageUrl}`;
                    }
                  }
                }
                
                return (
                <Card key={property.id} className="overflow-hidden">
                  <div className="relative h-48 bg-muted">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={property.nama}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home className="w-12 h-12 text-muted-foreground opacity-50" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      {getStatusBadge(property.status)}
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg">{property.nama}</CardTitle>
                    <CardDescription>
                      {property.type} • {property.alamat || property.city || 'Lokasi tidak tersedia'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-2xl font-bold text-primary">
                        Rp {property.harga.toLocaleString('id-ID')}
                        <span className="text-sm font-normal text-muted-foreground">/{property.priceUnit}</span>
                      </p>
                      <div className="flex gap-2 pt-2">
                        
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(`/mitra/property/edit/${property.id}`)}
>
                        <Edit className="w-4 h-4 mr-2" />
                           Edit
                      </Button>

                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleDelete(property.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Hapus
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
              })}
            </div>
          )}
        </div>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Properti Baru</DialogTitle>
            <DialogDescription>
              Lengkapi informasi properti Anda. Semua field bertanda * wajib diisi.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="title">
                  Judul Properti <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Contoh: Kost Eksklusif Menteng"
                  required
                />
              </div>

              <div>
                <Label htmlFor="type">
                  Tipe Properti <span className="text-destructive">*</span>
                </Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kost">Kost</SelectItem>
                    <SelectItem value="guesthouse">Guest House</SelectItem>
                    <SelectItem value="villa">Villa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="city">
                  Kota <span className="text-destructive">*</span>
                </Label>
                <Popover open={openCityCombo} onOpenChange={setOpenCityCombo}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCityCombo}
                      className="w-full justify-between"
                      disabled={loadingCities}
                    >
                      {loadingCities ? (
                        <span className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          Memuat kota...
                        </span>
                      ) : (
                        formData.city || "Pilih kota..."
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Cari kota..." />
                      <CommandEmpty>Kota tidak ditemukan.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-auto">
                        {cities.map((city) => (
                          <CommandItem
                            key={city.id}
                            value={city.name}
                            onSelect={() => handleCitySelect(city.id.toString(), city.name)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.city === city.name ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {city.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground mt-1">
                  {cities.length > 0 ? `${cities.length} kota tersedia` : 'Memuat data kota...'}
                </p>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="address">
                  Alamat Lengkap <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Contoh: Jl. Sudirman No. 123, Menteng"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Masukkan alamat lengkap properti (jalan, nomor, kecamatan)
                </p>
              </div>

              <div>
                <Label htmlFor="price">
                  Harga <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="price"
                  type="text"
                  value={formatPriceDisplay(formData.price)}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  placeholder="2.500.000"
                  required
                />
                {formData.price && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Rp {formatPriceDisplay(formData.price)}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="price_unit">Satuan Harga</Label>
                <Select value={formData.price_unit} onValueChange={(value) => handleInputChange('price_unit', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bulan">Bulan</SelectItem>
                    <SelectItem value="malam">Malam</SelectItem>
                    <SelectItem value="tahun">Tahun</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="bedrooms">Jumlah Kamar Tidur</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  min="1"
                  value={formData.bedrooms}
                  onChange={(e) => handleInputChange('bedrooms', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="bathrooms">Jumlah Kamar Mandi</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  min="1"
                  value={formData.bathrooms}
                  onChange={(e) => handleInputChange('bathrooms', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="area">Luas (m²)</Label>
                <Input
                  id="area"
                  type="number"
                  value={formData.area}
                  onChange={(e) => handleInputChange('area', e.target.value)}
                  placeholder="20"
                />
              </div>

              <div>
                <Label htmlFor="owner_name">
                  Nama Pemilik <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="owner_name"
                  value={formData.owner_name}
                  onChange={(e) => handleInputChange('owner_name', e.target.value)}
                  placeholder="Nama lengkap"
                  required
                />
              </div>

              <div>
                <Label htmlFor="owner_whatsapp">
                  Nomor WhatsApp <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="owner_whatsapp"
                  value={formData.owner_whatsapp}
                  onChange={(e) => handleInputChange('owner_whatsapp', e.target.value)}
                  placeholder="628123456789"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Deskripsikan properti Anda..."
                  rows={4}
                />
              </div>

              <div className="md:col-span-2">
                <Label>Fasilitas</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  {FACILITIES_OPTIONS.map(facility => (
                    <div key={facility} className="flex items-center space-x-2">
                      <Checkbox
                        id={facility}
                        checked={formData.facilities.includes(facility)}
                        onCheckedChange={() => handleFacilityToggle(facility)}
                      />
                      <Label
                        htmlFor={facility}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {facility}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="images">Gambar Properti</Label>
                <Input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="mt-2"
                />
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 h-6 w-6 p-0"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Mengupload...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Properti
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}