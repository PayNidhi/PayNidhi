import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar, Sidebar } from './../components/admin/exports';

const AdminLayout = () => {
  // State to control the mobile sidebar slider
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    // 1. Root wrapper: strict 100dvh, premium background, overflow hidden
    <div className="flex bg-[#F8FAFC] font-sans text-slate-800" style={{ height: '100dvh', overflow: 'hidden' }}>
      
      {/* Soft Ambient Background Glow (Optional, matches your dashboards) */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#D9FAF2]/30 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* 2. Sidebar Component */}
      <Sidebar 
        isMobileOpen={isMobileOpen} 
        onCloseMobile={() => setIsMobileOpen(false)} 
      />

      {/* 3. Main Content Container: Pushed right by 64 units (256px) on Desktop to make room for fixed sidebar */}
      <div className="flex-1 flex flex-col relative z-10 min-w-0 h-full transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] lg:ml-64">
        
        {/* Navbar / Header */}
        <div className="flex-none z-30">
          <Navbar onToggleSidebar={() => setIsMobileOpen(true)} />
        </div>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {/* Note: We do not put padding or max-width here directly. 
            Your individual pages (like AdminDashboard) already have 
            their own specific padding and max-width containers!
          */}
          <Outlet />
        </main>
        
      </div>
      
      {/* Global CSS for scrollbars */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 0px; display: none; }
        .custom-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
};

export default AdminLayout;