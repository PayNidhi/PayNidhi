// frontend/src/pages/seller/SellerWallet.jsx
import React, { useState, useEffect } from "react";
import SellerNav from "../../components/seller/SellerNav";
import SellerHeader from "../../components/seller/SellerHeader";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { 
  Wallet, Plus, History, ArrowDownLeft, ArrowUpRight, 
  CreditCard, Loader2, X, ArrowRight, ShieldCheck, Landmark,
  FileText, TrendingUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

// Theme Colors: Navy (Available), Emerald (Received/Settled), Rose (Fees/Pending)
const COLORS = ["#1e293b", "#10b981", "#f43f5e"]; 

const SellerWallet = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const isKycComplete = Boolean(user?.isOnboarded && user?.kycStatus === "verified");

  const [activeKey, setActiveKey] = useState("wallet");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  const [walletData, setWalletData] = useState({ balance: 0, transactions: [] });
  const [loading, setLoading] = useState(true);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [processing, setProcessing] = useState(false);
  const [timeFilter, setTimeFilter] = useState('1M');

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/seller/wallet-data`, 
        { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setWalletData({ balance: data.walletBalance, transactions: data.transactions });
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

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const amountNum = Number(withdrawAmount);
    if (!amountNum || amountNum > walletData.balance) return toast.error("Invalid withdrawal amount");

    try {
      setProcessing(true);
      // Implementation for withdrawal logic would go here (e.g., Payout API)
      const res = await fetch(`${API_BASE_URL}/api/seller/withdraw`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json" 
        },
        credentials: "include", // Required for cookies/session
        body: JSON.stringify({
          amount: amountNum,
          currency: "INR",
          requestedAt: new Date().toISOString()
        }),
      });
      const data = await res.json();
    //   toast.success("Withdrawal request initiated!");
    if(data.success) {
        toast.success("Amount withdrawn successfully");
        fetchWallet();
    }
      setIsWithdrawOpen(false);
    } catch (err) {
      toast.error("Withdrawal failed");
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val || 0);

  // --- Calculations ---
//   const totalWithdrawn = walletData.transactions.filter(t => t.type === 'WITHDRAWAL').reduce((acc, t) => acc + t.amount, 0);
  const totalWithdrawn = 32000;
//   const totalEarnings = walletData.transactions.filter(t => t.type === 'INVOICE_SETTLEMENT').reduce((acc, t) => acc + t.amount, 0);
  const totalVolume = (walletData.balance || 0) + totalWithdrawn;

  const pieData = [
    { name: "Current Balance", value: walletData.balance || 1 },
    { name: "Total Withdrawn", value: totalWithdrawn },
    { name: "Pending Settlement", value: 0 } // Placeholder for future logic
  ];

  const areaData = [
    { name: '05/05', balance: (walletData.balance || 5000) * 0.5 },
    { name: '13/05', balance: (walletData.balance || 5000) * 0.8 },
    { name: 'Today', balance: walletData.balance || 5000 },
  ];

  const renderTransactionIcon = (type) => {
    if (['INVOICE_SETTLEMENT', 'DEPOSIT'].includes(type)) {
      return <div className="h-10 w-10 rounded-[1rem] bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><ArrowDownLeft size={20}/></div>;
    }
    return <div className="h-10 w-10 rounded-[1rem] bg-slate-100 text-slate-600 flex items-center justify-center shrink-0"><ArrowUpRight size={20}/></div>;
  };

  return (
    <div className="flex bg-[#F8FAFC]" style={{ height: '100dvh', overflow: 'hidden' }}>
      
      <SellerNav 
        activeKey={activeKey} 
        onChange={setActiveKey} 
        isKycComplete={isKycComplete} 
        isMobileOpen={isMobileOpen} 
        onCloseMobile={() => setIsMobileOpen(false)} 
        onHoverChange={setIsSidebarHovered} 
      />

      <div className={`flex-1 flex flex-col relative min-w-0 h-full transition-all duration-300 ${isSidebarHovered ? 'lg:ml-64' : 'lg:ml-[72px]'}`}>
        
        <header className="flex-none z-30">
          <SellerHeader onLogout={logout} onToggleSidebar={() => setIsMobileOpen(true)} />
        </header>

        <main className="flex-1 overflow-y-auto w-full px-4 sm:px-8 py-6 pb-28 custom-scrollbar">
          <div className="w-full max-w-[1400px] mx-auto space-y-6">
            
            {/* ACTION BANNERS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-100 flex items-center justify-between overflow-hidden group">
                <div className="relative z-10">
                  <h3 className="text-lg font-bold text-slate-900">Request Payout</h3>
                  <p className="text-xs text-slate-500 mt-1 mb-4">Transfer available funds to your bank.</p>
                  <button onClick={() => setIsWithdrawOpen(true)} className="text-[12px] font-bold text-slate-900 flex items-center gap-1">
                    Withdraw Now <ArrowRight size={14} />
                  </button>
                </div>
                <div className="w-16 h-16 bg-slate-900 rounded-[1.25rem] flex items-center justify-center text-white shadow-lg group-hover:rotate-6 transition-transform">
                  <Landmark size={28} />
                </div>
              </div>

              <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-100 flex items-center justify-between overflow-hidden group">
                <div className="relative z-10">
                  <h3 className="text-lg font-bold text-slate-900">Finance Invoices</h3>
                  <p className="text-xs text-slate-500 mt-1 mb-4">Upload new invoices for instant funding.</p>
                  <button onClick={() => navigate('/seller/invoices')} className="text-[12px] font-bold text-emerald-600 flex items-center gap-1">
                    New Request <ArrowRight size={14} />
                  </button>
                </div>
                <div className="w-16 h-16 bg-emerald-500 rounded-[1.25rem] flex items-center justify-center text-white shadow-lg group-hover:-rotate-6 transition-transform">
                  <FileText size={28} />
                </div>
              </div>
            </div>

            {/* CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-[1.5rem] p-6 sm:p-8 shadow-sm border border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Available to Withdraw</h2>
                    <span className="text-3xl sm:text-4xl font-black text-slate-900">
                      {loading ? "..." : formatCurrency(walletData.balance)}
                    </span>
                  </div>
                  <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-100">
                    {['1M', '3M', '6M', 'ALL'].map(f => (
                      <button key={f} onClick={() => setTimeFilter(f)} className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${timeFilter === f ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>{f}</button>
                    ))}
                  </div>
                </div>
                <div className="w-full h-[250px]">
                  <ResponsiveContainer>
                    <AreaChart data={areaData}>
                      <defs>
                        <linearGradient id="colorSeller" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1e293b" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#1e293b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                      <RechartsTooltip />
                      <Area type="monotone" dataKey="balance" stroke="#1e293b" strokeWidth={3} fill="url(#colorSeller)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-[1.5rem] p-6 sm:p-8 shadow-sm border border-slate-100">
                <h3 className="text-base font-bold text-slate-900 text-center mb-2">Cashflow Breakdown</h3>
                <div className="relative h-[200px] w-full flex items-center justify-center">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                        {pieData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Total Volume</p>
                    <p className="text-lg font-black text-slate-900">₹{(totalVolume/100000).toFixed(1)}L</p>
                  </div>
                </div>
                <div className="space-y-4 mt-6">
                  {pieData.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px] font-bold">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                        <span className="text-slate-600">{item.name}</span>
                      </div>
                      <span className="text-slate-900">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* TRANSACTIONS */}
            <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-100">
              <h3 className="text-base font-bold text-slate-900 mb-6">Wallet Activity</h3>
              {loading ? (
                <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-slate-400"/></div>
              ) : (
                <div className="space-y-1">
                  {/* {walletData.transactions.map((txn) => (
                    <div key={txn._id} className="flex items-center justify-between p-4 rounded-[1.25rem] hover:bg-slate-50 transition-all">
                      <div className="flex items-center gap-4">
                        {renderTransactionIcon(txn.type)}
                        <div>
                          <p className="text-[14px] font-bold text-slate-900 capitalize">{txn.type.replace(/_/g, ' ').toLowerCase()}</p>
                          <p className="text-[11px] text-slate-500">{new Date(txn.createdAt).toLocaleDateString('en-GB')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-[15px] font-black ${txn.type.includes('SETTLEMENT') ? 'text-emerald-600' : 'text-slate-900'}`}>
                          {txn.type.includes('SETTLEMENT') ? '+' : '-'} {formatCurrency(txn.amount)}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">{txn.status}</p>
                      </div>
                    </div>
                  ))} */}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* WITHDRAWAL MODAL */}
      <AnimatePresence>
        {isWithdrawOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => !processing && setIsWithdrawOpen(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-md p-8 relative z-10">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-slate-900">Withdraw Funds</h2>
                <button onClick={() => setIsWithdrawOpen(false)} className="text-slate-400"><X /></button>
              </div>
              <form onSubmit={handleWithdraw} className="space-y-8">
                <div className="border-b-2 border-slate-200 pb-2">
                  <span className="text-slate-400 text-3xl">₹</span>
                  <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} className="w-full pl-4 text-4xl font-black focus:outline-none" placeholder="0" />
                </div>
                <button type="submit" disabled={processing} className="w-full bg-slate-900 text-white py-5 rounded-[1.25rem] font-bold shadow-xl">
                  {processing ? <Loader2 className="animate-spin mx-auto"/> : `Confirm Withdrawal`}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SellerWallet;