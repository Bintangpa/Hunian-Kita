import { useEffect, useState } from "react"
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { MobileNav } from '@/components/MobileNav'
import { HeroSection } from '@/components/HeroSection'
import { StatsSection } from '@/components/StatsSection'
import { PropertyFilters } from '@/components/PropertyFilters'
import { PropertyCard } from '@/components/PropertyCard'
import { Property, PropertyType } from '@/types/property'
import { Home, Search } from 'lucide-react'

// Interface untuk data dari backend
interface Rumah {
  id: number
  nama: string
  type: string
  alamat: string         // Address lengkap, backend akan parse untuk city & district
  city: string           // Di-extract dari alamat di backend
  district: string       // Di-extract dari alamat di backend
  harga: number
  priceUnit: 'bulan' | 'malam' | 'tahun'
  description: string
  facilities: string[]
  images: string[]
  ownerName: string
  whatsappNumber: string
  bedrooms?: number
  bathrooms?: number
  area?: number
  isSponsored: boolean
  views: number
  whatsappClicks: number
  createdAt: string
}

// Fungsi konversi SUPER SIMPLE
// Karena backend sudah kirim data dalam format yang benar!
function convertToProperty(rumah: Rumah): Property {
  return {
    id: rumah.id.toString(),
    title: rumah.nama,
    type: rumah.type as PropertyType,
    price: rumah.harga,
    priceUnit: rumah.priceUnit,
    location: {
      city: rumah.city,
      district: rumah.district,
      address: rumah.alamat
    },
    images: rumah.images,
    facilities: rumah.facilities,
    description: rumah.description,
    whatsappNumber: rumah.whatsappNumber,
    ownerName: rumah.ownerName,
    isSponsored: rumah.isSponsored,
    views: rumah.views,
    whatsappClicks: rumah.whatsappClicks,
    createdAt: new Date(rumah.createdAt)
  }
}

export default function Index() {
  const [listings, setListings] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<PropertyType | null>(null)
  const [selectedCity, setSelectedCity] = useState<string | null>(null)

  useEffect(() => {
    fetch("http://localhost:3000/api/rumah")
      .then((res) => res.json())
      .then((data: Rumah[]) => {
        console.log("✅ DATA DARI DB:", data)
        const convertedData = data.map(convertToProperty)
        setListings(convertedData)
        setLoading(false)
      })
      .catch((err) => {
        console.error("❌ ERROR FETCH:", err)
        setLoading(false)
      })
  }, [])

  // Filter properti berdasarkan search query, type, dan city
  const filteredListings = listings.filter((property) => {
    const matchesSearch = 
      property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.location.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.location.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.location.address.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesType = selectedType === null || property.type === selectedType
    const matchesCity = selectedCity === null || property.location.city === selectedCity
    
    return matchesSearch && matchesType && matchesCity
  })

  // Dapatkan daftar kota unik dari data yang ada
  const cities = Array.from(new Set(listings.map(p => p.location.city))).sort()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Memuat properti...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <HeroSection onSearch={setSearchQuery} />
      
      <StatsSection />

      <main className="container mx-auto px-4 py-8">
        <PropertyFilters
          selectedType={selectedType}
          selectedCity={selectedCity}
          onTypeChange={setSelectedType}
          onCityChange={setSelectedCity}
          cities={cities}
        />

        <div className="mt-6 mb-4">
          <p className="text-muted-foreground">
            Menampilkan <span className="font-semibold text-foreground">{filteredListings.length}</span> properti
            {searchQuery && ` untuk "${searchQuery}"`}
            {selectedType && ` · ${selectedType === 'kost' ? 'Kost' : selectedType === 'guesthouse' ? 'Guest House' : 'Villa'}`}
            {selectedCity && ` · ${selectedCity}`}
          </p>
        </div>

        {filteredListings.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
              <Search className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Tidak ada properti yang ditemukan
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Coba ubah filter atau kata kunci pencarian Anda untuk menemukan properti yang sesuai.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </main>

      <Footer />
      <MobileNav />
    </div>
  )
}