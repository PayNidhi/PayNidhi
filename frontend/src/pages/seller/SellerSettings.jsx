// frontend/src/pages/seller/SellerSettings.jsx
import React, { useState, useRef } from "react";
import SellerNav from "../../components/seller/SellerNav";
import SellerHeader from "../../components/seller/SellerHeader";
import SellerFooter from "../../components/seller/SellerFooter";
import { 
  Building2, 
  Mail, 
  Lock, 
  Camera, 
  ShieldCheck, 
  IndianRupee,
  Save,
  Loader2,
  CheckCircle2,
  UploadCloud
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

const SellerSettings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const handleToggleSidebar = () => setIsMobileOpen((prev) => !prev);
  const handleCloseMobile = () => setIsMobileOpen(false);
  const handleLogout = () => logout();

  const isKycComplete = Boolean(user?.isOnboarded && user?.kycStatus === "verified");

  let initialAvatar = "/avatars/avatar-1.png";
  if (user?.avatarUrl) {
    initialAvatar = user.avatarUrl.startsWith("/uploads") 
      ? `${API_BASE_URL}${user.avatarUrl}` 
      : user.avatarUrl;
  }

  const [form, setForm] = useState({
    companyName: user?.companyName || "Global Solutions Public Limited",
    email: user?.email || "finance@company.com",
    password: "", 
    annualTurnover: user?.annualTurnover || "",
    gstNumber: user?.gstNumber || "27ABCDE1234F1Z5", 
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
      const profileResponse = await fetch(`${API_BASE_URL}/api/auth/update-profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          companyName: form.companyName,
          email: form.email,
          annualTurnover: form.annualTurnover,
          password: form.password || undefined 
        })
      });

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json();
        throw new Error(errorData.error || "Failed to update profile");
      }

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

      toast.success("Settings updated securely.");
      setForm(prev => ({ ...prev, password: "" })); 
      
    } catch (error) {
      toast.error(error.message || "An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex bg-[#F8FAFC]" style={{ height: '100dvh', overflow: 'hidden' }}>
      
      <SellerNav
        activeKey="settings"
        onChange={() => {}}
        isKycComplete={isKycComplete}
        navigateToKyc={() => navigate("/seller/kyc")}
        isMobileOpen={isMobileOpen}
        onCloseMobile={handleCloseMobile}
      />

      <div className="flex-1 flex flex-col lg:ml-64 relative min-w-0 h-full">
        
        <header className="flex-none z-30">
          <SellerHeader onLogout={handleLogout} onToggleSidebar={handleToggleSidebar} />
        </header>

        <main className="flex-1 overflow-y-auto w-full px-4 sm:px-6 lg:px-10 py-8 lg:py-10 pb-32 lg:pb-16 custom-scrollbar">
          <div className="w-full max-w-5xl mx-auto">
            
            {/* Page Title */}
            <div className="mb-10">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Account Settings</h1>
              <p className="text-sm text-slate-500 mt-2 font-medium">Manage your corporate identity, operational details, and security.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-12">
              
              {/* --- SECTION 1: BRAND IDENTITY (Split Layout) --- */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-12 pb-12 border-b border-slate-200/60">
                <div className="lg:col-span-1">
                  <h2 className="text-base font-bold text-slate-900">Brand Identity</h2>
                  <p className="text-[13px] text-slate-500 mt-2 leading-relaxed">
                    This logo is visible to institutional lenders on the marketplace. A high-quality logo builds trust and credibility.
                  </p>
                </div>
                
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-[1.5rem] border border-slate-200/60 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
                    <div className="relative group shrink-0">
                      <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-[#0f8f79]/10 to-[#47C4B7]/10 blur-xl pointer-events-none transition-all duration-300 group-hover:opacity-100 opacity-50" />
                      <img 
                        src={avatarPreview} 
                        alt="Business Logo" 
                        className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-full object-cover border-[4px] border-white shadow-md bg-white" 
                      />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:text-[#0f8f79] active:scale-95 px-5 py-2.5 rounded-xl transition-all shadow-sm"
                      >
                        <UploadCloud size={16} /> Upload New Logo
                      </button>
                      <p className="text-[11px] font-medium text-slate-400 mt-3">
                        Recommended format: JPG or PNG. Max size: 2MB.
                      </p>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
                    </div>
                  </div>
                </div>
              </div>

              {/* --- SECTION 2: BUSINESS DETAILS (Split Layout) --- */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-12 pb-12 border-b border-slate-200/60">
                <div className="lg:col-span-1">
                  <h2 className="text-base font-bold text-slate-900">Business Profile</h2>
                  <p className="text-[13px] text-slate-500 mt-2 leading-relaxed">
                    Update your primary operational details. Your GSTIN is permanently linked to your verified KYC and cannot be changed here.
                  </p>
                </div>
                
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-[1.5rem] border border-slate-200/60 shadow-sm p-6 sm:p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                      
                      {/* Company Name */}
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.1em] ml-1">
                          Registered Entity Name
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                            <Building2 size={16} />
                          </span>
                          <input
                            type="text"
                            name="companyName"
                            value={form.companyName}
                            onChange={handleChange}
                            required
                            className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-[14px] font-semibold text-slate-900 focus:bg-white focus:border-[#47C4B7] focus:ring-4 focus:ring-[#47C4B7]/10 outline-none transition-all placeholder:font-normal"
                            placeholder="Acme Corp Ltd"
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.1em] ml-1">
                          Primary Work Email
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                            <Mail size={16} />
                          </span>
                          <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-[14px] font-semibold text-slate-900 focus:bg-white focus:border-[#47C4B7] focus:ring-4 focus:ring-[#47C4B7]/10 outline-none transition-all placeholder:font-normal"
                            placeholder="finance@company.com"
                          />
                        </div>
                      </div>

                      {/* Annual Turnover */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.1em] ml-1">
                          Annual Turnover
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                            <IndianRupee size={16} />
                          </span>
                          <input
                            type="number"
                            name="annualTurnover"
                            value={form.annualTurnover}
                            onChange={handleChange}
                            className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-[14px] font-semibold text-slate-900 focus:bg-white focus:border-[#47C4B7] focus:ring-4 focus:ring-[#47C4B7]/10 outline-none transition-all placeholder:font-normal"
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      {/* GST Number (Locked) */}
                      <div className="space-y-2 md:col-span-2 pt-2 border-t border-slate-100 mt-2">
                        <div className="flex items-center justify-between ml-1 mb-2 mt-2">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.1em]">
                            Verified GSTIN
                          </label>
                          <span className="flex items-center gap-1.5 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md uppercase tracking-wider font-bold">
                            <CheckCircle2 size={12} strokeWidth={2.5} /> KYC Locked
                          </span>
                        </div>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                            <ShieldCheck size={16} />
                          </span>
                          <input
                            type="text"
                            name="gstNumber"
                            value={form.gstNumber}
                            disabled
                            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold text-slate-500 outline-none cursor-not-allowed uppercase tracking-widest"
                          />
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>

              {/* --- SECTION 3: SECURITY (Split Layout) --- */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-12 pb-6">
                <div className="lg:col-span-1">
                  <h2 className="text-base font-bold text-slate-900">Security</h2>
                  <p className="text-[13px] text-slate-500 mt-2 leading-relaxed">
                    Ensure your account stays secure. Use a strong password containing letters, numbers, and symbols.
                  </p>
                </div>
                
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-[1.5rem] border border-slate-200/60 shadow-sm p-6 sm:p-8">
                    <div className="max-w-md space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.1em] ml-1">
                        Update Password
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                          <Lock size={16} />
                        </span>
                        <input
                          type="password"
                          name="password"
                          value={form.password}
                          onChange={handleChange}
                          className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-[14px] font-bold text-slate-900 focus:bg-white focus:border-[#47C4B7] focus:ring-4 focus:ring-[#47C4B7]/10 outline-none transition-all placeholder:font-normal placeholder:text-slate-400"
                          placeholder="Leave blank to keep current"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* --- BOTTOM ACTION BAR --- */}
              <div className="flex items-center justify-end pt-6 border-t border-slate-200/60">
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-10 py-3.5 bg-[#0f8f79] hover:bg-[#0c6b5f] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#0f8f79]/20 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <><Loader2 size={18} className="animate-spin" /> Saving...</>
                  ) : (
                    <><Save size={18} /> Save Settings</>
                  )}
                </button>
              </div>

            </form>
          </div>
        </main>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
      `}} />
    </div>
  );
};

export default SellerSettings;