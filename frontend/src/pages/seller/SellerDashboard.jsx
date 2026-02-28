import React, { useState, useEffect, useRef, useCallback } from "react";
import SellerNav from "../../components/seller/SellerNav";
import SellerHeader from "../../components/seller/SellerHeader";
import SellerFooter from "../../components/seller/SellerFooter";
import {
  ArrowRight, ShieldCheck, UploadCloud, FileText, X, CheckCircle2,
  Sparkles, AlertCircle, Search, Loader2, Zap, Store, Wallet,
  Activity, Gavel, Users, Lock
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
} from "recharts";
import { motion } from "framer-motion";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

const SCAN_STEPS = [
  "Initializing AI Vision Engine...",
  "Extracting document structure & text...",
  "Validating GSTIN and PO numbers...",
  "Running compliance & fraud checks...",
  "Finalizing financial risk assessment...",
];

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const SellerDashboard = () => {
  const [activeKey, setActiveKey] = useState("overview");
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Summary (KPIs, charts)
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [summaryError, setSummaryError] = useState(null);

  // Trust Score Animation State
  const [animatedScore, setAnimatedScore] = useState(0);

  // Recent invoices
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [invoiceError, setInvoiceError] = useState(null);

  // UPLOAD & MODAL STATES
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState("idle");
  const [scanStepIndex, setScanStepIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [extractedData, setExtractedData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const kycToastRef = useRef(null);

  const handleLogout = () => {
    logout();
  };

  const isKycComplete = !!user && user.isOnboarded && user.kycStatus === "verified";
  const firstName = user?.companyName?.split(" ")[0] || "Seller";

  const showKycToast = useCallback(() => {
    if (kycToastRef.current) {
      toast.dismiss(kycToastRef.current);
    }
    kycToastRef.current = toast(
      "Please complete KYC to unlock full features",
      {
        duration: 4000,
        position: "top-right",
        id: "kyc-simple-toast",
        style: {
          background: "#fef3c7",
          color: "#92400e",
          border: "1px solid #f59e0b",
          padding: "12px",
          fontSize: "14px",
        },
      }
    );
  }, []);

  useEffect(() => {
    if (!user) return;
    if (!isKycComplete) {
      const timeout = setTimeout(() => {
        showKycToast();
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [isKycComplete, showKycToast, user]);

  const navigateToKyc = useCallback(() => {
    navigate("/seller/kyc");
  }, [navigate]);

  const handleNavClick = useCallback(
    (key) => {
      if (!isKycComplete && key !== "overview") {
        toast.error("Complete KYC first", { id: "nav-kyc-error" });
        navigateToKyc();
        return;
      }
      setActiveKey(key);
      setIsMobileOpen(false);
    },
    [isKycComplete, navigateToKyc]
  );

  // Fetch dashboard summary
  useEffect(() => {
    let isMounted = true;
    const fetchSummary = async () => {
      try {
        setLoadingSummary(true);
        setSummaryError(null);
        const res = await fetch(`${API_BASE_URL}/api/seller/dashboard-summary`, { credentials: "include" });
        if (!res.ok) throw new Error("Failed to load dashboard data");
        const data = await res.json();
        if (isMounted) setSummary(data);
      } catch (err) {
        if (isMounted) setSummaryError(err.message || "Failed to load dashboard data");
        if (isMounted) setSummary({ totalFinanced: 1500000, invoicesUnderReview: 3, upcomingSettlementAmount: 450000, trustScore: 820 });
      } finally {
        if (isMounted) setLoadingSummary(false);
      }
    };
    fetchSummary();
    return () => { isMounted = false; };
  }, []);

  // Trigger trust score animation
  useEffect(() => {
    if (summary?.trustScore) {
      const timer = setTimeout(() => {
        setAnimatedScore(summary.trustScore);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [summary?.trustScore]);

  // Fetch seller invoices
  useEffect(() => {
    let isMounted = true;
    const fetchInvoices = async () => {
      try {
        setLoadingInvoices(true);
        setInvoiceError(null);
        const res = await fetch(`${API_BASE_URL}/api/invoice/my`, { credentials: "include" });
        if (!res.ok) throw new Error("Failed to load invoices");
        const data = await res.json();
        if (isMounted) setInvoices(Array.isArray(data) ? data : []);
      } catch (err) {
        if (isMounted) setInvoiceError(err.message || "Failed to load invoices");
      } finally {
        if (isMounted) setLoadingInvoices(false);
      }
    };
    fetchInvoices();
    return () => { isMounted = false; };
  }, []);

  // DIRECT UPLOAD LOGIC
  const openModal = () => {
    if (!isKycComplete) {
      toast.error("Please complete KYC to upload invoices.");
      return navigateToKyc();
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (status === "scanning") return;
    setIsModalOpen(false);
    setTimeout(() => {
      setFile(null);
      setStatus("idle");
      setErrorMessage("");
      setExtractedData(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }, 300);
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    if (!isKycComplete) {
      toast.error("Please complete KYC to upload invoices.");
      return navigateToKyc();
    }
    if (!selectedFile) return;
    if (selectedFile.type !== "application/pdf") {
      return toast.error("Only PDF files are allowed.");
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      return toast.error("File size must be under 5MB.");
    }
    setFile(selectedFile);
    setStatus("idle");
    setErrorMessage("");
    setIsModalOpen(true);
  };

  const removeFile = () => {
    setFile(null);
    setStatus("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    let interval;
    if (status === "scanning") {
      interval = setInterval(() => {
        setScanStepIndex((prev) => (prev < SCAN_STEPS.length - 1 ? prev + 1 : prev));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  const handleUpload = async () => {
    if (!file) return toast.error("Please select a file first.");

    setStatus("scanning");
    setScanStepIndex(0);
    setErrorMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE_URL}/api/invoice/upload`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();
      await new Promise(resolve => setTimeout(resolve, 5500));

      if (!res.ok) throw new Error(data.error || "Verification failed");

      setExtractedData(data.data);
      setStatus("success");
      toast.success("Invoice successfully verified!");

    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 4000));
      setErrorMessage(error.message);
      setStatus("error");
    }
  };

  // Mock data for UI alignment
  const areaChartData = summary?.deployedByMonth && summary.deployedByMonth.length > 0
    ? summary.deployedByMonth
    : [
        { name: 'Jan', value: 10 }, { name: 'Feb', value: 20 }, { name: 'Mar', value: 15 },
        { name: 'Apr', value: 25 }, { name: 'May', value: 18 }, { name: 'Jun', value: 30 },
        { name: 'Jul', value: 22 }, { name: 'Aug', value: 35 }, { name: 'Sep', value: 28 },
        { name: 'Oct', value: 40 }, { name: 'Nov', value: 30 }, { name: 'Dec', value: 45 }
      ];

  const statusData = summary?.invoiceStatusCounts
    ? Object.entries(summary.invoiceStatusCounts).map(([status, value]) => ({ name: status, value }))
    : [{ name: "Verified", value: 16 }, { name: "Pending", value: 32 }];

  // -------------------------------------------------------------
  // RENDER: MODAL COMPONENTS
  // -------------------------------------------------------------
  const renderIdleState = () => (
    <div className="animate-in fade-in duration-500 w-full max-w-md mx-auto text-center relative z-10">
      {!file ? (
        <div
          onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
          className={`group w-full border-2 border-dashed rounded-[1.5rem] p-6 sm:p-10 flex flex-col items-center transition-all duration-300 ease-out ${isDragging ? 'border-[#47C4B7] bg-[#D9FAF2]/60 scale-[1.02] shadow-[0_0_20px_rgba(71,196,183,0.2)]' : 'border-slate-200/80 bg-slate-50/50 hover:bg-[#F3FBF9] hover:border-[#7FE0CC]/80'
            }`}
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white text-[#0f8f79] rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-5 shadow-sm border border-slate-100 group-hover:-translate-y-1 group-hover:shadow-[0_4px_12px_rgba(15,143,121,0.15)] transition-all duration-300">
            <UploadCloud size={28} strokeWidth={2} className="sm:w-[30px] sm:h-[30px]" />
          </div>
          <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-1.5 group-hover:text-[#0f8f79] transition-colors">Drop Document</h2>
          <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium mb-5 sm:mb-6 leading-relaxed max-w-[220px] mx-auto">
            Drag & drop your PDF or click below to browse. Max size: 5MB.
          </p>
          <label className="cursor-pointer inline-flex items-center justify-center px-5 sm:px-6 py-2.5 bg-[#C9EFE6] text-[#0f8f79] rounded-xl font-bold text-[10px] sm:text-[11px] uppercase tracking-widest hover:bg-[#47C4B7] hover:text-white transition-all duration-300 active:scale-95 shadow-sm">
            Browse Files
            <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={handleFileChange} />
          </label>
        </div>
      ) : (
        <div className="animate-in zoom-in-95 duration-400">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#D9FAF2] rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 sm:mb-5 shadow-sm text-[#0f8f79] relative border border-[#7FE0CC]/30">
            <FileText size={28} strokeWidth={1.5} className="sm:w-[32px] sm:h-[32px]" />
            <button onClick={removeFile} className="absolute -top-2 -right-2 bg-white border border-slate-200 p-1.5 rounded-full text-slate-400 hover:text-rose-500 shadow-sm hover:bg-rose-50 transition-all duration-200 hover:scale-110">
              <X size={14} strokeWidth={2.5} />
            </button>
          </div>
          <h3 className="text-sm sm:text-base font-semibold text-slate-900 mb-1 truncate px-4">{file.name}</h3>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100/60 mb-6 sm:mb-8">
            <ShieldCheck size={12} className="text-emerald-500" />
            <span className="text-[8px] sm:text-[9px] font-bold text-emerald-700 uppercase tracking-widest">Integrity Verified</span>
          </div>
          <button
            onClick={handleUpload}
            className="w-full flex items-center justify-center gap-2 py-3 sm:py-3.5 bg-gradient-to-r from-[#47C4B7] to-[#0f8f79] text-white rounded-xl font-semibold text-[12px] sm:text-[13px] shadow-[0_4px_16px_rgba(15,143,121,0.25)] hover:shadow-[0_6px_20px_rgba(15,143,121,0.35)] hover:-translate-y-[1px] active:translate-y-0 transition-all duration-300 group"
          >
            <Sparkles size={16} className="group-hover:animate-pulse" /> Start AI Scan
          </button>
        </div>
      )}
    </div>
  );

  const renderScanningState = () => (
    <div className="py-4 sm:py-6 flex flex-col animate-in fade-in duration-500 max-w-md mx-auto relative z-20">
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 sm:mb-8 flex items-center justify-center">
        <div className="absolute inset-0 bg-[#0f8f79] rounded-full blur-2xl animate-pulse opacity-20" />
        <div className="absolute inset-2 bg-gradient-to-tr from-[#0f8f79] via-[#47C4B7] to-[#C9EFE6] rounded-full animate-spin" style={{ animationDuration: "3s" }} />
        <div className="absolute inset-3 bg-white rounded-full flex items-center justify-center shadow-inner">
          <Sparkles className="text-[#0f8f79] animate-pulse" size={20} className="sm:w-[24px] sm:h-[24px]" />
        </div>
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-slate-900 text-center mb-1">Analyzing Document</h3>
      <p className="text-[10px] sm:text-[11px] text-slate-500 text-center mb-5 sm:mb-6">Cross-referencing entities and risk patterns.</p>
      <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden mb-5 sm:mb-6">
        <div className="h-full bg-gradient-to-r from-[#0f8f79] to-[#47C4B7] transition-all duration-700 ease-out" style={{ width: `${((scanStepIndex + 1) / SCAN_STEPS.length) * 100}%` }} />
      </div>
      <div className="space-y-1.5 sm:space-y-2">
        {SCAN_STEPS.map((stepText, idx) => {
          const isPast = idx < scanStepIndex;
          const isCurrent = idx === scanStepIndex;
          return (
            <div key={idx} className={`flex items-center gap-2.5 sm:gap-3 rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 transition-all duration-300 ${isCurrent ? "bg-[#F3FBF9] border border-[#7FE0CC]/40" : "bg-transparent border border-transparent"}`}>
              <div className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center shrink-0">
                {isPast ? <CheckCircle2 className="text-[#0f8f79]" size={14} className="sm:w-[16px] sm:h-[16px]" /> : isCurrent ? <Loader2 className="text-[#47C4B7] animate-spin" size={14} className="sm:w-[16px] sm:h-[16px]" /> : <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-slate-200" />}
              </div>
              <p className={`text-[9px] sm:text-[11px] truncate ${isCurrent ? "font-semibold text-[#0f8f79]" : isPast ? "font-medium text-slate-500" : "font-medium text-slate-400"}`}>{stepText}</p>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderSuccessState = () => (
    <div className="animate-in zoom-in-95 duration-500 text-center py-2 sm:py-4 max-w-sm mx-auto relative z-20">
      <div className="h-14 w-14 sm:h-16 sm:w-16 bg-[#D9FAF2] rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-5 shadow-sm border border-[#7FE0CC]/50 relative">
        <div className="absolute inset-0 bg-[#47C4B7] rounded-2xl animate-ping opacity-20" />
        <CheckCircle2 size={28} className="text-[#0f8f79] sm:w-[32px] sm:h-[32px]" strokeWidth={2.5} />
      </div>
      <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-1 sm:mb-2">Verified Successfully!</h3>
      <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 mb-6 sm:mb-8 px-2 sm:px-4">Your invoice passed all compliance checks and is now active.</p>
      {extractedData && (
        <div className="bg-slate-50 border border-slate-100 rounded-[1rem] p-3 sm:p-4 grid grid-cols-2 gap-3 sm:gap-4 text-left mx-auto mb-6 sm:mb-8 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">
          <div><p className="text-[8px] sm:text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Invoice No</p><p className="text-[11px] sm:text-xs font-semibold text-slate-800 truncate">{extractedData.invoiceNumber}</p></div>
          <div><p className="text-[8px] sm:text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Amount</p><p className="text-xs sm:text-sm font-bold text-[#0f8f79] truncate">₹ {extractedData.totalAmount?.toLocaleString("en-IN")}</p></div>
          <div><p className="text-[8px] sm:text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Buyer GSTIN</p><p className="text-[9px] sm:text-[11px] font-medium text-slate-600 font-mono bg-white px-1.5 py-0.5 rounded border border-slate-100 inline-block truncate max-w-full">{extractedData.buyerGst}</p></div>
          <div><p className="text-[8px] sm:text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Due Date</p><p className="text-[9px] sm:text-[11px] font-medium text-slate-600 truncate">{new Date(extractedData.dueDate).toLocaleDateString()}</p></div>
        </div>
      )}
      <button onClick={closeModal} className="w-full inline-flex items-center justify-center gap-2 py-2.5 sm:py-3 bg-slate-900 text-white text-[11px] sm:text-[12px] font-semibold rounded-xl hover:bg-slate-800 transition-all shadow-sm">
        Finish <ArrowRight size={14} />
      </button>
    </div>
  );

  const renderErrorState = () => (
    <div className="animate-in fade-in duration-500 text-center py-4 sm:py-6 max-w-sm mx-auto relative z-20">
      <div className="h-14 w-14 sm:h-16 sm:w-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-100 shadow-sm">
        <AlertCircle size={28} className="text-amber-500 sm:w-[32px] sm:h-[32px]" />
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1 sm:mb-2">Verification Failed</h3>
      <p className="text-[10px] sm:text-[11px] font-medium text-amber-700 mb-6 sm:mb-8 bg-amber-50/50 py-2 sm:py-3 px-3 sm:px-4 rounded-xl border border-amber-100/60 break-words">{errorMessage}</p>
      <div className="flex justify-center gap-2 sm:gap-3">
        <button onClick={() => setStatus("idle")} className="px-4 sm:px-6 py-2 sm:py-2.5 bg-white border border-slate-200 text-slate-700 text-[10px] sm:text-[11px] font-semibold rounded-xl hover:bg-slate-50 transition-all shadow-sm">Try Again</button>
        <button onClick={closeModal} className="px-4 sm:px-6 py-2 sm:py-2.5 bg-slate-100 text-slate-600 text-[10px] sm:text-[11px] font-semibold rounded-xl hover:bg-slate-200 transition-all">Cancel</button>
      </div>
    </div>
  );

  return (
    <div className="flex bg-[#F8FAFC] font-sans text-slate-800" style={{ height: '100dvh', overflow: 'hidden' }}>
      
      {/* Soft Background Glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#D9FAF2]/30 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <SellerNav
        activeKey={activeKey}
        onChange={handleNavClick}
        isKycComplete={isKycComplete}
        navigateToKyc={navigateToKyc}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Container - margin respects sidebar */}
      <div className={`flex-1 flex flex-col relative z-10 min-w-0 h-full transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] lg:ml-64`}>
        
        <header className="flex-none z-30">
          <SellerHeader onLogout={handleLogout} onToggleSidebar={() => setIsMobileOpen(true)} />
        </header>

        {/* Scrollable area wrapped cleanly */}
        <div className={`flex-1 overflow-y-auto overflow-x-hidden w-full custom-scrollbar transition-all duration-500 ${isModalOpen ? 'blur-xl scale-[0.98] opacity-30' : ''}`}>
          <main className="w-full px-4 sm:px-6 lg:px-8 pt-3 pb-8">
            <div className="w-full max-w-[1200px] mx-auto">

              {summaryError && (
                <div className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-[10px] sm:text-[11px] text-rose-700 mb-4">
                  {summaryError}
                </div>
              )}

              {/* Soft Header */}
              <div className="flex flex-row items-center justify-between gap-3 mb-6 sm:mb-8 w-full min-w-0">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#0f8f79] shadow-sm flex items-center justify-center text-white text-sm sm:text-base font-semibold shrink-0 ring-4 ring-white">
                    {firstName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-base sm:text-lg md:text-[22px] font-semibold text-slate-800 tracking-tight truncate">
                      Welcome, {firstName}
                    </h1>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">Here's your business overview today.</p>
                  </div>
                </div>
                
                <button 
                  onClick={openModal} 
                  className="px-3 py-2.5 sm:px-4 md:px-5 sm:py-2.5 bg-[#0f8f79] text-white text-[11px] md:text-[12px] font-semibold rounded-xl flex items-center gap-2 hover:bg-[#0c7865] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 active:scale-95 shadow-md shadow-[#0f8f79]/20 flex-shrink-0"
                >
                  <UploadCloud size={16} /> 
                  <span className="hidden sm:inline">Upload Invoice</span>
                </button>
              </div>

              {/* Action Required / KYC */}
              {!isKycComplete && (
                <div className="bg-white rounded-[1rem] p-3 sm:p-4 shadow-[0_2px_15px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 sm:mb-8 border border-amber-100">
                  <div className="flex items-center gap-3 pl-1">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                      <ShieldCheck size={16} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 text-[11px] sm:text-xs">KYC Required</h3>
                      <p className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5">Complete your financial and bank details to access invoices & financing.</p>
                    </div>
                  </div>
                  <button onClick={navigateToKyc} className="w-full sm:w-auto px-4 sm:px-5 py-2 bg-slate-800 text-white text-[10px] sm:text-[11px] font-medium rounded-lg hover:bg-slate-700 transition-all text-center shadow-sm hover:shadow-md hover:-translate-y-0.5">
                    Verify Now
                  </button>
                </div>
              )}

              {/* Responsive 2-Column Layout */}
              <div className="flex flex-col xl:flex-row gap-5 lg:gap-6">
                
                {/* LEFT COLUMN */}
                <div className="w-full xl:w-[55%] flex flex-col gap-5 lg:gap-6">
                  
                  {/* 🌟 4-Grid Analytics 🌟 */}
                  <div>
                    <h2 className="text-sm font-semibold text-slate-800 mb-3 sm:mb-4 px-1">Analytics</h2>
                    
                    <motion.div 
                      variants={containerVariants}
                      initial="hidden"
                      animate="show"
                      className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5"
                    >
                      <motion.div variants={cardVariants} className="bg-white rounded-[1.25rem] sm:rounded-[1.5rem] p-4 sm:p-5 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-50 flex flex-col items-center text-center hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(15,143,121,0.08)] transition-all duration-300 min-h-[160px] sm:min-h-[200px]">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-[14px] bg-[#0f8f79] text-white flex items-center justify-center mb-auto shadow-lg shadow-[#0f8f79]/20 transition-transform">
                          <Zap size={20} className="sm:w-[22px] sm:h-[22px] opacity-90"/>
                        </div>
                        <div className="mt-3 sm:mt-4 mb-2 sm:mb-3 w-full">
                          <p className="text-[10px] sm:text-[11px] md:text-[13px] font-semibold text-slate-400 mb-1 sm:mb-1.5">Disbursed</p>
                          <h3 className="text-lg sm:text-xl md:text-[28px] font-bold text-slate-800 tracking-tight leading-none truncate">{summary ? formatCurrencyCompact(summary.totalFinanced) : "₹0"}</h3>
                        </div>
                        <div className="text-[9px] sm:text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg border border-emerald-100/50 w-fit">
                          + 14.2%
                        </div>
                      </motion.div>

                      <motion.div variants={cardVariants} className="bg-white rounded-[1.25rem] sm:rounded-[1.5rem] p-4 sm:p-5 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-50 flex flex-col items-center text-center hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(71,196,183,0.08)] transition-all duration-300 min-h-[160px] sm:min-h-[200px]">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-[14px] bg-[#47C4B7] text-white flex items-center justify-center mb-auto shadow-lg shadow-[#47C4B7]/20 transition-transform">
                          <Wallet size={20} className="sm:w-[22px] sm:h-[22px]" />
                        </div>
                        <div className="mt-3 sm:mt-4 mb-2 sm:mb-3 w-full">
                          <p className="text-[10px] sm:text-[11px] md:text-[13px] font-semibold text-slate-400 mb-1 sm:mb-1.5">Credit Limit</p>
                          <h3 className="text-lg sm:text-xl md:text-[28px] font-bold text-slate-800 tracking-tight leading-none truncate">2.50Cr</h3>
                        </div>
                        <div className="text-[9px] sm:text-[10px] font-bold text-slate-500 bg-slate-50 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg border border-slate-100/50 w-fit">
                          Static
                        </div>
                      </motion.div>

                      <motion.div variants={cardVariants} className="bg-white rounded-[1.25rem] sm:rounded-[1.5rem] p-4 sm:p-5 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-50 flex flex-col items-center text-center hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(51,65,85,0.08)] transition-all duration-300 min-h-[160px] sm:min-h-[200px]">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-[14px] bg-slate-700 text-white flex items-center justify-center mb-auto shadow-lg shadow-slate-700/20 transition-transform">
                          <Gavel size={20} className="sm:w-[22px] sm:h-[22px]" />
                        </div>
                        <div className="mt-3 sm:mt-4 mb-2 sm:mb-3 w-full">
                          <p className="text-[10px] sm:text-[11px] md:text-[13px] font-semibold text-slate-400 mb-1 sm:mb-1.5">Reviewing</p>
                          <h3 className="text-lg sm:text-xl md:text-[28px] font-bold text-slate-800 tracking-tight leading-none truncate">{summary?.invoicesUnderReview || 0}</h3>
                        </div>
                        <div className="text-[9px] sm:text-[10px] font-bold text-amber-600 bg-amber-50 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg border border-amber-100/50 w-fit">
                          Pending
                        </div>
                      </motion.div>

                      <motion.div variants={cardVariants} className="bg-white rounded-[1.25rem] sm:rounded-[1.5rem] p-4 sm:p-5 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-50 flex flex-col items-center text-center hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(20,184,166,0.08)] transition-all duration-300 min-h-[160px] sm:min-h-[200px]">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-[14px] bg-[#14b8a6] text-white flex items-center justify-center mb-auto shadow-lg shadow-teal-500/20 transition-transform">
                          <Store size={20} className="sm:w-[22px] sm:h-[22px]" />
                        </div>
                        <div className="mt-3 sm:mt-4 mb-2 sm:mb-3 w-full">
                          <p className="text-[10px] sm:text-[11px] md:text-[13px] font-semibold text-slate-400 mb-1 sm:mb-1.5">Settlements</p>
                          <h3 className="text-lg sm:text-xl md:text-[28px] font-bold text-slate-800 tracking-tight leading-none truncate">{summary ? formatCurrencyCompact(summary.upcomingSettlementAmount) : "₹0"}</h3>
                        </div>
                        <div className="text-[9px] sm:text-[10px] font-bold text-rose-500 bg-rose-50 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg border border-rose-100/50 w-fit">
                          Due Soon
                        </div>
                      </motion.div>
                    </motion.div>
                  </div>

                  {/* Mixed Grid: Trust Card + Invoices */}
                  <div className="mt-1 sm:mt-2">
                    <div className="flex items-center justify-between mb-3 sm:mb-4 px-1">
                      <h2 className="text-sm font-semibold text-slate-800 tracking-tight">Trust & Recent Activity</h2>
                      <button onClick={() => navigate("/seller/invoices")} disabled={!isKycComplete} className="text-[10px] font-medium text-[#0f8f79] hover:underline disabled:opacity-50">
                        View all &rarr;
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-5">
                      {/* 1. GREEN TRUST CARD */}
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 24, delay: 0.1 }}
                        className="relative w-full h-[140px] sm:h-[150px] rounded-[1.25rem] sm:rounded-[1.5rem] bg-gradient-to-br from-[#064E3B] via-[#047857] to-[#022C22] p-4 sm:p-5 text-white shadow-sm overflow-hidden isolate flex flex-col justify-between group cursor-default border border-[#064E3B]/50 hover:shadow-[0_10px_30px_rgba(4,120,87,0.15)] transition-shadow"
                      >
                        <div className="absolute top-0 left-0 w-[150%] h-[150%] bg-gradient-to-br from-white/10 to-transparent -rotate-[30deg] -translate-y-[40%] translate-x-[-15%] pointer-events-none"></div>
                        
                        <div className="flex justify-between items-center z-10">
                          <span className="text-[9px] sm:text-[10px] font-medium tracking-widest text-emerald-100/80 uppercase truncate pr-2">PayNidhi Trust</span>
                          <Activity size={14} className="text-emerald-300 opacity-80 shrink-0 sm:w-[16px] sm:h-[16px]" />
                        </div>
                        
                        <div className="z-10">
                          <div className="flex items-baseline gap-1.5 sm:gap-2">
                            <span className="text-[24px] sm:text-[28px] font-mono font-semibold text-white tracking-widest drop-shadow-sm">
                              {animatedScore || summary?.trustScore || 850}
                            </span>
                            <span className="text-[10px] sm:text-[11px] font-mono text-emerald-300/80">/ 900</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-end z-10">
                          <div className="min-w-0 pr-2">
                            <p className="text-[8px] sm:text-[9px] text-emerald-200/60 uppercase tracking-widest mb-0.5 sm:mb-1">Cardholder</p>
                            <p className="text-[10px] sm:text-[11px] font-medium tracking-widest uppercase text-emerald-50 truncate">{user?.companyName || "Seller Profile"}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[8px] sm:text-[9px] text-emerald-200/60 uppercase tracking-widest mb-0.5 sm:mb-1">Status</p>
                            <p className="text-[10px] sm:text-[11px] font-medium tracking-widest uppercase text-emerald-300">Excellent</p>
                          </div>
                        </div>
                      </motion.div>

                      {/* 2. CASHFLOW CHART CARD */}
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 24, delay: 0.2 }}
                        className="bg-white rounded-[1.25rem] sm:rounded-[1.5rem] p-4 sm:p-5 shadow-[0_2px_15px_rgba(0,0,0,0.02)] border border-slate-50 flex flex-col min-w-0 h-[140px] sm:h-[150px]"
                      >
                        <div className="flex justify-between items-center mb-3 sm:mb-4">
                          <h4 className="text-[10px] sm:text-[11px] font-semibold text-slate-700 uppercase tracking-widest truncate">Cashflow</h4>
                          <span className="text-[8px] sm:text-[9px] bg-emerald-50 text-emerald-600 font-medium px-2 py-0.5 rounded shrink-0">Track</span>
                        </div>
                        <div className="flex-1 w-full min-w-0">
                           <ResponsiveContainer width="100%" height="100%">
                             <AreaChart data={areaChartData.slice(3)}>
                               <defs>
                                 <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                                   <stop offset="5%" stopColor="#0f8f79" stopOpacity={0.15} />
                                   <stop offset="95%" stopColor="#0f8f79" stopOpacity={0} />
                                 </linearGradient>
                               </defs>
                               <Area type="monotone" dataKey="value" stroke="#0f8f79" strokeWidth={1.5} fill="url(#colorYield)" />
                             </AreaChart>
                           </ResponsiveContainer>
                        </div>
                      </motion.div>

                      {/* 3, 4. RECENT INVOICE CARDS - Explicit Animation to fix invisible gap bug */}
                      {loadingInvoices ? (
                        <div className="h-[140px] sm:h-[150px] bg-white rounded-[1.25rem] sm:rounded-[1.5rem] shadow-sm animate-pulse"></div>
                      ) : invoices.length === 0 ? (
                         <motion.div 
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            transition={{ type: "spring", stiffness: 300, damping: 24 }}
                            className="h-[140px] sm:h-[150px] bg-white rounded-[1.25rem] sm:rounded-[1.5rem] p-4 sm:p-5 text-center shadow-sm border border-slate-50 flex flex-col items-center justify-center col-span-1 md:col-span-2"
                          >
                          <p className="text-[11px] sm:text-[12px] font-medium text-slate-500 mb-2 sm:mb-3">No invoices yet.</p>
                          <button onClick={openModal} disabled={!isKycComplete} className="px-4 sm:px-5 py-2 sm:py-2.5 bg-[#0f8f79] text-white text-[10px] sm:text-[11px] font-medium rounded-lg hover:bg-[#0c7865] transition-colors disabled:opacity-50">
                            Upload your first invoice
                          </button>
                        </motion.div>
                      ) : (
                        invoices.slice(0, 2).map((inv, index) => (
                          <motion.div 
                            key={inv._id} 
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            transition={{ type: "spring", stiffness: 300, damping: 24, delay: index * 0.1 }}
                            onClick={() => navigate("/seller/invoices")}
                            className="bg-white rounded-[1.25rem] sm:rounded-[1.5rem] p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-50 flex flex-col justify-between h-[140px] sm:h-[150px] hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all cursor-pointer group"
                          >
                            <div className="flex justify-between items-start">
                              <div className="pr-2 min-w-0">
                                <h4 className="font-semibold text-slate-800 text-xs sm:text-[14px] truncate tracking-tight">{inv.buyerName || "Direct Buyer"}</h4>
                                <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 sm:mt-1.5 truncate">Invoice #{inv.invoiceNumber}</p>
                              </div>
                              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-[10px] sm:rounded-[12px] bg-[#F3FBF9] flex items-center justify-center text-[#0f8f79] shrink-0 border border-[#0f8f79]/10 group-hover:scale-110 transition-transform">
                                <FileText size={16} className="sm:w-[18px] sm:h-[18px]"/>
                              </div>
                            </div>
                            
                            <div className="flex items-end justify-between mt-2">
                              <div className="min-w-0 pr-2">
                                <p className="text-lg sm:text-[20px] font-bold text-slate-800 leading-none tracking-tight truncate">{formatCurrencyCompact(inv.totalAmount)}</p>
                                <p className="text-[8px] sm:text-[9px] font-semibold text-slate-400 mt-1 sm:mt-1.5 uppercase tracking-widest truncate">Amount</p>
                              </div>
                              <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 text-[8px] sm:text-[9px] font-bold rounded-md uppercase shrink-0 ${inv.status === 'Verified' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                {inv.status}
                              </span>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="w-full xl:w-[45%] flex flex-col gap-5 lg:gap-6 mt-1 sm:mt-2 xl:mt-[42px]">
                  
                  {/* Funding Trajectory Chart */}
                  <div className="bg-white rounded-[1.25rem] sm:rounded-[1.5rem] p-4 sm:p-5 md:p-7 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-50 flex flex-col">
                    <div className="flex justify-between items-start mb-4 sm:mb-5 md:mb-6">
                      <div className="min-w-0 pr-2">
                        <h3 className="font-semibold text-slate-800 text-[13px] sm:text-sm tracking-tight truncate">Funding Trajectory</h3>
                        <p className="text-[9px] sm:text-[10px] font-medium text-slate-400 mt-0.5 sm:mt-1 truncate">Capital acquired</p>
                      </div>
                      <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-slate-50 border border-slate-100 rounded text-[9px] sm:text-[10px] font-medium text-slate-500 shrink-0">2026</span>
                    </div>

                    <div className="w-full h-[140px] sm:h-[160px] md:h-[180px] min-w-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={areaChartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorChart" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0f8f79" stopOpacity={0.15} />
                              <stop offset="95%" stopColor="#0f8f79" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 500 }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 500 }} tickFormatter={(val) => `${val / 1000}k`} />
                          <RechartsTooltip 
                            contentStyle={{ borderRadius: '8px', border: '1px solid #f1f5f9', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', fontSize: '11px', fontWeight: '500' }}
                            itemStyle={{ color: '#0f8f79' }}
                            formatter={(value) => [`₹${value.toLocaleString()}`, 'Funded']}
                          />
                          <Area type="monotone" dataKey="value" stroke="#0f8f79" strokeWidth={2} fillOpacity={1} fill="url(#colorChart)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* App-like Mini Stat Pills Grid */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-white rounded-[1rem] sm:rounded-[1.25rem] p-2.5 sm:p-3 md:p-4 flex items-center shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-slate-50">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[8px] sm:rounded-[10px] bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 shrink-0 mr-2.5 sm:mr-3">
                        <ShieldCheck size={14} className="sm:w-[14px] sm:h-[14px]"/>
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                         <span className="text-[8px] sm:text-[9px] font-medium text-slate-400 uppercase tracking-wide truncate mb-0.5">Verified</span>
                         <span className="font-semibold text-slate-800 text-xs sm:text-sm">{statusData.find(s => s.name === 'Verified')?.value || 16}</span>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-[1rem] sm:rounded-[1.25rem] p-2.5 sm:p-3 md:p-4 flex items-center shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-slate-50">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[8px] sm:rounded-[10px] bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shrink-0 mr-2.5 sm:mr-3">
                        <FileText size={14} className="sm:w-[14px] sm:h-[14px]"/>
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                         <span className="text-[8px] sm:text-[9px] font-medium text-slate-400 uppercase tracking-wide truncate mb-0.5">Pending</span>
                         <span className="font-semibold text-slate-800 text-xs sm:text-sm">{statusData.find(s => s.name === 'Pending')?.value || 5}</span>
                      </div>
                    </div>

                    <div className="bg-white rounded-[1rem] sm:rounded-[1.25rem] p-2.5 sm:p-3 md:p-4 flex items-center shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-slate-50">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[8px] sm:rounded-[10px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0 mr-2.5 sm:mr-3">
                        <Users size={14} className="sm:w-[14px] sm:h-[14px]"/>
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                         <span className="text-[8px] sm:text-[9px] font-medium text-slate-400 uppercase tracking-wide truncate mb-0.5">Buyers</span>
                         <span className="font-semibold text-slate-800 text-xs sm:text-sm">{summary?.totalBuyers || 5}</span>
                      </div>
                    </div>

                    <div className="bg-white rounded-[1rem] sm:rounded-[1.25rem] p-2.5 sm:p-3 md:p-4 flex items-center shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-slate-50">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[8px] sm:rounded-[10px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0 mr-2.5 sm:mr-3">
                        <Lock size={14} className="sm:w-[14px] sm:h-[14px]"/>
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                         <span className="text-[8px] sm:text-[9px] font-medium text-slate-400 uppercase tracking-wide truncate mb-0.5">Access</span>
                         <span className="font-semibold text-slate-800 text-xs sm:text-sm">40</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </main>

          {/* Wrapper for footer prevents overlap with mobile bottom nav */}
          <div className="flex-none z-20 pb-[80px] lg:pb-0">
            <SellerFooter />
          </div>

        </div>
      </div>

      {/* --- FLOATING UPLOAD MODAL/POPUP --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div
            className={`absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity duration-300 ease-out ${status === 'scanning' ? 'opacity-90 bg-slate-900/40' : 'opacity-100'}`}
            onClick={status === 'idle' ? closeModal : undefined}
          />

          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto scrollbar-hide bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100 flex flex-col animate-in zoom-in-95 fade-in slide-in-from-bottom-4 duration-300 ease-out">

            {status === "scanning" && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-0 left-0 w-[80%] h-[80%] bg-gradient-to-br from-[#0f8f79]/15 to-transparent blur-[60px] animate-corner-tl" />
                <div className="absolute top-0 right-0 w-[80%] h-[80%] bg-gradient-to-bl from-[#0f8f79]/15 to-transparent blur-[60px] animate-corner-tr" />
                <div className="absolute bottom-0 left-0 w-[80%] h-[80%] bg-gradient-to-tr from-[#0f8f79]/15 to-transparent blur-[60px] animate-corner-bl" />
                <div className="absolute bottom-0 right-0 w-[80%] h-[80%] bg-gradient-to-tl from-[#0f8f79]/15 to-transparent blur-[60px] animate-corner-br" />
              </div>
            )}

            {status !== "scanning" && (
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 sm:top-5 sm:right-5 z-50 w-7 h-7 sm:w-8 sm:h-8 bg-slate-50 text-slate-400 hover:bg-[#F3FBF9] hover:text-[#0f8f79] rounded-full flex items-center justify-center transition-all duration-200"
              >
                <X size={14} className="sm:w-[16px] sm:h-[16px]" strokeWidth={2.5} />
              </button>
            )}

            <div className="p-5 sm:p-10 relative overflow-hidden z-10 min-h-[300px] sm:min-h-[380px] flex items-center justify-center">
              {status === "idle" && renderIdleState()}
              {status === "scanning" && renderScanningState()}
              {status === "success" && renderSuccessState()}
              {status === "error" && renderErrorState()}
            </div>

            {status === "idle" && (
              <div className="bg-slate-50/80 border-t border-slate-100 p-4 sm:p-5 z-10 relative">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-around">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-white p-1.5 sm:p-2 rounded-[10px] sm:rounded-xl text-[#0f8f79] shadow-sm border border-slate-100"><ShieldCheck size={14} className="sm:w-[16px] sm:h-[16px]" /></div>
                    <div>
                      <h4 className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-slate-700">Encrypted</h4>
                      <p className="text-[8px] sm:text-[9px] font-medium text-slate-500">Secure TLS 1.3 transit</p>
                    </div>
                  </div>
                  <div className="hidden sm:block w-px bg-slate-200/60 h-8 self-center" />
                  <div className="flex items-center gap-2.5">
                    <div className="bg-white p-1.5 sm:p-2 rounded-[10px] sm:rounded-xl text-[#47C4B7] shadow-sm border border-slate-100"><Search size={14} className="sm:w-[16px] sm:h-[16px]" /></div>
                    <div>
                      <h4 className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-slate-700">Verified</h4>
                      <p className="text-[8px] sm:text-[9px] font-medium text-slate-500">Govt GSTIN handshake</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- GLOBAL CSS --- */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 0px; display: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        body { font-family: 'Inter', 'Poppins', sans-serif; }

        @keyframes corner-tl { 0%, 100% { transform: translate(-30%, -30%) scale(1); opacity: 0; } 50% { transform: translate(10%, 10%) scale(1.2); opacity: 0.8; } }
        @keyframes corner-tr { 0%, 100% { transform: translate(30%, -30%) scale(1); opacity: 0; } 50% { transform: translate(-10%, 10%) scale(1.2); opacity: 0.8; } }
        @keyframes corner-bl { 0%, 100% { transform: translate(-30%, 30%) scale(1); opacity: 0; } 50% { transform: translate(10%, -10%) scale(1.2); opacity: 0.8; } }
        @keyframes corner-br { 0%, 100% { transform: translate(30%, 30%) scale(1); opacity: 0; } 50% { transform: translate(-10%, -10%) scale(1.2); opacity: 0.8; } }
        
        .animate-corner-tl { animation: corner-tl 4s ease-in-out infinite; }
        .animate-corner-tr { animation: corner-tr 4s ease-in-out infinite; animation-delay: 1s; }
        .animate-corner-bl { animation: corner-bl 4s ease-in-out infinite; animation-delay: 0.5s; }
        .animate-corner-br { animation: corner-br 4s ease-in-out infinite; animation-delay: 1.5s; }
      `}} />
    </div>
  );
};

// --- Custom Formatters ---
const formatCurrencyCompact = (amount) => {
  if (amount == null) return "₹0";
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}k`;
  return `₹${amount}`;
};

export default SellerDashboard;