import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import SidebarLayout from './components/layout/SidebarLayout';

// Public Pages
import Landing from './pages/landing/Landing';
import PatientLogin from './pages/auth/PatientLogin';
import PatientRegister from './pages/auth/PatientRegister';
import DonorLogin from './pages/auth/DonorLogin';
import DonorRegister from './pages/auth/DonorRegister';

// Patient Pages
import PatientOverview from './pages/patient/PatientOverview';
import PatientRequests from './pages/patient/PatientRequests';
import PatientDonors from './pages/patient/PatientDonors';
import PatientHistory from './pages/patient/PatientHistory';
import PatientProfile from './pages/patient/PatientProfile';

// Donor Pages
import DonorOverview from './pages/donor/DonorOverview';
import DonorRequests from './pages/donor/DonorRequests';
import DonorDonations from './pages/donor/DonorDonations';
import DonorAvailability from './pages/donor/DonorAvailability';
import DonorImpact from './pages/donor/DonorImpact';
import DonorProfile from './pages/donor/DonorProfile';

// Protected Route Guard
function ProtectedRoute({ children, allowedRole }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary text-text-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRole && role !== allowedRole) {
    return <Navigate to={role === 'patient' ? '/patient/dashboard' : '/donor/dashboard'} replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/patient/login" element={<PatientLogin />} />
          <Route path="/patient/register" element={<PatientRegister />} />
          <Route path="/donor/login" element={<DonorLogin />} />
          <Route path="/donor/register" element={<DonorRegister />} />

          {/* Patient Protected Dashboard Routes */}
          <Route 
            path="/patient/dashboard" 
            element={
              <ProtectedRoute allowedRole="patient">
                <SidebarLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<PatientOverview />} />
            <Route path="requests" element={<PatientRequests />} />
            <Route path="donors" element={<PatientDonors />} />
            <Route path="history" element={<PatientHistory />} />
            <Route path="profile" element={<PatientProfile />} />
          </Route>

          {/* Donor Protected Dashboard Routes */}
          <Route 
            path="/donor/dashboard" 
            element={
              <ProtectedRoute allowedRole="donor">
                <SidebarLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DonorOverview />} />
            <Route path="requests" element={<DonorRequests />} />
            <Route path="donations" element={<DonorDonations />} />
            <Route path="availability" element={<DonorAvailability />} />
            <Route path="impact" element={<DonorImpact />} />
            <Route path="profile" element={<DonorProfile />} />
          </Route>

          {/* Fallback Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      
      {/* Global Toast Notifications */}
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#1c1c1c',
            color: '#ededed',
            border: '1px solid #2e2e2e',
          },
        }}
      />
    </AuthProvider>
  );
}
