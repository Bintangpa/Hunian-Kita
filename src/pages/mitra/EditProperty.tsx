import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Building2, LogOut, Upload, ArrowLeft, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';


const FACILITIES_OPTIONS = [
  'AC', 'WiFi', 'Kamar Mandi Dalam', 'Kamar Mandi Luar', 'Parkir Motor',
  'Parkir Mobil', 'Dapur', 'TV', 'Kasur', 'Lemari', 'Meja', 'Kursi',
  'Sarapan', 'Laundry', '24 Jam',
];

interface IndonesiaCity {
  id: string;
  name: string;
}

interface City {
  id: number;
  name: string;
  slug: string;
}

export default function EditProperty() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayWhatsApp, setDisplayWhatsApp] = useState('');

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
  
  // ✅ FETCH USER LENGKAP DARI API
  fetchFullUserData(parsedUser.id);
  fetchPropertyData();
  
}, [navigate, id]);

  

const fetchFullUserData = async (userId: number) => {
  try {
    const response = await fetch(`http://localhost:3000/api/users/${userId}`);
    if (response.ok) {
      const fullUserData = await response.json();
      const whatsappNumber = fullUserData.whatsapp || fullUserData.phone || '';
      setDisplayWhatsApp(whatsappNumber);
      console.log('✅ WhatsApp loaded:', whatsappNumber);
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
  }
};


  // Fungsi untuk normalisasi tipe properti dari database
  const normalizePropertyType = (type: string): string => {
    if (!type) return 'kost';
    
    const lowerType = type.toLowerCase().trim();
    
    // Map berbagai kemungkinan format dari database
    if (lowerType === 'kost' || lowerType === 'kos') return 'kost';
    if (lowerType === 'guesthouse' || lowerType === 'guest house' || lowerType === 'guest-house') return 'guesthouse';
    if (lowerType === 'villa') return 'villa';
    
    // Default ke kost jika tidak dikenali
    return 'kost';
  };

  const fetchPropertyData = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/rumah/${id}`);
      if (response.ok) {
        const data = await response.json();
        
        // Normalisasi type dari database
        const normalizedType = normalizePropertyType(data.type);
        
        console.log('Data dari API:', data);
        console.log('Original type:', data.type);
        console.log('Normalized type:', normalizedType);
        
        setFormData({
          title: data.nama || '',
          type: normalizedType, // Gunakan normalized type
          city: data.city || '',
          city_id: '',
          address: data.alamat || '',
          price: data.harga?.toString() || '',
          price_unit: data.priceUnit || 'bulan',
          description: data.description || '',
          facilities: data.facilities || [],
          images: [],
          owner_name: data.ownerName || '',
          
          bedrooms: data.bedrooms?.toString() || '1',
          bathrooms: data.bathrooms?.toString() || '1',
          area: data.area?.toString() || '',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Properti tidak ditemukan',
          variant: 'destructive',
        });
        navigate('/mitra/dashboard');
      }
    } catch (error) {
      console.error('Error fetching property:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data properti',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    // Validasi type sebelum submit
    if (!formData.type) {
      toast({
        title: 'Error',
        description: 'Tipe properti harus dipilih',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadData = new FormData();
      
      uploadData.append('title', formData.title);
      uploadData.append('type', formData.type); // Pastikan type ter-append
      uploadData.append('city', formData.city);
      uploadData.append('address', formData.address);
      uploadData.append('price', formData.price);
      uploadData.append('price_unit', formData.price_unit);
      uploadData.append('description', formData.description);
      uploadData.append('facilities', JSON.stringify(formData.facilities));
      uploadData.append('owner_name', formData.owner_name);
      uploadData.append('owner_whatsapp', displayWhatsApp);
      uploadData.append('bedrooms', formData.bedrooms);
      uploadData.append('bathrooms', formData.bathrooms);
      uploadData.append('area', formData.area || '0');
      
      // Mapping category_id yang konsisten
      const categoryMap: Record<string, number> = { 
        'kost': 1, 
        'guesthouse': 2, 
        'villa': 3 
      };
      const category_id = categoryMap[formData.type.toLowerCase()] || 1;
      uploadData.append('category_id', category_id.toString());
      
      // Debug log
      console.log('Form data being sent:');
      console.log('Type:', formData.type);
      console.log('Category ID:', category_id);
      
      formData.images.forEach((file) => {
        uploadData.append('images', file);
      });

      const response = await fetch(`http://localhost:3000/api/properties/${id}`, {
        method: 'PUT',
        body: uploadData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: 'Berhasil! 🎉',
          description: 'Properti berhasil diupdate',
        });
        navigate('/mitra/dashboard');
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Gagal mengupdate properti',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating property:', error);
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat mengupdate properti',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

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
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/mitra/dashboard')} 
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Dashboard
          </Button>
        </div>

        <div className="bg-card border border-border rounded-xl p-8">
          <h1 className="text-2xl font-bold mb-6">Edit Properti</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="title">Judul Properti *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="type">Tipe Properti *</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => {
                    console.log('Type changed to:', value);
                    setFormData(prev => ({ ...prev, type: value }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tipe properti">
                      {formData.type === 'kost' && 'Kost'}
                      {formData.type === 'guesthouse' && 'Guest House'}
                      {formData.type === 'villa' && 'Villa'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kost">Kost</SelectItem>
                    <SelectItem value="guesthouse">Guest House</SelectItem>
                    <SelectItem value="villa">Villa</SelectItem>
                  </SelectContent>
                </Select>
                {/* Debug info - hapus setelah testing */}
                <p className="text-xs text-muted-foreground mt-1">
                  Current type: {formData.type}
                </p>
              </div>

              
              <div>
                <Label htmlFor="city">Kota</Label>
                <div className="px-3 py-2 border border-border rounded-md bg-muted text-muted-foreground">
                    {formData.city || 'Tidak ada data'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    Kota tidak dapat diubah saat edit properti
                </p>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="address">Alamat Lengkap *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="price">Harga *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="price_unit">Satuan Harga</Label>
                <Select value={formData.price_unit} onValueChange={(value) => setFormData(prev => ({ ...prev, price_unit: value }))}>
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
                  onChange={(e) => setFormData(prev => ({ ...prev, bedrooms: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="bathrooms">Jumlah Kamar Mandi</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  min="1"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData(prev => ({ ...prev, bathrooms: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="area">Luas (m²)</Label>
                <Input
                  id="area"
                  type="number"
                  value={formData.area}
                  onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                  placeholder="20"
                />
              </div>

              <div>
                <Label htmlFor="owner_name">Nama Pemilik *</Label>
                <Input
                  id="owner_name"
                  value={formData.owner_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, owner_name: e.target.value }))}
                  placeholder="Nama lengkap"
                  required
                />
              </div>

              <div>
  <Label htmlFor="owner_whatsapp">Nomor WhatsApp *</Label>
  <div className="relative">
    <Input
      id="owner_whatsapp"
      value={displayWhatsApp}
      readOnly
      disabled
      className="bg-muted cursor-not-allowed pl-10"
    />
    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
  </div>
  <p className="text-xs text-muted-foreground mt-1">
    Nomor WhatsApp dari akun Anda (tidak dapat diubah)
  </p>
</div>

              <div className="md:col-span-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Deskripsikan properti Anda..."
                  rows={4}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="images">Upload Gambar Baru (Opsional)</Label>
                <Input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setFormData(prev => ({ ...prev, images: files }));
                  }}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Upload gambar baru akan mengganti gambar lama
                </p>
              </div>

              <div className="md:col-span-2">
                <Label>Fasilitas</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  {FACILITIES_OPTIONS.map(facility => (
                    <div key={facility} className="flex items-center space-x-2">
                      <Checkbox
                        id={facility}
                        checked={formData.facilities.includes(facility)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData(prev => ({ ...prev, facilities: [...prev.facilities, facility] }));
                          } else {
                            setFormData(prev => ({ ...prev, facilities: prev.facilities.filter(f => f !== facility) }));
                          }
                        }}
                      />
                      <Label htmlFor={facility} className="text-sm font-normal cursor-pointer">
                        {facility}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/mitra/dashboard')}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Simpan Perubahan
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}