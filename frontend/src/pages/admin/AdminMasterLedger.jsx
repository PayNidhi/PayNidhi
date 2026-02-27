import React, { useState, useEffect } from 'react';
import {
    History, Receipt, Info, Building2, ExternalLink,
    CheckCircle2, Clock, Ban, Search, Filter,
    ChevronRight, Plus, Edit, Trash2, Calendar, TrendingUp
} from 'lucide-react';
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
                <div className="flex flex-col items-start px-1">
                    <span className="text-sm font-semibold text-slate-600 uppercase tracking-tight">{row.invoiceNumber}</span>
                    <span className="text-[9px] text-slate-400 font-normal tracking-widest mt-0.5">ID: {row._id.slice(-8)}</span>
                </div>
            )
        },
        {
            header: "ORIGINATING ENTITY",
            render: (row) => (
                <div className="flex items-center justify-center gap-2">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-tight">{row.seller?.companyName || 'Global Seller'}</span>
                </div>
            )
        },
        {
            header: "FACILITY AMOUNT",
            render: (row) => (
                <span className="text-sm font-semibold text-slate-600 italic uppercase tracking-tighter">₹{row.totalAmount?.toLocaleString()}</span>
            )
        },
        {
            header: "LIFECYCLE STATE",
            render: (row) => (
                <div className={`inline-flex items-center justify-center gap-2 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${row.status === 'Repaid' ? 'text-indigo-600 border-indigo-100 bg-indigo-50/20' :
                    row.status === 'Funded' ? 'text-emerald-600 border-emerald-100 bg-emerald-50/20' :
                        row.status === 'Cancelled' ? 'text-rose-600 border-rose-100 bg-rose-50/20' :
                            'text-[#47C4B7] border-[#47C4B7]/20 bg-[#47C4B7]/5'
                    }`}>
                    {row.status.replace(/_/g, ' ')}
                </div>
            )
        },
        {
            header: "AUDIT ENTRY",
            render: (row) => (
                <span className="text-xs font-medium text-slate-400 italic">
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
                                const tId = toast.loading('Processing Repayment...');
                                try {
                                    await adminApi.post(`/${row._id}/process-repayment`);
                                    toast.success('Repayment Processed Successfully', { id: tId });
                                    fetchData();
                                } catch (error) {
                                    toast.error('Repayment Processing Failed', { id: tId });
                                }
                            }}
                            className="px-6 py-1.5 bg-[#47C4B7]/10 text-[#47C4B7] border border-[#47C4B7]/20 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#47C4B7] hover:text-white transition-all active:scale-95 min-w-[110px]"
                        >
                            Repayment
                        </button>
                    ) : row.status === 'Repaid' ? (
                        <span className="text-[10px] font-medium text-slate-300 uppercase tracking-widest">Completed</span>
                    ) : (
                        <button
                            onClick={async () => {
                                const tId = toast.loading('Initiating Force-Repay...');
                                try {
                                    await adminApi.post(`/invoice/${row._id}/settle`);
                                    toast.success('Repayment Triggered', { id: tId });
                                    fetchData();
                                } catch (error) {
                                    toast.error('Repayment Blocked: Status Mismatch', { id: tId });
                                }
                            }}
                            className="px-5 py-1 bg-slate-50 text-slate-400 border border-slate-100 rounded-md text-[9px] font-medium uppercase tracking-tighter hover:bg-slate-100 transition-all opacity-60 hover:opacity-100 min-w-[90px]"
                        >
                            REPAYMENT
                        </button>
                    )}
                </div>
            )
        },
        {
            header: "AUDIT CONTROL",
            align: "right",
            render: (row) => (
                <div className="flex items-center justify-end gap-1.5 px-2">
                    <button
                        className="p-2 text-slate-400 hover:text-[#47C4B7] hover:bg-slate-50 rounded-xl transition-all"
                        onClick={() => row.fileUrl && window.open(row.fileUrl, '_blank')}
                    >
                        <ExternalLink size={18} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-blue-500 rounded-xl transition-all">
                        <Edit size={16} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-rose-500 rounded-xl transition-all">
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="w-full pb-20">
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
