import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Rocket, Save, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TokenSetting {
  id: number;
  setting_key: string;
  setting_value: number;
  description: string;
}

export default function SettingUpload() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [uploadCost, setUploadCost] = useState<number | string>(15);
  const [boostCost, setBoostCost] = useState<number | string>(15);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/admin/token-settings');
      const result = await response.json();
      
      if (result.success) {
        const settings = result.data;
        
        const uploadSetting = settings.find((s: TokenSetting) => s.setting_key === 'upload_property_cost');
        const boostSetting = settings.find((s: TokenSetting) => s.setting_key === 'boost_property_cost');
        
        if (uploadSetting) setUploadCost(uploadSetting.setting_value);
        if (boostSetting) setBoostCost(boostSetting.setting_value);
      } else {
        toast({
          title: 'Error',
          description: 'Gagal memuat data setting',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat memuat data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUploadCost = async () => {
    const cost = typeof uploadCost === 'string' ? parseInt(uploadCost) : uploadCost;
    
    if (!cost || cost < 1) {
      toast({
        title: 'Error',
        description: 'Biaya token minimal 1',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('http://localhost:3000/api/admin/token-settings/upload_property_cost', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: cost })
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Berhasil! 🎉',
          description: 'Biaya upload properti berhasil diupdate',
        });
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Gagal update setting',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving upload cost:', error);
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat menyimpan',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBoostCost = async () => {
    const cost = typeof boostCost === 'string' ? parseInt(boostCost) : boostCost;
    
    if (!cost || cost < 1) {
      toast({
        title: 'Error',
        description: 'Biaya token minimal 1',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('http://localhost:3000/api/admin/token-settings/boost_property_cost', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: cost })
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Berhasil! 🎉',
          description: 'Biaya boost properti berhasil diupdate',
        });
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Gagal update setting',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving boost cost:', error);
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat menyimpan',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Informasi Setting Token</p>
              <p>
                Atur biaya token yang dibutuhkan mitra untuk melakukan upload properti dan boost properti. 
                Perubahan akan langsung berlaku untuk semua transaksi selanjutnya.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Setting Upload Properti */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Upload className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Setting Upload Properti</CardTitle>
                <CardDescription>Biaya token untuk upload properti baru</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="upload-cost">Biaya Token</Label>
              <Input
                id="upload-cost"
                type="number"
                min="1"
                value={uploadCost}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setUploadCost('' as any);
                  } else {
                    setUploadCost(parseInt(val));
                  }
                }}
                onBlur={(e) => {
                  const val = e.target.value;
                  if (val === '' || parseInt(val) < 1) {
                    setUploadCost(1);
                  }
                }}
                placeholder="Masukkan jumlah token"
                className="text-lg font-semibold"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Setiap mitra membutuhkan <span className="font-semibold text-primary">{typeof uploadCost === 'number' ? uploadCost : 0} token</span> untuk upload 1 properti
              </p>
            </div>
            
            <Button 
              onClick={handleSaveUploadCost} 
              disabled={saving}
              className="w-full"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Simpan Perubahan
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Setting Boost Properti */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Rocket className="w-5 h-5 text-accent" />
              </div>
              <div>
                <CardTitle>Setting Boost Properti</CardTitle>
                <CardDescription>Biaya token untuk boost properti</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="boost-cost">Biaya Token</Label>
              <Input
                id="boost-cost"
                type="number"
                min="1"
                value={boostCost}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setBoostCost('' as any);
                  } else {
                    setBoostCost(parseInt(val));
                  }
                }}
                onBlur={(e) => {
                  const val = e.target.value;
                  if (val === '' || parseInt(val) < 1) {
                    setBoostCost(1);
                  }
                }}
                placeholder="Masukkan jumlah token"
                className="text-lg font-semibold"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Setiap mitra membutuhkan <span className="font-semibold text-accent">{typeof boostCost === 'number' ? boostCost : 0} token</span> untuk boost 1 properti
              </p>
            </div>
            
            <Button 
              onClick={handleSaveBoostCost} 
              disabled={saving}
              className="w-full"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Simpan Perubahan
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Preview Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Preview Biaya</CardTitle>
          <CardDescription>Simulasi biaya token untuk mitra</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Upload 1 Properti</p>
              <p className="text-2xl font-bold text-primary">{typeof uploadCost === 'number' ? uploadCost : 0} Token</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Boost 1 Properti</p>
              <p className="text-2xl font-bold text-accent">{typeof boostCost === 'number' ? boostCost : 0} Token</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Upload 5 Properti</p>
              <p className="text-2xl font-bold text-primary">{(typeof uploadCost === 'number' ? uploadCost : 0) * 5} Token</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Upload + Boost 1 Properti</p>
              <p className="text-2xl font-bold text-foreground">{(typeof uploadCost === 'number' ? uploadCost : 0) + (typeof boostCost === 'number' ? boostCost : 0)} Token</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}