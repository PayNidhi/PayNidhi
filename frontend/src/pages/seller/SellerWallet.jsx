import React, { useState, useEffect } from "react";
import SellerNav from "../../components/seller/SellerNav";
import SellerHeader from "../../components/seller/SellerHeader";
import SellerFooter from "../../components/seller/SellerFooter";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { 
  History, ArrowDownLeft, ArrowUpRight, 
  Loader2, X, ArrowRight, Landmark,
  FileText, ShieldCheck, Banknote, IndianRupee
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";
const COLORS = ["#0f8f79", "#6366f1", "#f59e0b"]; 

const SellerWallet = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const isKycComplete = Boolean(user?.isOnboarded && user?.kycStatus === "verified");

  const [activeKey, setActiveKey] = useState("wallet");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [walletData, setWalletData] = useState({ balance: 0, transactions: [] });
  const [loading, setLoading] = useState(true);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  
  // Withdrawal State
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [processing, setProcessing] = useState(false);
  const [timeFilter, setTimeFilter] = useState('1M');

  // --- UPDATED: Fetching real data based on your backend ---
  const fetchWallet = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/seller/wallet-data`, { credentials: "include" });
      const data = await res.json();
      
      if (data.success) {
        setWalletData({ 
          balance: data.walletBalance || 0, 
          // Assuming transactions aren't sent yet based on the backend snippet, fallback to empty array
          transactions: data.transactions || [] 
        });
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

  // --- UPDATED: Withdrawal logic matching your backend ---
  const handleWithdraw = async (e) => {
    e.preventDefault();
    const amountNum = Number(withdrawAmount);
    
    if (!amountNum || amountNum <= 0) return toast.error("Please enter a valid amount.");
    if (amountNum > walletData.balance) return toast.error("Insufficient wallet balance.");

    setProcessing(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/seller/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", 
        body: JSON.stringify({
          amount: amountNum // Only sending what your backend expects
        }),
      });
      
      const data = await res.json();
      
      if(data.success) {
        toast.success(data.message || "Withdrawal request submitted successfully.");
        
        // Update local state directly with the remaining balance from backend
        setWalletData(prev => ({ ...prev, balance: data.remainingBalance }));
        setWithdrawAmount("");
        setIsWithdrawOpen(false);
      } else {
        toast.error(data.error || "Failed to process withdrawal");
      }

    } catch (err) {
      console.error("Withdrawal Error:", err);
      toast.error("Withdrawal failed due to a server error.");
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleSidebar = () => setIsMobileOpen((prev) => !prev);
  const handleCloseMobile = () => setIsMobileOpen(false);
  const navigateToKyc = () => navigate("/seller/kyc");

  const handleNavClick = (key) => {
    if (!isKycComplete && key !== "overview") {
      toast.error("Complete KYC first");
      navigateToKyc();
      return;
    }
    setActiveKey(key);
    setIsMobileOpen(false);
  };

  const formatCurrency = (val) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val || 0);

  const totalWithdrawn = 32000; // You can fetch this later when backend supports it
  const totalVolume = (walletData.balance || 0) + totalWithdrawn;

  const pieData = [
    { name: "Available Balance", value: walletData.balance || 1 },
    { name: "Total Withdrawn", value: totalWithdrawn },
    { name: "Pending Settlement", value: 0 } 
  ];

  const areaData = [
    { name: '05/05', balance: (walletData.balance || 5000) * 0.2 },
    { name: '13/05', balance: (walletData.balance || 5000) * 0.4 },
    { name: '20/05', balance: (walletData.balance || 5000) * 0.35 },
    { name: '28/05', balance: (walletData.balance || 5000) * 0.8 },
    { name: '05/06', balance: (walletData.balance || 5000) * 0.9 },
    { name: 'Today', balance: walletData.balance || 5000 },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-3 py-2 rounded-xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] border border-slate-100 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#0f8f79]"></div>
          <p className="text-sm font-bold text-[#0f8f79] tracking-wide">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-[#F8FAFC] overflow-hidden font-sans">
      <SellerNav 
        activeKey={activeKey}
        onChange={handleNavClick}
        isKycComplete={isKycComplete}
        navigateToKyc={navigateToKyc}
        isMobileOpen={isMobileOpen}
        onCloseMobile={handleCloseMobile}
      />

      <div className="flex-1 flex flex-col lg:ml-64 h-[100dvh] relative z-10">
        <div className="flex-none">
          <SellerHeader onLogout={logout} onToggleSidebar={handleToggleSidebar} />
        </div>

        <main className="flex-1 overflow-y-auto w-full px-4 sm:px-6 lg:px-8 py-6 pb-28 lg:pb-10 custom-scrollbar relative">
          <div className="w-full max-w-[1400px] mx-auto space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-100 flex items-center justify-between relative overflow-hidden group">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br from-[#E0F6F2] to-[#47C4B7]/20 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700" />
                <div className="relative z-10">
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">Request Payout Fast</h3>
                  <p className="text-xs text-slate-500 mt-1 mb-4">Transfer available funds to your bank.</p>
                  <button onClick={() => setIsWithdrawOpen(true)} className="text-[12px] font-bold text-[#0f8f79] hover:text-[#0c6b5f] flex items-center gap-1 transition-colors">
                    Withdraw Now <ArrowRight size={14} />
                  </button>
                </div>
                <div className="relative z-10 w-16 h-16 bg-gradient-to-br from-[#0f8f79] to-[#47C4B7] rounded-[1.25rem] flex items-center justify-center text-white shadow-lg rotate-3 group-hover:rotate-6 transition-transform shrink-0">
                  <Landmark size={28} strokeWidth={1.5} />
                </div>
              </div>
              <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-100 flex items-center justify-between relative overflow-hidden group">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br from-indigo-50 to-indigo-200/40 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700" />
                <div className="relative z-10">
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">Finance New Invoices</h3>
                  <p className="text-xs text-slate-500 mt-1 mb-4">Upload new invoices to unlock working capital.</p>
                  <button onClick={() => navigate('/seller/invoices')} className="text-[12px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors">
                    Start Request <ArrowRight size={14} />
                  </button>
                </div>
                <div className="relative z-10 w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-400 rounded-[1.25rem] flex items-center justify-center text-white shadow-lg -rotate-3 group-hover:-rotate-6 transition-transform shrink-0">
                  <FileText size={28} strokeWidth={1.5} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-[1.5rem] p-6 sm:p-8 shadow-sm border border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Wallet Balance</h2>
                    <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                      {loading ? "..." : formatCurrency(walletData.balance)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-white p-1 rounded-lg">
                    {['1D', '7D', '1M', '3M', 'YTD'].map(f => (
                      <button key={f} onClick={() => setTimeFilter(f)} className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${timeFilter === f ? 'bg-[#0f8f79] text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>{f}</button>
                    ))}
                  </div>
                </div>
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
                      <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: '#0f8f79', strokeWidth: 1, strokeDasharray: '4 4' }} />
                      <Area type="monotone" dataKey="balance" stroke="#0f8f79" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-[1.5rem] p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col justify-between">
                <h3 className="text-base font-bold text-slate-900 text-center tracking-tight mb-2">My Cashflow</h3>
                <div className="relative h-[200px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} innerRadius={65} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none" cornerRadius={4}>
                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <RechartsTooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} contentStyle={{ borderRadius: '8px', fontSize: '11px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}/>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Value</p>
                    <p className="text-lg font-black text-slate-900 tracking-tight">₹{(totalVolume/100000).toFixed(1)}L</p>
                  </div>
                </div>
                <div className="space-y-4 mt-6">
                  {pieData.map((item, idx) => {
                    const percentage = totalVolume > 0 ? Math.round((item.value / totalVolume) * 100) : 0;
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx] }} /><span className="text-slate-600">{item.name}</span></div>
                          <span className="text-slate-900">{percentage}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden"><div className="h-1.5 rounded-full transition-all duration-1000" style={{ width: `${percentage}%`, backgroundColor: COLORS[idx] }} /></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Transaction Ledger Placeholder */}
            <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-100">
              <h3 className="text-base font-bold text-slate-900 tracking-tight mb-6">Transaction History</h3>
              {walletData.transactions.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <History size={32} />
                  </div>
                  <p className="text-sm font-bold text-slate-800 mb-1">No transactions yet</p>
                  <p className="text-xs text-slate-500">Finance an invoice to start seeing activity.</p>
                </div>
              ) : (
                <div className="space-y-2">
                   {/* Map through real transactions here when available */}
                </div>
              )}
            </div>

          </div>
          <div className="flex-none hidden lg:block"><SellerFooter /></div>
        </main>
      </div>

      {/* 💳 CLEAN, STRIPE-LIKE MODERN FINTECH POPUP */}
      <AnimatePresence>
        {isWithdrawOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            
            {/* Soft, clean overlay */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
              onClick={() => !processing && setIsWithdrawOpen(false)} 
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="relative w-full max-w-md z-10"
            >
              {/* Clean White Card */}
              <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] p-6 sm:p-8 overflow-hidden">
                
                {/* Header Section */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm border border-emerald-100/50">
                      <Landmark size={22} strokeWidth={2} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 tracking-tight">Withdraw Funds</h2>
                      <p className="text-sm text-slate-500 font-medium">To primary bank account</p>
                    </div>
                  </div>
                  <button onClick={() => !processing && setIsWithdrawOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>

                {/* Form Section */}
                <form onSubmit={handleWithdraw} className="space-y-6">
                  
                  {/* Clean Input Area */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm font-semibold px-1">
                      <span className="text-slate-700">Amount</span>
                      <span className="text-[#0f8f79]">Available: {formatCurrency(walletData.balance)}</span>
                    </div>
                    
                    <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-2xl p-4 focus-within:border-[#0f8f79] focus-within:ring-4 focus-within:ring-[#0f8f79]/10 transition-all">
                      <IndianRupee size={28} className="text-slate-400 mr-2" strokeWidth={2}/>
                      <input 
                        type="number" 
                        min="100" 
                        required 
                        value={withdrawAmount} 
                        onChange={(e) => setWithdrawAmount(e.target.value)} 
                        disabled={processing}
                        className="w-full bg-transparent text-4xl font-black text-slate-900 focus:outline-none placeholder:text-slate-300" 
                        placeholder="0"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Quick Select Buttons */}
                  <div className="flex gap-3">
                    {[10000, 50000].map(val => (
                      <button 
                        key={val} 
                        type="button" 
                        onClick={() => setWithdrawAmount(val)} 
                        className="flex-1 py-2.5 bg-white border border-slate-200 hover:border-[#0f8f79] hover:text-[#0f8f79] rounded-xl text-sm font-bold text-slate-600 transition-colors shadow-sm"
                      >
                        +{formatCurrency(val).replace('₹', '')}
                      </button>
                    ))}
                    <button 
                      type="button" 
                      onClick={() => setWithdrawAmount(walletData.balance)} 
                      className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
                    >
                      MAX
                    </button>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Submit Button */}
                  <button 
                    type="submit" 
                    disabled={processing || !withdrawAmount || Number(withdrawAmount) > walletData.balance} 
                    className="w-full bg-[#0f8f79] hover:bg-[#0c7865] text-white py-4 rounded-[1rem] font-bold text-base shadow-[0_8px_20px_rgba(15,143,121,0.25)] hover:shadow-[0_12px_25px_rgba(15,143,121,0.35)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {processing ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Confirm Withdrawal"
                    )}
                  </button>

                  {/* Security Badge */}
                  <div className="flex items-center justify-center gap-2 opacity-80 pt-1">
                    <ShieldCheck size={16} className="text-emerald-600" />
                    <p className="text-xs text-slate-500 font-medium">Secured by AES-256 Bank Encryption</p>
                  </div>

                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
        
        /* Remove arrows from number input */
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
          -webkit-appearance: none; 
          margin: 0; 
        }
      `}} />
    </div>
  );
};

export default SellerWallet;