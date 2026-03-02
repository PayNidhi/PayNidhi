import React, { useState, useEffect, useCallback, useRef } from "react";
import LenderNav from "../../components/lender/LenderNav";
import LenderHeader from "../../components/lender/LenderHeader";
import {
  ShieldCheck, Store, Wallet, Activity,
  Gavel, Zap, Users, Lock, FileText
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE_URL = "http://localhost:5001";

// Animation Variants defined locally to fix the SyntaxError
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: "spring", 
      stiffness: 300, 
      damping: 24 
    } 
  }
};

const LenderDashboard = () => {
  const [activeKey, setActiveKey] = useState("overview");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  
  const [recentBids, setRecentBids] = useState([]);
  const [loadingBids, setLoadingBids] = useState(true);

  const isKycComplete = Boolean(user?.isOnboarded && user?.kycStatus === "verified");
  const firstName = user?.companyName?.split(" ")[0] || "Lender";

  const hasToasted = useRef(false);

  const navigateToKyc = useCallback(() => navigate("/lender/kyc"), [navigate]);

  const handleNavClick = useCallback(
    (key) => {
      if (!isKycComplete && key !== "overview") {
        toast.error("Complete KYC first");
        navigateToKyc();
        return;
      }
      setActiveKey(key);
      setIsMobileOpen(false);
    },
    [isKycComplete, navigateToKyc]
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // --- Show Greeting Toast strictly ONCE ---
  useEffect(() => {
    if (!hasToasted.current && firstName) {
      toast(`${getGreeting()}, ${firstName}!`, {
        icon: '✨',
        style: {
          borderRadius: '12px',
          background: '#fff',
          color: '#334155',
          fontSize: '12px',
          fontWeight: '500',
          border: '1px solid #f1f5f9',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        },
      });
      hasToasted.current = true;
    }
  }, [firstName]);

  // --- Fetch Summary Data ---
  useEffect(() => {
    let isMounted = true;
    const fetchSummary = async () => {
      try {
        setLoadingSummary(true);
        const res = await fetch(`${API_BASE_URL}/api/lender/dashboard-summary`, { credentials: "include" });
        if (!res.ok) throw new Error("API not yet implemented");
        const data = await res.json();
        if (isMounted) setSummary(data);
      } catch (err) {
        if (isMounted) setSummary({
          totalInvested: 28000000, availableCapital: 50000000, activeBids: 12, totalMSMEs: 15, avgYield: "16.4%", trustScore: 850
        });
      } finally {
        if (isMounted) setLoadingSummary(false);
      }
    };
    fetchSummary();
    return () => { isMounted = false; };
  }, []);

  // --- Fetch Recent Bids ---
  useEffect(() => {
    let isMounted = true;
    const fetchBids = async () => {
      try {
        setLoadingBids(true);
        const res = await fetch(`${API_BASE_URL}/api/lender/my-bids`, { credentials: "include" });
        if (!res.ok) throw new Error("API failed");
        const data = await res.json();
        if (isMounted) setRecentBids(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Using empty bids due to error:", err);
      } finally {
        if (isMounted) setLoadingBids(false);
      }
    };
    fetchBids();
    return () => { isMounted = false; };
  }, []);

  const statusData = summary?.portfolioStatusCounts
    ? Object.entries(summary.portfolioStatusCounts).map(([name, value]) => ({ name, value }))
    : [{ name: "Active", value: 16 }, { name: "Pending", value: 32 }, { name: "Completed", value: 24 }];

  const areaChartData = summary?.deployedByMonth && summary.deployedByMonth.length > 0
    ? summary.deployedByMonth
    : [
        { name: 'Jan', value: 10 }, { name: 'Feb', value: 20 }, { name: 'Mar', value: 15 },
        { name: 'Apr', value: 25 }, { name: 'May', value: 18 }, { name: 'Jun', value: 30 },
        { name: 'Jul', value: 22 }, { name: 'Aug', value: 35 }, { name: 'Sep', value: 28 },
        { name: 'Oct', value: 40 }, { name: 'Nov', value: 30 }, { name: 'Dec', value: 45 }
      ];

  return (
    <div className="flex bg-[#F8FAFC] font-sans text-slate-800" style={{ height: '100dvh', overflow: 'hidden' }}>
      
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#D9FAF2]/30 rounded-full blur-[120px] pointer-events-none z-0"></div>
      
      <LenderNav
        activeKey={activeKey}
        onChange={handleNavClick}
        isKycComplete={isKycComplete}
        navigateToKyc={navigateToKyc}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        onHoverChange={setIsSidebarHovered}
      />

      <div className={`flex-1 flex flex-col relative z-10 min-w-0 h-full transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isSidebarHovered ? 'lg:ml-64' : 'lg:ml-[72px]'}`}>
        
        <header className="flex-none z-30">
          <LenderHeader onLogout={logout} onToggleSidebar={() => setIsMobileOpen(true)} />
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden w-full custom-scrollbar">
          <main className="w-full px-4 sm:px-6 lg:px-8 pt-3 pb-28 lg:pb-12">
            <div className="w-full max-w-[1200px] mx-auto">

              <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8 mt-2 w-full min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#0f8f79] shadow-sm flex items-center justify-center text-white text-sm sm:text-base font-semibold shrink-0 ring-4 ring-white">
                  {firstName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-base sm:text-lg md:text-[22px] font-semibold text-slate-800 tracking-tight truncate">
                    Welcome, {firstName}
                  </h1>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">Here's your treasury overview today.</p>
                </div>
              </div>

              {!isKycComplete && (
                <div className="bg-white rounded-[1rem] p-3 sm:p-4 shadow-[0_2px_15px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 sm:mb-8 border border-amber-100">
                  <div className="flex items-center gap-3 pl-1">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                      <ShieldCheck size={16} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 text-[11px] sm:text-xs">Action Required</h3>
                      <p className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5">Complete identity verification to unlock marketplace.</p>
                    </div>
                  </div>
                  <button onClick={navigateToKyc} className="w-full sm:w-auto px-4 sm:px-5 py-2 bg-slate-800 text-white text-[10px] sm:text-[11px] font-medium rounded-lg hover:bg-slate-700 transition-all text-center shadow-sm hover:shadow-md hover:-translate-y-0.5">
                    Verify Now
                  </button>
                </div>
              )}

              <div className="flex flex-col xl:flex-row gap-5 lg:gap-6">
                
                <div className="w-full xl:w-[55%] flex flex-col gap-5 lg:gap-6">
                  
                  <div>
                    <h2 className="text-sm font-semibold text-slate-800 mb-3 sm:mb-4 px-1">Analytics</h2>
                    
                    <motion.div 
                      variants={containerVariants}
                      initial="hidden"
                      animate="show"
                      className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5"
                    >
                      <motion.div variants={cardVariants} className="bg-white rounded-[1.25rem] sm:rounded-[1.5rem] p-4 sm:p-5 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-50 flex flex-col items-center text-center hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(15,143,121,0.08)] transition-all duration-300 min-h-[160px] sm:min-h-[200px]">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-[14px] bg-[#0f8f79] text-white flex items-center justify-center mb-auto shadow-lg shadow-[#0f8f79]/20 transition-transform">
                          <Zap size={20} className="sm:w-[22px] sm:h-[22px] opacity-90"/>
                        </div>
                        <div className="mt-3 sm:mt-4 mb-2 sm:mb-3 w-full">
                          <p className="text-[10px] sm:text-[11px] md:text-[13px] font-semibold text-slate-400 mb-1 sm:mb-1.5">Invested</p>
                          <h3 className="text-lg sm:text-xl md:text-[28px] font-bold text-slate-800 tracking-tight leading-none truncate">{summary ? formatCurrencyCompact(summary.totalInvested) : "₹0"}</h3>
                        </div>
                        <div className="text-[9px] sm:text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg border border-emerald-100/50 w-fit">
                          + 6.4%
                        </div>
                      </motion.div>

                      <motion.div variants={cardVariants} className="bg-white rounded-[1.25rem] sm:rounded-[1.5rem] p-4 sm:p-5 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-50 flex flex-col items-center text-center hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(71,196,183,0.08)] transition-all duration-300 min-h-[160px] sm:min-h-[200px]">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-[14px] bg-[#47C4B7] text-white flex items-center justify-center mb-auto shadow-lg shadow-[#47C4B7]/20 transition-transform">
                          <Wallet size={20} className="sm:w-[22px] sm:h-[22px]" />
                        </div>
                        <div className="mt-3 sm:mt-4 mb-2 sm:mb-3 w-full">
                          <p className="text-[10px] sm:text-[11px] md:text-[13px] font-semibold text-slate-400 mb-1 sm:mb-1.5">Available</p>
                          <h3 className="text-lg sm:text-xl md:text-[28px] font-bold text-slate-800 tracking-tight leading-none truncate">{summary ? formatCurrencyCompact(summary.availableCapital) : "₹0"}</h3>
                        </div>
                        <div className="text-[9px] sm:text-[10px] font-bold text-rose-500 bg-rose-50 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg border border-rose-100/50 w-fit">
                          - 3.1%
                        </div>
                      </motion.div>

                      <motion.div variants={cardVariants} className="bg-white rounded-[1.25rem] sm:rounded-[1.5rem] p-4 sm:p-5 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-50 flex flex-col items-center text-center hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(51,65,85,0.08)] transition-all duration-300 min-h-[160px] sm:min-h-[200px]">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-[14px] bg-slate-700 text-white flex items-center justify-center mb-auto shadow-lg shadow-slate-700/20 transition-transform">
                          <Gavel size={20} className="sm:w-[22px] sm:h-[22px]" />
                        </div>
                        <div className="mt-3 sm:mt-4 mb-2 sm:mb-3 w-full">
                          <p className="text-[10px] sm:text-[11px] md:text-[13px] font-semibold text-slate-400 mb-1 sm:mb-1.5">Active Bids</p>
                          <h3 className="text-lg sm:text-xl md:text-[28px] font-bold text-slate-800 tracking-tight leading-none truncate">{summary?.activeBids || 0}</h3>
                        </div>
                        <div className="text-[9px] sm:text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg border border-emerald-100/50 w-fit">
                          + 10.3%
                        </div>
                      </motion.div>

                      <motion.div variants={cardVariants} className="bg-white rounded-[1.25rem] sm:rounded-[1.5rem] p-4 sm:p-5 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-50 flex flex-col items-center text-center hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(20,184,166,0.08)] transition-all duration-300 min-h-[160px] sm:min-h-[200px]">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-[14px] bg-[#14b8a6] text-white flex items-center justify-center mb-auto shadow-lg shadow-teal-500/20 transition-transform">
                          <Store size={20} className="sm:w-[22px] sm:h-[22px]" />
                        </div>
                        <div className="mt-3 sm:mt-4 mb-2 sm:mb-3 w-full">
                          <p className="text-[10px] sm:text-[11px] md:text-[13px] font-semibold text-slate-400 mb-1 sm:mb-1.5">MSMEs</p>
                          <h3 className="text-lg sm:text-xl md:text-[28px] font-bold text-slate-800 tracking-tight leading-none truncate">{summary?.totalMSMEs || 0}</h3>
                        </div>
                        <div className="text-[9px] sm:text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg border border-emerald-100/50 w-fit">
                          + 12.1%
                        </div>
                      </motion.div>
                    </motion.div>
                  </div>

                  <div className="mt-1 sm:mt-2">
                    <div className="flex items-center justify-between mb-3 sm:mb-4 px-1">
                      <h2 className="text-sm font-semibold text-slate-800 tracking-tight">Trust & Recent Activity</h2>
                      <button onClick={() => navigate("/lender/marketplace")} disabled={!isKycComplete} className="text-[10px] font-medium text-[#0f8f79] hover:underline disabled:opacity-50">
                        View all &rarr;
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-5">
                      
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
                              {summary?.trustScore || 850}
                            </span>
                            <span className="text-[10px] sm:text-[11px] font-mono text-emerald-300/80">/ 900</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-end z-10">
                          <div className="min-w-0 pr-2">
                            <p className="text-[8px] sm:text-[9px] text-emerald-200/60 uppercase tracking-widest mb-0.5 sm:mb-1">Cardholder</p>
                            <p className="text-[10px] sm:text-[11px] font-medium tracking-widest uppercase text-emerald-50 truncate">{user?.companyName || "Lender Profile"}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[8px] sm:text-[9px] text-emerald-200/60 uppercase tracking-widest mb-0.5 sm:mb-1">Status</p>
                            <p className="text-[10px] sm:text-[11px] font-medium tracking-widest uppercase text-emerald-300">Excellent</p>
                          </div>
                        </div>
                      </motion.div>
                      
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 24, delay: 0.2 }}
                        className="bg-white rounded-[1.25rem] sm:rounded-[1.5rem] p-4 sm:p-5 shadow-[0_2px_15px_rgba(0,0,0,0.02)] border border-slate-50 flex flex-col min-w-0 h-[140px] sm:h-[150px]"
                      >
                        <div className="flex justify-between items-center mb-3 sm:mb-4">
                          <h4 className="text-[10px] sm:text-[11px] font-semibold text-slate-700 uppercase tracking-widest truncate">Yield</h4>
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

                      {loadingBids ? (
                        <div className="h-[140px] sm:h-[150px] bg-white rounded-[1.25rem] sm:rounded-[1.5rem] shadow-sm animate-pulse"></div>
                      ) : recentBids.length === 0 ? (
                         <motion.div 
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 24 }}
                            className="h-[140px] sm:h-[150px] bg-white rounded-[1.25rem] sm:rounded-[1.5rem] p-4 sm:p-5 text-center shadow-sm border border-slate-50 flex flex-col items-center justify-center col-span-1 md:col-span-2"
                         >
                          <p className="text-[11px] sm:text-[12px] font-medium text-slate-500 mb-2 sm:mb-3">No active deployments.</p>
                          <button onClick={() => navigate("/lender/marketplace")} disabled={!isKycComplete} className="px-4 sm:px-5 py-2 sm:py-2.5 bg-[#0f8f79] text-white text-[10px] sm:text-[11px] font-medium rounded-lg hover:bg-[#0c7865] transition-colors disabled:opacity-50">
                            Explore
                          </button>
                        </motion.div>
                      ) : (
                        recentBids.slice(0, 2).map((bid, index) => (
                          <motion.div 
                            key={bid._id} 
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 24, delay: index * 0.1 }}
                            onClick={() => navigate("/lender/bids")}
                            className="bg-white rounded-[1.25rem] sm:rounded-[1.5rem] p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-50 flex flex-col justify-between h-[140px] sm:h-[150px] hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all cursor-pointer group"
                          >
                            <div className="flex justify-between items-start">
                              <div className="pr-2 min-w-0">
                                <h4 className="font-semibold text-slate-800 text-xs sm:text-[14px] truncate tracking-tight">{bid.invoice?.seller?.companyName || "Borrower Profile"}</h4>
                                <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 sm:mt-1.5 line-clamp-2 leading-relaxed">Invoice financing deployment with {bid.interestRate}% IRR return rate.</p>
                              </div>
                              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-[10px] sm:rounded-[12px] bg-[#F3FBF9] flex items-center justify-center text-[#0f8f79] shrink-0 border border-[#0f8f79]/10 group-hover:scale-110 transition-transform">
                                <FileText size={16} className="sm:w-[18px] sm:h-[18px]"/>
                              </div>
                            </div>
                            
                            <div className="flex items-end justify-between mt-2">
                              <div className="min-w-0 pr-2">
                                <p className="text-lg sm:text-[20px] font-bold text-slate-800 leading-none tracking-tight truncate">{formatCurrencyCompact(bid.loanAmount)}</p>
                                <p className="text-[8px] sm:text-[9px] font-semibold text-slate-400 mt-1 sm:mt-1.5 uppercase tracking-widest truncate">Amount</p>
                              </div>
                              <button className="px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-[9px] sm:text-[10px] font-medium text-slate-600 transition-colors border border-slate-100/50 group-hover:text-[#0f8f79]">
                                Detail
                              </button>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="w-full xl:w-[45%] flex flex-col gap-5 lg:gap-6 mt-1 sm:mt-2 xl:mt-[42px]">
                  
                  <div className="bg-white rounded-[1.25rem] sm:rounded-[1.5rem] p-4 sm:p-5 md:p-7 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-50 flex flex-col">
                    <div className="flex justify-between items-start mb-4 sm:mb-5 md:mb-6">
                      <div className="min-w-0 pr-2">
                        <h3 className="font-semibold text-slate-800 text-[13px] sm:text-sm tracking-tight truncate">Deployment Trajectory</h3>
                        <p className="text-[9px] sm:text-[10px] font-medium text-slate-400 mt-0.5 sm:mt-1 truncate">Capital invested</p>
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
                            formatter={(value) => [`₹${value.toLocaleString()}`, 'Deployed']}
                          />
                          <Area type="monotone" dataKey="value" stroke="#0f8f79" strokeWidth={2} fillOpacity={1} fill="url(#colorChart)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-white rounded-[1rem] sm:rounded-[1.25rem] p-2.5 sm:p-3 md:p-4 flex items-center shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-slate-50">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[8px] sm:rounded-[10px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0 mr-2.5 sm:mr-3">
                        <Store size={14} className="sm:w-[14px] sm:h-[14px]"/>
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                         <span className="text-[8px] sm:text-[9px] font-medium text-slate-400 uppercase tracking-wide truncate mb-0.5">Active</span>
                         <span className="font-semibold text-slate-800 text-xs sm:text-sm">{statusData[0]?.value || 16}</span>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-[1rem] sm:rounded-[1.25rem] p-2.5 sm:p-3 md:p-4 flex items-center shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-slate-50">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[8px] sm:rounded-[10px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0 mr-2.5 sm:mr-3">
                        <FileText size={14} className="sm:w-[14px] sm:h-[14px]"/>
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                         <span className="text-[8px] sm:text-[9px] font-medium text-slate-400 uppercase tracking-wide truncate mb-0.5">Pending</span>
                         <span className="font-semibold text-slate-800 text-xs sm:text-sm">{statusData[1]?.value || 32}</span>
                      </div>
                    </div>

                    <div className="bg-white rounded-[1rem] sm:rounded-[1.25rem] p-2.5 sm:p-3 md:p-4 flex items-center shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-slate-50">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[8px] sm:rounded-[10px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0 mr-2.5 sm:mr-3">
                        <Users size={14} className="sm:w-[14px] sm:h-[14px]"/>
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                         <span className="text-[8px] sm:text-[9px] font-medium text-slate-400 uppercase tracking-wide truncate mb-0.5">Team</span>
                         <span className="font-semibold text-slate-800 text-xs sm:text-sm">24</span>
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
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 0px; display: none; }
        body { font-family: 'Inter', 'Poppins', sans-serif; }
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

export default LenderDashboard;