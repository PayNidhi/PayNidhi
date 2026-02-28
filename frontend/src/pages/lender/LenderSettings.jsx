import React, { useState, useRef, useCallback } from "react";
import LenderNav from "../../components/lender/LenderNav";
import LenderHeader from "../../components/lender/LenderHeader";
import { 
  Building, 
  Mail, 
  Lock, 
  Camera, 
  ShieldCheck, 
  Save,
  Loader2,
  Briefcase,
  KeyRound,
  Landmark,
  BadgeCheck
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

const LenderSettings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Mobile Nav State
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const handleToggleSidebar = () => setIsMobileOpen((prev) => !prev);
  const handleCloseMobile = () => setIsMobileOpen(false);
  const handleLogout = () => logout();

  const isKycComplete = Boolean(user?.isOnboarded && user?.kycStatus === "verified");

  // Format initial avatar
  let initialAvatar = "/avatars/avatar-1.png";
  if (user?.avatarUrl) {
    initialAvatar = user.avatarUrl.startsWith("/uploads") 
      ? `${API_BASE_URL}${user.avatarUrl}` 
      : user.avatarUrl;
  }

  // Form State
  const [form, setForm] = useState({
    companyName: user?.companyName || "Capital Trust Partners",
    email: user?.email || "treasury@capitaltrust.in",
    password: "", 
    gstNumber: user?.gstNumber || "N/A", // Read-only
    lenderLicense: user?.lenderLicense || "N/A", // Read-only
    lenderType: user?.lenderType || "N/A", // Read-only
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(initialAvatar);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // 1. Update Profile Information
      // Note: Backend endpoint is shared. We send annualTurnover: 0 as backend expects it for validation fallback
      const profileResponse = await fetch(`${API_BASE_URL}/api/auth/update-profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          companyName: form.companyName,
          email: form.email,
          annualTurnover: 0, 
          password: form.password || undefined 
        })
      });

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json();
        throw new Error(errorData.error || "Failed to update profile");
      }

      // 2. Update Avatar
      if (avatarFile) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);

        const avatarResponse = await fetch(`${API_BASE_URL}/api/auth/update-avatar`, {
          method: "POST", 
          body: formData,
          credentials: "include",
        });

        if (!avatarResponse.ok) {
          const errorData = await avatarResponse.json();
          throw new Error(errorData.error || "Failed to upload avatar");
        }
      }

      toast.success("Settings updated successfully!");
      setForm(prev => ({ ...prev, password: "" })); 
      
    } catch (error) {
      toast.error(error.message || "An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex bg-[#F8FAFC]" style={{ height: '100dvh', overflow: 'hidden' }}>
      
      {/* Soft Background Glows */}
      <div className="fixed top-[0%] right-[-10%] w-[40%] h-[40%] bg-[#D9FAF2]/40 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* Sidebar Navigation */}
      <LenderNav
        activeKey="settings"
        onChange={() => {}}
        isKycComplete={isKycComplete}
        navigateToKyc={() => navigate("/lender/kyc")}
        isMobileOpen={isMobileOpen}
        onCloseMobile={handleCloseMobile}
      />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col lg:ml-64 relative min-w-0 h-full z-10 transition-all duration-300">
        
        {/* STATIC HEADER */}
        <header className="flex-none z-30">
          <LenderHeader onLogout={handleLogout} onToggleSidebar={handleToggleSidebar} />
        </header>

        {/* SCROLLABLE MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden w-full px-4 sm:px-6 lg:px-8 pb-28 lg:pb-12 custom-scrollbar">
          <div className="w-full max-w-[900px] mx-auto pt-6 sm:pt-8">
            
            {/* Page Header */}
            <div className="mb-6 sm:mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <h1 className="text-xl sm:text-[26px] font-bold text-slate-900 tracking-tight">
                Institution Settings
              </h1>
              <p className="text-[12px] sm:text-[13px] text-slate-500 font-medium mt-1.5 max-w-2xl">
                Manage your institutional profile, regulatory licenses, and treasury security protocols.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              
              {/* --- BOX 1: Identity & Contact --- */}
              <div className="bg-white rounded-[1.5rem] border border-slate-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-500 delay-75">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 text-[#0f8f79] shadow-sm">
                    <Briefcase size={16} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">Identity & Contact</h2>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">Marketplace facing information</p>
                  </div>
                </div>

                <div className="p-6 sm:p-8">
                  {/* Avatar Upload */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6 mb-8">
                    <div className="relative group shrink-0">
                      <div className="absolute inset-0 bg-slate-900/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-10"></div>
                      <img 
                        src={avatarPreview} 
                        alt="Institution Logo" 
                        className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover border-4 border-white shadow-md bg-slate-50 transition-transform duration-300 group-hover:scale-[1.02]" 
                      />
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 h-8 w-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-600 shadow-md hover:text-[#0f8f79] hover:border-[#0f8f79] hover:scale-110 transition-all z-20"
                      >
                        <Camera size={14} strokeWidth={2.5} />
                      </button>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Institution Logo</h3>
                      <p className="text-[11px] sm:text-[12px] font-medium text-slate-500 mt-1 mb-3 max-w-sm leading-relaxed">
                        Upload your official bank or fund logo to build trust with borrowers and MSMEs. (Max 2MB, JPG/PNG)
                      </p>
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[11px] font-bold text-[#0f8f79] bg-[#E0F6F2]/60 hover:bg-[#C9EFE6] px-4 py-2 rounded-lg transition-colors border border-[#7FE0CC]/30"
                      >
                        Change Logo
                      </button>
                    </div>
                  </div>

                  {/* Input Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                        Institution Name
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0f8f79] transition-colors">
                          <Building size={16} />
                        </div>
                        <input
                          type="text"
                          name="companyName"
                          value={form.companyName}
                          onChange={handleChange}
                          required
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-800 focus:bg-white focus:border-[#47C4B7] focus:ring-4 focus:ring-[#47C4B7]/10 transition-all outline-none hover:border-slate-300"
                          placeholder="Enter institution name"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                        Treasury Email
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0f8f79] transition-colors">
                          <Mail size={16} />
                        </div>
                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          required
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-800 focus:bg-white focus:border-[#47C4B7] focus:ring-4 focus:ring-[#47C4B7]/10 transition-all outline-none hover:border-slate-300"
                          placeholder="treasury@institution.com"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* --- BOX 2: Compliance & Licensing --- */}
              <div className="bg-white rounded-[1.5rem] border border-slate-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 text-[#0f8f79] shadow-sm">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">Compliance & Licensing</h2>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">Regulatory framework details</p>
                  </div>
                </div>

                <div className="p-6 sm:p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                    
                    {/* RBI License Number (Locked) */}
                    <div className="space-y-1.5 md:col-span-2">
                      <div className="flex items-center justify-between pl-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          RBI License / Registration No.
                        </label>
                        <span className="flex items-center gap-1 text-[8px] text-emerald-600 bg-emerald-50 border border-emerald-200/80 px-1.5 py-[2px] rounded uppercase tracking-widest font-bold">
                          <ShieldCheck size={10} /> Verified
                        </span>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Landmark size={16} />
                        </div>
                        <input
                          type="text"
                          name="lenderLicense"
                          value={form.lenderLicense}
                          disabled
                          className="w-full pl-10 pr-4 py-3 bg-slate-100/60 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-500 outline-none cursor-not-allowed uppercase tracking-wider"
                        />
                      </div>
                      <p className="text-[10px] font-medium text-slate-400 mt-1 pl-1">License is cross-verified with the central regulatory database.</p>
                    </div>

                    {/* Provider Type (Locked) */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                        Provider Entity Type
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <BadgeCheck size={16} />
                        </div>
                        <input
                          type="text"
                          name="lenderType"
                          value={form.lenderType}
                          disabled
                          className="w-full pl-10 pr-4 py-3 bg-slate-100/60 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-500 outline-none cursor-not-allowed uppercase tracking-wider"
                        />
                      </div>
                    </div>

                    {/* GST Number (Locked) */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                        GSTIN Number
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock size={16} />
                        </div>
                        <input
                          type="text"
                          name="gstNumber"
                          value={form.gstNumber}
                          disabled
                          className="w-full pl-10 pr-4 py-3 bg-slate-100/60 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-500 outline-none cursor-not-allowed uppercase tracking-wider"
                        />
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* --- BOX 3: Security --- */}
              <div className="bg-white rounded-[1.5rem] border border-slate-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-500 delay-150">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 text-[#0f8f79] shadow-sm">
                    <KeyRound size={16} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">Security</h2>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">Account access and authentication</p>
                  </div>
                </div>

                <div className="p-6 sm:p-8">
                  <div className="max-w-md space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                      Update Password
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0f8f79] transition-colors">
                        <Lock size={16} />
                      </div>
                      <input
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-800 focus:bg-white focus:border-[#47C4B7] focus:ring-4 focus:ring-[#47C4B7]/10 transition-all outline-none hover:border-slate-300 placeholder:font-normal placeholder:text-slate-400"
                        placeholder="Leave blank to keep current"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Actions Button */}
              <div className="flex items-center justify-end pt-2 pb-6 animate-in fade-in duration-700 delay-200">
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#0f8f79] to-[#47C4B7] text-white rounded-xl text-[13px] font-bold shadow-[0_4px_16px_rgba(15,143,121,0.25)] hover:shadow-[0_6px_20px_rgba(15,143,121,0.35)] hover:-translate-y-[1px] active:translate-y-[1px] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed group"
                >
                  {isSaving ? (
                    <><Loader2 size={16} className="animate-spin" /> Saving Changes...</>
                  ) : (
                    <><Save size={16} className="group-hover:scale-110 transition-transform" /> Save All Settings</>
                  )}
                </button>
              </div>

            </form>
          </div>
        </main>
        
      </div>

      {/* Global Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 0px; 
          display: none; 
        }
        .custom-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        body { font-family: 'Inter', 'Poppins', sans-serif; }
      `}} />
    </div>
  );
};

export default LenderSettings;