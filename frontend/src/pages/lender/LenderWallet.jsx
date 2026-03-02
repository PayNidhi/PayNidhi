import React, { useState, useEffect } from "react";
import LenderNav from "../../components/lender/LenderNav";
import LenderHeader from "../../components/lender/LenderHeader";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import {
  History, ArrowDownLeft, ArrowUpRight,
  Loader2, X, ArrowRight, Landmark,
  FileText, ShieldCheck, Banknote, IndianRupee, Download, Eye,
  ChevronLeft, ChevronRight, Compass
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// --- FIXED: Added missing COLORS definition ---
const COLORS = ["#0f8f79", "#47C4B7", "#6366f1"];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 15 } }
};

const LenderWallet = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isKycComplete = Boolean(user?.isOnboarded && user?.kycStatus === "verified");

  const [activeKey, setActiveKey] = useState("wallet");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  
  const [walletData, setWalletData] = useState({ balance: 0, utilizedLimit: 0, transactions: [] });
  const [loading, setLoading] = useState(true);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  // Withdrawal State
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [processing, setProcessing] = useState(false);
  const [timeFilter, setTimeFilter] = useState('1M');
  const [withdrawStep, setWithdrawStep] = useState("input"); // input, processing, success
  const [progress, setProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/lender/wallet`, { credentials: "include" });
      const data = await res.json();

      if (data.success) {
        setWalletData({
          balance: data.balance || 0,
          utilizedLimit: data.utilizedLimit || 0,
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

  // --- WITHDRAWAL LOGIC ---
  const handleWithdraw = async (e) => {
    e.preventDefault();
    const amountNum = Number(withdrawAmount);

    if (!amountNum || amountNum <= 0) return toast.error("Please enter a valid amount.");
    if (amountNum > walletData.balance) return toast.error("Insufficient wallet balance.");

    setProcessing(true);
    setWithdrawStep("processing");
    setProgress(0);

    // Simulate progress while calling backend
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + 5;
      });
    }, 100);

    try {
      const startTime = Date.now();
      const res = await fetch(`${API_BASE_URL}/api/lender/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          amount: amountNum
        }),
      });

      const data = await res.json();

      // Ensure animation lasts at least 2 seconds for effect
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < 2000) {
        await new Promise(resolve => setTimeout(resolve, 2000 - elapsedTime));
      }

      clearInterval(progressInterval);
      setProgress(100);

      if (data.success) {
        setWithdrawStep("success");
        setWalletData(prev => ({ ...prev, balance: data.remainingBalance }));
        fetchWallet();
      } else {
        setWithdrawStep("input");
        toast.error(data.error || "Failed to process withdrawal");
      }

    } catch (err) {
      console.error("Withdrawal Error:", err);
      toast.error("Withdrawal failed due to a server error.");
      setWithdrawStep("input");
    } finally {
      setProcessing(false);
      clearInterval(progressInterval);
    }
  };

  const handleToggleSidebar = () => setIsMobileOpen((prev) => !prev);
  const handleCloseMobile = () => setIsMobileOpen(false);
  const navigateToKyc = () => navigate("/lender/kyc");

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

  const generateReceiptPDF = (tx, download = false) => {
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = 210;
      const brandTeal = [15, 143, 121];
      const brandGold = [255, 179, 0];
      const darkGrey = [66, 66, 66];

      // 1. Header & Shapes
      doc.setFillColor(246, 246, 246); doc.rect(0, 0, pageWidth, 55, 'F');
      doc.setFillColor(...darkGrey); doc.rect(pageWidth - 40, 0, 40, 55, 'F');
      doc.triangle(pageWidth - 60, 0, pageWidth - 40, 0, pageWidth - 40, 55, 'F');
      doc.setFillColor(...brandGold); doc.rect(pageWidth - 80, 5, 80, 45, 'F');
      doc.setFillColor(245, 245, 245); doc.rect(pageWidth - 70, 10, 70, 35, 'F');

      // 2. Official Logo Image
      try {
        doc.addImage("/logo.png", "PNG", 15, 12, 17, 17);
      } catch (e) {
        doc.setTextColor(...brandTeal); doc.setFontSize(12); doc.setFont("helvetica", "bold");
        doc.text("PayNidhi", 15, 22);
      }

      // 3. Header Branding
      doc.setTextColor(...brandGold); doc.setFontSize(14); doc.text("PayNidhi Trusted Lender", 20, 45);
      doc.setFontSize(9); doc.setTextColor(85, 85, 85); doc.setFont("helvetica", "normal");
      doc.text("support@paynidhi.com | paynidhi.com | +91 888 777 6666", 20, 50);

      // 4. Title & Core Info
      doc.setTextColor(51, 51, 51); doc.setFontSize(22); doc.setFont("helvetica", "bold");
      doc.text("Transaction Receipt", 105, 80, { align: "center" });

      doc.setFontSize(10); doc.text(`Receipt Number: ${tx.referenceId || "N/A"}`, 20, 95);
      doc.text(`Date: ${new Date(tx.createdAt || tx.transactionDate).toLocaleString()}`, 20, 101);

      // 5. Party Table (Dynamic)
      autoTable(doc, {
        startY: 110,
        head: [['Received From:', 'Received By:']],
        body: [[
          `Lender: ${user?.companyName || user?.fullName || "PayNidhi Lender"}\nEmail: ${user?.email || "N/A"}\nPhone: +91 ${user?.phone || user?.phoneNumber || "N/A"}`,
          `PayNidhi Financial Services\nUnit 4, Capital Towers, Mumbai\nGSTIN: 27AABCP1234Z1Z5`
        ]],
        headStyles: { fillColor: [245, 245, 245], textColor: [51, 51, 51], fontStyle: 'bold' },
        theme: 'grid', styles: { cellPadding: 8 }
      });

      // 6. Transaction Details Table
      const tY = doc.lastAutoTable.finalY + 15;
      doc.setFont("helvetica", "bold"); doc.text("Details of Transaction:", 20, tY);
      autoTable(doc, {
        startY: tY + 5,
        head: [['Description', 'Reference ID', 'Status', 'Amount']],
        body: [[
          tx.description || `${tx.type} Settlement`,
          tx.referenceId,
          tx.status,
          `INR ${Number(tx.amount).toLocaleString('en-IN')}.00`
        ]],
        headStyles: { fillColor: [245, 245, 245], textColor: [51, 51, 51], fontStyle: 'bold' },
        theme: 'grid'
      });

      // 7. Totals & Footer
      const finalY = doc.lastAutoTable.finalY + 15;
      doc.text(`Total Amount: INR ${Number(tx.amount).toLocaleString('en-IN')}.00`, 20, finalY);
      doc.text(`Payment Method: IMPS Real-time Settlement`, 20, finalY + 6);

      doc.setDrawColor(224, 224, 224); doc.line(20, finalY + 20, 190, finalY + 20);
      doc.setTextColor(85, 85, 85); doc.setFontSize(8); doc.setFont("helvetica", "normal");
      doc.text([
        "Thank you for partnering with PayNidhi Financial Services.",
        "This is a computer-generated receipt valid for all audits. No signature required.",
        `Generated on: ${new Date().toLocaleString()}`
      ], 20, finalY + 30);

      // Action Handlers
      if (download) {
        doc.save(`PayNidhi_Receipt_${tx.referenceId}.pdf`);
      } else {
        const pdfBlob = doc.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        window.open(url, '_blank');
      }
    } catch (err) {
      console.error("PDF Final Error:", err);
      toast.error("Failed to generate PDF. Check console.");
    }
  };

  // Chart Data Calculations
  const totalDisbursed = walletData.transactions.filter(t => t.type === 'DISBURSEMENT').reduce((acc, t) => acc + t.amount, 0);
  const totalReturns = walletData.transactions.filter(t => t.type === 'REPAYMENT_IN').reduce((acc, t) => acc + t.amount, 0);
  const totalPortfolio = (walletData.balance || 0) + walletData.utilizedLimit;

  const pieData = [
    { name: "Liquid Balance", value: walletData.balance || 0 },
    { name: "Deployed Capital", value: walletData.utilizedLimit || 0 },
    { name: "Earned Returns", value: totalReturns } 
  ];

  const getChartData = () => {
    const currentBalance = walletData.balance || 0;
    let data = [];
    const configs = {
      '1D': { label: 'Time', trend: 0.05, volatility: 0.02, labels: ['9AM', '12PM', '3PM', '6PM', '9PM', 'Now'] },
      '7D': { label: 'Day', trend: 0.15, volatility: 0.08, labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'] },
      '1M': { label: 'Date', trend: 0.35, volatility: 0.12, labels: ['1st', '7th', '14th', '21st', '28th', 'Today'] },
      '3M': { label: 'Week', trend: 0.60, volatility: 0.15, labels: ['W1', 'W4', 'W7', 'W10', 'W12', 'Today'] },
      'YTD': { label: 'Month', trend: 1.20, volatility: 0.20, labels: ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Today'] }
    };
    const config = configs[timeFilter] || configs['1M'];
    const totalGrowth = config.trend;

    for (let i = 0; i < config.labels.length; i++) {
      const isLast = i === config.labels.length - 1;
      if (isLast) {
        data.push({ name: config.labels[i], balance: currentBalance });
      } else {
        const progress = i / (config.labels.length - 1);
        const randomFactor = 1 + (Math.random() * config.volatility * 2 - config.volatility);
        const baseMultiplier = (1 - totalGrowth) + (totalGrowth * progress);
        const pointValue = Math.max(0, currentBalance * baseMultiplier * randomFactor);
        data.push({ name: config.labels[i], balance: Math.round(pointValue) });
      }
    }
    return data;
  };

  const areaData = getChartData();

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
      <LenderNav
        activeKey={activeKey}
        onChange={handleNavClick}
        isKycComplete={isKycComplete}
        navigateToKyc={navigateToKyc}
        isMobileOpen={isMobileOpen}
        onCloseMobile={handleCloseMobile}
        onHoverChange={setIsSidebarHovered}
      />

      <div className={`flex-1 flex flex-col relative min-w-0 h-full transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isSidebarHovered ? 'lg:ml-64' : 'lg:ml-[72px]'}`}>
        <div className="flex-none">
          <LenderHeader onLogout={logout} onToggleSidebar={handleToggleSidebar} />
        </div>

        <main className="flex-1 overflow-y-auto w-full px-4 sm:px-6 lg:px-8 py-6 pb-28 lg:pb-10 custom-scrollbar relative">
          <div className="w-full max-w-[1400px] mx-auto space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-100 flex items-center justify-between relative overflow-hidden group">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br from-[#E0F6F2] to-[#47C4B7]/20 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700" />
                <div className="relative z-10 flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight truncate">Withdraw Liquidity</h3>
                  <p className="text-xs text-slate-500 mt-1 mb-4 truncate sm:whitespace-normal">Transfer available balance to your bank account.</p>
                  <button onClick={() => setIsWithdrawOpen(true)} className="text-[12px] font-bold text-[#0f8f79] hover:text-[#0c6b5f] flex items-center gap-1 transition-colors">
                    Request Payout <ArrowRight size={14} />
                  </button>
                </div>
                <div className="relative z-10 w-16 h-16 bg-gradient-to-br from-[#0f8f79] to-[#47C4B7] rounded-[1.25rem] flex items-center justify-center text-white shadow-lg rotate-3 group-hover:rotate-6 transition-transform shrink-0">
                  <Landmark size={28} strokeWidth={1.5} />
                </div>
              </div>
              <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-100 flex items-center justify-between relative overflow-hidden group">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br from-indigo-50 to-indigo-200/40 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700" />
                <div className="relative z-10 flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight truncate">Discover Invoices</h3>
                  <p className="text-xs text-slate-500 mt-1 mb-4 truncate sm:whitespace-normal">Deploy your liquid funds into verified assets.</p>
                  <button onClick={() => navigate('/lender/marketplace')} className="text-[12px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors">
                    Explore Market <ArrowRight size={14} />
                  </button>
                </div>
                <div className="relative z-10 w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-400 rounded-[1.25rem] flex items-center justify-center text-white shadow-lg -rotate-3 group-hover:-rotate-6 transition-transform shrink-0">
                  <Compass size={28} strokeWidth={1.5} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-[1.5rem] p-6 sm:p-8 shadow-sm border border-slate-100 relative min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Available Liquidity</h2>
                    <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                      {loading ? "..." : formatCurrency(walletData.balance)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-white p-1 rounded-lg overflow-x-auto hide-scrollbar w-full sm:w-auto">
                    {['1D', '7D', '1M', '3M', 'YTD'].map(f => (
                      <button key={f} onClick={() => setTimeFilter(f)} className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all shrink-0 ${timeFilter === f ? 'bg-[#0f8f79] text-white shadow-sm scale-105' : 'text-slate-500 hover:text-slate-900'}`}>{f}</button>
                    ))}
                  </div>
                </div>
                <div className="w-full h-[250px] sm:h-[300px] min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={areaData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0f8f79" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#0f8f79" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(val) => `₹${val / 1000}k`} />
                      <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: '#0f8f79', strokeWidth: 1, strokeDasharray: '4 4' }} />
                      <Area type="monotone" dataKey="balance" stroke="#0f8f79" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" animationDuration={1500}/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-[1.5rem] p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col justify-between min-w-0">
                <h3 className="text-base font-bold text-slate-900 text-center tracking-tight mb-2">Portfolio Overview</h3>
                <div className="relative h-[200px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} innerRadius={65} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none" cornerRadius={4} animationDuration={1500}>
                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity cursor-pointer" />)}
                      </Pie>
                      <RechartsTooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} contentStyle={{ borderRadius: '8px', fontSize: '11px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5, duration: 0.5 }} className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Value</p>
                    <p className="text-lg font-black text-slate-900 tracking-tight">₹{(totalPortfolio / 100000).toFixed(1)}L</p>
                  </motion.div>
                </div>
                <div className="space-y-4 mt-6">
                  {pieData.map((item, idx) => {
                    const percentage = totalPortfolio > 0 ? Math.round((item.value / totalPortfolio) * 100) : 0;
                    return (
                      <motion.div key={idx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + (idx * 0.1) }} className="space-y-1.5 group">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx] }} /><span className="text-slate-600 truncate max-w-[120px]">{item.name}</span></div>
                          <span className="text-slate-900">{percentage}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden"><div className="h-1.5 rounded-full transition-all duration-1000" style={{ width: `${percentage}%`, backgroundColor: COLORS[idx] }} /></div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

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
                  <p className="text-xs text-slate-500">Add capital to start investing.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto min-w-0">
                    <table className="w-full text-left min-w-[700px]">
                      <thead>
                        <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                          <th className="pb-4 px-2">Type</th>
                          <th className="pb-4 px-2">Date</th>
                          <th className="pb-4 px-2">Time</th>
                          <th className="pb-4 px-2">Reference</th>
                          <th className="pb-4 px-2">Status</th>
                          <th className="pb-4 px-2 text-right">Amount</th>
                          <th className="pb-4 px-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {walletData.transactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((tx, idx) => (
                          <tr key={tx._id || idx} className="text-sm group hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-2">
                              <div className="flex items-center gap-2">
                                {tx.type === 'WITHDRAWAL' ? (
                                  <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center"><ArrowUpRight size={14} /></div>
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"><ArrowDownLeft size={14} /></div>
                                )}
                                <span className="font-bold text-slate-700 text-xs">{tx.type}</span>
                              </div>
                            </td>
                            <td className="py-4 px-2 text-xs font-medium text-slate-500">{new Date(tx.createdAt || tx.transactionDate).toLocaleDateString()}</td>
                            <td className="py-4 px-2 text-xs font-medium text-slate-400 uppercase">
                              {new Date(tx.createdAt || tx.transactionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </td>
                            <td className="py-4 px-2 text-xs font-mono text-slate-400">{tx.referenceId}</td>
                            <td className="py-4 px-2">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tx.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600' :
                                tx.status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                                }`}>
                                {tx.status}
                              </span>
                            </td>
                            <td className={`py-4 px-2 text-right font-bold ${tx.type === 'WITHDRAWAL' ? 'text-slate-900' : 'text-emerald-600'}`}>
                              {tx.type === 'WITHDRAWAL' ? '-' : '+'}{formatCurrency(tx.amount)}
                            </td>
                            <td className="py-4 px-2 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => generateReceiptPDF(tx, false)} className="p-1.5 rounded-lg text-slate-400 hover:text-[#0f8f79] hover:bg-emerald-50 transition-all tooltip" title="View Receipt">
                                  <Eye size={16} />
                                </button>
                                <button onClick={() => generateReceiptPDF(tx, true)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all font-bold" title="Download PDF">
                                  <Download size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {walletData.transactions.length > itemsPerPage && (
                    <div className="flex items-center justify-end mt-6 gap-2 border-t border-slate-100 pt-4">
                      <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 transition-all disabled:opacity-30">
                        <ChevronLeft size={16} />
                      </button>
                      <span className="text-xs font-bold text-slate-600 px-2">{currentPage} / {Math.ceil(walletData.transactions.length / itemsPerPage)}</span>
                      <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(walletData.transactions.length / itemsPerPage)))} disabled={currentPage === Math.ceil(walletData.transactions.length / itemsPerPage)} className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 transition-all disabled:opacity-30">
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

          </div>
        </main>
      </div>

      <AnimatePresence>
        {isWithdrawOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => {
                if (withdrawStep !== "processing") {
                  setIsWithdrawOpen(false);
                  setTimeout(() => setWithdrawStep("input"), 300);
                }
              }}
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-[380px] z-10"
            >
              <AnimatePresence>
                {withdrawStep === "processing" && (
                  <motion.div
                    initial={{ opacity: 0, x: 20, y: -20 }}
                    animate={{ opacity: 1, x: 0, y: -45 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="absolute -right-4 -top-8 bg-[#00ac69] text-white p-4 rounded-2xl rounded-br-none shadow-xl z-20 max-w-[180px] pointer-events-none"
                  >
                    <p className="text-xs font-bold leading-relaxed">Processing your settlement via IMPS...</p>
                    <div className="absolute -bottom-2 right-0 w-4 h-4 bg-[#00ac69] transform rotate-45" />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="bg-white rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden">

                {withdrawStep === "input" && (
                  <div className="p-0 relative">
                    <button
                      onClick={() => setIsWithdrawOpen(false)}
                      className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-all z-20 group"
                    >
                      <X size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                    </button>

                    <div className="p-6 pb-2 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#1a4d46] text-white flex items-center justify-center text-xl font-bold">
                        {user?.companyName?.charAt(0) || "L"}
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                          {user?.companyName || "Lender Profile"}
                        </h2>
                        <div className="flex items-center gap-1 opacity-70">
                          <ShieldCheck size={12} className="text-emerald-500 fill-emerald-500/10" />
                          <span className="text-[10px] font-bold text-slate-500 tracking-tight uppercase">PayNidhi Trusted Lender</span>
                        </div>
                      </div>
                    </div>

                    <div className="px-6 py-4">
                      <div className="border border-slate-100 rounded-2xl p-4 mb-4 bg-slate-50/30">
                        <p className="text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wider">Transfer Funds To</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center">
                              <Landmark size={18} className="text-slate-400" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-700">Primary Bank Account</p>
                              <p className="text-[10px] text-slate-400 font-mono">XXXX 8921</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[11px] font-bold text-slate-400 px-1 uppercase tracking-wider">Amount</p>
                        <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between group focus-within:border-emerald-300 transition-all">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <IndianRupee size={22} className="text-[#0f8f79]/60 mr-1.5" strokeWidth={3} />
                              <input
                                type="number"
                                value={withdrawAmount}
                                onChange={(e) => {
                                  if (Number(e.target.value) <= walletData.balance) {
                                    setWithdrawAmount(e.target.value);
                                  } else {
                                    setWithdrawAmount(walletData.balance.toString());
                                    toast.error("Exceeds balance");
                                  }
                                }}
                                className="w-full bg-transparent text-2xl font-black text-slate-800 focus:outline-none placeholder:text-slate-200"
                                placeholder="0"
                                autoFocus
                              />
                            </div>
                          </div>
                          {withdrawAmount && Number(withdrawAmount) > 0 && (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-white px-2 py-1 rounded-md border border-emerald-100">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Verified
                            </div>
                          )}
                        </div>
                        <div className="flex justify-between px-1">
                          <button
                            type="button"
                            onClick={() => setWithdrawAmount(walletData.balance.toString())}
                            className="text-[10px] font-bold text-[#0f8f79] hover:underline"
                          >
                            Use Max: {formatCurrency(walletData.balance)}
                          </button>
                          {withdrawAmount && <span className="text-[10px] font-bold text-slate-400">IMPS Enabled</span>}
                        </div>
                      </div>
                    </div>

                    <div className="p-6 pt-2 space-y-4">
                      <button
                        onClick={handleWithdraw}
                        disabled={!withdrawAmount || Number(withdrawAmount) <= 0}
                        className="w-full bg-[#1a4d46] hover:bg-[#143b35] text-white py-4 rounded-2xl font-bold text-base shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
                      >
                        Verify & Withdraw
                      </button>

                      <div className="flex flex-col items-center gap-1.5 opacity-60">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Secured by</span>
                          <div className="flex items-center gap-0.5 text-[#1a4d46] font-black italic tracking-tighter">
                            <div className="w-4 h-4 bg-[#1a4d46] rounded-sm flex items-center justify-center mr-0.5">
                              <IndianRupee size={10} className="text-white" strokeWidth={4} />
                            </div>
                            PAYNIDHI
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {withdrawStep === "processing" && (
                  <div className="p-8 pb-12 flex flex-col items-center text-center bg-white min-h-[360px] justify-between">
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-slate-800">Confirming Payment</h3>
                      <p className="text-xs text-slate-400 font-medium">This will only take a few seconds.</p>
                    </div>

                    <div className="relative py-12">
                      <motion.div
                        animate={{
                          rotateY: [0, 180, 360],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                        className="w-20 h-20 rounded-full bg-[#FFD700] border-[3px] border-[#E6B800] shadow-[0_0_30px_rgba(255,215,0,0.3)] flex items-center justify-center relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent" />
                        <div className="w-16 h-16 rounded-full border border-[#E6B800]/50" />
                      </motion.div>

                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1.5, opacity: [0, 0.4, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-x-0 inset-y-0 -m-8 border-2 border-yellow-200/20 rounded-full"
                      />
                    </div>

                    <div className="w-full max-w-[200px] space-y-6">
                      <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: "0%" }}
                          animate={{ width: `${progress}%` }}
                          className="h-full bg-[#1a4d46] rounded-full"
                        />
                      </div>

                      <div className="flex flex-col items-center gap-1.5 opacity-60">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Secured by</span>
                          <div className="flex items-center gap-0.5 text-[#1a4d46] font-black italic tracking-tighter">
                            <div className="w-4 h-4 bg-[#1a4d46] rounded-sm flex items-center justify-center mr-0.5">
                              <IndianRupee size={10} className="text-white" strokeWidth={4} />
                            </div>
                            PAYNIDHI
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {withdrawStep === "success" && (
                  <div className="p-10 flex flex-col items-center text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }}
                      className="w-24 h-24 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-2xl shadow-emerald-200 mb-8 border-[6px] border-emerald-50"
                    >
                      <ShieldCheck size={48} strokeWidth={2.5} />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <h3 className="text-3xl font-black text-slate-900 mb-2">Success!</h3>
                      <p className="text-slate-500 font-bold mb-8">
                        {formatCurrency(withdrawAmount)} is on its way to your bank account.
                      </p>

                      <div className="bg-slate-50 rounded-[1.5rem] p-5 border border-slate-100 mb-8 text-left">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Transaction ID</span>
                          <span className="text-[11px] font-black text-slate-900 font-mono">WD-{Date.now().toString().slice(-8)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Est. Arrival</span>
                          <span className="text-[11px] font-black text-[#0f8f79]">Instant (IMPS)</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setIsWithdrawOpen(false);
                          setWithdrawStep("input");
                          setWithdrawAmount("");
                        }}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-black transition-all active:scale-95 shadow-xl shadow-slate-200"
                      >
                        Done
                      </button>
                    </motion.div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{
        __html: `
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

export default LenderWallet;