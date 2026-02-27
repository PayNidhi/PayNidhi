import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
// Add Upload to your existing lucide-react import
import { 
  FileText, X, Building2, Calendar, IndianRupee, Gavel, 
  ArrowRight, Loader2, CheckCircle2, XCircle, ShieldCheck, Plus, FileSignature, Info, Upload
} from "lucide-react";

// Add this import for the PDF generator
import { useReactToPrint } from "react-to-print";
import { useRef } from "react"; // Ensure useRef is imported from "react"

import SellerNav from "../../components/seller/SellerNav"; 
import SellerHeader from "../../components/seller/SellerHeader";
import SellerFooter from "../../components/seller/SellerFooter"; 
import { useAuth } from "../../context/AuthContext";



const API_BASE_URL = "http://localhost:5001";

// --- 📄 MINI COMPONENT FOR HIDDEN PDF GENERATION ---
// --- 📄 MINI COMPONENT FOR HIDDEN PDF GENERATION ---
const GenerateNoaAction = ({ invoice, seller }) => {
  // 1. Rename to contentRef to match the new Version 3 API
  const contentRef = useRef(null);
  
  // 2. Pass the ref directly into the options
  const handlePrint = useReactToPrint({
    contentRef: contentRef,
    documentTitle: `NOA_Invoice_${invoice?.invoiceNumber}`,
  });

  return (
    <>
      <button 
        onClick={(e) => { 
          e.preventDefault(); 
          e.stopPropagation(); 
          handlePrint(); 
        }}
        className="h-9 px-4 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all w-full justify-center shadow-sm"
      >
        <FileSignature size={14} /> Generate NOA
      </button>

      {/* 3. The Fix: Push it off-screen instead of display:none, so the browser actually renders it! */}
      <div className="absolute overflow-hidden h-0 w-0 left-[-9999px]">
        
        {/* The target ref is placed exactly here */}
        <div ref={contentRef} className="p-10 font-serif text-black bg-white" style={{ width: "210mm", minHeight: "297mm" }}>
          
          <div className="border-b-2 border-black pb-4 mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">NOTICE OF ASSIGNMENT</h1>
              <p className="text-sm text-gray-500 mt-1">Under Factoring Regulation Act, 2011</p>
            </div>
            <h2 className="text-2xl font-bold">PayNidhi Escrow</h2>
          </div>
          
          <p className="mb-6 text-lg"><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
          <p className="mb-2 text-lg"><strong>To:</strong> Accounts Payable, <strong>{invoice?.buyerName || "Buyer"}</strong></p>
          
          <p className="mb-6 text-lg leading-relaxed mt-6">
            This letter serves as formal notice that <strong>{seller?.companyName || "Seller"}</strong> has legally assigned the payment rights for 
            Invoice Number <strong>{invoice?.invoiceNumber || "N/A"}</strong> in the amount of <strong>₹{invoice?.totalAmount || 0}</strong> to PayNidhi Escrow Services.
          </p>
          
          <p className="mb-6 text-lg leading-relaxed font-bold text-red-700">
            ACTION REQUIRED: Please redirect the payment for this invoice ONLY to the following Escrow Bank Account:
          </p>
          
          <div className="border-2 border-black p-6 mb-12">
            <p className="text-lg"><strong>Account Name:</strong> PayNidhi Nodal Escrow Account</p>
            <p className="text-lg"><strong>Account Number:</strong> 222333444555</p>
            <p className="text-lg"><strong>IFSC Code:</strong> HDFC0001234</p>
          </div>
          
          <div className="flex justify-between mt-20">
            <div className="text-center">
              <p>___________________________</p>
              <p className="font-bold mt-2">{seller?.companyName || "Authorized Signatory"}</p>
            </div>
            <div className="text-center">
              <p>___________________________</p>
              <p className="font-bold mt-2">{invoice?.buyerName || "Buyer Signatory"}</p>
            </div>
          </div>
        
        </div>
      </div>
    </>
  );
};

/**
 * SafePdfViewer Component
 * Secure iframe viewer to strictly prevent auto-downloads.
 */
