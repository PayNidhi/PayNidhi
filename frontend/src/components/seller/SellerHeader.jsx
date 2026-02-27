// frontend/src/components/seller/SellerHeader.jsx
import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  Settings,
  Bell,
  ChevronDown,
  User2,
  Menu,
} from "lucide-react";

// ✅ Fetching API URL from .env file securely
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

const SellerHeader = ({ onLogout, onToggleSidebar }) => {
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
    if (user.avatarUrl.startsWith("/uploads")) {
      avatarSrc = `${API_BASE_URL}${user.avatarUrl}`;
    } else {
      avatarSrc = user.avatarUrl;
    }
  }

  useEffect(() => {
    const handleClick = (e) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleLogout = () => {
    setOpen(false);
    onLogout?.();
  };

  return (
    <header className="h-16 border-b border-slate-200/80 bg-white/90 backdrop-blur flex items-center sticky top-0 z-40">
      <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 flex items-center justify-between">
        
        {/* Left: Mobile Toggler + Title */}
        <div className="flex items-center gap-3 sm:gap-2">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="inline-flex lg:hidden h-10 w-10 sm:h-9 sm:w-9 items-center justify-center rounded-full sm:rounded-xl border border-slate-200 bg-slate-50 sm:bg-white text-slate-600 hover:bg-[#E0F6F2] hover:text-[#0f8f79] active:scale-95 transition-all duration-200 shadow-sm z-50"
            aria-label="Toggle menu"
          >
            <Menu size={18} />
          </button>

          <h1 className="block sm:hidden text-[15px] font-bold text-slate-800 tracking-tight truncate max-w-[160px]">
            {companyName}
          </h1>

          <div className="hidden sm:flex flex-col">
            <p className="text-[11px] font-semibold text-[#0f8f79] uppercase tracking-[0.18em]">
              Seller Dashboard
            </p>
            <h1 className="text-sm sm:text-base font-semibold text-slate-800">
              Overview
            </h1>
          </div>
        </div>

        {/* Right: User Block with Dropdown */}
        <div className="flex items-center gap-2 sm:gap-4 relative" ref={dropdownRef}>
          
          <button
            type="button"
            className="inline-flex h-10 w-10 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 sm:bg-white text-slate-500 hover:bg-slate-100 hover:text-[#0f8f79] active:scale-95 transition-all sm:shadow-none shadow-sm"
          >
            <Bell size={18} className="sm:w-[15px] sm:h-[15px]" />
          </button>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full sm:bg-slate-50 sm:border sm:border-slate-200 p-0 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:border-slate-300 active:scale-95 transition-all"
          >
            <div className="hidden sm:flex flex-col items-end leading-tight mr-1">
              <span className="max-w-[160px] truncate font-medium">{email}</span>
              <span className="text-[10px] font-normal text-slate-500">
                Seller Account
              </span>
            </div>
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt="Seller avatar"
                className="h-10 w-10 sm:h-7 sm:w-7 rounded-full object-cover border border-slate-200 shadow-sm"
              />
            ) : (
              <div className="h-10 w-10 sm:h-7 sm:w-7 rounded-full bg-[#E0F6F2] border border-[#7FE0CC] flex items-center justify-center text-[13px] sm:text-[11px] font-semibold text-[#0f8f79] shadow-sm">
                {initials}
              </div>
            )}
            <ChevronDown
              size={14}
              className={`hidden sm:block text-slate-400 transition-transform ${
                open ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown panel */}
          {open && (
            <div className="absolute right-0 top-14 sm:top-12 w-56 rounded-2xl border border-slate-200 bg-white shadow-xl py-2 text-xs text-slate-700 z-50 origin-top-right animate-in fade-in zoom-in-95 duration-200">
              <div className="px-3 pb-2 pt-2 border-b border-slate-100">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.16em]">
                  Account
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900 truncate">
                  {companyName}
                </p>
                <p className="text-[11px] text-slate-500 truncate">{email}</p>
              </div>
              <button 
                onClick={() => {
                  setOpen(false);
                  navigate("/seller/kyc");
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-[#F3FBF9] hover:text-[#0f8f79] active:bg-slate-50 transition-colors"
              >
                <span className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                  <User2 size={14} />
                </span>
                <span>Profile & KYC</span>
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-[#F3FBF9] hover:text-[#0f8f79] active:bg-slate-50 transition-colors">
                <span className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                  <Bell size={14} />
                </span>
                <span>Notifications</span>
              </button>

              {/* ✅ ADDED ONCLICK TO REDIRECT TO SETTINGS HERE */}
              <button 
                onClick={() => {
                  setOpen(false);
                  navigate("/seller/settings");
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-[#F3FBF9] hover:text-[#0f8f79] active:bg-slate-50 transition-colors"
              >
                <span className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                  <Settings size={14} />
                </span>
                <span>Settings</span>
              </button>
              
              <div className="my-1 border-t border-slate-100" />
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-rose-600 hover:bg-rose-50 active:bg-rose-100 transition-colors"
              >
                <span className="h-6 w-6 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                  <LogOut size={14} />
                </span>
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default SellerHeader;