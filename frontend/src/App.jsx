import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { Header } from './components/Header.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { BrowsePage } from './pages/BrowsePage.jsx';
import { BecomeBlockerPage } from './pages/BecomeBlockerPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { MembershipPage } from './pages/MembershipPage.jsx';
import { PartnersPage } from './pages/PartnersPage.jsx';
import { DetailPage } from './pages/DetailPage.jsx';
import { VipRoomPage } from './pages/VipRoomPage.jsx';
import { NewsPage } from './pages/NewsPage.jsx';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.jsx';
import { ResetPasswordPage } from './pages/ResetPasswordPage.jsx';
import { AdminDashboardPage } from './pages/AdminPage.jsx';
import { MoMoModal } from './components/MoMoModal.jsx';
import { Footer } from './components/Footer.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Guraaha UI Error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F6F5F0] p-6">
          <div className="max-w-lg w-full bg-white border border-brand-line rounded-[14px] p-6 shadow-md space-y-4">
            <h2 className="text-xl font-bold text-red-700">Something went wrong loading this view</h2>
            <pre className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 overflow-x-auto whitespace-pre-wrap">
              {String(this.state.error?.message || this.state.error || 'Unknown error')}
            </pre>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/';
              }}
              className="px-4 py-2 rounded-[9px] bg-[#007A66] text-white text-sm font-semibold cursor-pointer"
            >
              Reload Homepage
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function MainLayout() {
  const location = useLocation();
  const isDashboardView =
    location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin');

  return (
    <div
      className={`flex flex-col min-h-screen w-full max-w-full overflow-x-clip ${
        isDashboardView ? 'h-dvh overflow-hidden' : ''
      }`}
    >
      <Header />
      <main
        className={`flex-1 flex flex-col w-full max-w-full min-w-0 ${
          isDashboardView ? 'min-h-0 overflow-hidden' : ''
        }`}
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/listing/:id" element={<DetailPage />} />
          <Route path="/vip-room" element={<VipRoomPage />} />
          <Route path="/membership" element={<MembershipPage />} />
          <Route path="/partners" element={<PartnersPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/news/:id" element={<NewsPage />} />
          <Route path="/become-blocker" element={<BecomeBlockerPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>
      {!isDashboardView && <Footer />}
      <MoMoModal />
    </div>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppProvider>
            <MainLayout />
          </AppProvider>
        </AuthProvider>
      </BrowserRouter>
    </AppErrorBoundary>
  );
}
