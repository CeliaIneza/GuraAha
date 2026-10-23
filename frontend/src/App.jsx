import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { Header } from './components/Header.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { BrowsePage } from './pages/BrowsePage.jsx';
import { BecomeBlockerPage } from './pages/BecomeBlockerPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { Button } from './components/ui/button.jsx';
import { Card, CardHeader, CardTitle, CardContent } from './components/ui/card.jsx';
import { Layers, Search, ShieldCheck, Code2, LogIn, UserCheck, Shield, LayoutDashboard } from 'lucide-react';
import { AdminDashboardPage } from './pages/AdminPage.jsx';

function DashboardPlaceholder({ title, description, badge }) {
  const { user } = useAuth();
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <Card className="rounded-[9px] border-brand-line bg-white shadow-sm p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-green bg-brand-green/10 px-2.5 py-1 rounded-[6px]">
            {badge}
          </span>
        </div>
        <CardTitle className="text-2xl font-bold text-brand-ink">{title}</CardTitle>
        <p className="text-sm text-brand-ink-soft leading-relaxed">{description}</p>
        <div className="pt-2 p-4 rounded-[9px] bg-brand-bg-soft/50 border border-brand-line flex items-center justify-between text-xs sm:text-sm">
          <span>Logged in as: <strong className="text-brand-ink">{user?.name}</strong> ({user?.role})</span>
          <span className="text-brand-ink-soft font-mono">{user?.email || user?.phone}</span>
        </div>
        <div className="pt-4 flex items-center gap-3">
          <Button asChild variant="default" className="rounded-[9px]">
            <Link to="/browse">Explore Properties</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-[9px]">
            <Link to="/">Back to Home</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}

function DesignSystemView() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10 space-y-8 w-full">
      <Card className="rounded-[9px] p-6 bg-white space-y-4 border-brand-line">
        <h2 className="text-xl font-bold text-brand-ink">One-Liner Search Card Component Reference</h2>
        <p className="text-sm text-brand-ink-soft">
          All filters use shadcn <code className="font-mono text-brand-green font-semibold">Select</code> and the CTA uses shadcn <code className="font-mono text-brand-green font-semibold">Button</code>. Both share the uniform height <code className="font-mono font-semibold">h-11</code> (44px) and <code className="font-mono font-semibold">rounded-[9px]</code>.
        </p>
        <div className="bg-brand-ink text-brand-line p-4 rounded-[9px] text-xs font-mono overflow-x-auto leading-relaxed">
          <pre>{`<div className="search-card bg-white rounded-[14px] p-3 sm:p-4 shadow-2xl">
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3 items-center">
    <Select value={selectedProvince} onValueChange={handleProvinceChange} items={provinceItemsMap}>
      <SelectTrigger className="w-full h-11 rounded-[9px] ...">
        <SelectValue placeholder="Province" />
      </SelectTrigger>
      <SelectContent className="rounded-[9px]">...</SelectContent>
    </Select>
    ...
    <Button variant="default" className="w-full h-11 rounded-[9px] font-semibold text-base shadow-sm">
      <Search className="w-4 h-4" />
      <span>Search</span>
    </Button>
  </div>
</div>`}</pre>
        </div>
      </Card>
    </div>
  );
}

function MainLayout() {
  const { user, login, logout } = useAuth();
  const location = useLocation();
  const [showMatrix, setShowMatrix] = useState(false);
  const isDashboardView = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin');

  return (
    <div className={`flex flex-col min-h-screen ${isDashboardView ? 'h-dvh overflow-hidden' : ''}`}>
      <Header />

      {showMatrix ? (
        <DesignSystemView />
      ) : (
        <main className={`flex-1 flex flex-col ${isDashboardView ? 'min-h-0 overflow-hidden' : ''}`}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/browse" element={<BrowsePage />} />
            <Route path="/become-blocker" element={<BecomeBlockerPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route
              path="/admin"
              element={<AdminDashboardPage />}
            />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </main>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <MainLayout />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
