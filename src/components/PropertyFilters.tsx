import { PropertyType } from '@/types/property';
import { Button } from '@/components/ui/button';
import { Home, Building, TreePalm, LayoutGrid } from 'lucide-react';

interface PropertyFiltersProps {
  selectedType: PropertyType | null;
  selectedCity: string | null;
  onTypeChange: (type: PropertyType | null) => void;
  onCityChange: (city: string | null) => void;
  cities: string[];
}

const propertyTypes: { type: PropertyType | null; label: string; icon: React.ReactNode }[] = [
  { type: null, label: 'Semua', icon: <LayoutGrid className="w-4 h-4" /> },
  { type: 'kost', label: 'Kost', icon: <Home className="w-4 h-4" /> },
  { type: 'guesthouse', label: 'Guest House', icon: <Building className="w-4 h-4" /> },
  { type: 'villa', label: 'Villa', icon: <TreePalm className="w-4 h-4" /> },
];

export function PropertyFilters({
  selectedType,
  selectedCity,
  onTypeChange,
  onCityChange,
  cities,
}: PropertyFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Property Type Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {propertyTypes.map(({ type, label, icon }) => (
          <Button
            key={label}
            variant={selectedType === type ? 'filterActive' : 'filter'}
            size="sm"
            onClick={() => onTypeChange(type)}
            className="flex-shrink-0 gap-1.5"
          >
            {icon}
            {label}
          </Button>
        ))}
      </div>

      {/* City Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <Button
          variant={selectedCity === null ? 'filterActive' : 'filter'}
          size="sm"
          onClick={() => onCityChange(null)}
          className="flex-shrink-0"
        >
          Semua Kota
        </Button>
        {cities.map((city) => (
          <Button
            key={city}
            variant={selectedCity === city ? 'filterActive' : 'filter'}
            size="sm"
            onClick={() => onCityChange(city)}
            className="flex-shrink-0"
          >
            {city}
          </Button>
        ))}
      </div>
    </div>
  );
}
