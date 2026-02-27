// frontend/src/components/lender/LenderHeader.jsx
import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogOut, Settings, Bell, User2, Menu, ChevronDown } from "lucide-react";

// ✅ Securely fetching API URL from .env file
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

const LenderHeader = ({ onLogout, onToggleSidebar }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const companyName = user?.companyName || "Your business";
  const email = user?.email || "you@business.in";

  const initials = (user?.companyName || "PN")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  let avatarSrc = "/avatars/avatar-1.png";
  if (user?.avatarUrl) {
    avatarSrc = user.avatarUrl.startsWith("/uploads") 
      ? `${API_BASE_URL}${user.avatarUrl}` 
      : user.avatarUrl;
  }

  useEffect(() => {
    const handleClick = (e) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    // ✅ Responsive Header Background: Transparent on Desktop, White/Glass on Mobile
    <header className="h-16 lg:h-10 bg-white/90 lg:bg-transparent backdrop-blur lg:backdrop-blur-none border-b border-slate-200/80 lg:border-none flex items-center sticky top-0 z-40 transition-all">
      <div className="w-full px-3 sm:px-6 lg:px-10 flex items-center justify-between">
        
        {/* Left Side: Mobile Menu Toggler + Title (Hidden on Desktop) */}
        <div className="flex items-center gap-3 lg:hidden">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="inline-flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center rounded-full sm:rounded-xl border border-slate-200 bg-slate-50 sm:bg-white text-slate-600 hover:bg-[#E0F6F2] hover:text-[#0f8f79] active:scale-95 transition-all duration-200 shadow-sm z-50"
            aria-label="Toggle menu"
          >
            <Menu size={18} />
          </button>

          {/* ✅ Mobile Title: Company Name (Matches Seller Side) */}
          <h1 className="text-[15px] font-bold text-slate-800 tracking-tight truncate max-w-[160px]">
            {companyName}
          </h1>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-4 relative ml-auto" ref={dropdownRef}>
          
          {/* ✅ Bell Icon: Only visible on mobile (Matches Seller Side) */}
          <button
            type="button"
            className="inline-flex lg:hidden h-10 w-10 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 sm:bg-white text-slate-500 hover:bg-slate-100 hover:text-[#0f8f79] active:scale-95 transition-all shadow-sm"
          >
            <Bell size={18} className="sm:w-[15px] sm:h-[15px]" />
          </button>

          {/* Profile Button: Circular on Mobile, Floating Avatar on Desktop */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="lg:h-9 lg:w-9 lg:rounded-full lg:border-2 lg:border-white lg:shadow-sm lg:bg-white lg:hover:scale-105 lg:transition-all lg:duration-300 flex items-center justify-center text-[12px] font-bold text-[#0f8f79] overflow-hidden rounded-full sm:bg-slate-50 sm:border sm:border-slate-200 p-0 active:scale-95 transition-all"
          >
            {avatarSrc ? (
              <img src={avatarSrc} alt="Avatar" className="h-10 w-10 sm:h-7 sm:w-7 lg:h-full lg:w-full rounded-full lg:rounded-none object-cover border border-slate-200 lg:border-none shadow-sm lg:shadow-none" />
            ) : (
              <div className="h-10 w-10 sm:h-7 sm:w-7 lg:h-full lg:w-full rounded-full lg:rounded-none bg-[#E0F6F2] lg:bg-transparent border border-[#7FE0CC] lg:border-none flex items-center justify-center text-[13px] sm:text-[11px] lg:text-[12px] font-semibold text-[#0f8f79] shadow-sm lg:shadow-none">
                {initials}
              </div>
            )}
          </button>

          {/* Dropdown panel */}
          {open && (
            <div className="absolute right-0 top-14 lg:top-12 w-56 rounded-2xl border border-slate-100 bg-white shadow-xl py-2 text-xs text-slate-700 z-50 origin-top-right animate-in fade-in zoom-in-95 duration-200">
              <div className="px-4 pb-3 pt-2 border-b border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account</p>
                <p className="mt-1 text-sm font-bold text-slate-900 truncate">{companyName}</p>
                <p className="text-[11px] font-medium text-slate-500 truncate">{email}</p>
              </div>
              <button onClick={() => { setOpen(false); navigate("/lender/kyc"); }} className="w-full flex items-center gap-3 px-4 py-3 font-semibold hover:bg-slate-50 hover:text-[#0f8f79] transition-colors">
                <User2 size={16} className="text-slate-500" /> Profile & KYC
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 font-semibold hover:bg-slate-50 hover:text-[#0f8f79] transition-colors">
                <Bell size={16} className="text-slate-500" /> Notifications
              </button>
              <button onClick={() => { setOpen(false); navigate("/lender/settings"); }} className="w-full flex items-center gap-3 px-4 py-3 font-semibold hover:bg-slate-50 hover:text-[#0f8f79] transition-colors">
                <Settings size={16} className="text-slate-500" /> Settings
              </button>
              <div className="my-1 border-t border-slate-100" />
              <button onClick={() => { setOpen(false); onLogout?.(); }} className="w-full flex items-center gap-3 px-4 py-3 font-semibold text-rose-600 hover:bg-rose-50 transition-colors">
                <LogOut size={16} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default LenderHeader;