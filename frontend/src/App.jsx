import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { MoMoModal } from './components/MoMoModal';

import { HomePage } from './pages/HomePage';
import { BrowsePage } from './pages/BrowsePage';
import { DetailPage } from './pages/DetailPage';
import { MembershipPage } from './pages/MembershipPage';
import { PartnersPage } from './pages/PartnersPage';
import { BecomeBlockerPage } from './pages/BecomeBlockerPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminPage } from './pages/AdminPage';

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/browse" element={<BrowsePage />} />
              <Route path="/listing/:id" element={<DetailPage />} />
              <Route path="/membership" element={<MembershipPage />} />
              <Route path="/partners" element={<PartnersPage />} />
              <Route path="/become-blocker" element={<BecomeBlockerPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </main>
          <Footer />
          <MoMoModal />
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;
