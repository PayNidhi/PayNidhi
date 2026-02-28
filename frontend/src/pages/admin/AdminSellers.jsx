import React, { useState, useEffect } from 'react';
import {
    Users, ToggleRight, ToggleLeft, Edit, Trash2
} from 'lucide-react';
import { PremiumTable } from '../../components/admin/exports';
import { getSellers, toggleUser } from '../../api/adminApi';
import toast from 'react-hot-toast';

const AdminSellers = () => {
    const [sellers, setSellers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const fetchSellers = async () => {
        try {
            setLoading(true);
            const res = await getSellers();
            setSellers(res.data.sellers || []);
        } catch (error) {
            toast.error("Failed to fetch seller data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSellers();
    }, []);

    const handleToggle = async (id, currentStatus) => {
        try {
            await toggleUser('seller', id, { isActive: !currentStatus });
            toast.success(`Seller ${!currentStatus ? 'activated' : 'suspended'}`);
            fetchSellers();
        } catch (error) {
            toast.error("Status update failed");
        }
    };

    const filteredData = sellers.filter(s =>
        s.companyName?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase()) ||
        s.gstNumber?.toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        {
            header: "COMPANY NAME",
            render: (row) => (
                <span className="text-[11px] sm:text-xs font-semibold text-slate-800 uppercase tracking-wide whitespace-nowrap">{row.companyName}</span>
            )
        },
        {
            header: "ENTITY EMAIL",
            render: (row) => (
                <span className="text-[11px] sm:text-sm font-medium text-slate-500 whitespace-nowrap">{row.email}</span>
            )
        },
        {
            header: "BUSINESS TYPE",
            render: (row) => (
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#0f8f79] bg-[#E0F6F2] px-2 py-1 rounded-md whitespace-nowrap">{row.businessType || 'SME'}</span>
            )
        },
        {
            header: "INDUSTRY",
            render: (row) => (
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded-md whitespace-nowrap">
                    {row.industry || 'General'}
                </span>
            )
        },
        {
            header: "TURNOVER",
            render: (row) => (
                <span className="text-xs sm:text-sm font-bold text-slate-800 font-mono whitespace-nowrap">₹{row.annualTurnover ? (row.annualTurnover / 100000).toFixed(1) : '0'}L</span>
            )
        },
        {
            header: "GSTIN",
            render: (row) => (
                <span className="text-[11px] sm:text-xs font-semibold text-slate-600 font-mono uppercase tracking-tight bg-slate-50 border border-slate-200 px-2 py-1 rounded-md whitespace-nowrap">{row.gstNumber || 'N/A'}</span>
            )
        },
        {
            header: "KYC STATUS",
            render: (row) => (
                <span className={`inline-flex px-2 py-1 rounded-md text-[8px] sm:text-[9px] font-bold uppercase tracking-widest whitespace-nowrap ${row.kycStatus === 'verified' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                    {row.kycStatus}
                </span>
            )
        },
        {
            header: "STATUS",
            render: (row) => (
                <span className={`inline-flex px-2 py-1 rounded-md text-[8px] sm:text-[9px] font-bold uppercase tracking-widest whitespace-nowrap ${row.isActive ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                    {row.isActive ? 'Active' : 'Suspended'}
                </span>
            )
        },
        {
            header: "ACTIONS",
            align: "right",
            render: (row) => (
                <div className="flex items-center justify-end gap-1.5">
                    <button className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all active:scale-95">
                        <Edit size={14} />
                    </button>
                    <button
                        onClick={() => handleToggle(row._id, row.isActive)}
                        className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all active:scale-95 border border-transparent ${row.isActive ? 'bg-slate-50 text-slate-400 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'}`}
                    >
                        {row.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
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
                title="Seller Registry"
                subtitle="Platform trade partner management and verification"
                icon={Users}
                stats={{
                    label: "Total Registered",
                    value: sellers.length,
                    unit: "SELLERS",
                    aggregateText: `Platform trade partners`
                }}
                columns={columns}
                data={filteredData}
                loading={loading}
                onSearchChange={setSearch}
                onRefresh={fetchSellers}
            />
        </div>
    );
};

export default AdminSellers;