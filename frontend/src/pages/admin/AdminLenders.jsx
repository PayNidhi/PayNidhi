import React, { useState, useEffect } from 'react';
import {
    Zap, Mail, Landmark, Building,
    Plus, Edit, Trash2, Lock, Unlock
} from 'lucide-react';
import { PremiumTable } from '../../components/admin/exports';
import { getLenders, toggleUser } from '../../api/adminApi';
import toast from 'react-hot-toast';

const AdminLenders = () => {
    const [lenders, setLenders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const fetchLenders = async () => {
        try {
            setLoading(true);
            const res = await getLenders();
            setLenders(res.data.lenders || []);
        } catch (error) {
            toast.error("Failed to fetch lender data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLenders();
    }, []);

    const handleToggle = async (id, currentStatus) => {
        try {
            await toggleUser('lender', id, { isActive: !currentStatus });
            toast.success(`Lender ${!currentStatus ? 'activated' : 'suspended'}`);
            fetchLenders();
        } catch (error) {
            toast.error("Status update failed");
        }
    };

    const filteredData = lenders.filter(l =>
        l.companyName?.toLowerCase().includes(search.toLowerCase()) ||
        l.email?.toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        {
            header: "ENTITY NAME",
            render: (row) => (
                <span className="text-[11px] sm:text-xs font-semibold text-slate-800 uppercase tracking-wider whitespace-nowrap">{row.companyName}</span>
            )
        },
        {
            header: "SECURE EMAIL",
            render: (row) => (
                <span className="text-[11px] sm:text-sm font-medium text-slate-500 whitespace-nowrap">{row.email}</span>
            )
        },
        {
            header: "PROVIDER TYPE",
            render: (row) => (
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#0f8f79] bg-[#E0F6F2] px-2 py-1 rounded-md whitespace-nowrap">{row.lenderType}</span>
            )
        },
        {
            header: "LICENSE ID",
            render: (row) => (
                <span className="text-[11px] sm:text-xs font-semibold text-slate-600 font-mono tracking-tight bg-slate-50 border border-slate-200 px-2 py-1 rounded-md whitespace-nowrap">{row.lenderLicense || 'RBI-V-001'}</span>
            )
        },
        {
            header: "TOTAL DEPLOYED",
            render: (row) => (
                <span className="text-xs sm:text-sm font-bold text-slate-800 whitespace-nowrap">₹{row.totalCreditLimit?.toLocaleString() || '0'}</span>
            )
        },
        {
            header: "UTILIZATION",
            render: (row) => {
                const usage = (row.utilizedLimit / (row.totalCreditLimit || 1)) * 100;
                return (
                    <div className="flex flex-col gap-1.5 min-w-[100px] max-w-[140px]">
                        <div className="flex justify-between w-full mb-0.5">
                            <span className="text-[9px] sm:text-[10px] font-bold text-slate-500">{Math.round(usage)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 border border-slate-200/50 rounded-full overflow-hidden shadow-inner">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${usage > 90 ? 'bg-rose-500' : usage > 50 ? 'bg-amber-400' : 'bg-[#47C4B7]'}`}
                                style={{ width: `${usage}%` }}
                            ></div>
                        </div>
                    </div>
                );
            }
        },
        {
            header: "WALLET BALANCE",
            render: (row) => (
                <span className="text-xs sm:text-sm font-bold text-[#0f8f79] whitespace-nowrap">₹{row.walletBalance?.toLocaleString() || '0'}</span>
            )
        },
        {
            header: "KYC STATUS",
            render: (row) => (
                <span className={`inline-flex items-center px-2 py-1 rounded-md text-[8px] sm:text-[9px] font-bold uppercase tracking-widest whitespace-nowrap ${row.kycStatus === 'verified' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                    {row.kycStatus}
                </span>
            )
        },
        {
            header: "SYSTEM STATUS",
            render: (row) => (
                <span className={`inline-flex px-2 py-1 rounded-md text-[8px] sm:text-[9px] font-bold uppercase tracking-widest whitespace-nowrap ${row.isActive ? 'text-indigo-600 bg-indigo-50 border border-indigo-100' : 'text-rose-600 bg-rose-50 border border-rose-100'}`}>
                    {row.isActive ? 'Active' : 'Muted'}
                </span>
            )
        },
        {
            header: "ACTION HUB",
            align: "right",
            render: (row) => (
                <div className="flex items-center justify-end gap-1.5">
                    <button className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all active:scale-95">
                        <Edit size={14} />
                    </button>
                    <button
                        onClick={() => handleToggle(row._id, row.isActive)}
                        className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all active:scale-95 border border-transparent ${row.isActive ? 'bg-slate-50 text-slate-400 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-100' : 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100'}`}
                    >
                        {row.isActive ? <Lock size={14} /> : <Unlock size={14} />}
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all active:scale-95">
                        <Trash2 size={14} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="w-full pb-24 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 max-w-[1600px] mx-auto">
            <PremiumTable
                title="Lender Registry"
                subtitle="Verification and management of institutional capital partners"
                icon={Landmark}
                stats={{
                    label: "Active Pool",
                    value: lenders.length,
                    unit: "LENDERS",
                    aggregateText: `Institutional liquidity providers`
                }}
                columns={columns}
                data={filteredData}
                loading={loading}
                onSearchChange={setSearch}
                onRefresh={fetchLenders}
            />
        </div>
    );
};

export default AdminLenders;