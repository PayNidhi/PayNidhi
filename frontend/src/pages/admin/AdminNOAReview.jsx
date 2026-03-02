import React, { useState, useEffect } from 'react';
import { 
    FileCheck, Eye, CheckCircle2, XCircle, 
    ShieldCheck, Loader2, X 
} from 'lucide-react';
import { getPendingNOAs, verifyNOA } from '../../api/adminApi';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Use the environment variable with a local fallback for development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

// 📄 Secure PDF Viewer Component
const SecureAdminPdfViewer = ({ filePath }) => {
    const [pdfUrl, setPdfUrl] = useState(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!filePath) return;
        let isMounted = true;

        const fetchPdf = async () => {
            try {
                setError(false);
                // Normalize slashes for Windows/Linux paths
                const normalizedPath = filePath.replace(/\\/g, "/");
                // Ensure the path starts with a single slash
                const cleanPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
                
                // ✅ FIXED: Changed API_BACKEND_URL to API_BASE_URL
                const response = await fetch(`${API_BASE_URL}${cleanPath}`);
                
                if (!response.ok) throw new Error("File not found");
                
                const blob = await response.blob();
                const pdfBlob = new Blob([blob], { type: "application/pdf" });
                const objectUrl = URL.createObjectURL(pdfBlob);
                
                if (isMounted) setPdfUrl(objectUrl);
            } catch (err) {
                console.error("PDF Load Error:", err);
                if (isMounted) setError(true);
            }
        };

        fetchPdf();

        return () => {
            isMounted = false;
            if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        };
    }, [filePath]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-full bg-slate-50 text-rose-400">
                <XCircle size={36} className="mb-2" />
                <p className="text-xs font-bold uppercase tracking-wider">Failed to load document.</p>
                <p className="text-[10px] font-medium text-slate-400 mt-1">The file might be corrupted or missing.</p>
            </div>
        );
    }

    if (!pdfUrl) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-full bg-slate-50">
                <Loader2 size={28} className="text-[#0f8f79] animate-spin mb-3" />
                <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Decrypting Document...</p>
            </div>
        );
    }

    return (
        <iframe 
            src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} 
            className="absolute inset-0 w-full h-full border-none" 
            title="NOA Document Preview" 
        />
    );
};

