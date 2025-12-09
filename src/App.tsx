import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { App as AntdApp } from 'antd';
import { AuthProvider } from './contexts/AuthContext';
import { AlertProvider } from './contexts/AlertContext';
import { ThemeProvider } from './components/ThemeProvider';
import { LanguageProvider } from './contexts/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import PublicLayout from './components/PublicLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import About from './pages/About';
import Contact from './pages/Contact';
import Dashboard from './pages/Dashboard';
import HealthData from './pages/HealthData';
import WaterQuality from './pages/WaterQuality';
import Education from './pages/Education';
//import Community from './pages/Community';
import Alerts from './pages/Alerts';
import CommunityChat from './pages/CommunityChat';
import Map from './pages/Map';
import Gallery from './pages/Gallery';
import News from './pages/News';
import DiseaseMapping from './pages/DiseaseMapping';
import ASHACommunication from './pages/ASHACommunication';
import WaterQualityPrediction from './pages/ReportWaterQuality';
import GovernmentReports from './pages/GovermentReports'; 
import AshaWorker from './pages/AshaWorker';
import EmergencyContacts from './pages/EmergencyContacts';
import RainfallAlert from './pages/RainfallAlert';
import SelfReport from './pages/SelfReport';

// ⭐ NEW IMPORT — this is the correct page for /report-symptoms
import SymptomReporting from './pages/SymptomReporting';
import ManageUsers from './pages/ManageUsers';
import AdminReports from './pages/AdminReports';
import ProfileDrawer from './pages/ProfileDrawer';
import ComplaintForm from './pages/ComplainForm';
import ComplaintsManagement from './pages/ComplainsManagment';
import GovernmentManagement from './pages/GovernmentManagement';
import './App.css';
import './locales';
const ProfileRoute = () => {
  const navigate = useNavigate();
  return (
    <ProfileDrawer 
      open={true} 
      onClose={() => navigate(-1)} // Go back to previous page on close
    />
  );
};
function App() {
  return (
    <AntdApp>
      <AuthProvider>
        <AlertProvider>
          <ThemeProvider>
            <LanguageProvider>
              <Router>
                <Routes>

                {/* Public pages */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                {/* Public pages with layout */}
                <Route path="/about" element={
                  <PublicLayout>
                    <About />
                  </PublicLayout>
                } />

                <Route path="/contact" element={
                  <PublicLayout>
                    <Contact />
                  </PublicLayout>
                } />
               {/* ⭐ NEW — COMMUNITY SELF REPORTING FEATURE */}
              <Route 
                path="/self-report"
                element={
                  <ProtectedRoute requiredRole={["community_user"]}>
                    <Layout type="dashboard">
                      <SelfReport />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route path="/map" element={
                <PublicLayout>
                  <Map />
                </PublicLayout>
              } />

              <Route path="/gallery" element={
                <PublicLayout>
                  <Gallery />
                </PublicLayout>
              } />

              <Route path="/news" element={
                <PublicLayout>
                  <News />
                </PublicLayout>
              } />

              <Route path="/emergency-contacts" element={
                <EmergencyContacts />
              } />

              {/* Community Chat */}
              <Route path="/community" element={
                <ProtectedRoute>
                  <Layout type="dashboard">
                    <CommunityChat />
                  </Layout>
                </ProtectedRoute>
              } />

              {/* ⭐ FIXED ROUTE — shows SymptomReporting */}
              <Route path="/report-symptoms" element={
                <ProtectedRoute>
                  <Layout type="dashboard">
                    <SymptomReporting />
                  </Layout>
                </ProtectedRoute>
              } />

            

              {/* Disease Mapping */}
              <Route path="/disease-mapping" element={
                <ProtectedRoute requiredRole={["admin", "healthcare_worker", "asha_worker", "district_health_official", "government_body"]}>
                  <Layout type="dashboard">
                    <DiseaseMapping />
                  </Layout>
                </ProtectedRoute>
              } />

              {/* ASHA Communication */}
              <Route path="/asha-communication" element={
                <ProtectedRoute requiredRole={["admin", "healthcare_worker", "asha_worker", "district_health_official", "government_body"]}>
                  <Layout type="dashboard">
                    <ASHACommunication />
                  </Layout>
                </ProtectedRoute>
              } />

              {/* AI Water Prediction */}
              <Route path="/ai-prediction" element={
                <ProtectedRoute requiredRole={["admin", "healthcare_worker", "asha_worker", "district_health_official", "government_body", "volunteer"]}>
                  <Layout type="dashboard">
                    <WaterQualityPrediction />
                  </Layout>
                </ProtectedRoute>
              } />

              {/* Dashboard */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Layout type="dashboard">
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              {/* Profile Route */}
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Layout type="dashboard">
                    <ProfileRoute />
                  </Layout>
                </ProtectedRoute>
             } />
              {/* Health Worker Data */}
              <Route path="/health" element={
                <ProtectedRoute requiredRole="health_worker">
                  <Layout type="dashboard">
                    <HealthData />
                  </Layout>
                </ProtectedRoute>
              } />

              {/* Water Quality */}
              <Route path="/water-quality" element={
                <ProtectedRoute>
                  <Layout type="dashboard">
                    <WaterQuality />
                  </Layout>
                </ProtectedRoute>
              } />

              {/* Alerts */}
              <Route path="/alerts" element={
              <ProtectedRoute>
                <Layout type="dashboard">
                  <Alerts />
                </Layout>
              </ProtectedRoute>
            } />

              {/* Rainfall Alert */}
              <Route path="/rainfall-alert" element={
                <ProtectedRoute>
                  <Layout type="dashboard">
                    <RainfallAlert />
                  </Layout>
                </ProtectedRoute>
              } />


              {/* Education */}
              <Route path="/education" element={
                <ProtectedRoute>
                  <Layout type="dashboard">
                    <Education />
                  </Layout>
                </ProtectedRoute>
              } />

              {/* Admin Reports */}
              <Route path="/reports" element={
                <ProtectedRoute requiredRole="admin">
                  <Layout type="dashboard">
                    <AdminReports />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/goverment-reports" element={
                <ProtectedRoute requiredRole={["admin", "district_health_official", "government_body", "community_user", "volunteer"]}>
                  <Layout type="dashboard"> 
                    <GovernmentReports />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/asha-worker" element={
                <ProtectedRoute requiredRole={["community_user", "volunteer"]}>
                  <Layout type="dashboard"> 
                    <AshaWorker />
                  </Layout>
                </ProtectedRoute>
              } />

              {/* Manage Users - Government Officials Only */}
              <Route path="/manage-users" element={
                <ProtectedRoute requiredRole="government_body">
                  <Layout type="dashboard">
                    <ManageUsers />
                  </Layout>
                </ProtectedRoute>
              } />

              {/* Complaint Form - ASHA Workers and Admin */}
              <Route path="/complaint-form" element={
                <ProtectedRoute requiredRole={["asha_worker", "admin"]}>
                  <Layout type="dashboard">
                    <ComplaintForm />
                  </Layout>
                </ProtectedRoute>
              } />

              {/* Complaints Management - Government Officials */}
              <Route path="/complaints-management" element={
                <ProtectedRoute requiredRole="government_body">
                  <Layout type="dashboard">
                    <ComplaintsManagement />
                  </Layout>
                </ProtectedRoute>
              } />

              {/* Alternative route for Government section */}
              <Route path="/government/manage-users" element={
                <ProtectedRoute requiredRole="government_body">
                  <Layout type="dashboard">
                    <ManageUsers />
                  </Layout>
                </ProtectedRoute>
              } />

              {/* Accounts - Government Officials and Admin */}
              <Route path="/accounts" element={
                <ProtectedRoute requiredRole={["government_body", "admin"]}>
                  <Layout type="dashboard">
                    <GovernmentManagement />
                  </Layout>
                </ProtectedRoute>
              } />
                </Routes>
              </Router>
            </LanguageProvider>
          </ThemeProvider>
        </AlertProvider>
      </AuthProvider>
    </AntdApp>
  );
}

export default App;