const SafePdfViewer = ({ filePath, isThumbnail }) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!filePath) return;
    let isMounted = true;

    const fetchPdf = async () => {
      try {
        setError(false);
        const normalizedPath = filePath.replace(/\\/g, "/");
        const response = await fetch(`${API_BASE_URL}/${normalizedPath}`);
        
        if (!response.ok) throw new Error("File not found");
        
        const blob = await response.blob();
        const pdfBlob = new Blob([blob], { type: "application/pdf" });
        const objectUrl = URL.createObjectURL(pdfBlob);
        
        if (isMounted) setPdfUrl(objectUrl);
      } catch (err) {
        console.error("PDF Load Error:", err);
        if (isMounted) setError(true);
      }
    };

    fetchPdf();

    return () => {
      isMounted = false;
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [filePath]);

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-slate-50 text-slate-300">
        <FileText size={isThumbnail ? 20 : 40} />
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-slate-50">
        <Loader2 size={isThumbnail ? 16 : 24} className="text-[#0f8f79] animate-spin" />
      </div>
    );
  }

  if (isThumbnail) {
    return (
      <div className="relative w-full h-full overflow-hidden bg-white">
        <div style={{ width: '400%', height: '400%', transform: 'scale(0.25)', transformOrigin: 'top left' }}>
          <iframe 
            src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} 
            className="w-full h-full border-none pointer-events-none" 
            title="Thumbnail"
          />
        </div>
        <div className="absolute inset-0 z-10 bg-transparent" />
      </div>
    );
  }

  return (
    <iframe src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} className="w-full h-full border-none" title="Document" />
  );
};

