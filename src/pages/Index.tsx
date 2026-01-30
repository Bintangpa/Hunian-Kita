import { useEffect, useState } from "react"
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { MobileNav } from '@/components/MobileNav'
import { HeroSection } from '@/components/HeroSection'
import { StatsSection } from '@/components/StatsSection'
import { PropertyFilters } from '@/components/PropertyFilters'
import { PropertyCard } from '@/components/PropertyCard'
import { Property, PropertyType } from '@/types/property'
import { Home, Search, Zap, ChevronDown, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react'

// Interface untuk data dari backend
interface Rumah {
  id: number
  nama: string
  title: string
  type: string
  alamat: string
  city: string
  district: string
  harga: number
  price: number
  priceUnit: 'bulan' | 'malam' | 'tahun'
  price_unit: 'bulan' | 'malam' | 'tahun'
  description: string
  facilities: string[]
  images: string[]
  ownerName: string
  owner_name: string
  whatsappNumber: string
  owner_whatsapp: string
  bedrooms?: number
  bathrooms?: number
  area?: number
  isSponsored: boolean
  views: number
  whatsappClicks: number
  whatsapp_clicks: number
  createdAt: string
  created_at: string
  is_boosted?: number
  boost_days_remaining?: number
  boosted_until?: string
}

// Fungsi konversi dengan fallback untuk field yang berbeda
function convertToProperty(rumah: Rumah): Property {
  return {
    id: rumah.id.toString(),
    title: rumah.title || rumah.nama,
    type: rumah.type as PropertyType,
    price: rumah.price || rumah.harga,
    priceUnit: rumah.price_unit || rumah.priceUnit,
    location: {
      city: rumah.city,
      district: rumah.district || '',
      address: rumah.alamat
    },
    images: rumah.images,
    facilities: rumah.facilities,
    description: rumah.description,
    whatsappNumber: rumah.owner_whatsapp || rumah.whatsappNumber,
    ownerName: rumah.owner_name || rumah.ownerName,
    isSponsored: rumah.isSponsored,
    views: rumah.views,
    whatsappClicks: rumah.whatsapp_clicks || rumah.whatsappClicks,
    createdAt: new Date(rumah.created_at || rumah.createdAt),
    // ✅ TAMBAHKAN DATA BOOST
    is_boosted: rumah.is_boosted,
    boost_days_remaining: rumah.boost_days_remaining,
    boosted_until: rumah.boosted_until
  } as Property
}

const ITEMS_PER_PAGE = 12 // Tampilkan 12 properti per halaman

export default function Index() {
  const [listings, setListings] = useState<Property[]>([])
  const [boostedListings, setBoostedListings] = useState<Property[]>([])
  const [regularListings, setRegularListings] = useState<Property[]>([])
  
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<PropertyType | null>(null)
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  
  // ✅ State untuk pagination
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE)

  useEffect(() => {
    fetch("http://localhost:3000/api/properties")
      .then((res) => res.json())
      .then((data) => {
        console.log("✅ DATA DARI DB:", data)
        
        if (Array.isArray(data)) {
          console.log("📦 Processing properties array")
          const allProperties = data.map(convertToProperty)
          
          // Pisahkan berdasarkan is_boosted
          const boosted = allProperties.filter(p => (p as any).is_boosted === 1)
          const regular = allProperties.filter(p => (p as any).is_boosted !== 1)
          
          // ✅ SORT REGULAR PROPERTIES BERDASARKAN WAKTU UPLOAD (TERBARU DI ATAS)
          const sortedRegular = regular.sort((a, b) => {
            return b.createdAt.getTime() - a.createdAt.getTime()
          })
          
          setBoostedListings(boosted)
          setRegularListings(sortedRegular)
          setListings(allProperties)
          
          console.log(`✅ Loaded: ${boosted.length} boosted, ${sortedRegular.length} regular (sorted by date)`)
        } else {
          console.warn("⚠️ Unexpected data format")
          setListings([])
          setBoostedListings([])
          setRegularListings([])
        }
        
        setLoading(false)
      })
      .catch((err) => {
        console.error("❌ ERROR FETCH:", err)
        setLoading(false)
      })
  }, [])

  // Reset displayCount ketika filter berubah
  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE)
  }, [searchQuery, selectedType, selectedCity])

  // ✅ Filter properti dengan safe checking
  const filteredListings = listings.filter((property) => {
    const title = property.title || '';
    const city = property.location?.city || '';
    const district = property.location?.district || '';
    const address = property.location?.address || '';
    
    const matchesSearch = 
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      address.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesType = selectedType === null || property.type === selectedType
    const matchesCity = selectedCity === null || property.location?.city === selectedCity
    
    return matchesSearch && matchesType && matchesCity
  })

  // ✅ Filter boosted properties
  const filteredBoostedListings = boostedListings.filter((property) => {
    const title = property.title || '';
    const city = property.location?.city || '';
    const district = property.location?.district || '';
    const address = property.location?.address || '';
    
    const matchesSearch = 
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      address.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesType = selectedType === null || property.type === selectedType
    const matchesCity = selectedCity === null || property.location?.city === selectedCity
    
    return matchesSearch && matchesType && matchesCity
  })

  // ✅ Filter regular properties dan SORT BY DATE
  const filteredRegularListings = regularListings
    .filter((property) => {
      const title = property.title || '';
      const city = property.location?.city || '';
      const district = property.location?.district || '';
      const address = property.location?.address || '';
      
      const matchesSearch = 
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        district.toLowerCase().includes(searchQuery.toLowerCase()) ||
        address.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesType = selectedType === null || property.type === selectedType
      const matchesCity = selectedCity === null || property.location?.city === selectedCity
      
      return matchesSearch && matchesType && matchesCity
    })
    // ✅ SORT BERDASARKAN CREATED_AT (TERBARU DI ATAS)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  // ✅ Properti yang ditampilkan (dengan pagination)
  const displayedRegularListings = filteredRegularListings.slice(0, displayCount)
  
  // ✅ Cek apakah masih ada properti yang belum ditampilkan
  const hasMore = filteredRegularListings.length > displayCount

  // ✅ Fungsi untuk load more - setiap klik tambah 12 properti lagi
  const loadMore = () => {
    setDisplayCount(prev => prev + ITEMS_PER_PAGE)
  }
  
  // ✅ Hitung berapa kali sudah load dan berapa kali masih bisa load
  const currentPage = Math.ceil(displayCount / ITEMS_PER_PAGE)
  const totalPages = Math.ceil(filteredRegularListings.length / ITEMS_PER_PAGE)
  const remainingItems = filteredRegularListings.length - displayCount

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

        {/* SECTION BOOSTED PROPERTIES */}
        {filteredBoostedListings.length > 0 && (
          <div className="mb-12">
            {/* Header Section */}
            <div className="flex items-center gap-3 mb-6">
              <Zap className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              <h2 className="text-2xl font-bold">Properti Unggulan</h2>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-semibold rounded-full">
                {filteredBoostedListings.length} Properti
              </span>
            </div>
            
            {/* Horizontal Scroll Container */}
            <div className="relative">
              <div 
                className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                {filteredBoostedListings.map((property) => (
                  <div 
                    key={property.id} 
                    className="flex-none w-[320px] md:w-[360px] snap-start"
                  >
                    <PropertyCard property={property} />
                  </div>
                ))}
              </div>
              
              {/* Scroll Indicator */}
              {filteredBoostedListings.length > 3 && (
                <div className="flex justify-center gap-2 mt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Scroll untuk melihat lebih banyak</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Divider antara Boosted dan Regular */}
        {filteredBoostedListings.length > 0 && filteredRegularListings.length > 0 && (
          <div className="my-8 border-t border-border"></div>
        )}

        {/* Section Title untuk Regular Properties */}
        {filteredRegularListings.length > 0 && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold">
              {filteredBoostedListings.length > 0 ? 'Semua Properti' : 'Daftar Properti'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Diurutkan berdasarkan waktu upload terbaru
            </p>
          </div>
        )}

        {/* ✅ TAMPILKAN REGULAR PROPERTIES (DENGAN PAGINATION) */}
        {filteredRegularListings.length === 0 && filteredBoostedListings.length === 0 ? (
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
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedRegularListings.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>

            {/* ✅ TOMBOL MUAT LEBIH BANYAK */}
            {hasMore && (
              <div className="mt-8 flex flex-col items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  Menampilkan {displayedRegularListings.length} dari {filteredRegularListings.length} properti
                  {remainingItems > 0 && ` • ${Math.min(ITEMS_PER_PAGE, remainingItems)} properti berikutnya tersedia`}
                </div>
                <button
                  onClick={loadMore}
                  className="group flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <span className="font-medium">
                    Muat {Math.min(ITEMS_PER_PAGE, remainingItems)} Properti Lainnya
                  </span>
                  <ChevronDown className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                </button>
                <div className="text-xs text-muted-foreground">
                  Halaman {currentPage} dari {totalPages}
                </div>
              </div>
            )}

            {/* ✅ INDIKATOR SUDAH SEMUA */}
            {!hasMore && filteredRegularListings.length > ITEMS_PER_PAGE && (
              <div className="mt-8 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-full text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Semua properti telah ditampilkan ({filteredRegularListings.length} properti)</span>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
      <MobileNav />
    </div>
  )
}