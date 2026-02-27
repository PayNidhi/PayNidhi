// frontend/src/pages/lender/LenderBids.jsx
import React, { useState, useEffect, useCallback } from "react";
import LenderNav from "../../components/lender/LenderNav";
import LenderHeader from "../../components/lender/LenderHeader";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { 
  Gavel, CreditCard, Building2, 
  MoreVertical, Filter, Download,
  Clock, ShieldCheck, CheckCircle2, Lock // 👈 Added specific status icons
} from "lucide-react";

const API_BASE_URL = "http://localhost:5001";

const LenderBids = () => {
  const [activeKey, setActiveKey] = useState("bids");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [myBids, setMyBids] = useState([]);
  const [loading, setLoading] = useState(true);

  const isKycComplete = Boolean(user?.isOnboarded && user?.kycStatus === "verified");
  const navigateToKyc = useCallback(() => navigate("/lender/kyc"), [navigate]);

  // Load Razorpay Script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleNavClick = useCallback((key) => {
    if (!isKycComplete && key !== "overview") {
      toast.error("Complete KYC first");
      navigateToKyc();
      return;
    }
    setActiveKey(key);
    setIsMobileOpen(false);
  }, [isKycComplete, navigateToKyc]);

  const fetchMyBids = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/lender/my-bids`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch bids");
      const data = await res.json();
      setMyBids(data);
    } catch (err) {
      toast.error(err.message || "Error loading bids");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBids();
  }, []);

  // Razorpay Payment Logic
  const handlePayment = async (bid) => {
    try {
      toast.loading("Initializing payment gateway...", { id: "payment-loading" });

      const response = await fetch(`${API_BASE_URL}/api/payment/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          bidId: bid._id,
        }),
      });

      const orderData = await response.json();
      toast.dismiss("payment-loading");

      if (!response.ok) throw new Error(orderData.error || "Failed to create payment order");

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, 
        amount: orderData.amount,
        currency: "INR",
        name: "PayNidhi Marketplace",
        description: `Disbursement for Invoice`,
        order_id: orderData.orderId,
        handler: async function (razorpayResponse) {
          try {
            toast.loading("Verifying payment...", { id: "verify-loading" });

            const verifyRes = await fetch(`${API_BASE_URL}/api/payment/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                ...razorpayResponse, 
                bidId: bid._id      
              }),
            });

            const verifyData = await verifyRes.json();
            toast.dismiss("verify-loading");

            if (verifyRes.ok && verifyData.success) {
              toast.success("Payment successful! The Seller has been funded.");
              fetchMyBids(); 
            } else {
              toast.error(verifyData.error || "Payment verification failed.");
            }
          } catch(err) {
            toast.dismiss("verify-loading");
            toast.error("An error occurred during verification.",err);
          }
        },
        prefill: {
          name: user?.companyName || user?.name,
          email: user?.email,
        },
        theme: {
          color: "#0f8f79",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.dismiss("payment-loading");
      toast.error(err.message || "Something went wrong");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'accepted': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'funded': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'rejected': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-amber-50 text-amber-700 border-amber-100';
    }
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

        <main className="flex-1 overflow-y-auto w-full px-4 sm:px-6 lg:px-8 pb-10 mt-6">
          <div className="max-w-7xl mx-auto">
            
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Active Bids</h1>
                <p className="text-sm text-slate-500">Manage your active offers and pending disbursements.</p>
              </div>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  <Filter size={16} /> Filter
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  <Download size={16} /> Export
                </button>
              </div>
            </div>

            {/* Table Container */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-200">
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Entity Details</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bid Amount</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Interest Rate</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Applied Date</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      [1, 2, 3].map((i) => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan="6" className="px-6 py-8 bg-slate-50/20"></td>
                        </tr>
                      ))
                    ) : myBids.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center">
                            <Gavel className="text-slate-200 mb-3" size={40} />
                            <p className="text-slate-500 font-medium">No bids found</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      myBids.map((bid) => {
                        // Safely extract the nested invoice data
                        const invoiceData = bid.invoice || bid.invoiceId; 

                        return (
                        <tr key={bid._id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-[#0f8f79]/10 group-hover:text-[#0f8f79] transition-colors">
                                <Building2 size={20} />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900">{invoiceData?.seller?.companyName || "Verified MSME"}</p>
                                <p className="text-[11px] text-slate-500 font-medium tracking-tight">Inv: {invoiceData?.invoiceNumber}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-slate-900">{formatCurrency(bid.loanAmount)}</p>
                            <p className="text-[11px] text-slate-400">Total Return: {formatCurrency(bid.repaymentAmount)}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-[#0f8f79] font-bold text-xs border border-emerald-100">
                              {bid.interestRate}% / mo
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                            {new Date(bid.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${getStatusStyle(bid.status)}`}>
                              {bid.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {/* 🚨 THE NOA SECURITY LOCK LOGIC 🚨 */}
                            {(() => {
                              const bStatus = bid.status?.toLowerCase();
                              const invStatus = invoiceData?.status;

                              // 1. Transaction is fully funded and complete
                              if (bStatus === "funded") {
                                return (
                                  <span className="inline-flex items-center gap-1.5 text-indigo-600 font-bold text-xs px-3 py-1.5 bg-indigo-50 rounded-lg border border-indigo-100">
                                    <CheckCircle2 size={14} /> Funded
                                  </span>
                                );
                              }

                              // 2. Bid was accepted, now checking Invoice NOA state
                              if (bStatus === "accepted") {
                                if (invStatus === "NOA_Verified") {
                                  // UNLOCKED: Admin verified the document!
                                  return (
                                    <button 
                                      onClick={() => handlePayment(bid)}
                                      className="inline-flex items-center gap-2 bg-[#0f8f79] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-900 transition-all shadow-sm"
                                    >
                                      <CreditCard size={14} /> Pay Now
                                    </button>
                                  );
                                } 
                                else if (invStatus === "Pending_NOA") {
                                  // LOCKED: Waiting for Seller
                                  return (
                                    <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-xl text-[10px] font-bold border border-amber-100 cursor-not-allowed">
                                      <Clock size={14} /> Awaiting Seller NOA
                                    </div>
                                  );
                                } 
                                else if (invStatus === "Pending Admin Approval") {
                                  // LOCKED: Waiting for Admin
                                  return (
                                    <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-[10px] font-bold border border-blue-100 cursor-not-allowed">
                                      <ShieldCheck size={14} className="animate-pulse" /> Admin Reviewing NOA
                                    </div>
                                  );
                                } 
                                else {
                                  // Fallback for any other unexpected state
                                  return (
                                    <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-500 px-3 py-1.5 rounded-xl text-[10px] font-bold border border-slate-200 cursor-not-allowed">
                                      <Lock size={14} /> Locked ({invStatus?.replace(/_/g, ' ')})
                                    </div>
                                  );
                                }
                              }

                              // 3. Bid is still pending or rejected
                              return (
                                <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                                  <MoreVertical size={18} />
                                </button>
                              );
                            })()}
                          </td>
                        </tr>
                      )})
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LenderBids;