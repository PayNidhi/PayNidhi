import React, { useState, useEffect, useCallback } from "react";
import LenderNav from "../../components/lender/LenderNav";
import LenderHeader from "../../components/lender/LenderHeader";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { 
  FileText, X, Building2, Calendar, IndianRupee, Gavel, FileSignature, ArrowRight, ShieldCheck
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

// ✅ ADDED: Custom PDF Viewer that securely fetches the file and stops auto-downloading
const SafePdfViewer = ({ filePath, className, fallbackSize = 40 }) => {
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    if (!filePath) return;
    let isMounted = true;

    const fetchPdf = async () => {
      try {
        const normalizedPath = filePath.replace(/\\/g, "/");
        const response = await fetch(`${API_BASE_URL}/${normalizedPath}`);
        const blob = await response.blob();
        
        // Force the blob to have a PDF MIME type so the browser knows NOT to download it
        const pdfBlob = new Blob([blob], { type: "application/pdf" });
        const objectUrl = URL.createObjectURL(pdfBlob);
        
        if (isMounted) setPdfUrl(objectUrl);
      } catch (error) {
        console.error("Failed to load PDF preview:", error);
      }
    };

    fetchPdf();

    return () => {
      isMounted = false;
      if (pdfUrl) URL.revokeObjectURL(pdfUrl); // Cleanup memory
    };
  }, [filePath]);

  if (!pdfUrl) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <FileText size={fallbackSize} className="text-slate-300 animate-pulse" />
      </div>
    );
  }

  return (
    <iframe 
      src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} 
      className={className}
      title="Invoice Preview"
    />
  );
};

