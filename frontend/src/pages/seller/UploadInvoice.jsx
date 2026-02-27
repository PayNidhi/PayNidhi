import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import {
  UploadCloud,
  FileText,
  X,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Search,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Plus,
  Layers,
  Trash2,
  Calendar,
  ExternalLink
} from "lucide-react";

import SellerNav from "../../components/seller/SellerNav";
import SellerHeader from "../../components/seller/SellerHeader";
import SellerFooter from "../../components/seller/SellerFooter";

const API_BASE_URL = "http://localhost:5001";

const SCAN_STEPS = [
  "Initializing AI Vision Engine...",
  "Extracting document structure & text...",
  "Validating GSTIN and PO numbers...",
  "Running compliance & fraud checks...",
  "Finalizing financial risk assessment...",
];

const UploadInvoice = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState("idle");
  const [scanStepIndex, setScanStepIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [extractedData, setExtractedData] = useState(null);
  
  // --- INVOICE LIST STATE ---
  const [invoices, setInvoices] = useState([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isKycComplete = Boolean(user?.isOnboarded && user?.kycStatus === "verified");

  // --- FETCH INVOICES ---
  const fetchInvoices = useCallback(async () => {
    try {
      setIsLoadingInvoices(true);
      const res = await fetch(`${API_BASE_URL}/api/seller/invoices`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setInvoices(data);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast.error("Failed to load invoice history.");
    } finally {
      setIsLoadingInvoices(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleLogout = () => logout();

  const navigateToKyc = useCallback(() => {
    navigate("/seller/kyc");
  }, [navigate]);

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

  useEffect(() => {
    let interval;
    if (status === "scanning") {
      interval = setInterval(() => {
        setScanStepIndex((prev) => {
          if (prev < SCAN_STEPS.length - 1) return prev + 1;
          clearInterval(interval);
          return prev;
        });
      }, 800);
    }
    return () => clearInterval(interval);
  }, [status]);

  // Handle Logic for Deleting
  const handleDeleteInvoice = async (id) => {
    if(!window.confirm("Are you sure you want to delete this invoice?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/invoice/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if(res.ok) {
        toast.success("Invoice deleted");
        fetchInvoices();
      }
    } catch (err) {
      toast.error("Failed to delete invoice");
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
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
  };

  const handleUpload = async () => {
    if (!file) return toast.error("Please select a file first.");
    setStatus("scanning");
    setScanStepIndex(0);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE_URL}/api/invoice/upload`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();
      await new Promise((resolve) => setTimeout(resolve, 4500));

      if (!res.ok) throw new Error(data.error || "Failed to process invoice.");

      setExtractedData(data.data);
      setStatus("success");
      toast.success("Invoice successfully verified!");
      fetchInvoices(); // Refresh the list
    } catch (error) {
      console.error("Upload failed:", error);
      await new Promise((resolve) => setTimeout(resolve, 4000));
      setErrorMessage(error.message);
      setStatus("error");
      return toast.error(error.message);
    }
  };

  // Handle Buyer Verification Request
const handleVerifyInvoice = async (invoiceId) => {
  const loadingToast = toast.loading("Initiating buyer verification...");
  try {
    const res = await fetch(`${API_BASE_URL}/api/invoice/verify-buyer?invoiceId=${invoiceId}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        // "Authorization": "Bearer "+ 
      },
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Verification request failed.");

    toast.success("Verification request sent to buyer!", { id: loadingToast });
    fetchInvoices(); // Refresh the list to reflect any status changes
  } catch (error) {
    console.error("Verification Error:", error);
    toast.error(error.message, { id: loadingToast });
  }
};

  // -------------------------------------------------------------
  // RENDER HELPERS (States remain same as your original)
  // -------------------------------------------------------------
  const renderIdleState = () => (
    <div className="animate-in fade-in duration-500 w-full max-w-md mx-auto text-center relative z-10">
      {!file ? (
        <div 
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} 
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }} 
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) validateAndSetFile(e.dataTransfer.files[0]); }}
          className={`group w-full border-2 border-dashed rounded-[1.5rem] p-10 flex flex-col items-center transition-all duration-300 ease-out ${
            isDragging ? 'border-[#47C4B7] bg-[#D9FAF2]/60' : 'border-slate-200/80 bg-slate-50/50 hover:border-[#7FE0CC]/80'
          }`}
        >
          <div className="w-16 h-16 bg-white text-[#0f8f79] rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm border border-slate-100">
            <UploadCloud size={30} />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-1.5">Drop Document</h2>
          <p className="text-[11px] text-slate-500 font-medium mb-6">PDF files only. Max 5MB.</p>
          <label className="cursor-pointer inline-flex items-center justify-center px-6 py-2.5 bg-[#C9EFE6] text-[#0f8f79] rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-[#47C4B7] hover:text-white transition-all">
            Browse Files
            <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={handleFileChange} />
          </label>
        </div>
      ) : (
        <div className="animate-in zoom-in-95 duration-400">
           <div className="w-20 h-20 bg-[#D9FAF2] rounded-[1.5rem] flex items-center justify-center mx-auto mb-5 text-[#0f8f79] relative border border-[#7FE0CC]/30">
            <FileText size={32} />
            <button onClick={() => setFile(null)} className="absolute -top-2 -right-2 bg-white border border-slate-200 p-1.5 rounded-full text-slate-400 hover:text-rose-500 shadow-sm">
              <X size={14} />
            </button>
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-1 truncate px-4">{file.name}</h3>
          <button 
            onClick={handleUpload} 
            className="w-full mt-6 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-[#47C4B7] to-[#0f8f79] text-white rounded-xl font-semibold text-[13px] shadow-lg hover:-translate-y-[1px] transition-all"
          >
            <Sparkles size={16} /> Start AI Scan
          </button>
        </div>
      )}
    </div>
  );

  const renderScanningState = () => (
    <div className="py-6 flex flex-col animate-in fade-in duration-500 max-w-md mx-auto">
      <div className="relative w-20 h-20 mx-auto mb-8">
        <div className="absolute inset-0 bg-[#0f8f79] rounded-full blur-xl animate-pulse opacity-20" />
        <div className="absolute inset-0 border-4 border-[#0f8f79]/20 rounded-full" />
        <div className="absolute inset-0 border-4 border-[#0f8f79] rounded-full border-t-transparent animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="text-[#0f8f79]" size={24} />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-slate-900 text-center mb-1">Analyzing Document</h3>
      <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden my-6">
        <div className="h-full bg-[#0f8f79] transition-all duration-700" style={{ width: `${((scanStepIndex + 1) / SCAN_STEPS.length) * 100}%` }} />
      </div>
      <div className="space-y-2">
        {SCAN_STEPS.map((step, idx) => (
          <div key={idx} className={`flex items-center gap-3 px-3 py-2 rounded-xl ${idx === scanStepIndex ? "bg-[#F3FBF9]" : ""}`}>
            {idx < scanStepIndex ? <CheckCircle2 size={16} className="text-[#0f8f79]" /> : <Loader2 size={16} className={`text-slate-300 ${idx === scanStepIndex ? "animate-spin text-[#0f8f79]" : ""}`} />}
            <span className={`text-[11px] ${idx === scanStepIndex ? "text-[#0f8f79] font-bold" : "text-slate-400"}`}>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSuccessState = () => (
    <div className="text-center py-4 animate-in zoom-in-95">
      <div className="h-16 w-16 bg-[#D9FAF2] rounded-2xl flex items-center justify-center mx-auto mb-5 text-[#0f8f79]">
        <CheckCircle2 size={32} />
      </div>
      <h3 className="text-xl font-semibold text-slate-900 mb-2">Verified!</h3>
      {extractedData && (
        <div className="bg-slate-50 rounded-xl p-4 text-left mb-6 border border-slate-100">
          <div className="flex justify-between mb-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Invoice</span>
            <span className="text-[11px] font-bold text-slate-800">{extractedData.invoiceNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Amount</span>
            <span className="text-[13px] font-bold text-[#0f8f79]">₹{extractedData.totalAmount?.toLocaleString()}</span>
          </div>
        </div>
      )}
      <button onClick={closeModal} className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-bold">Done</button>
    </div>
  );

  return (
    <div className="flex flex-col h-[100dvh] bg-[#F8FAFC] overflow-hidden">
      <SellerNav activeKey="invoices" isKycComplete={isKycComplete} navigateToKyc={navigateToKyc} isMobileOpen={isMobileOpen} onCloseMobile={() => setIsMobileOpen(false)} />

      <div className="flex-1 flex flex-col lg:ml-64 h-[100dvh]">
        <SellerHeader onLogout={handleLogout} onToggleSidebar={() => setIsMobileOpen((prev) => !prev)} />

        <main className={`flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-6 transition-all duration-700 ${status === 'scanning' ? 'blur-xl' : ''}`}>
          <div className="w-full max-w-6xl mx-auto flex flex-col gap-6">
            
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Invoices</h1>
              <p className="text-[12px] font-medium text-slate-500 mt-1">Manage documents and view financing statuses.</p>
            </div>

            <div className="w-full bg-white rounded-[1.5rem] border border-slate-200/60 shadow-sm p-5 flex flex-col sm:flex-row items-center justify-between gap-5 transition-all hover:shadow-md">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="h-12 w-12 bg-[#F3FBF9] text-[#0f8f79] rounded-2xl flex items-center justify-center border border-[#7FE0CC]/30">
                   <FileText size={22} strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Upload New Invoice</h2>
                  <p className="text-[11px] font-medium text-slate-500 mt-0.5">AI-powered verification for instant financing.</p>
                </div>
              </div>
              <button onClick={openModal} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#0f8f79] to-[#0d7a68] text-white rounded-xl font-medium text-[12px] shadow-md hover:-translate-y-1 transition-all">
                <Plus size={14} /> Upload Invoice
              </button>
            </div>

            {/* --- INVOICE HISTORY TABLE --- */}
            <div className="w-full bg-white rounded-[1.5rem] border border-slate-200/60 shadow-sm min-h-[500px] flex flex-col overflow-hidden">
               <div className="border-b border-slate-100 p-4 sm:px-6 flex items-center justify-between bg-slate-50/30">
                  <h3 className="text-[13px] font-bold text-slate-800">Invoice History</h3>
                  <span className="text-[10px] bg-[#E2F5F1] text-[#0f8f79] px-2 py-1 rounded-md font-bold uppercase tracking-wider">
                    {invoices.length} Total
                  </span>
               </div>
               
               <div className="flex-1 overflow-x-auto">
                {isLoadingInvoices ? (
                  <div className="flex flex-col items-center justify-center h-64 gap-3">
                    <Loader2 className="animate-spin text-[#0f8f79]" size={32} />
                    <p className="text-xs font-medium text-slate-400">Loading your invoices...</p>
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-20">
                     <Layers size={48} className="text-slate-200 mb-4" strokeWidth={1} />
                     <h4 className="text-[13px] font-semibold text-slate-600">No invoices yet</h4>
                     <p className="text-[11px] font-medium text-slate-400 mt-1">Upload your first invoice to see it here.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Document</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {invoices.map((inv) => (
                        <tr key={inv._id} className="hover:bg-[#F3FBF9]/40 transition-colors group">
                          {/* LEFTMOST ICON & INV NUMBER */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center border border-slate-100 group-hover:bg-[#D9FAF2] group-hover:text-[#0f8f79] transition-all">
                                <FileText size={18} />
                              </div>
                              <div>
                                <p className="text-[12px] font-bold text-slate-800">{inv.invoiceNumber}</p>
                                <p className="text-[10px] font-semibold text-[#0f8f79]">₹{inv.totalAmount?.toLocaleString()}</p>
                              </div>
                            </div>
                          </td>

                          {/* DATE */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-slate-500">
                              <Calendar size={13} className="text-slate-300" />
                              <span className="text-[11px] font-medium">{new Date(inv.invoiceDate).toLocaleDateString('en-GB')}</span>
                            </div>
                          </td>

                          {/* STATUS */}
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                              inv.status === 'Verified' 
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                : 'bg-amber-50 text-amber-600 border-amber-100'
                            }`}>
                              <span className={`w-1 h-1 rounded-full ${inv.status === 'Verified' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                              {inv.status}
                            </span>
                          </td>

                          {/* DESCRIPTION */}
                          <td className="px-6 py-4">
                            <p className="text-[11px] text-slate-500 font-medium max-w-[200px] truncate" title={inv.description}>
                              {inv.description || "No description provided."}
                            </p>
                          </td>

                          {/* ACTIONS */}
                          <td className="px-6 py-4 text-right">
  <div className="flex items-center justify-end gap-3">
    {/* VERIFY BUTTON */}
    <button 
      onClick={() => handleVerifyInvoice(inv._id)}
      disabled={inv.status === 'Verified'}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all
        ${inv.status === 'Verified' 
          ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
          : 'bg-[#F3FBF9] text-[#0f8f79] hover:bg-[#0f8f79] hover:text-white border border-[#0f8f79]/20 shadow-sm'
        }`}
      title="Request Buyer Verification"
    >
      <ShieldCheck size={14} />
      {inv.status === 'Verified' ? 'Verified' : 'Verify'}
    </button>

    {/* DELETE BUTTON */}
    <button 
      onClick={() => handleDeleteInvoice(inv._id)}
      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all border border-transparent hover:border-rose-100"
      title="Delete Invoice"
    >
      <Trash2 size={16} />
    </button>
  </div>
</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
               </div>
            </div>

          </div>
        </main>
        <div className="flex-none hidden lg:block"><SellerFooter /></div>
      </div>

      {/* MODAL (Render States Remain the same as provided earlier) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className={`absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-all ${status === 'scanning' ? 'opacity-90' : 'opacity-100'}`} onClick={status === 'idle' ? closeModal : undefined} />
          <div className="relative w-full max-w-xl bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95">
            {status !== "scanning" && (
              <button onClick={closeModal} className="absolute top-5 right-5 z-50 w-8 h-8 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-full flex items-center justify-center transition-all">
                <X size={16} />
              </button>
            )}
            <div className="p-10 min-h-[380px] flex items-center justify-center">
              {status === "idle" && renderIdleState()}
              {status === "scanning" && renderScanningState()}
              {status === "success" && renderSuccessState()}
              {/* {status === "error" && renderErrorState()} */}
              {/* {status === "error" && renderIdleState()} */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadInvoice;