import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PageLoader } from "@/components/PageLoader";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PasangIklan from "./pages/PasangIklan";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import AdminDashboard from '@/pages/admin/Dashboard';
import MitraDashboard from '@/pages/mitra/Dashboard';
import PropertyDetail from './pages/PropertyDetail';
import Kost from "./pages/Kost";
import GuestHouse from "./pages/GuestHouse";
import Villa from "./pages/Villa";
import EditProperty from './pages/mitra/EditProperty';
import AdminSettings from './pages/admin/AdminSettings';
import MitraSettings from './pages/mitra/MitraSettings';
import Propertydetail from '@/pages/mitra/Propertydetail';




const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        {/* PageLoader untuk smooth refresh */}
        <PageLoader />
        
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/search" element={<Index />} />
          <Route path="/favorites" element={<Index />} />
          <Route path="/account" element={<Index />} />
          <Route path="/pasang-iklan" element={<PasangIklan />} />
          <Route path="/property/:id" element={<PropertyDetail />} />
          <Route path="/mitra/settings" element={<MitraSettings />} />
          {/* Route untuk halaman Kost, Guest House, dan Villa */}
          <Route path="/kost" element={<Kost />} />
          <Route path="/guesthouse" element={<GuestHouse />} />
          <Route path="/villa" element={<Villa />} />
          
          {/* Route untuk Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Route untuk Dashboard */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/mitra/dashboard" element={<MitraDashboard />} />
          
        <Route path="/mitra/dashboard" element={<MitraDashboard />} />
        <Route path="/mitra/dashboard/property/:id" element={<Propertydetail />} />
        <Route path="/mitra/dashboard/edit/:id" element={<EditProperty />} />

          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/mitra/property/edit/:id" element={<EditProperty />} />

          {/* 404 Page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;