const LenderMarketplace = () => {
  const [activeKey, setActiveKey] = useState("marketplace");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Bid Form State
  const [bidForm, setBidForm] = useState({
    loanAmount: "",
    interestRate: "",
    processingFee: "0",
  });
  const [isBidding, setIsBidding] = useState(false);

  const isKycComplete = Boolean(user?.isOnboarded && user?.kycStatus === "verified");

  const navigateToKyc = useCallback(() => navigate("/lender/kyc"), [navigate]);

  const handleNavClick = useCallback((key) => {
    if (!isKycComplete && key !== "overview") {
      toast.error("Complete KYC first");
      navigateToKyc();
      return;
    }
    setActiveKey(key);
    setIsMobileOpen(false);
  }, [isKycComplete, navigateToKyc]);

  // 1. Fetch Marketplace Data
  const fetchMarketplace = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/lender/marketplace`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch marketplace data");
      const data = await res.json();
      setInvoices(data);
    } catch (err) {
      toast.error(err.message || "Error loading marketplace");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketplace();
  }, []);

  // 2. Open Modal and pre-fill form
  const handleOpenModal = (invoice) => {
    setSelectedInvoice(invoice);
    setBidForm({
      loanAmount: invoice.totalAmount || "",
      interestRate: "",
      processingFee: "0",
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedInvoice(null);
  };

  // 3. Handle Bid Submission
  const handleBidSubmit = async (e) => {
    e.preventDefault();
    if (!bidForm.loanAmount || !bidForm.interestRate) {
      toast.error("Please fill required bid fields.");
      return;
    }

    setIsBidding(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/lender/bid/${selectedInvoice._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          loanAmount: Number(bidForm.loanAmount),
          interestRate: Number(bidForm.interestRate),
          processingFee: Number(bidForm.processingFee),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to place bid");

      toast.success("Bid Placed Successfully!");
      handleCloseModal();
      fetchMarketplace(); // Refresh the list to show the new bid
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsBidding(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="flex bg-[#F8FAFC]" style={{ height: '100dvh', overflow: 'hidden' }}>
      
      <LenderNav 
        activeKey={activeKey} 
        onChange={handleNavClick} 
        isKycComplete={isKycComplete} 
        navigateToKyc={navigateToKyc} 
        isMobileOpen={isMobileOpen} 
        onCloseMobile={() => setIsMobileOpen(false)} 
        onHoverChange={setIsSidebarHovered} 
      />

      <div className={`flex-1 flex flex-col relative min-w-0 h-full transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isSidebarHovered ? 'lg:ml-64' : 'lg:ml-[72px]'}`}>
        
        <header className="flex-none z-30">
          <LenderHeader onLogout={logout} onToggleSidebar={() => setIsMobileOpen(true)} />
        </header>

        <main className="flex-1 overflow-y-auto w-full px-4 sm:px-6 lg:px-10 pb-[100px] lg:pb-10 custom-scrollbar mt-4">
          <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
            
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Live Marketplace</h1>
              <p className="text-sm text-slate-500 mt-1">Browse verified invoices and deploy capital securely.</p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-48 bg-white rounded-2xl border border-slate-200 animate-pulse" />
                ))}
              </div>
            ) : invoices.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center">
                <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="text-slate-400" size={28} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">No active invoices</h3>
                <p className="text-slate-500 mt-1">Check back later for new investment opportunities.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {invoices.map((invoice) => {
                  return (
                    <div key={invoice._id} className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-[#47C4B7]/50 transition-all duration-300 flex flex-col sm:flex-row overflow-hidden group">
                      
                      {/* Left Side: PDF Preview */}
                      <div className="sm:w-2/5 bg-slate-100 relative border-b sm:border-b-0 sm:border-r border-slate-200 h-48 sm:h-auto overflow-hidden flex items-center justify-center">
                        
                        <SafePdfViewer 
                          filePath={invoice.fileUrl} 
                          className="w-full h-[150%] transform scale-75 origin-top pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity border-none"
                          fallbackSize={40}
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 to-transparent pointer-events-none" />
                        <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur text-[10px] font-bold text-slate-700 rounded-md shadow-sm flex items-center gap-1 border border-slate-200/50">
                          <FileSignature size={12} className="text-[#0f8f79]" /> Document
                        </div>
                      </div>

                      {/* Right Side: Details */}
                      <div className="sm:w-3/5 p-5 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="text-[10px] font-bold text-[#0f8f79] uppercase tracking-widest mb-1">{invoice.invoiceNumber}</p>
                              <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{invoice.seller?.companyName}</h3>
                              <p className="text-[11px] text-slate-500 mt-0.5">Billed to: {invoice.buyerName}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-slate-900">{formatCurrency(invoice.totalAmount)}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">Amount</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                              <p className="text-[10px] text-slate-400 font-medium">Due Date</p>
                              <p className="text-xs font-semibold text-slate-700 mt-0.5">{new Date(invoice.dueDate).toLocaleDateString()}</p>
                            </div>
                            <div className="bg-emerald-50/50 rounded-lg p-2 border border-emerald-100/50">
                              <p className="text-[10px] text-slate-400 font-medium">Best Bid</p>
                              <p className="text-xs font-bold text-[#0f8f79] mt-0.5">{invoice.bestBid}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
                          <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
                            <Gavel size={14} className="text-slate-400" /> {invoice.bidCount} active bids
                          </span>
                          <button 
                            onClick={() => handleOpenModal(invoice)}
                            className="bg-slate-900 text-white text-[11px] font-semibold px-4 py-2 rounded-lg hover:bg-[#0f8f79] transition-colors flex items-center gap-1.5"
                          >
                            Place Bid <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
        
      </div>

      {/* =========================================
          MODAL: INVOICE DETAILS & BID FORM
          ========================================= */}
      {isModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleCloseModal} />
          
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden relative z-10 flex flex-col md:flex-row animate-in zoom-in-95 duration-200">
            
            {/* Modal Left: Large PDF View */}
            <div className="hidden md:flex w-1/2 bg-slate-100 border-r border-slate-200 flex-col">
              <div className="p-4 border-b border-slate-200 bg-white flex items-center gap-2">
                <FileText size={18} className="text-[#0f8f79]" />
                <h3 className="text-sm font-bold text-slate-800">Original Document</h3>
              </div>
              <div className="flex-1 w-full bg-slate-200/50 relative">
                
                <SafePdfViewer 
                  filePath={selectedInvoice.fileUrl} 
                  className="absolute inset-0 w-full h-full border-none"
                  fallbackSize={60}
                />

              </div>
            </div>

            {/* Modal Right: Details & Bidding Form */}
            <div className="w-full md:w-1/2 flex flex-col h-full max-h-[90vh]">
              {/* ✅ MODIFIED HEADER: Name + Trust Score + Invoice No */}
              <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-white shrink-0">
                <div className="flex-1 pr-4">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <h2 className="text-lg font-bold text-slate-900">{selectedInvoice.seller?.companyName}</h2>
                    {/* Trust Score Badge */}
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100/60 shadow-sm">
                      <ShieldCheck size={12} className="text-emerald-500" />
                      <span className="text-[10px] font-bold text-emerald-700 tracking-wide">
                        Score: {selectedInvoice.seller?.trustScore || 850}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <FileText size={12} className="text-slate-400" /> INV: {selectedInvoice.invoiceNumber}
                  </p>
                </div>
                <button onClick={handleCloseModal} className="h-8 w-8 shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors">
                  <X size={16} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar bg-slate-50/50">
                
                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] text-slate-400 font-medium mb-1 flex items-center gap-1"><IndianRupee size={12}/> Invoice Amount</p>
                    <p className="text-base font-bold text-slate-900">{formatCurrency(selectedInvoice.totalAmount)}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] text-slate-400 font-medium mb-1 flex items-center gap-1"><Calendar size={12}/> Due Date</p>
                    <p className="text-base font-bold text-slate-900">{new Date(selectedInvoice.dueDate).toLocaleDateString()}</p>
                  </div>
                  <div className="col-span-2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] text-slate-400 font-medium mb-1 flex items-center gap-1"><Building2 size={12}/> Buyer</p>
                    <p className="text-sm font-semibold text-slate-800">{selectedInvoice.buyerName}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">GSTIN: {selectedInvoice.buyerGst}</p>
                  </div>
                </div>

                {/* Existing Bids Table */}
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Gavel size={14} className="text-[#0f8f79]" /> Current Bids ({selectedInvoice.bidCount})
                  </h3>
                  
                  {selectedInvoice.bids && selectedInvoice.bids.length > 0 ? (
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-2 font-semibold">Lender</th>
                            <th className="px-4 py-2 font-semibold text-right">Offer</th>
                            <th className="px-4 py-2 font-semibold text-right">Rate</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedInvoice.bids.map(b => (
                            <tr key={b._id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-2.5 font-medium text-slate-800">{b.lender?.companyName || "A Lender"}</td>
                              <td className="px-4 py-2.5 font-bold text-slate-900 text-right">{formatCurrency(b.loanAmount)}</td>
                              <td className="px-4 py-2.5 font-semibold text-[#0f8f79] text-right">{b.interestRate}% <span className="text-[9px] text-slate-400 font-normal">/mo</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
                      <p className="text-xs font-medium text-amber-700">No bids placed yet. Be the first to bid!</p>
                    </div>
                  )}
                </div>

                {/* Form to Place New Bid */}
                <div className="bg-white rounded-xl border border-[#7FE0CC] shadow-sm p-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#47C4B7] to-[#0f8f79]" />
                  <h3 className="text-sm font-bold text-slate-900 mb-4">Submit Your Bid</h3>
                  
                  <form onSubmit={handleBidSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">Funding Amount (₹) <span className="text-amber-500">*</span></label>
                      <input 
                        type="number" 
                        required 
                        max={selectedInvoice.totalAmount}
                        value={bidForm.loanAmount}
                        onChange={(e) => setBidForm({...bidForm, loanAmount: e.target.value})}
                        className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0f8f79]/30 focus:border-[#0f8f79] outline-none transition-all font-semibold"
                        placeholder={`Max: ${selectedInvoice.totalAmount}`}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">Interest Rate (% per month) <span className="text-amber-500">*</span></label>
                        <input 
                          type="number" 
                          step="0.01"
                          required 
                          value={bidForm.interestRate}
                          onChange={(e) => setBidForm({...bidForm, interestRate: e.target.value})}
                          className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0f8f79]/30 focus:border-[#0f8f79] outline-none transition-all font-semibold text-[#0f8f79]"
                          placeholder="e.g. 1.5"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">Processing Fee (₹)</label>
                        <input 
                          type="number" 
                          value={bidForm.processingFee}
                          onChange={(e) => setBidForm({...bidForm, processingFee: e.target.value})}
                          className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0f8f79]/30 focus:border-[#0f8f79] outline-none transition-all"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={isBidding}
                      className="w-full mt-2 bg-slate-900 text-white font-semibold text-sm py-3 rounded-lg hover:bg-[#0f8f79] transition-colors disabled:opacity-70 flex justify-center items-center gap-2 shadow-md hover:shadow-lg"
                    >
                      {isBidding ? "Submitting..." : "Confirm & Submit Bid"}
                    </button>
                  </form>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LenderMarketplace;