const AdminNOAReview = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [viewDocumentPath, setViewDocumentPath] = useState(null);

    const fetchPendingNOAs = async () => {
        try {
            setLoading(true);
            const res = await getPendingNOAs();
            // Assuming your backend returns { success: true, data: [...] }
            setInvoices(res.data.data || []);
        } catch (error) {
            toast.error("Failed to fetch NOA queue");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingNOAs();
    }, []);

    const handleVerification = async (id, isApproved) => {
        setProcessingId(id);
        const toastStyle = { style: { borderRadius: '12px', background: '#1e293b', color: '#fff', fontSize: '12px', fontWeight: 'bold' } };
        const toastId = toast.loading(isApproved ? 'Verifying NOA and Unlocking Funds...' : 'Rejecting NOA...', toastStyle);
        
        try {
            await verifyNOA(id, { isApproved });
            
            if (isApproved) {
                toast.success('NOA Verified! Lender can now disburse funds.', { id: toastId });
            } else {
                toast.success('NOA Rejected. Sent back to Seller.', { id: toastId });
            }
            
            setInvoices(prev => prev.filter(inv => inv._id !== id));
            setViewDocumentPath(null); 
        } catch (error) {
            toast.error('Verification process failed.', { id: toastId });
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32">
                <Loader2 className="w-10 h-10 text-[#0f8f79] animate-spin mb-4" />
                <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">Loading secure legal queue...</p>
            </div>
        );
    }

    return (
        <div className="w-full pb-24 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            <div className="bg-white border border-slate-200/80 rounded-[1.5rem] shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden relative">
                
                {/* Header Section */}
                <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="bg-[#F3FBF9] p-3 rounded-[14px] border border-[#7FE0CC]/50 shadow-sm">
                            <FileCheck className="text-[#0f8f79] w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight">Legal Gateway (NOA)</h2>
                            <p className="text-[10px] sm:text-xs font-medium text-slate-500 mt-0.5">Verify uploaded Notices of Assignment to unlock lender capital.</p>
                        </div>
                    </div>
                    <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-2 w-fit shadow-sm">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0f8f79] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0f8f79]"></span>
                        </span>
                        <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">{invoices.length} Pending</span>
                    </div>
                </div>

                {/* Table Section */}
                <div className="overflow-x-auto custom-scrollbar pb-2">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-white border-b border-slate-100 text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <th className="px-5 sm:px-6 py-4">Originating Entity</th>
                                <th className="px-5 sm:px-6 py-4">Invoice Ref</th>
                                <th className="px-5 sm:px-6 py-4">Facility Value</th>
                                <th className="px-5 sm:px-6 py-4 text-center">Status</th>
                                <th className="px-5 sm:px-6 py-4 text-right">Authentication Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {invoices.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center">
                                        <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <ShieldCheck className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <p className="text-slate-800 font-bold text-sm">The queue is completely clear.</p>
                                        <p className="text-[11px] text-slate-500 font-medium mt-1">All legal documents have been processed.</p>
                                    </td>
                                </tr>
                            ) : (
                                invoices.map((row) => (
                                    <tr key={row._id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-5 sm:px-6 py-4 sm:py-5">
                                            <div className="flex flex-col min-w-[150px]">
                                                <span className="text-xs sm:text-sm font-bold text-slate-800 uppercase truncate">{row.seller?.companyName}</span>
                                                <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium mt-0.5 truncate">{row.seller?.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 sm:px-6 py-4 sm:py-5">
                                            <span className="text-[10px] sm:text-xs font-bold text-slate-600 font-mono bg-slate-100 border border-slate-200 px-2 py-1 rounded-md whitespace-nowrap">
                                                {row.invoiceNumber}
                                            </span>
                                        </td>
                                        <td className="px-5 sm:px-6 py-4 sm:py-5">
                                            <span className="text-xs sm:text-sm font-black text-slate-800 whitespace-nowrap">
                                                ₹{row.totalAmount?.toLocaleString('en-IN')}
                                            </span>
                                        </td>
                                        <td className="px-5 sm:px-6 py-4 sm:py-5 text-center">
                                            <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-600 border border-amber-100 px-2.5 py-1 rounded-lg text-[8px] sm:text-[9px] font-bold uppercase tracking-widest whitespace-nowrap">
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Under Review
                                            </span>
                                        </td>
                                        <td className="px-5 sm:px-6 py-4 sm:py-5">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#0f8f79] hover:bg-[#E0F6F2] hover:border-[#7FE0CC]/50 transition-all rounded-xl border border-slate-200 bg-white shadow-sm active:scale-95"
                                                    onClick={() => setViewDocumentPath(row.noaDocumentUrl)}
                                                    title="View Document"
                                                >
                                                    <Eye size={14} />
                                                </button>
                                                
                                                <button 
                                                    disabled={processingId === row._id}
                                                    onClick={() => handleVerification(row._id, false)}
                                                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all rounded-xl border border-slate-200 bg-white shadow-sm disabled:opacity-50 active:scale-95"
                                                    title="Reject Document"
                                                >
                                                    <XCircle size={14} />
                                                </button>

                                                <button
                                                    disabled={processingId === row._id}
                                                    onClick={() => handleVerification(row._id, true)}
                                                    className="flex items-center gap-1.5 px-4 sm:px-5 py-2 bg-slate-900 hover:bg-[#0f8f79] text-white text-[9px] sm:text-[10px] font-bold rounded-xl shadow-md transition-all uppercase tracking-widest disabled:opacity-50 active:scale-95 whitespace-nowrap ml-1"
                                                >
                                                    {processingId === row._id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={14} className="text-[#47C4B7]" />}
                                                    Verify
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 📄 SECURE PDF VIEWER MODAL */}
                <AnimatePresence>
                    {viewDocumentPath && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                                onClick={() => setViewDocumentPath(null)}
                            />
                            
                            <motion.div 
                                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden relative z-10 border border-slate-200"
                            >
                                {/* Modal Header */}
                                <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-[#F3FBF9] p-2 rounded-[10px] border border-[#7FE0CC]/50">
                                            <FileCheck className="w-5 h-5 text-[#0f8f79]" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-slate-800 tracking-tight">Secure Document Viewer</h3>
                                            <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">Notice of Assignment</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setViewDocumentPath(null)}
                                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all bg-slate-50"
                                    >
                                        <X size={16} strokeWidth={2.5} />
                                    </button>
                                </div>

                                {/* PDF Container */}
                                <div className="flex-1 w-full bg-slate-100/50 p-4 sm:p-6 overflow-hidden">
                                    <div className="w-full h-full rounded-2xl overflow-hidden border border-slate-200/80 bg-white shadow-inner relative">
                                        <SecureAdminPdfViewer filePath={viewDocumentPath} />
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

            </div>
            
            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { height: 4px; width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}} />
        </div>
    );
};

export default AdminNOAReview;