const SellerInvoices = () => {

  const [uploadingNoaId, setUploadingNoaId] = useState(null);

  // 5. Upload NOA Document Function
  const handleUploadNOA = async (invoiceId, file) => {
    if (!file) return;
    setUploadingNoaId(invoiceId);
    const toastId = toast.loading("Uploading signed NOA...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Replace this body with your actual file upload logic (FormData or Base64)
      const res = await fetch(`${API_BASE_URL}/api/seller/invoice/${invoiceId}/upload-noa`, {
        method: "POST",
        // headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: formData, 
      });

      console.log(res);
      if (!res.ok) throw new Error("Failed to upload document");
      toast.success("NOA uploaded! Sent to Admin for review.", { id: toastId });
      fetchMyInvoices(); // Refresh the list
    } catch (err) {
      toast.error(err.message, { id: toastId });
    } finally {
      setUploadingNoaId(null);
    }
  };

  const [activeKey, setActiveKey] = useState("invoice");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal & Bids State
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [activeBids, setActiveBids] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingBids, setLoadingBids] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [popupTab, setPopupTab] = useState("bids"); 
  
  const [expandedBidId, setExpandedBidId] = useState(null);

  const isKycComplete = useMemo(() => 
    Boolean(user?.isOnboarded && user?.kycStatus === "verified"), 
  [user]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", { 
      style: "currency", currency: "INR", maximumFractionDigits: 0 
    }).format(amount);
  };

  // 1. Fetch Invoices
  const fetchMyInvoices = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/seller/invoices`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch invoices");
      const data = await res.json();
      setInvoices(data);
    } catch (err) {
      toast.error("Could not load your invoices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyInvoices();
  }, []);

  // 2. Send Verification Request to Buyer
  const handleVerifyBuyer = async (invoiceId) => {
    const toastId = toast.loading("Sending verification request...");
    try {
      const res = await fetch(`${API_BASE_URL}/api/invoice/verify-buyer?invoiceId=${invoiceId}`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send request.");
      toast.success("Verification link sent to buyer!", { id: toastId });
      fetchMyInvoices(); 
    } catch (error) {
      toast.error(error.message, { id: toastId });
    }
  };

  // 3. Open Modal & Fetch Bids for selected invoice
  const openInvoiceModal = async (invoice) => {
    setSelectedInvoice(invoice);
    setPopupTab("bids"); 
    setExpandedBidId(null); 
    setIsModalOpen(true);
    setLoadingBids(true);
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/seller/invoice/${invoice._id}/bids`, { credentials: "include" });
      const responseData = await res.json();
      if (responseData.success) {
        setActiveBids(responseData.data.bids);
      } else {
        throw new Error(responseData.error);
      }
    } catch (err) {
      toast.error("Failed to load bids for this invoice.");
      setActiveBids([]);
    } finally {
      setLoadingBids(false);
    }
  };

  const closeInvoiceModal = () => {
    setIsModalOpen(false);
    setSelectedInvoice(null);
    setActiveBids([]);
    setPopupTab("bids");
    setExpandedBidId(null); 
  };

  // 4. Accept/Reject Bid
  const handleBidAction = async (bidId, action) => {
    setProcessingId(bidId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/seller/bid-response/${bidId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: action }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${action.toLowerCase()} bid`);

      if (action === "Accepted") {
        toast.success("Offer Accepted! Invoice is now financed.");
        closeInvoiceModal();
        fetchMyInvoices(); 
      } else {
        toast.success("Offer Rejected.");
        setActiveBids(prev => prev.filter(b => b._id !== bidId)); 
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const toggleBidExpansion = (bidId) => {
    setExpandedBidId(prev => prev === bidId ? null : bidId);
  };

  return (
    <div className="flex bg-[#F8FAFC] h-screen overflow-hidden font-sans text-slate-600 antialiased">
      
      <div className="z-40">
        <SellerNav 
          activeKey={activeKey} 
          onChange={setActiveKey} 
          isKycComplete={isKycComplete} 
          isMobileOpen={isMobileOpen} 
          onCloseMobile={() => setIsMobileOpen(false)} 
          onHoverChange={setIsSidebarHovered} 
        />
      </div>

      <div className={`flex-1 flex flex-col relative min-w-0 h-full transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] lg:ml-64`}>
        
        <header className="flex-none z-30">
          <SellerHeader onLogout={logout} onToggleSidebar={() => setIsMobileOpen(true)} />
        </header>

        <main className="flex-1 overflow-y-auto px-6 sm:px-10 py-8 custom-scrollbar">
          <div className="max-w-5xl mx-auto">
            
            {/* Minimalist Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 border-b border-slate-200/60 pb-5 gap-4">
              <div>
                <h1 className="text-xl font-medium text-slate-800 tracking-tight">Invoice Portfolio</h1>
                <p className="text-slate-400 text-sm font-light mt-1">Manage your uploaded assets and review funding offers.</p>
              </div>
            </div>

            {/* List Section */}
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-50 rounded-2xl animate-pulse border border-slate-100" />)}
              </div>
            ) : invoices.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-200 rounded-[2rem] p-16 text-center shadow-sm">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <FileText className="text-slate-400" size={32} strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-medium text-slate-800">No Invoices Found</h3>
                <p className="text-slate-400 mt-1 text-xs">Upload your first invoice to attract lenders.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <div 
                    key={invoice._id} 
                    className="bg-white border border-slate-200/60 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md hover:border-slate-300 transition-all duration-300"
                  >
                    
                    <div className="flex items-center gap-5 w-full md:w-auto">
                      {/* Small PDF Thumbnail */}
                      <div className="w-12 h-16 bg-slate-50 relative overflow-hidden border border-slate-100 shrink-0 hidden sm:block">
                        <SafePdfViewer filePath={invoice.fileUrl} isThumbnail={true} />
                      </div>

                      {/* Data Section */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            {invoice.invoiceNumber}
                          </span>
                          {invoice.status === "Financed" ? (
                            <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                              Financed
                            </span>
                          ) : invoice.status === "Verified" ? (
                            <span className="flex items-center gap-1 text-[9px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                              Active in Market
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[9px] font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                              {invoice.status.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-medium text-slate-800 truncate">Buyer: {invoice.buyerName}</h3>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                           <span><Calendar size={12} className="inline mr-1"/>{new Date(invoice.dueDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
                      <div className="text-left md:text-right px-2 md:border-r md:border-slate-100 md:pr-6">
                        <p className="text-sm font-bold text-slate-900 tracking-tight">{formatCurrency(invoice.totalAmount)}</p>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Amount</p>
                      </div>
                      
                      {/* Action Button Based on Status */}
                      {/* Action Button Based on Status */}
                      <div className="w-36 flex flex-col justify-end gap-2">
                        
                        {/* --- THE NEW NOA STATE BUTTONS --- */}
                        {invoice.status === "Pending_NOA" ? (
                          <>
                            <GenerateNoaAction invoice={invoice} seller={user} />
                            
                            <label className="cursor-pointer h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all w-full justify-center shadow-sm">
                              {uploadingNoaId === invoice._id ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                              {uploadingNoaId === invoice._id ? "Uploading..." : "Upload NOA"}
                              <input 
                                type="file" 
                                accept=".pdf, image/*" 
                                className="hidden" 
                                disabled={uploadingNoaId === invoice._id}
                                onChange={(e) => handleUploadNOA(invoice._id, e.target.files[0])} 
                              />
                            </label>
                          </>
                        ) : invoice.status === "NOA_Under_Review" ? (
                          <div className="h-9 px-4 bg-blue-50 border border-blue-200 text-blue-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 w-full justify-center shadow-sm">
                            <Loader2 size={14} className="animate-spin" /> In Review
                          </div>

                        /* --- YOUR EXISTING BUTTONS --- */
                        ) : invoice.status === "Pending_Buyer_Approval" ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleVerifyBuyer(invoice._id); }}
                            className="h-9 px-4 bg-white border border-amber-200 text-amber-600 hover:bg-amber-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all w-full justify-center shadow-sm"
                          >
                            <ShieldCheck size={14} /> Verify Buyer
                          </button>
                        ) : invoice.status === "Financed" ? (
                          <button 
                            onClick={() => openInvoiceModal(invoice)}
                            className="h-9 px-4 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 w-full justify-center border border-emerald-100"
                          >
                            <CheckCircle2 size={14} /> View Deal
                          </button>
                        ) : (
                          <button 
                            onClick={() => openInvoiceModal(invoice)}
                            className="h-9 px-4 bg-white border border-emerald-200 text-black hover:bg-gradient-to-r from-[#0f8f79] to-[#0d7a68] hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all w-full justify-center shadow-sm"
                          >
                            <Gavel size={14} /> {invoice.bidCount || 0} Offers
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
        
        {/* FOOTER */}
        <div className="flex-none hidden lg:block z-20">
          <SellerFooter />
        </div>
      </div>

      {/* --- INVOICE & BIDS MODAL --- */}
      <AnimatePresence>
        {isModalOpen && selectedInvoice && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" 
              onClick={closeInvoiceModal} 
            />
            
            <motion.div 
              initial={{ scale: 0.96, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-[900px] h-[85vh] overflow-hidden relative z-10 flex flex-col md:flex-row border border-slate-200"
            >
              
              {/* Left Side: Document Preview (Only on desktop) */}
              <div className="hidden md:flex flex-col w-[45%] bg-slate-100/50 border-r border-slate-200 relative">
                <div className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
                   <FileSignature size={14} className="text-slate-500" />
                   <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Document</span>
                </div>
                <div className="flex-1 w-full h-full pt-[52px]">
                  <SafePdfViewer filePath={selectedInvoice.fileUrl} isThumbnail={false} />
                </div>
              </div>

              {/* Right Side: Invoice Info & Bids List */}
              <div className="flex-1 flex flex-col bg-white overflow-hidden">
                
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-start shrink-0 bg-slate-50/50">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Invoice {selectedInvoice.invoiceNumber}</p>
                    <h2 className="text-lg font-semibold text-slate-900 tracking-tight leading-none mb-1">Review Offers</h2>
                  </div>
                  <button onClick={closeInvoiceModal} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors">
                    <X size={18} />
                  </button>
                </div>

                {/* Summary Metrics */}
                <div className="px-6 py-4 grid grid-cols-2 gap-4 border-b border-slate-100 shrink-0">
                  <div>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-0.5">Asset Value</p>
                    <p className="text-xl font-bold text-slate-900">{formatCurrency(selectedInvoice.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-0.5">Current Status</p>
                    <p className={`text-sm font-semibold mt-1 ${selectedInvoice.status === 'Financed' ? 'text-emerald-600' : 'text-blue-600'}`}>
                      {selectedInvoice.status.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>

                {/* Bids List Section */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50/30">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <Gavel size={14} className="text-indigo-500" /> 
                      Institutional Bids
                    </h3>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      Total: {activeBids.length}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {loadingBids ? (
                      <div className="flex flex-col justify-center items-center py-12">
                        <Loader2 size={24} className="animate-spin text-slate-300 mb-2" />
                        <p className="text-xs text-slate-400">Loading secure offers...</p>
                      </div>
                    ) : activeBids.length === 0 ? (
                      <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
                        <p className="text-sm font-medium text-slate-600">No lenders have placed a bid yet.</p>
                        <p className="text-[11px] text-slate-400 mt-1">Please check back later.</p>
                      </div>
                    ) : (
                      activeBids.map((bid) => (
                        <div key={bid._id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all relative overflow-hidden group">
                          
                          {/* Accent line for accepted bids */}
                          {bid.status === "Accepted" && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500" />}
                          
                          <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
                            

                            {/* Offer Details Grid */}
                            <div className="flex items-center gap-4 bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-100 shrink-0">
                              <div>
                                <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Financial Partner</p>
                                <button 
                                  onClick={() => toggleBidExpansion(bid._id)}
                                  className="text-slate-50 hover:text-slate-50 bg-slate-800 hover:bg-emerald-600 p-1 rounded-md transition-colors flex items-center gap-1"
                                  title="View Lender Details"
                                >
                                  <Info size={13} />
                                  <span className="text-[9px] font-bold uppercase tracking-wider">{expandedBidId === bid._id ? 'Hide' : 'Info'}</span>
                                </button>
                              </div>
                              <div>
                                <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Offer Amount</p>
                                <p className="text-sm font-bold text-slate-900">{formatCurrency(bid.loanAmount)}</p>
                              </div>
                              <div className="w-px h-6 bg-slate-200" />
                              <div>
                                <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Monthly Rate</p>
                                <p className="text-sm font-bold text-indigo-600">{bid.interestRate}%</p>
                              </div>
                            </div>

                            {/* Accept / Reject Buttons */}
                            <div className="flex flex-col gap-2 shrink-0 lg:w-28 mt-1 xl:mt-0">
                              {selectedInvoice.status === "Financed" ? (
                                bid.status === "Accepted" ? (
                                  <div className="w-full py-2 bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center gap-1.5 border border-emerald-100 text-[10px] font-bold">
                                    <ShieldCheck size={14} /> Deal Won
                                  </div>
                                ) : (
                                  <div className="w-full py-2 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center text-[10px] font-bold border border-slate-100">
                                    Closed
                                  </div>
                                )
                              ) : (
                                <>
                                  <button 
                                    disabled={processingId !== null}
                                    onClick={() => handleBidAction(bid._id, "Accepted")}
                                    className="w-full py-2 bg-slate-900 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-semibold transition-colors flex justify-center items-center gap-1.5 disabled:opacity-50 shadow-sm"
                                  >
                                    {processingId === bid._id ? <Loader2 size={12} className="animate-spin"/> : <CheckCircle2 size={12}/>}
                                    Accept
                                  </button>
                                  <button 
                                    disabled={processingId !== null}
                                    onClick={() => handleBidAction(bid._id, "Rejected")}
                                    className="w-full py-2 bg-white border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-lg text-[10px] font-semibold transition-colors flex justify-center items-center gap-1.5 disabled:opacity-50"
                                  >
                                    <XCircle size={12}/> Reject
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* ✅ EXPANDABLE LENDER PROFILE SECTION */}
                          <AnimatePresence>
                            {expandedBidId === bid._id && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="pt-4 pb-1 border-t border-slate-100 mt-4">
                                  <h5 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-3">Verified Lender Profile</h5>
                                  <div className="grid grid-cols-2 gap-3">
                                    
                                    {/* 1. Entity Type */}
                                    <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50">
                                      <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest mb-1">Entity Type</p>
                                      <p className="text-xs font-semibold text-indigo-900">{bid.lender?.lenderType || "Institutional Investor"}</p>
                                    </div>
                                    
                                    {/* 2. Platform Status */}
                                    <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50 flex items-center gap-3">
                                      <ShieldCheck size={20} className="text-emerald-500 shrink-0" />
                                      <div className="min-w-0">
                                        <p className="text-[9px] text-emerald-600/70 font-bold uppercase tracking-widest mb-0.5 truncate">Platform Status</p>
                                        <p className="text-xs font-semibold text-emerald-700 truncate">KYC Verified</p>
                                      </div>
                                    </div>
                                    
                                    {/* 3. Regulatory License */}
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">Regulator License</p>
                                      <p className="text-xs font-semibold text-slate-700 font-mono truncate">
                                        {bid.lender?.lenderLicense ? `Verified: ${bid.lender.lenderLicense.substring(0, 4)}***` : "Platform Compliant"}
                                      </p>
                                    </div>
                                    
                                    {/* 4. Official Contact */}
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">Registered Contact</p>
                                      <p className="text-xs font-semibold text-slate-700 truncate">
                                        {bid.lender?.email ? bid.lender.email.replace(/(.{2})(.*)(?=@)/, "$1***") : "Verified Contact"}
                                      </p>
                                    </div>
                                    
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SellerInvoices;