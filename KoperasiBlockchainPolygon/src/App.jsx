// src/App.jsx
import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import UserPage from './pages/UserPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';
import AdminRoute from './routes/AdminRoute';
import LoanDetailPage from './pages/LoanDetailPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Halaman user */}
        <Route path="/" element={<UserPage />} />
        <Route path="/user" element={<UserPage />} />
        <Route path="/profil" element={<ProfilePage />} />

        {/* Halaman admin (proteksi via AdminRoute wrapper) */}
        <Route path="/admin" element={<AdminRoute />}>
          <Route index element={<AdminPage />} />
        </Route>

        {/* Halaman detail pinjaman */}
        <Route path="/pinjaman/detail" element={<LoanDetailPage />} />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
