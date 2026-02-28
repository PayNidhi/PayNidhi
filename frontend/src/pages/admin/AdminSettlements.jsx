import React, { useState, useEffect } from 'react';
import { Calculator, History } from 'lucide-react';
import { PremiumTable } from '../../components/admin/exports';
import { getFinances, settleInvoice } from '../../api/adminApi';
import toast from 'react-hot-toast';

const AdminSettlements = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await getFinances();
            setData(res.data.finances?.filter(f => !f.isSettled) || []);
        } catch (error) {
            toast.error("Failed to fetch loan book");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSettle = async (invoiceId) => {
        const toastId = toast.loading('Executing Money Split Protocol...', {
            style: { borderRadius: '12px', background: '#1e293b', color: '#fff', fontSize: '12px', fontWeight: 'bold' }
        });
        try {
            await settleInvoice(invoiceId);
            toast.success('Funds Disbursed. Wallets Updated.', { id: toastId });
            fetchData();
        } catch (error) {
            toast.error('Split execution failed.', { id: toastId });
        }
    };

    const filteredData = data.filter(d =>
        d.seller?.companyName?.toLowerCase().includes(search.toLowerCase()) ||
        d.lender?.companyName?.toLowerCase().includes(search.toLowerCase()) ||
        d.invoice?.invoiceNumber?.toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        {
            header: "MARKET PARTICIPANTS",
            render: (row) => (
                <div className="flex flex-col gap-1.5 items-start min-w-[180px]">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-tight truncate">{row.seller?.companyName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#0f8f79]"></div>
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-tight truncate">{row.lender?.companyName}</span>
                    </div>
                </div>
            )
        },
        {
            header: "PRINCIPAL DEPLOYED",
            render: (row) => (
                <span className="text-xs sm:text-sm font-black text-slate-800 whitespace-nowrap">₹{row.loanAmount?.toLocaleString()}</span>
            )
        },
        {
            header: "REPAYMENT VALUE",
            render: (row) => (
                <span className="text-xs sm:text-sm font-black text-[#0f8f79] italic whitespace-nowrap">₹{row.bid?.repaymentAmount?.toLocaleString()}</span>
            )
        },
        {
            header: "ASSET STATUS",
            render: (row) => (
                <span className="px-2.5 py-1 bg-[#F3FBF9] border border-[#7FE0CC]/50 rounded-md text-[8px] sm:text-[9px] font-bold text-[#0f8f79] uppercase tracking-widest whitespace-nowrap shadow-sm">
                    Escrow Live
                </span>
            )
        },
        {
            header: "TIMESTAMP",
            render: (row) => (
                <span className="text-[10px] sm:text-xs font-medium text-slate-500 whitespace-nowrap">
                    {new Date(row.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
            )
        },
        {
            header: "SPLIT EXECUTION",
            align: "right",
            render: (row) => (
                <div className="flex items-center justify-end gap-2">
                    <button className="w-8 h-8 flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 rounded-xl transition-all active:scale-95 shadow-sm">
                        <History size={14} />
                    </button>
                    <button
                        onClick={() => handleSettle(row.invoice?._id)}
                        className="px-4 sm:px-6 py-2 bg-slate-900 hover:bg-[#0f8f79] text-white text-[9px] sm:text-[10px] font-black rounded-xl shadow-md hover:shadow-lg shadow-[#0f8f79]/20 transition-all uppercase tracking-[0.1em] whitespace-nowrap active:scale-95"
                    >
                        Execute Split
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="w-full pb-24 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 max-w-[1600px] mx-auto">
            <PremiumTable
                title="Settlement Hub"
                subtitle="Real-time fund reconciliation and escrow distribution protocols."
                icon={Calculator}
                stats={{
                    label: "Active Protocols",
                    value: data.length,
                    unit: "FILES",
                    aggregateText: `Live reconciliation in progress`
                }}
                columns={columns}
                data={filteredData}
                loading={loading}
                onSearchChange={setSearch}
                onRefresh={fetchData}
            />
        </div>
    );
};

export default AdminSettlements;