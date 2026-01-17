import { Building2, Users, MapPin, Star } from 'lucide-react';

const stats = [
  {
    icon: Building2,
    value: '10,000+',
    label: 'Properti',
    color: 'text-primary',
  },
  {
    icon: Users,
    value: '50,000+',
    label: 'Pengguna',
    color: 'text-accent',
  },
  {
    icon: MapPin,
    value: '50+',
    label: 'Kota',
    color: 'text-villa',
  },
  {
    icon: Star,
    value: '4.9',
    label: 'Rating',
    color: 'text-sponsored',
  },
];

export function StatsSection() {
  return (
    <section className="bg-card py-8 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map(({ icon: Icon, value, label, color }) => (
            <div
              key={label}
              className="text-center animate-fade-in"
            >
              <Icon className={`w-8 h-8 ${color} mx-auto mb-2`} />
              <p className="text-2xl md:text-3xl font-bold text-foreground">
                {value}
              </p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
