import React, { useRef } from "react";
import { useReactToPrint } from "react-to-print";

const NOAGenerator = ({ invoice, seller }) => {
  const componentRef = useRef();

  // This hook triggers the browser's PDF save/print dialog
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `NOA_Invoice_${invoice?.invoiceNumber || "Draft"}`,
  });

  if (!invoice || !seller) return <p>Loading NOA Data...</p>;

  return (
    <div className="flex flex-col items-center bg-gray-100 p-6 rounded-lg">
      
      {/* 📥 The Download Button */}
      <button 
        onClick={handlePrint} 
        className="mb-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded shadow-lg transition-all"
      >
        Download NOA as PDF
      </button>

      {/* 📄 The Actual A4 Document (Hidden overflow, styled like paper) */}
      <div className="overflow-auto shadow-2xl">
        <div 
          ref={componentRef} 
          className="bg-white w-[210mm] min-h-[297mm] p-[20mm] text-black font-serif print:shadow-none"
        >
          {/* Header */}
          <div className="border-b-2 border-gray-800 pb-4 mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">NOTICE OF ASSIGNMENT</h1>
              <p className="text-sm text-gray-500 mt-1">Legally binding under the Factoring Regulation Act, 2011</p>
            </div>
            <h2 className="text-2xl font-bold text-blue-800">PayNidhi</h2>
          </div>

          {/* Date & Addressee */}
          <p className="mb-6 text-lg"><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
          <p className="mb-2 text-lg"><strong>To:</strong> The Accounts Payable Department</p>
          <p className="mb-8 text-lg"><strong>Company:</strong> {invoice.buyerName}</p>
          
          {/* The Legal Body */}
          <p className="mb-6 text-lg leading-relaxed">
            This letter serves as formal notice that <strong>{seller.companyName}</strong> has legally assigned the payment rights for 
            Invoice Number <strong>{invoice.invoiceNumber}</strong> (Dated: {new Date(invoice.createdAt).toLocaleDateString()}) 
            in the total amount of <strong>₹{invoice.totalAmount}</strong> to PayNidhi Escrow Services.
          </p>

          <p className="mb-6 text-lg leading-relaxed font-bold text-red-700">
            ACTION REQUIRED: You are hereby instructed to redirect the payment for this invoice ONLY to the following assigned Escrow Bank Account:
          </p>

          {/* PayNidhi Bank Details Box */}
          <div className="border-2 border-gray-800 p-6 mb-12 bg-gray-50 rounded">
            <p className="text-lg mb-2"><strong>Account Name:</strong> PayNidhi Nodal Escrow Account</p>
            <p className="text-lg mb-2"><strong>Account Number:</strong> 222333444555</p>
            <p className="text-lg mb-2"><strong>IFSC Code:</strong> HDFC0001234</p>
            <p className="text-lg"><strong>Bank:</strong> HDFC Bank, Main Branch</p>
          </div>

          <p className="mb-16 text-lg leading-relaxed">
            Payment made to any other account, including our previous standard bank account, will not constitute a valid discharge of your payment obligation for this invoice.
          </p>

          {/* Signature Blocks */}
          <div className="flex justify-between mt-12 pt-8">
            <div className="text-center">
              <p className="mb-2">___________________________</p>
              <p className="font-bold">{seller.companyName}</p>
              <p className="text-sm text-gray-600">Authorized Seller Signatory</p>
            </div>
            <div className="text-center">
              <p className="mb-2">___________________________</p>
              <p className="font-bold">{invoice.buyerName}</p>
              <p className="text-sm text-gray-600">Authorized Buyer Acknowledgment</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default NOAGenerator;