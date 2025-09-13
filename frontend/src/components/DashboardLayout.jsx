import React from 'react';
// import Sidebar from '../components/Sidebar';
import { Outlet } from 'react-router-dom';

export default function DashboardLayout() {
  return (
    <div style={{ minHeight: '100vh', background: '#f6f8fa', paddingTop: 64 }}>
      <main style={{ flex: 1, padding: '40px 5vw', maxWidth: 1200, margin: '0 auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
