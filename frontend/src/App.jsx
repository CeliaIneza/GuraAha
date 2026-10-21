import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { MoMoModal } from './components/MoMoModal';
import { ProtectedRoute } from './components/ProtectedRoute';

import { HomePage } from './pages/HomePage';
import { BrowsePage } from './pages/BrowsePage';
import { DetailPage } from './pages/DetailPage';
import { MembershipPage } from './pages/MembershipPage';
import { PartnersPage } from './pages/PartnersPage';
import { BecomeBlockerPage } from './pages/BecomeBlockerPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminPage } from './pages/AdminPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

function AppShell() {
  const { pathname } = useLocation();
  const isBrowse = pathname === '/browse';

  return (
    <div className={`flex flex-col min-h-screen ${isBrowse ? 'h-dvh overflow-hidden' : ''}`}>
      <Header />
      <main className={`flex-1 ${isBrowse ? 'min-h-0 overflow-hidden' : ''}`}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/listing/:id" element={<DetailPage />} />
          <Route path="/membership" element={<MembershipPage />} />
          <Route path="/partners" element={<PartnersPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/become-blocker"
            element={
              <ProtectedRoute>
                <BecomeBlockerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={['USER', 'BLOCKER']}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <AdminPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      {!isBrowse && <Footer />}
      <MoMoModal />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <AppShell />
        </Router>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
