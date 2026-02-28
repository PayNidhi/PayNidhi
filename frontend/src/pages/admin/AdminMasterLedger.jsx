import React, { useState, useEffect } from 'react';
import { History, ExternalLink, Edit, Trash2 } from 'lucide-react';
import { PremiumTable } from '../../components/admin/exports';
import adminApi, { getLedger } from '../../api/adminApi';
import toast from 'react-hot-toast';

const AdminMasterLedger = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await getLedger();
            setData(res.data.invoices || []);
        } catch (error) {
            toast.error("Failed to fetch ledger data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredData = data.filter(d =>
        d.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
        d.seller?.companyName?.toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        {
            header: "INSTRUMENT REF",
            render: (row) => (
                <div className="flex flex-col items-start min-w-[120px]">
                    <span className="text-[11px] sm:text-xs font-bold text-slate-800 uppercase tracking-tight whitespace-nowrap">{row.invoiceNumber}</span>
                    <span className="text-[9px] text-slate-400 font-medium tracking-widest mt-0.5">ID: {row._id.slice(-8)}</span>
                </div>
            )
        },
        {
            header: "ORIGINATING ENTITY",
            render: (row) => (
                <div className="flex items-center gap-2">
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 uppercase tracking-tight whitespace-nowrap">{row.seller?.companyName || 'Global Seller'}</span>
                </div>
            )
        },
        {
            header: "FACILITY AMOUNT",
            render: (row) => (
                <span className="text-xs sm:text-sm font-black text-slate-800 italic uppercase tracking-tighter whitespace-nowrap">₹{row.totalAmount?.toLocaleString()}</span>
            )
        },
        {
            header: "LIFECYCLE STATE",
            render: (row) => (
                <div className={`inline-flex items-center justify-center px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg text-[8px] sm:text-[9px] font-bold uppercase tracking-widest border whitespace-nowrap shadow-sm ${row.status === 'Repaid' ? 'bg-indigo-50 text-indigo-600 border-indigo-200/60' :
                    row.status === 'Funded' ? 'bg-[#F3FBF9] text-[#0f8f79] border-[#7FE0CC]/50' :
                    row.status === 'Cancelled' ? 'bg-rose-50 text-rose-600 border-rose-200/60' :
                    'bg-slate-50 text-slate-500 border-slate-200'
                }`}>
                    {row.status.replace(/_/g, ' ')}
                </div>
            )
        },
        {
            header: "AUDIT ENTRY",
            render: (row) => (
                <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 whitespace-nowrap">
                    {new Date(row.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
            )
        },
        {
            header: "REPAYMENT",
            render: (row) => (
                <div className="flex justify-center">
                    {row.status === 'Funded' ? (
                        <button
                            onClick={async () => {
                                const tId = toast.loading('Processing Repayment...', { style: { borderRadius: '12px', background: '#1e293b', color: '#fff', fontSize: '12px', fontWeight: 'bold' } });
                                try {
                                    await adminApi.post(`/${row._id}/process-repayment`);
                                    toast.success('Repayment Processed Successfully', { id: tId });
                                    fetchData();
                                } catch (error) {
                                    toast.error('Repayment Processing Failed', { id: tId });
                                }
                            }}
                            className="px-4 py-1.5 sm:px-5 sm:py-2 bg-[#F3FBF9] text-[#0f8f79] border border-[#7FE0CC]/60 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest hover:bg-[#0f8f79] hover:text-white hover:shadow-md transition-all active:scale-95 whitespace-nowrap"
                        >
                            Trigger Repay
                        </button>
                    ) : row.status === 'Repaid' ? (
                        <span className="text-[9px] sm:text-[10px] font-bold text-slate-300 uppercase tracking-widest">Completed</span>
                    ) : (
                        <button
                            onClick={async () => {
                                const tId = toast.loading('Initiating Force-Repay...', { style: { borderRadius: '12px', background: '#1e293b', color: '#fff', fontSize: '12px', fontWeight: 'bold' } });
                                try {
                                    await adminApi.post(`/invoice/${row._id}/settle`);
                                    toast.success('Repayment Triggered', { id: tId });
                                    fetchData();
                                } catch (error) {
                                    toast.error('Repayment Blocked: Status Mismatch', { id: tId });
                                }
                            }}
                            className="px-4 py-1.5 bg-slate-50 text-slate-400 border border-slate-200 rounded-lg text-[8px] sm:text-[9px] font-bold uppercase tracking-wider hover:bg-slate-100 hover:text-slate-600 transition-all active:scale-95 whitespace-nowrap"
                        >
                            Force Repay
                        </button>
                    )}
                </div>
            )
        },
        {
            header: "AUDIT CONTROL",
            align: "right",
            render: (row) => (
                <div className="flex items-center justify-end gap-1.5">
                    <button
                        className="w-8 h-8 flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-400 hover:text-[#0f8f79] hover:bg-[#E0F6F2] hover:border-[#7FE0CC]/50 rounded-xl transition-all active:scale-95 shadow-sm"
                        onClick={() => row.fileUrl && window.open(row.fileUrl, '_blank')}
                    >
                        <ExternalLink size={14} />
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-400 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-100 rounded-xl transition-all active:scale-95 shadow-sm">
                        <Edit size={14} />
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 rounded-xl transition-all active:scale-95 shadow-sm">
                        <Trash2 size={14} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="w-full pb-24 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 max-w-[1600px] mx-auto">
            <PremiumTable
                title="Asset Ledger"
                subtitle="End-to-end historical record of verified trade instruments."
                icon={History}
                stats={{
                    label: "Total Audit Logs",
                    value: data.length,
                    unit: "ENTRIES",
                    aggregateText: `Full historical transaction history`
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

export default AdminMasterLedger;