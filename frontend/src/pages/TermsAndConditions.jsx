import React from 'react';

const TermsAndConditions = () => {
  const effectiveDate = "February 28, 2026";

  const sections = [
    { id: 'acceptance', title: '1. Acceptance of Terms' },
    { id: 'eligibility', title: '2. Eligibility & KYC' },
    { id: 'invoice-rules', title: '3. Invoice Financing Rules' },
    { id: 'disbursement', title: '4. Disbursement & Fees' },
    { id: 'liability', title: '5. Limitation of Liability' },
    { id: 'governing-law', title: '6. Governing Law' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100 flex flex-col md:flex-row">
        
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-80 bg-slate-900 p-8 text-slate-300">
          <div className="sticky top-8">
            <h2 className="text-white font-bold text-2xl mb-2 tracking-tight italic">PayNidhi</h2>
            <p className="text-xs uppercase tracking-widest text-slate-500 mb-8">Legal Framework</p>
            <nav className="space-y-4 text-sm font-medium">
              {sections.map((section) => (
                <a 
                  key={section.id}
                  href={`#${section.id}`} 
                  className="block hover:text-blue-400 transition-colors py-2 border-b border-slate-800"
                >
                  {section.title}
                </a>
              ))}
            </nav>
            <div className="mt-12 p-4 bg-slate-800 rounded-lg text-xs leading-relaxed">
              By using PayNidhi, you acknowledge that you have read and understood these terms in full.
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 p-8 md:p-16">
          <header className="mb-12">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Terms & Conditions</h1>
            <div className="flex items-center text-sm text-gray-500">
              <span className="font-semibold text-blue-600 mr-2 underline decoration-2 decoration-blue-200">Version 2.0</span>
              <span>• Effective Date: {effectiveDate}</span>
            </div>
          </header>

          <article className="prose prose-slate max-w-none text-gray-600 space-y-10">
            
            <section id="acceptance">
              <h3 className="text-xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h3>
              <p>
                These Terms and Conditions govern the use of the PayNidhi platform. By registering as an **MSME Seller** or a **Lender**, you agree to comply with all rules, regulations, and privacy policies integrated herein.
              </p>
            </section>

            <section id="eligibility">
              <h3 className="text-xl font-bold text-gray-900 mb-4">2. Eligibility & KYC Verification</h3>
              <p>
                To maintain a secure financial ecosystem, all users must undergo mandatory verification:
              </p>
              <ul className="list-disc pl-5 mt-4 space-y-2">
                <li><strong>MSMEs:</strong> Must provide valid GSTIN, PAN, and Udyam registration.</li>
                <li><strong>Lenders:</strong> Must be RBI-regulated NBFCs, Banks, or qualified institutional investors.</li>
                <li><strong>Verification:</strong> PayNidhi uses third-party APIs for GST and Aadhaar e-KYC. Users consent to this data sharing for credit assessment purposes.</li>
              </ul>
            </section>

            <section id="invoice-rules">
              <h3 className="text-xl font-bold mb-4 text-gray-900">3. Invoice Financing Rules (Anti-Fraud)</h3>
              <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-xl">
                <p className="font-bold text-red-900 mb-2 underline">No Double Financing</p>
                <p className="text-red-800 text-sm">
                  Sellers are strictly prohibited from uploading an invoice that has already been financed by another platform or bank. Any attempt to "Double Finance" will result in immediate permanent banning and reporting to credit bureaus and legal authorities.
                </p>
              </div>
              <p className="mt-4">
                Invoices must represent genuine trade transactions. Any "Pro-forma" or "Estimate" invoices are ineligible for funding.
              </p>
            </section>

            <section id="disbursement">
              <h3 className="text-xl font-bold text-gray-900 mb-4">4. Disbursement & Fees</h3>
              <p>
                PayNidhi facilitates the flow of funds from Lenders to MSMEs. A platform service fee (as agreed upon in the fee schedule) will be deducted from the disbursement amount or charged separately.
              </p>
              <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm italic">
                Note: PayNidhi is a marketplace platform and does not provide credit from its own balance sheet.
              </div>
            </section>

            <section id="liability">
              <h3 className="text-xl font-bold text-gray-900 mb-4">5. Limitation of Liability</h3>
              <p>
                PayNidhi shall not be liable for the buyer's (debtor's) failure to pay the Lender on the invoice due date. The recourse or non-recourse nature of the financing is strictly between the Seller and the Lender as per their specific agreement.
              </p>
            </section>

          </article>

          <footer className="mt-16 pt-10 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center text-sm">
            <div className="mb-4 sm:mb-0">
              <p className="font-bold text-gray-900">Contact Compliance Office</p>
              <p className="text-gray-500">legal@paynidhi.com</p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => window.print()} className="px-6 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-100">
                Print for Records
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;