import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Settings, Save, Plus, Trash2, Edit, FileText, 
  List, Package, MessageSquare, Loader2, CheckCircle2,
  AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Hero {
  id: number;
  title: string;
  subtitle: string;
}

interface Step {
  id: number;
  step_number: number;
  title: string;
  description: string;
  display_order: number;
}

interface Plan {
  id: number;
  name: string;
  price: number;
  period: string;
  description: string;
  icon: string;
  is_popular: number;
  features: string[];
}

interface TokenPackage {
  id: number;
  tokens: number;
  price: number;
  bonus: number;
  display_order: number;
}

interface CTA {
  id: number;
  title: string;
  description: string;
  button_text: string;
  whatsapp_number: string;
  whatsapp_message: string;
}

export default function PasangIklanSetting() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // States untuk setiap section
  const [hero, setHero] = useState<Hero | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [tokenPackages, setTokenPackages] = useState<TokenPackage[]>([]);
  const [cta, setCta] = useState<CTA | null>(null);
  
  // States untuk collapse sections
  const [expandedSections, setExpandedSections] = useState({
    hero: true,
    steps: false,
    plans: false,
    tokens: false,
    cta: false,
  });

  // States untuk edit mode
  const [editingStep, setEditingStep] = useState<number | null>(null);
  const [editingPlan, setEditingPlan] = useState<number | null>(null);
  const [editingToken, setEditingToken] = useState<number | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/pasang-iklan/content');
      const result = await response.json();
      
      if (result.success) {
        setHero(result.data.hero);
        setSteps(result.data.steps);
        setPlans(result.data.plans);
        setTokenPackages(result.data.tokenPackages);
        setCta(result.data.cta);
      } else {
        toast({
          title: 'Error',
          description: 'Gagal memuat data',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat memuat data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // ========== HERO SECTION ==========
  const saveHero = async () => {
    if (!hero) return;
    
    try {
      setSaving(true);
      const response = await fetch('http://localhost:3000/api/admin/pasang-iklan/hero', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: hero.title,
          subtitle: hero.subtitle
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Berhasil! 🎉',
          description: 'Hero section berhasil diupdate',
        });
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Gagal update hero',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving hero:', error);
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat menyimpan',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // ========== STEPS SECTION ==========
  const saveStep = async (step: Step) => {
    try {
      setSaving(true);
      const response = await fetch(`http://localhost:3000/api/admin/pasang-iklan/steps/${step.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step_number: step.step_number,
          title: step.title,
          description: step.description
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Berhasil! 🎉',
          description: 'Step berhasil diupdate',
        });
        setEditingStep(null);
        fetchAllData();
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Gagal update step',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving step:', error);
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat menyimpan',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const addNewStep = async () => {
    const newStep = {
      step_number: steps.length + 1,
      title: 'Step Baru',
      description: 'Deskripsi step',
      display_order: steps.length + 1
    };

    try {
      setSaving(true);
      const response = await fetch('http://localhost:3000/api/admin/pasang-iklan/steps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStep)
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Berhasil! 🎉',
          description: 'Step baru berhasil ditambahkan',
        });
        fetchAllData();
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Gagal menambah step',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error adding step:', error);
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat menambah step',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteStep = async (id: number) => {
    if (!confirm('Yakin ingin menghapus step ini?')) return;

    try {
      setSaving(true);
      const response = await fetch(`http://localhost:3000/api/admin/pasang-iklan/steps/${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Berhasil! 🎉',
          description: 'Step berhasil dihapus',
        });
        fetchAllData();
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Gagal menghapus step',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting step:', error);
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat menghapus',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // ========== PLANS SECTION ==========
  const savePlan = async (plan: Plan) => {
    try {
      setSaving(true);
      
      // Update plan info
      const planResponse = await fetch(`http://localhost:3000/api/admin/pasang-iklan/plans/${plan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: plan.name,
          price: plan.price,
          period: plan.period,
          description: plan.description,
          icon: plan.icon,
          is_popular: plan.is_popular
        })
      });

      const planResult = await planResponse.json();
      
      if (!planResult.success) {
        throw new Error(planResult.message);
      }

      // Update features
      const featuresResponse = await fetch(`http://localhost:3000/api/admin/pasang-iklan/plans/${plan.id}/features`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          features: plan.features
        })
      });

      const featuresResult = await featuresResponse.json();
      
      if (featuresResult.success) {
        toast({
          title: 'Berhasil! 🎉',
          description: 'Plan berhasil diupdate',
        });
        setEditingPlan(null);
        fetchAllData();
      } else {
        throw new Error(featuresResult.message);
      }
    } catch (error: any) {
      console.error('Error saving plan:', error);
      toast({
        title: 'Error',
        description: error.message || 'Terjadi kesalahan saat menyimpan',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const addFeatureToPlan = (planId: number) => {
    setPlans(prev => prev.map(plan => {
      if (plan.id === planId) {
        return {
          ...plan,
          features: [...plan.features, 'Fitur baru']
        };
      }
      return plan;
    }));
  };

  const removeFeatureFromPlan = (planId: number, featureIndex: number) => {
    setPlans(prev => prev.map(plan => {
      if (plan.id === planId) {
        return {
          ...plan,
          features: plan.features.filter((_, idx) => idx !== featureIndex)
        };
      }
      return plan;
    }));
  };

  const updateFeatureText = (planId: number, featureIndex: number, newText: string) => {
    setPlans(prev => prev.map(plan => {
      if (plan.id === planId) {
        const newFeatures = [...plan.features];
        newFeatures[featureIndex] = newText;
        return {
          ...plan,
          features: newFeatures
        };
      }
      return plan;
    }));
  };

  // ========== TOKEN PACKAGES SECTION ==========
  const saveTokenPackage = async (pkg: TokenPackage) => {
    try {
      setSaving(true);
      const response = await fetch(`http://localhost:3000/api/admin/pasang-iklan/token-packages/${pkg.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokens: pkg.tokens,
          price: pkg.price,
          bonus: pkg.bonus
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Berhasil! 🎉',
          description: 'Token package berhasil diupdate',
        });
        setEditingToken(null);
        fetchAllData();
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Gagal update token package',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving token package:', error);
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat menyimpan',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const addNewTokenPackage = async () => {
    const newPackage = {
      tokens: 100,
      price: 75000,
      bonus: 0,
      display_order: tokenPackages.length + 1
    };

    try {
      setSaving(true);
      const response = await fetch('http://localhost:3000/api/admin/pasang-iklan/token-packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPackage)
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Berhasil! 🎉',
          description: 'Token package baru berhasil ditambahkan',
        });
        fetchAllData();
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Gagal menambah token package',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error adding token package:', error);
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat menambah token package',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteTokenPackage = async (id: number) => {
    if (!confirm('Yakin ingin menghapus token package ini?')) return;

    try {
      setSaving(true);
      const response = await fetch(`http://localhost:3000/api/admin/pasang-iklan/token-packages/${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Berhasil! 🎉',
          description: 'Token package berhasil dihapus',
        });
        fetchAllData();
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Gagal menghapus token package',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting token package:', error);
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat menghapus',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // ========== CTA SECTION ==========
  const saveCTA = async () => {
    if (!cta) return;
    
    try {
      setSaving(true);
      const response = await fetch('http://localhost:3000/api/admin/pasang-iklan/cta', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: cta.title,
          description: cta.description,
          button_text: cta.button_text,
          whatsapp_number: cta.whatsapp_number,
          whatsapp_message: cta.whatsapp_message
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Berhasil! 🎉',
          description: 'CTA section berhasil diupdate',
        });
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Gagal update CTA',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving CTA:', error);
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
      <div className="space-y-6">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Pengaturan Halaman Pasang Iklan
            </CardTitle>
          </CardHeader>
        </Card>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Pengaturan Halaman Pasang Iklan
          </CardTitle>
          <CardDescription>
            Kelola konten halaman Pasang Iklan. Perubahan akan langsung tersimpan ke database.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* HERO SECTION */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => toggleSection('hero')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <CardTitle>Hero Section</CardTitle>
            </div>
            {expandedSections.hero ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </CardHeader>
        {expandedSections.hero && hero && (
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="hero-title">Judul Utama</Label>
              <Input
                id="hero-title"
                value={hero.title}
                onChange={(e) => setHero({ ...hero, title: e.target.value })}
                placeholder="Pasang Iklan Properti Anda"
              />
            </div>
            <div>
              <Label htmlFor="hero-subtitle">Sub Judul</Label>
              <Textarea
                id="hero-subtitle"
                value={hero.subtitle}
                onChange={(e) => setHero({ ...hero, subtitle: e.target.value })}
                placeholder="Jangkau ribuan pencari hunian..."
                rows={2}
              />
            </div>
            <Button onClick={saveHero} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Simpan Hero
                </>
              )}
            </Button>
          </CardContent>
        )}
      </Card>

      {/* STEPS SECTION */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => toggleSection('steps')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <List className="w-5 h-5 text-primary" />
              <CardTitle>Cara Kerja (Steps)</CardTitle>
            </div>
            {expandedSections.steps ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </CardHeader>
        {expandedSections.steps && (
          <CardContent className="space-y-4">
            {steps.map((step) => (
              <Card key={step.id} className="bg-muted/30">
                <CardContent className="pt-6 space-y-4">
                  {editingStep === step.id ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Nomor Step</Label>
                          <Input
                            type="number"
                            value={step.step_number}
                            onChange={(e) => {
                              const updated = steps.map(s => 
                                s.id === step.id ? { ...s, step_number: parseInt(e.target.value) } : s
                              );
                              setSteps(updated);
                            }}
                          />
                        </div>
                        <div>
                          <Label>Judul</Label>
                          <Input
                            value={step.title}
                            onChange={(e) => {
                              const updated = steps.map(s => 
                                s.id === step.id ? { ...s, title: e.target.value } : s
                              );
                              setSteps(updated);
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Deskripsi</Label>
                        <Textarea
                          value={step.description}
                          onChange={(e) => {
                            const updated = steps.map(s => 
                              s.id === step.id ? { ...s, description: e.target.value } : s
                            );
                            setSteps(updated);
                          }}
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => saveStep(step)} disabled={saving} size="sm">
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          Simpan
                        </Button>
                        <Button onClick={() => setEditingStep(null)} variant="outline" size="sm">
                          Batal
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                              {step.step_number}
                            </div>
                            <h4 className="font-semibold">{step.title}</h4>
                          </div>
                          <p className="text-sm text-muted-foreground ml-10">{step.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => setEditingStep(step.id)} variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button onClick={() => deleteStep(step.id)} variant="destructive" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
            <Button onClick={addNewStep} variant="outline" disabled={saving}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Step Baru
            </Button>
          </CardContent>
        )}
      </Card>

      {/* PLANS SECTION */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => toggleSection('plans')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              <CardTitle>Paket Langganan</CardTitle>
            </div>
            {expandedSections.plans ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </CardHeader>
        {expandedSections.plans && (
          <CardContent className="space-y-4">
            {plans.map((plan) => (
              <Card key={plan.id} className="bg-muted/30">
                <CardContent className="pt-6 space-y-4">
                  {editingPlan === plan.id ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Nama Paket</Label>
                          <Input
                            value={plan.name}
                            onChange={(e) => {
                              const updated = plans.map(p => 
                                p.id === plan.id ? { ...p, name: e.target.value } : p
                              );
                              setPlans(updated);
                            }}
                          />
                        </div>
                        <div>
                          <Label>Harga (Rp)</Label>
                          <Input
                            type="number"
                            value={plan.price}
                            onChange={(e) => {
                              const updated = plans.map(p => 
                                p.id === plan.id ? { ...p, price: parseFloat(e.target.value) } : p
                              );
                              setPlans(updated);
                            }}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Periode</Label>
                          <Input
                            value={plan.period}
                            onChange={(e) => {
                              const updated = plans.map(p => 
                                p.id === plan.id ? { ...p, period: e.target.value } : p
                              );
                              setPlans(updated);
                            }}
                            placeholder="330 token"
                          />
                        </div>
                        <div>
                          <Label>Icon</Label>
                          <select
                            value={plan.icon}
                            onChange={(e) => {
                              const updated = plans.map(p => 
                                p.id === plan.id ? { ...p, icon: e.target.value } : p
                              );
                              setPlans(updated);
                            }}
                            className="w-full px-3 py-2 border rounded-md"
                          >
                            <option value="Zap">Zap (⚡)</option>
                            <option value="Sparkles">Sparkles (✨)</option>
                            <option value="Crown">Crown (👑)</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <Label>Deskripsi</Label>
                        <Textarea
                          value={plan.description}
                          onChange={(e) => {
                            const updated = plans.map(p => 
                              p.id === plan.id ? { ...p, description: e.target.value } : p
                            );
                            setPlans(updated);
                          }}
                          rows={2}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`popular-${plan.id}`}
                          checked={plan.is_popular === 1}
                          onChange={(e) => {
                            const updated = plans.map(p => 
                              p.id === plan.id ? { ...p, is_popular: e.target.checked ? 1 : 0 } : p
                            );
                            setPlans(updated);
                          }}
                          className="w-4 h-4"
                        />
                        <Label htmlFor={`popular-${plan.id}`}>Tandai sebagai "Paling Populer"</Label>
                      </div>
                      
                      {/* Features */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label>Fitur-fitur</Label>
                          <Button 
                            onClick={() => addFeatureToPlan(plan.id)} 
                            variant="outline" 
                            size="sm"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Tambah Fitur
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {plan.features.map((feature, idx) => (
                            <div key={idx} className="flex gap-2">
                              <Input
                                value={feature}
                                onChange={(e) => updateFeatureText(plan.id, idx, e.target.value)}
                                placeholder="Nama fitur"
                              />
                              <Button 
                                onClick={() => removeFeatureFromPlan(plan.id, idx)}
                                variant="destructive" 
                                size="sm"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={() => savePlan(plan)} disabled={saving} size="sm">
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          Simpan
                        </Button>
                        <Button onClick={() => setEditingPlan(null)} variant="outline" size="sm">
                          Batal
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-bold text-lg">{plan.name}</h4>
                            {plan.is_popular === 1 && (
                              <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                                Populer
                              </span>
                            )}
                          </div>
                          <p className="text-2xl font-bold text-primary mb-1">
                            Rp {plan.price.toLocaleString('id-ID')}
                            {plan.period && <span className="text-sm text-muted-foreground"> / {plan.period}</span>}
                          </p>
                          <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>
                          <ul className="space-y-1">
                            {plan.features.map((feature, idx) => (
                              <li key={idx} className="text-sm flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <Button onClick={() => setEditingPlan(plan.id)} variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </CardContent>
        )}
      </Card>

      {/* TOKEN PACKAGES SECTION */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => toggleSection('tokens')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              <CardTitle>Paket Token</CardTitle>
            </div>
            {expandedSections.tokens ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </CardHeader>
        {expandedSections.tokens && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {tokenPackages.map((pkg) => (
                <Card key={pkg.id} className="bg-muted/30">
                  <CardContent className="pt-6 space-y-3">
                    {editingToken === pkg.id ? (
                      <>
                        <div>
                          <Label>Jumlah Token</Label>
                          <Input
                            type="number"
                            value={pkg.tokens}
                            onChange={(e) => {
                              const updated = tokenPackages.map(p => 
                                p.id === pkg.id ? { ...p, tokens: parseInt(e.target.value) } : p
                              );
                              setTokenPackages(updated);
                            }}
                          />
                        </div>
                        <div>
                          <Label>Harga (Rp)</Label>
                          <Input
                            type="number"
                            value={pkg.price}
                            onChange={(e) => {
                              const updated = tokenPackages.map(p => 
                                p.id === pkg.id ? { ...p, price: parseFloat(e.target.value) } : p
                              );
                              setTokenPackages(updated);
                            }}
                          />
                        </div>
                        <div>
                          <Label>Bonus Token</Label>
                          <Input
                            type="number"
                            value={pkg.bonus}
                            onChange={(e) => {
                              const updated = tokenPackages.map(p => 
                                p.id === pkg.id ? { ...p, bonus: parseInt(e.target.value) } : p
                              );
                              setTokenPackages(updated);
                            }}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => saveTokenPackage(pkg)} disabled={saving} size="sm">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Simpan
                          </Button>
                          <Button onClick={() => setEditingToken(null)} variant="outline" size="sm">
                            Batal
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary">
                            {pkg.tokens}
                            {pkg.bonus > 0 && (
                              <span className="text-accent text-lg ml-1">+{pkg.bonus}</span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">Token</p>
                          <p className="text-xl font-semibold mt-2">
                            Rp {pkg.price.toLocaleString('id-ID')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => setEditingToken(pkg.id)} variant="outline" size="sm" className="flex-1">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button onClick={() => deleteTokenPackage(pkg.id)} variant="destructive" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            <Button onClick={addNewTokenPackage} variant="outline" disabled={saving}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Paket Token Baru
            </Button>
          </CardContent>
        )}
      </Card>

      {/* CTA SECTION */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => toggleSection('cta')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <CardTitle>Call To Action (CTA)</CardTitle>
            </div>
            {expandedSections.cta ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </CardHeader>
        {expandedSections.cta && cta && (
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="cta-title">Judul CTA</Label>
              <Input
                id="cta-title"
                value={cta.title}
                onChange={(e) => setCta({ ...cta, title: e.target.value })}
                placeholder="Siap Memasang Iklan?"
              />
            </div>
            <div>
              <Label htmlFor="cta-description">Deskripsi</Label>
              <Textarea
                id="cta-description"
                value={cta.description}
                onChange={(e) => setCta({ ...cta, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cta-button">Teks Tombol</Label>
                <Input
                  id="cta-button"
                  value={cta.button_text}
                  onChange={(e) => setCta({ ...cta, button_text: e.target.value })}
                  placeholder="Hubungi via WhatsApp"
                />
              </div>
              <div>
                <Label htmlFor="cta-whatsapp">Nomor WhatsApp</Label>
                <Input
                  id="cta-whatsapp"
                  value={cta.whatsapp_number}
                  onChange={(e) => setCta({ ...cta, whatsapp_number: e.target.value })}
                  placeholder="628123456789"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="cta-message">Template Pesan WhatsApp</Label>
              <Textarea
                id="cta-message"
                value={cta.whatsapp_message}
                onChange={(e) => setCta({ ...cta, whatsapp_message: e.target.value })}
                rows={3}
              />
            </div>
            <Button onClick={saveCTA} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Simpan CTA
                </>
              )}
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}