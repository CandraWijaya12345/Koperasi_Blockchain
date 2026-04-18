// src/routes/AdminRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { useKoperasi } from '../hooks/useKoperasi';

const AdminRoute = () => {
  const { account, isConnecting } = useWallet();
  const { isPengurus, isLoading } = useKoperasi(account);

  // Masih loading cek wallet / koperasi
  if (isConnecting || isLoading) {
    return (
      <div style={{ padding: 24 }}>
        Memeriksa akses admin...
      </div>
    );
  }

  // ❌ DULUNYA: kalau !account langsung Navigate("/")
  // ✅ SEKARANG: biarkan lewat, biar AdminPage yang tampilkan "hubungkan wallet"
  if (!account) {
    return <Outlet />;
  }

  // Biarkan `AdminPage` yang menampilkan UI ketika akun tidak punya akses
  if (!isPengurus) {
    return <Outlet />;
  }

  // Sudah connect & pengurus -> boleh akses child route (/admin)
  return <Outlet />;
};

export default AdminRoute;
