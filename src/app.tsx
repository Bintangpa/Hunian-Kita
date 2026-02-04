import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { PageLoader } from "@/components/PageLoader";

// Index tetap import biasa — ini halaman pertama yang dibuka
import Index from "./pages/Index";

// Sisanya lazy load — fungsinya sama persis, cuma bundle-nya pisah
const NotFound = lazy(() => import("./pages/NotFound"));
const PasangIklan = lazy(() => import("./pages/PasangIklan"));
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const MitraDashboard = lazy(() => import("@/pages/mitra/Dashboard"));
const PropertyDetail = lazy(() => import("./pages/PropertyDetail"));
const Kost = lazy(() => import("./pages/Kost"));
const GuestHouse = lazy(() => import("./pages/GuestHouse"));
const Villa = lazy(() => import("./pages/Villa"));
const EditProperty = lazy(() => import("./pages/mitra/EditProperty"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const MitraSettings = lazy(() => import("./pages/mitra/MitraSettings"));
const Propertydetail = lazy(() => import("@/pages/mitra/Propertydetail"));



const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        {/* PageLoader untuk smooth refresh */}
        <PageLoader />

        <Suspense fallback={null}>
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
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;