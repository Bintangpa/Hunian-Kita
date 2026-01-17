// src/components/PageLoader.tsx
import { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';

export function PageLoader() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // HANYA untuk initial load/refresh
    // TIDAK trigger saat navigasi
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, []); // Empty - cuma sekali saat mount (refresh)

  // Selalu render overlay
  return (
    <div 
      className={`fixed inset-0 bg-background z-[9999] flex items-center justify-center transition-opacity duration-300 ${
        isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center animate-pulse">
          <Building2 className="w-10 h-10 text-primary-foreground" />
        </div>
        
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">
            Hunian<span className="text-primary">Kita</span>
          </p>
          <p className="text-sm text-muted-foreground">Memuat halaman...</p>
        </div>
      </div>
    </div>
  );
}