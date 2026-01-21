import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Coins, Search, User, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MitraUser {
  id: number;
  name: string;
  email: string;
  tokens: number;
  phone: string;
}

const TOKEN_PACKAGES = [
  { value: 15, label: '15 Token', price: 'Rp 10.000' },
  { value: 30, label: '30 Token', price: 'Rp 20.000' },
  { value: 75, label: '75 Token', price: 'Rp 50.000' },
  { value: 150, label: '150 Token', price: 'Rp 100.000' },
  { value: 330, label: '330 Token', price: 'Rp 200.000' },
];

export default function AdminIsiToken() {
  const { toast } = useToast();
  const [mitraUsers, setMitraUsers] = useState<MitraUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<MitraUser | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchMitraUsers();
  }, []);

  const fetchMitraUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        // Filter hanya mitra yang aktif
        const mitras = data.filter((u: any) => u.role === 'mitra' && u.is_active === 1);
        setMitraUsers(mitras);
      } else {
        toast({
          title: 'Error',
          description: 'Gagal memuat data mitra',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching mitra:', error);
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat memuat data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitToken = async () => {
    if (!selectedUser || !selectedPackage) {
      toast({
        title: 'Error',
        description: 'Pilih user dan paket token terlebih dahulu',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await fetch('http://localhost:3000/api/admin/add-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          tokens: selectedPackage
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: 'Berhasil! 🎉',
          description: `${selectedPackage} token berhasil ditambahkan ke akun ${selectedUser.name}`,
        });
        
        // Refresh data & reset form
        fetchMitraUsers();
        setSelectedUser(null);
        setSelectedPackage(null);
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Gagal menambahkan token',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error adding tokens:', error);
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat menambahkan token',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = mitraUsers.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" />
            Isi Token Mitra
          </CardTitle>
          <CardDescription>
            Tambahkan token ke akun mitra untuk memungkinkan mereka upload properti. 
            Setiap upload membutuhkan 15 token.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Pilih User */}
        <Card>
          <CardHeader>
            <CardTitle>1. Pilih Mitra</CardTitle>
            <CardDescription>Pilih user mitra yang akan diisi tokennya</CardDescription>
            
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Tidak ada mitra aktif</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`
                      w-full text-left p-4 rounded-lg border-2 transition-all
                      ${selectedUser?.id === user.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <Coins className="w-4 h-4 text-primary" />
                          <span className="font-bold text-primary">{user.tokens}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Token</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Pilih Paket & Konfirmasi */}
        <div className="space-y-6">
          {/* Pilih Paket Token */}
          <Card>
            <CardHeader>
              <CardTitle>2. Pilih Paket Token</CardTitle>
              <CardDescription>Pilih jumlah token yang akan ditambahkan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {TOKEN_PACKAGES.map((pkg) => (
                  <button
                    key={pkg.value}
                    onClick={() => setSelectedPackage(pkg.value)}
                    disabled={!selectedUser}
                    className={`
                      p-4 rounded-lg border-2 transition-all text-center
                      ${selectedPackage === pkg.value 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      }
                      ${!selectedUser ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <div className="font-bold text-xl mb-1">{pkg.label}</div>
                    <div className="text-sm text-muted-foreground">{pkg.price}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Ringkasan & Konfirmasi */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>3. Konfirmasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedUser && selectedPackage ? (
                <>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Mitra</span>
                      <span className="font-medium">{selectedUser.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Token Saat Ini</span>
                      <span className="font-bold text-primary">{selectedUser.tokens}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Token Ditambahkan</span>
                      <span className="font-bold text-green-600">+{selectedPackage}</span>
                    </div>
                    <div className="h-px bg-border"></div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total Token</span>
                      <span className="font-bold text-xl text-primary">
                        {selectedUser.tokens + selectedPackage}
                      </span>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-900">
                      Dengan {selectedUser.tokens + selectedPackage} token, mitra dapat upload{' '}
                      <strong>{Math.floor((selectedUser.tokens + selectedPackage) / 15)} properti</strong>
                    </p>
                  </div>

                  <Button
                    onClick={handleSubmitToken}
                    disabled={isSubmitting}
                    className="w-full h-12"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Memproses...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        Tambahkan Token
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Coins className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Pilih user dan paket token untuk melanjutkan</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}