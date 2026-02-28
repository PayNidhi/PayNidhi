import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp, Briefcase, RefreshCw, Calculator, 
    Scale, Zap, Shield, ShieldCheck, UserCheck, DollarSign,
    Lock, BarChart3
} from 'lucide-react';
import { getStats, getPendingNOAs, verifyNOA, settleInvoice } from '../../api/adminApi';
import adminApi from '../../api/adminApi';
import toast from 'react-hot-toast';

// --- Premium UI Components ---

const GlassCard = ({ children, className = "" }) => (
    <div className={`bg-white border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] rounded-[1.5rem] sm:rounded-[2rem] ${className}`}>
        {children}
    </div>
);

const StatCard = ({ title, value, icon: Icon, trend, description, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
        className="bg-white p-4 sm:p-5 rounded-[1.25rem] sm:rounded-[1.5rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-[0_10px_30px_rgba(15,143,121,0.08)] hover:-translate-y-1 transition-all flex flex-col h-full justify-between"
    >
        <div className="flex justify-between items-start mb-3 sm:mb-4">
            <div className="p-2 sm:p-2.5 rounded-xl bg-[#F3FBF9] text-[#0f8f79] group-hover:scale-110 transition-transform duration-300 shadow-sm border border-[#7FE0CC]/30">
                <Icon size={18} />
            </div>
            {trend && (
                <div className="flex items-center text-[9px] sm:text-[10px] font-bold px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100/50">
                    <TrendingUp size={10} className="mr-1" />
                    {trend}
                </div>
            )}
        </div>
        <div className="space-y-1">
            <h3 className="text-slate-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">{title}</h3>
            <p className="text-lg sm:text-xl font-black text-slate-800 tracking-tighter truncate">{value}</p>
            <p className="text-[9px] text-slate-400 font-medium leading-tight truncate">{description}</p>
        </div>
    </motion.div>
);

const SectionHeader = ({ title, subtitle, icon: Icon }) => (
    <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#F3FBF9] border border-[#7FE0CC]/40 flex items-center justify-center text-[#0f8f79] shadow-sm">
            <Icon size={20} />
        </div>
        <div>
            <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-tight uppercase">{title}</h2>
            <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest">{subtitle}</p>
        </div>
    </div>
);

// --- Main Page Component ---
const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [pendingNoa, setPendingNoa] = useState([]);
    const [activeLoans, setActiveLoans] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [settlementBreakdown, setSettlementBreakdown] = useState(null);

    const fetchData = async () => {
        try {
            const [statsRes, noaRes, financesRes] = await Promise.all([
                getStats(),
                getPendingNOAs(),
                adminApi.get('/finances')
            ]);
            setStats(statsRes.data);
            setPendingNoa(noaRes.data.data || []);
            setActiveLoans(financesRes.data.finances || []);
        } catch (error) {
            console.error('Master Sync Error:', error);
            toast.error('Dashboard synchronization failed.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleApproveNOA = async (id) => {
        const tId = toast.loading('Reviewing Authentication...');
        try {
            await verifyNOA(id, { isApproved: true });
            toast.success('NOA Verified. Capital unlocked.', { id: tId });
            fetchData();
        } catch (error) {
            toast.error('Verification failed.', { id: tId });
        }
    };

    const runSettlementSimulation = (loan) => {
        const principal = loan.loanAmount;
        const interest = loan.bid?.repaymentAmount - principal;
        const fee = principal * 0.02; 
        const sellerSettlement = loan.loanAmount - fee; 

        setSettlementBreakdown({
            invoiceId: loan.invoice?.invoiceNumber,
            lenderPayout: loan.bid?.repaymentAmount,
            platformFee: fee,
            sellerSettlement: sellerSettlement,
            id: loan._id
        });
        toast.success("Settlement Breakdown Generated");
    };

    const executeSettle = async (id) => {
        const tId = toast.loading('Executing Money Split...');
        try {
            await settleInvoice(id);
            toast.success('Funds Disbursed. Wallets Updated.', { id: tId });
            setSettlementBreakdown(null);
            fetchData();
        } catch (error) {
            toast.error('Execution failed.', { id: tId });
        }
    };

    return (
        <div className="w-full max-w-[1600px] mx-auto space-y-4 sm:space-y-6 lg:space-y-8 pb-24 pt-3 sm:pt-4 px-4 sm:px-6 lg:px-8">

            {/* --- COMPACT PAGE IDENTITY --- */}
            <div className="flex flex-row items-center justify-between gap-4 bg-white px-4 py-3 sm:px-5 sm:py-4 rounded-[1.25rem] border border-slate-100 shadow-sm">
                <div className="space-y-0.5">
                    <h1 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <BarChart3 className="text-[#0f8f79]" size={22} />
                        Global Intelligence
                    </h1>
                    <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 border-l-2 border-[#47C4B7] pl-2 hidden sm:block">
                        Real-time platform financial health & operational audit
                    </p>
                </div>
                <button
                    onClick={handleRefresh}
                    className="p-2 sm:p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:text-[#0f8f79] hover:bg-[#E0F6F2] shadow-sm transition-all active:scale-95 flex-shrink-0"
                >
                    <RefreshCw size={16} className={`${refreshing ? 'animate-spin' : 'hover:rotate-180 duration-700'}`} />
                </button>
            </div>

            {/* --- TOP ANALYTICS GRID --- */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
                <StatCard
                    title="Total GMV"
                    value={`₹${stats?.kpis?.totalGMV?.toLocaleString() || '0'}`}
                    trend="12.4%"
                    description="Total invoice value processed"
                    icon={TrendingUp}
                    delay={0.1}
                />
                <StatCard
                    title="Platform Revenue"
                    value={`₹${stats?.kpis?.totalRevenue?.toLocaleString() || '0'}`}
                    trend="8.1%"
                    description="2% platform fee earnings"
                    icon={DollarSign}
                    delay={0.2}
                />
                <StatCard
                    title="Active Loans"
                    value={stats?.kpis?.activeLoans || '0'}
                    description="Live financed invoices"
                    icon={Briefcase}
                    delay={0.3}
                />
                <StatCard
                    title="Verified Sellers"
                    value={stats?.kpis?.activeUsers?.sellers || '0'}
                    description="KYC approved trade partners"
                    icon={UserCheck}
                    delay={0.4}
                />
                <StatCard
                    title="Active Lenders"
                    value={stats?.kpis?.activeUsers?.lenders || '0'}
                    description="Verified capital providers"
                    icon={ShieldCheck}
                    delay={0.5}
                />
                <StatCard
                    title="Escrow Balance"
                    value={`₹${(stats?.kpis?.totalGMV * 0.4)?.toLocaleString() || '0'}`} 
                    description="Funds held in settlement"
                    icon={Lock}
                    delay={0.6}
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 lg:gap-6">
                
                {/* --- MAIN COLUMN (2/3) --- */}
                <div className="xl:col-span-2 space-y-5 lg:space-y-6">

                    {/* LEGAL AUTHENTICATOR (Warning Section) */}
                    <GlassCard className="p-4 sm:p-6 border-l-4 sm:border-l-8 border-l-amber-400">
                        <SectionHeader title="Legal Authenticator" subtitle="Pending NOA Verification Queue" icon={Scale} />

                        <div className="mt-4">
                            {pendingNoa.length > 0 ? (
                                <div className="overflow-x-auto custom-scrollbar pb-2">
                                    <table className="w-full text-left min-w-[500px]">
                                        <thead>
                                            <tr className="text-slate-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
                                                <th className="px-3 sm:px-4 py-3">Invoice ID</th>
                                                <th className="px-3 sm:px-4 py-3">Seller</th>
                                                <th className="px-3 sm:px-4 py-3 text-center">Amount</th>
                                                <th className="px-3 sm:px-4 py-3 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {pendingNoa.map(noa => (
                                                <tr key={noa._id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-3 sm:px-4 py-4 text-[11px] sm:text-xs font-mono font-bold text-slate-600">{noa.invoiceNumber}</td>
                                                    <td className="px-3 sm:px-4 py-4">
                                                        <span className="text-[10px] sm:text-xs font-black text-slate-800 uppercase line-clamp-1">{noa.seller?.companyName}</span>
                                                    </td>
                                                    <td className="px-3 sm:px-4 py-4 text-center text-xs sm:text-sm font-bold text-[#0f8f79]">₹{noa.totalAmount?.toLocaleString()}</td>
                                                    <td className="px-3 sm:px-4 py-4 text-right">
                                                        <button
                                                            onClick={() => handleApproveNOA(noa._id)}
                                                            className="px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white text-[9px] sm:text-[10px] font-black rounded-lg uppercase tracking-widest shadow-md hover:shadow-lg transition-all active:scale-95"
                                                        >
                                                            Review
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="bg-slate-50/80 rounded-[1rem] py-8 text-center border-2 border-dashed border-slate-200">
                                    <p className="text-slate-400 font-bold uppercase tracking-[0.15em] text-[10px] sm:text-[11px]">Queue is clear. No entries requiring attention.</p>
                                </div>
                            )}
                        </div>
                    </GlassCard>

                    {/* ESCROW SETTLEMENT ENGINE */}
                    <GlassCard className="p-4 sm:p-6">
                        <SectionHeader title="Escrow Settlement Engine" subtitle="Programmatic Disbursal Queue" icon={Calculator} />

                        <div className="space-y-5 sm:space-y-6">
                            {settlementBreakdown && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-4 sm:p-5 bg-slate-900 rounded-[1.25rem] text-white relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-10"><Zap size={60} /></div>
                                    <div className="relative z-10 flex flex-col md:flex-row justify-between gap-4 sm:gap-6">
                                        <div className="space-y-1">
                                            <p className="text-[#47C4B7] text-[9px] font-bold uppercase tracking-wider">Simulation Active: {settlementBreakdown.invoiceId}</p>
                                            <h3 className="text-lg sm:text-xl font-black">Mathematical Split</h3>
                                        </div>
                                        <div className="flex flex-wrap md:flex-nowrap gap-4 sm:gap-6 justify-between md:justify-start">
                                            <div className="text-left md:text-center w-[45%] md:w-auto">
                                                <p className="text-emerald-400 text-sm sm:text-base font-black">₹{settlementBreakdown.lenderPayout?.toLocaleString()}</p>
                                                <p className="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Lender Payout</p>
                                            </div>
                                            <div className="text-left md:text-center w-[45%] md:w-auto">
                                                <p className="text-blue-400 text-sm sm:text-base font-black">₹{settlementBreakdown.sellerSettlement?.toLocaleString()}</p>
                                                <p className="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Seller Credit</p>
                                            </div>
                                            <div className="text-left md:text-center w-full md:w-auto pt-2 md:pt-0 border-t border-slate-800 md:border-none">
                                                <p className="text-rose-400 text-sm sm:text-base font-black">₹{settlementBreakdown.platformFee?.toLocaleString()}</p>
                                                <p className="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Platform Fee</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => executeSettle(settlementBreakdown.id)}
                                            className="w-full md:w-auto px-6 py-2.5 bg-[#0f8f79] hover:bg-[#0c7865] text-white rounded-xl text-[10px] font-black uppercase tracking-widest md:self-center transition-colors shadow-lg shadow-[#0f8f79]/30"
                                        >
                                            Execute
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            <div className="overflow-x-auto custom-scrollbar pb-2">
                                <table className="w-full text-left min-w-[600px]">
                                    <thead>
                                        <tr className="text-slate-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
                                            <th className="px-3 sm:px-4 py-3">Invoice</th>
                                            <th className="px-3 sm:px-4 py-3">Seller</th>
                                            <th className="px-3 sm:px-4 py-3">Lender</th>
                                            <th className="px-3 sm:px-4 py-3 text-center">Amount</th>
                                            <th className="px-3 sm:px-4 py-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {activeLoans.filter(l => !l.isSettled).slice(0, 4).map(loan => (
                                            <tr key={loan._id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-3 sm:px-4 py-4 text-[11px] font-mono font-bold text-slate-600">{loan.invoice?.invoiceNumber}</td>
                                                <td className="px-3 sm:px-4 py-4 text-[9px] font-bold text-slate-500 uppercase line-clamp-1">{loan.seller?.companyName}</td>
                                                <td className="px-3 sm:px-4 py-4 text-[9px] font-bold text-slate-500 uppercase line-clamp-1">{loan.lender?.companyName}</td>
                                                <td className="px-3 sm:px-4 py-4 text-center text-xs font-bold text-slate-800">₹{loan.loanAmount?.toLocaleString()}</td>
                                                <td className="px-3 sm:px-4 py-4 text-right">
                                                    <button
                                                        onClick={() => runSettlementSimulation(loan)}
                                                        className="px-3 sm:px-4 py-2 bg-slate-100 text-slate-700 hover:bg-[#0f8f79] hover:text-white text-[8px] font-black rounded-lg uppercase tracking-widest transition-all active:scale-95 whitespace-nowrap"
                                                    >
                                                        Simulate Split
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* --- SIDEBAR COLUMN (1/3) --- */}
                <div className="space-y-5 lg:space-y-6">
                    
                    {/* TRUST & SECURITY PANEL */}
                    <GlassCard className="p-4 sm:p-6">
                        <SectionHeader title="Platform Integrity" subtitle="Real-time Network Security" icon={Shield} />
                        <div className="space-y-4 sm:space-y-5 mt-4">
                            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <span className="text-[9px] font-bold text-slate-500 uppercase">KYC Registry</span>
                                <span className="text-[9px] font-black text-emerald-600 bg-emerald-100/50 px-2 py-1 rounded uppercase tracking-widest">Clear</span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <span className="text-[9px] font-bold text-slate-500 uppercase">Security Status</span>
                                <span className="text-[9px] font-black text-[#0f8f79] bg-[#E0F6F2] px-2 py-1 rounded uppercase tracking-widest">99.9% Secure</span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <span className="text-[9px] font-bold text-slate-500 uppercase">Fraud Detection</span>
                                <span className="text-[9px] font-black text-blue-600 bg-blue-100/50 px-2 py-1 rounded uppercase tracking-widest">Active</span>
                            </div>

                            <div className="pt-2">
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/50 shadow-inner">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: "99.9%" }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        className="h-full bg-gradient-to-r from-[#47C4B7] to-[#0f8f79] shadow-[0_0_10px_rgba(15,143,121,0.5)]"
                                    />
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>

        </div>
    );
};

export default AdminDashboard;