// frontend/src/components/admin/AdminNOAReview.jsx
import React, { useState, useEffect } from 'react';
import { 
    FileCheck, Eye, CheckCircle2, XCircle, 
    ShieldCheck, Clock, Loader2, X 
} from 'lucide-react';
import { getPendingNOAs, verifyNOA } from '../../api/adminApi';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// const API_BACKEND_URL = "http://localhost:5001"; 
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// 📄 NEW: Secure PDF Viewer Component
// This intercepts the file and forces it to display inline, preventing auto-downloads!
const SecureAdminPdfViewer = ({ filePath }) => {
    const [pdfUrl, setPdfUrl] = useState(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!filePath) return;
        let isMounted = true;

        const fetchPdf = async () => {
            try {
                setError(false);
                // Fix Windows backslashes just in case
                const normalizedPath = filePath.replace(/\\/g, "/");
                // Ensure no double slashes in URL
                const cleanPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
                
                const response = await fetch(`${API_BACKEND_URL}${cleanPath}`);
                if (!response.ok) throw new Error("File not found");
                
                const blob = await response.blob();
                // 🛑 THE MAGIC FIX: Force the browser to treat this blob strictly as a PDF
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
                <XCircle size={40} className="mb-2" />
                <p className="text-sm font-semibold">Failed to load document.</p>
                <p className="text-xs text-slate-500">The file might be corrupted or missing.</p>
            </div>
        );
    }

    if (!pdfUrl) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-full bg-slate-50">
                <Loader2 size={30} className="text-[#24B28E] animate-spin mb-3" />
                <p className="text-xs font-semibold text-slate-500 tracking-widest uppercase">Decrypting Document...</p>
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
    
    // State holds the raw document path when a user clicks View
    const [viewDocumentPath, setViewDocumentPath] = useState(null);

    const fetchPendingNOAs = async () => {
        try {
            setLoading(true);
            const res = await getPendingNOAs();
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
        const toastId = toast.loading(isApproved ? 'Verifying NOA and Unlocking Funds...' : 'Rejecting NOA...');
        
        try {
            await verifyNOA(id, { isApproved });
            
            if (isApproved) {
                toast.success('NOA Verified! Lender can now disburse funds.', { id: toastId });
            } else {
                toast.success('NOA Rejected. Sent back to Seller.', { id: toastId });
            }
            
            setInvoices(prev => prev.filter(inv => inv._id !== id));
            setViewDocumentPath(null); // Close modal if open
        } catch (error) {
            toast.error('Verification process failed.', { id: toastId });
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-[#24B28E] animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Loading secure legal queue...</p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden relative">
            {/* Header Section */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="bg-[#24B28E]/10 p-3 rounded-xl border border-[#24B28E]/20">
                        <FileCheck className="text-[#24B28E] w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Legal Gateway (NOA)</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Verify uploaded Notices of Assignment to unlock lender capital.</p>
                    </div>
                </div>
                <div className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#24B28E] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#24B28E]"></span>
                    </span>
                    <span className="text-xs font-bold text-slate-700">{invoices.length} Pending</span>
                </div>
            </div>

            {/* Table Section */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <th className="px-6 py-4">Originating Entity</th>
                            <th className="px-6 py-4">Invoice Ref</th>
                            <th className="px-6 py-4">Facility Value</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Authentication Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {invoices.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-16 text-center">
                                    <ShieldCheck className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                    <p className="text-slate-500 font-medium">The queue is completely clear.</p>
                                    <p className="text-xs text-slate-400 mt-1">All legal documents have been processed.</p>
                                </td>
                            </tr>
                        ) : (
                            invoices.map((row) => (
                                <tr key={row._id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-800">{row.seller?.companyName}</span>
                                            <span className="text-[11px] text-slate-400 font-medium mt-0.5">{row.seller?.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-medium text-slate-600 font-mono bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                                            {row.invoiceNumber}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-bold text-slate-900">
                                            ₹{row.totalAmount?.toLocaleString('en-IN')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-600 border border-amber-100 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                                            <Clock size={12} /> Under Review
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            {/* 👁️ VIEW PDF BUTTON - Sets the path instead of full URL */}
                                            <button
                                                className="p-2 text-slate-400 hover:text-[#24B28E] hover:bg-[#24B28E]/10 transition-all rounded-xl border border-transparent hover:border-[#24B28E]/20"
                                                onClick={() => setViewDocumentPath(row.noaDocumentUrl)}
                                                title="View Signed Document securely"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            
                                            {/* Reject Button */}
                                            <button 
                                                disabled={processingId === row._id}
                                                onClick={() => handleVerification(row._id, false)}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all rounded-xl border border-transparent hover:border-rose-100 disabled:opacity-50"
                                                title="Reject Document"
                                            >
                                                <XCircle size={18} />
                                            </button>

                                            {/* Approve Button */}
                                            <button
                                                disabled={processingId === row._id}
                                                onClick={() => handleVerification(row._id, true)}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-[#24B28E] hover:bg-[#1e9576] text-white text-[11px] font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
                                            >
                                                {processingId === row._id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                                APPROVE KEY
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
                        {/* Dark backdrop */}
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            onClick={() => setViewDocumentPath(null)}
                        />
                        
                        {/* Modal Content */}
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden relative z-10 border border-slate-200"
                        >
                            {/* Modal Header */}
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="bg-[#24B28E]/10 p-2.5 rounded-xl border border-[#24B28E]/20">
                                        <FileCheck className="w-5 h-5 text-[#24B28E]" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 tracking-tight">Secure Document Viewer</h3>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">Notice of Assignment</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setViewDocumentPath(null)}
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Secure PDF Container using the new Component */}
                            <div className="flex-1 w-full bg-slate-100/50 p-4 sm:p-6 overflow-hidden">
                                <div className="w-full h-full rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-inner relative">
                                    <SecureAdminPdfViewer filePath={viewDocumentPath} />
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default AdminNOAReview;