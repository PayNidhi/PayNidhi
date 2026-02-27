// frontend/src/pages/lender/LenderWallet.jsx
import React, { useState, useEffect } from "react";
import LenderNav from "../../components/lender/LenderNav";
import LenderHeader from "../../components/lender/LenderHeader";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { 
  Wallet, Plus, History, ArrowDownLeft, ArrowUpRight, 
  CreditCard, Loader2, X, ArrowRight, ShieldCheck, Landmark
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

// Theme Colors for Charts
const COLORS = ["#0f8f79", "#6366f1", "#f59e0b"]; // Teal (Available), Indigo (Deployed), Amber (Returns)

const LenderWallet = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const isKycComplete = Boolean(user?.isOnboarded && user?.kycStatus === "verified");

  const [activeKey, setActiveKey] = useState("wallet");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  const [walletData, setWalletData] = useState({ balance: 0, transactions: [] });
  const [loading, setLoading] = useState(true);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [processing, setProcessing] = useState(false);

  // Time filter state (UI only for now)
  const [timeFilter, setTimeFilter] = useState('1M');

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/lender/wallet`, { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setWalletData({ balance: data.balance, transactions: data.transactions });
      }
    } catch (err) {
      toast.error("Failed to load wallet details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleTopUp = async (e) => {
    e.preventDefault();
    const amountNum = Number(topUpAmount);
    if (!amountNum || amountNum < 100) return toast.error("Minimum deposit is ₹100");

    try {
      setProcessing(true);
      toast.loading("Initializing secure gateway...", { id: "topup" });

      const res = await fetch(`${API_BASE_URL}/api/payment/topup/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount: amountNum }),
      });
      const orderData = await res.json();
      
      if (!res.ok) throw new Error(orderData.error);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: "INR",
        name: "PayNidhi Treasury",
        description: "Add Capital to Wallet",
        order_id: orderData.orderId,
        handler: async function (response) {
          toast.loading("Verifying transaction...", { id: "topup" });
          
          const verifyRes = await fetch(`${API_BASE_URL}/api/payment/topup/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ ...response, amount: amountNum }),
          });
          
          const verifyData = await verifyRes.json();
          if (verifyRes.ok && verifyData.success) {
            toast.success("Capital added successfully!", { id: "topup" });
            setIsTopUpOpen(false);
            setTopUpAmount("");
            fetchWallet(); 
          } else {
            toast.error(verifyData.error || "Payment failed", { id: "topup" });
          }
        },
        prefill: { email: user?.email, name: user?.companyName },
        theme: { color: "#0f8f79" },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function () {
        toast.error("Payment was cancelled or failed", { id: "topup" });
        setProcessing(false);
      });
      rzp.open();

    } catch (err) {
      toast.error(err.message || "Failed to initiate payment", { id: "topup" });
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val || 0);

  // --- Calculations for Charts ---
  const totalDisbursed = walletData.transactions.filter(t => t.type === 'DISBURSEMENT').reduce((acc, t) => acc + t.amount, 0);
  const totalReturns = walletData.transactions.filter(t => t.type === 'REPAYMENT_IN').reduce((acc, t) => acc + t.amount, 0);
  const totalPortfolio = (walletData.balance || 0) + totalDisbursed + totalReturns;

  const pieData = [
    { name: "Available Balance", value: walletData.balance || 1 }, // Fallback to 1 so circle renders
    { name: "Deployed Capital", value: totalDisbursed },
    { name: "Earned Returns", value: totalReturns }
  ];

  // Mock Area Chart Data (To match your reference image's visual curve)
  const areaData = [
    { name: '05/05', balance: (walletData.balance || 10000) * 0.2 },
    { name: '13/05', balance: (walletData.balance || 10000) * 0.4 },
    { name: '20/05', balance: (walletData.balance || 10000) * 0.35 },
    { name: '28/05', balance: (walletData.balance || 10000) * 0.8 },
    { name: '05/06', balance: (walletData.balance || 10000) * 0.9 },
    { name: 'Today', balance: walletData.balance || 10000 },
  ];

  const renderTransactionIcon = (type) => {
    if (['DEPOSIT', 'REPAYMENT_IN'].includes(type)) {
      return <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-[1rem] bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><ArrowDownLeft size={20} strokeWidth={2.5}/></div>;
    }
    if (['DISBURSEMENT', 'WITHDRAWAL'].includes(type)) {
      return <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-[1rem] bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0"><ArrowUpRight size={20} strokeWidth={2.5}/></div>;
    }
    return <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-[1rem] bg-slate-100 text-slate-500 flex items-center justify-center shrink-0"><ArrowRight size={20} strokeWidth={2.5}/></div>;
  };

  return (
    <div className="flex bg-[#F8FAFC]" style={{ height: '100dvh', overflow: 'hidden' }}>
      
      <LenderNav 
        activeKey={activeKey} 
        onChange={setActiveKey} 
        isKycComplete={isKycComplete} 
        isMobileOpen={isMobileOpen} 
        onCloseMobile={() => setIsMobileOpen(false)} 
        onHoverChange={setIsSidebarHovered} 
      />

      <div className={`flex-1 flex flex-col relative min-w-0 h-full transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isSidebarHovered ? 'lg:ml-64' : 'lg:ml-[72px]'}`}>
        
        <header className="flex-none z-30">
          <LenderHeader onLogout={logout} onToggleSidebar={() => setIsMobileOpen(true)} />
        </header>

        <main className="flex-1 overflow-y-auto w-full px-4 sm:px-6 lg:px-8 py-6 pb-28 lg:pb-10 custom-scrollbar">
          <div className="w-full max-w-[1400px] mx-auto space-y-6">
            
            {/* 1. TOP ACTION BANNERS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              
              {/* Banner 1: Add Capital */}
              <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-100 flex items-center justify-between relative overflow-hidden group">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br from-[#E0F6F2] to-[#47C4B7]/20 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700" />
                <div className="relative z-10">
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">Deploy Capital Securely</h3>
                  <p className="text-xs text-slate-500 mt-1 mb-4">Add funds to start earning high yields.</p>
                  <button onClick={() => setIsTopUpOpen(true)} className="text-[12px] font-bold text-[#0f8f79] hover:text-[#0c6b5f] flex items-center gap-1 transition-colors">
                    Add Capital <ArrowRight size={14} />
                  </button>
                </div>
                <div className="relative z-10 w-16 h-16 bg-gradient-to-br from-[#0f8f79] to-[#47C4B7] rounded-[1.25rem] flex items-center justify-center text-white shadow-lg rotate-3 group-hover:rotate-6 transition-transform">
                  <Wallet size={28} strokeWidth={1.5} />
                </div>
              </div>

              {/* Banner 2: Marketplace */}
              <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-100 flex items-center justify-between relative overflow-hidden group">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br from-indigo-50 to-indigo-200/40 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700" />
                <div className="relative z-10">
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">Discover Invoices</h3>
                  <p className="text-xs text-slate-500 mt-1 mb-4">Find verified MSME invoices to fund.</p>
                  <button onClick={() => navigate('/lender/marketplace')} className="text-[12px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors">
                    Explore Market <ArrowRight size={14} />
                  </button>
                </div>
                <div className="relative z-10 w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-400 rounded-[1.25rem] flex items-center justify-center text-white shadow-lg -rotate-3 group-hover:-rotate-6 transition-transform">
                  <ArrowUpRight size={28} strokeWidth={1.5} />
                </div>
              </div>
            </div>

            {/* 2. MAIN CHARTS AREA */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* LEFT: Area Chart */}
              <div className="lg:col-span-2 bg-white rounded-[1.5rem] p-6 sm:p-8 shadow-sm border border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Wallet Balance</h2>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                        {loading ? "..." : formatCurrency(walletData.balance)}
                      </span>
                      <span className="text-sm font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md">+4.2%</span>
                    </div>
                  </div>
                  
                  {/* Time Filters */}
                  <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100">
                    {['1D', '7D', '1M', '3M', 'YTD'].map(f => (
                      <button 
                        key={f}
                        onClick={() => setTimeFilter(f)}
                        className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${timeFilter === f ? 'bg-[#0f8f79] text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recharts Area */}
                <div className="w-full h-[250px] sm:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={areaData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0f8f79" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#0f8f79" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(val) => `₹${val/1000}k`} />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontWeight: 'bold', color: '#0f8f79' }}
                        formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Balance']}
                      />
                      <Area type="monotone" dataKey="balance" stroke="#0f8f79" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* RIGHT: Donut Breakdown */}
              <div className="bg-white rounded-[1.5rem] p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col justify-between">
                <h3 className="text-base font-bold text-slate-900 text-center tracking-tight mb-2">My Portfolio</h3>
                
                {/* Donut Chart */}
                <div className="relative h-[200px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                        cornerRadius={4}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} contentStyle={{ borderRadius: '8px', fontSize: '11px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}/>
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Center Text inside Donut */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Value</p>
                    <p className="text-lg font-black text-slate-900 tracking-tight">₹{(totalPortfolio/100000).toFixed(1)}L</p>
                  </div>
                </div>

                {/* Custom Legend / Progress Bars */}
                <div className="space-y-4 mt-6">
                  {pieData.map((item, idx) => {
                    const percentage = totalPortfolio > 0 ? Math.round((item.value / totalPortfolio) * 100) : 0;
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                            <span className="text-slate-600">{item.name}</span>
                          </div>
                          <span className="text-slate-900">{percentage}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div className="h-1.5 rounded-full transition-all duration-1000" style={{ width: `${percentage}%`, backgroundColor: COLORS[idx] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>

            {/* 3. TRANSACTION LEDGER */}
            <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-100">
              <h3 className="text-base font-bold text-slate-900 tracking-tight mb-6">Transaction History</h3>
              
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                  <Loader2 className="animate-spin w-8 h-8 mb-3 text-[#47C4B7]"/> 
                </div>
              ) : walletData.transactions.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <History size={32} />
                  </div>
                  <p className="text-sm font-bold text-slate-800 mb-1">No transactions yet</p>
                  <p className="text-xs text-slate-500">Add capital to start seeing activity.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {walletData.transactions.map((txn) => {
                    const isCredit = ['DEPOSIT', 'REPAYMENT_IN'].includes(txn.type);
                    const title = txn.type.replace(/_/g, ' ');
                    const date = new Date(txn.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                    
                    return (
                      <div key={txn._id} className="flex items-center justify-between p-3 sm:p-4 rounded-[1.25rem] hover:bg-slate-50 active:scale-[0.99] transition-all cursor-pointer group">
                        
                        <div className="flex items-center gap-4">
                          {renderTransactionIcon(txn.type)}
                          <div>
                            <p className="text-[13px] sm:text-[14px] font-bold text-slate-900 tracking-tight capitalize">
                              {title.toLowerCase()}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-[11px] font-medium text-slate-500">{date}</p>
                              <span className="w-1 h-1 rounded-full bg-slate-300" />
                              <p className="text-[10px] font-mono text-slate-400">{txn.referenceId}</p>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className={`text-[14px] sm:text-[15px] font-black tracking-tight ${isCredit ? 'text-emerald-600' : 'text-slate-900'}`}>
                            {isCredit ? '+' : '-'} {formatCurrency(txn.amount)}
                          </p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {txn.status}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </main>
      </div>

      {/* 💳 NATIVE BOTTOM SHEET / MODAL */}
      <AnimatePresence>
        {isTopUpOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" 
              onClick={() => !processing && setIsTopUpOpen(false)} 
            />
            
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} 
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] sm:shadow-2xl w-full max-w-md overflow-hidden relative z-10 p-6 sm:p-10 pb-safe mt-auto sm:mt-0"
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8 sm:hidden" />

              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-[#F3FBF9] text-[#0f8f79] rounded-full flex items-center justify-center">
                    <Landmark size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Add Funds</h2>
                    <p className="text-[12px] font-medium text-slate-500 mt-0.5">Secure bank transfer</p>
                  </div>
                </div>
                <button onClick={() => !processing && setIsTopUpOpen(false)} className="h-10 w-10 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full flex items-center justify-center transition-colors">
                  <X size={18} strokeWidth={2.5}/>
                </button>
              </div>

              <form onSubmit={handleTopUp} className="space-y-8">
                <div>
                  <div className="relative border-b-2 border-slate-200 focus-within:border-[#0f8f79] transition-colors pb-2">
                    <span className="absolute left-0 bottom-3 text-slate-400 text-3xl font-medium">₹</span>
                    <input 
                      type="number" min="100" required value={topUpAmount} onChange={(e) => setTopUpAmount(e.target.value)} disabled={processing} 
                      className="w-full pl-10 bg-transparent text-4xl sm:text-5xl font-black text-slate-900 focus:outline-none placeholder:text-slate-200 transition-all" 
                      placeholder="0" 
                    />
                  </div>
                  
                  <div className="flex flex-wrap gap-2.5 mt-6">
                    {[100000, 500000, 1000000].map(val => (
                      <button 
                        key={val} type="button" onClick={() => setTopUpAmount(val)} 
                        className="flex-1 py-2.5 bg-slate-50 border border-slate-100 hover:border-[#47C4B7] hover:bg-[#F3FBF9] hover:text-[#0f8f79] text-slate-600 rounded-[1rem] text-[12px] font-bold transition-all active:scale-95"
                      >
                        +{(val/100000 >= 1) ? `${val/100000}L` : `${val/1000}k`}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  type="submit" disabled={processing || !topUpAmount} 
                  className="w-full bg-[#0f8f79] hover:bg-[#0c6b5f] text-white py-4 sm:py-5 rounded-[1.25rem] text-[15px] sm:text-[16px] font-bold flex justify-center items-center gap-2 transition-all disabled:opacity-50 active:scale-[0.98] shadow-xl shadow-[#0f8f79]/20"
                >
                  {processing ? <Loader2 size={22} className="animate-spin" /> : <CreditCard size={22} />}
                  {processing ? "Connecting Gateway..." : `Add ${topUpAmount ? formatCurrency(topUpAmount) : 'Capital'}`}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
      `}} />
    </div>
  );
};

export default LenderWallet;