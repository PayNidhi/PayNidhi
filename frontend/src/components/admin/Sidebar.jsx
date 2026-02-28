import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from './../../context/AuthContext';
import toast from 'react-hot-toast';
import {
    LayoutDashboard, Users, FileCheck, Calculator, History, LogOut, ShieldCheck, X
} from 'lucide-react';

const Sidebar = ({ isMobileOpen, onCloseMobile }) => {
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        toast.success("Logged out successfully");
        window.location.href = "/";
    };

    const menuItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
        { name: 'Sellers', icon: Users, path: '/admin/sellers' },
        { name: 'Lenders', icon: Users, path: '/admin/lenders' },
        { name: 'NOA Review', icon: FileCheck, path: '/admin/noa-review' },
        { name: 'Settlements', icon: Calculator, path: '/admin/settlements' },
        { name: 'Master Ledger', icon: History, path: '/admin/ledger' },
    ];

    const SidebarContent = () => (
        <>
            {/* ✅ FIXED: Set explicitly to h-16 (64px) to perfectly match the Navbar height & border */}
            <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200/80 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-[#0f8f79] to-[#47C4B7] rounded-[10px] flex items-center justify-center shadow-md shadow-[#0f8f79]/20">
                        <ShieldCheck className="text-white w-5 h-5" />
                    </div>
                    <div className="flex flex-col justify-center">
                        <h1 className="text-[16px] font-black text-slate-800 tracking-tight leading-tight">PayNidhi</h1>
                        <p className="text-[8px] text-[#0f8f79] font-bold uppercase tracking-[0.2em] mt-0.5 leading-none">Command Center</p>
                    </div>
                </div>
                {/* Mobile Close Button */}
                <button onClick={onCloseMobile} className="lg:hidden p-1.5 bg-slate-50 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors">
                    <X size={16} />
                </button>
            </div>

            <div className="px-5 pt-4 pb-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.16em]">Navigation</p>
            </div>

            <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto custom-scrollbar">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        onClick={onCloseMobile} // Closes drawer automatically when a link is clicked
                        className={({ isActive }) =>
                            `relative flex items-center gap-3 px-3 py-2.5 rounded-2xl text-[12px] font-semibold transition-all duration-200 group overflow-hidden ${
                                isActive
                                    ? 'bg-gradient-to-r from-[#D9FAF2] via-white to-[#D9FAF2] text-[#0f8f79] border border-[#7FE0CC] shadow-sm'
                                    : 'text-slate-600 border border-transparent hover:bg-slate-50 hover:border-slate-200'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                {isActive && (
                                    <span className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-gradient-to-b from-[#47C4B7] to-emerald-500" />
                                )}
                                <span className={`flex h-8 w-8 items-center justify-center rounded-[10px] transition-transform duration-300 ${
                                    isActive ? 'bg-[#C9EFE6] text-[#0f8f79] scale-105' : 'bg-slate-100 text-slate-500 group-hover:scale-105 group-hover:bg-[#E0F6F2] group-hover:text-[#0f8f79]'
                                }`}>
                                    <item.icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                                </span>
                                <span className="flex-1 tracking-wide">{item.name}</span>
                                {!isActive && <span className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#0f8f79]">→</span>}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 mt-auto border-t border-slate-100 bg-slate-50/50">
                <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-white border border-rose-100 text-rose-600 hover:bg-rose-50 hover:border-rose-200 rounded-xl text-[12px] font-bold transition-all shadow-sm hover:shadow active:scale-95"
                >
                    <LogOut size={16} />
                    <span>Terminate Session</span>
                </button>
            </div>
        </>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 bg-white border-r border-slate-200/80 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-50">
                <SidebarContent />
            </aside>

            {/* Mobile Drawer Overlay */}
            <div className={`lg:hidden fixed inset-0 z-[100] transition-opacity duration-300 ${isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onCloseMobile} />
                <aside className={`absolute inset-y-0 left-0 w-[80%] max-w-[280px] bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
                    <SidebarContent />
                </aside>
            </div>
        </>
    );
};

export default Sidebar;