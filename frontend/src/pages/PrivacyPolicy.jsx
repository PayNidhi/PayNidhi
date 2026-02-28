import React from 'react';

const PrivacyPolicy = () => {
  const lastUpdated = "February 28, 2026";

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
        
        {/* Header Section */}
        <div className="bg-blue-600 p-8 text-white">
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="mt-2 text-blue-100">PayNidhi Fintech Platform</p>
          <p className="text-sm text-blue-200 mt-4">Last Updated: {lastUpdated}</p>
        </div>

        <div className="flex flex-col md:flex-row">
          {/* Quick Links Sidebar */}
          <aside className="hidden md:block w-64 bg-gray-50 p-8 border-r border-gray-100">
            <nav className="sticky top-8">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Contents</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><a href="#collection" className="hover:text-blue-600 transition">Data Collection</a></li>
                <li><a href="#usage" className="hover:text-blue-600 transition">How We Use Data</a></li>
                <li><a href="#verification" className="hover:text-blue-600 transition">KYC & GST Verification</a></li>
                <li><a href="#security" className="hover:text-blue-600 transition">Security Standards</a></li>
                <li><a href="#contact" className="hover:text-blue-600 transition">Contact Us</a></li>
              </ul>
            </nav>
          </aside>

          {/* Policy Content */}
          <main className="flex-1 p-8 md:p-12 text-gray-700 leading-relaxed">
            <section className="mb-10">
              <p className="text-lg text-gray-600 mb-6">
                At <strong>PayNidhi</strong>, we understand that trust is the foundation of invoice financing. This policy explains how we handle sensitive MSME and Lender data during the funding process.
              </p>
            </section>

            <section id="collection" className="mb-10">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="w-2 h-6 bg-blue-500 rounded mr-3"></span>
                1. Information We Collect
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <h4 className="font-semibold text-blue-600 mb-1">MSME Data</h4>
                  <p className="text-sm">GSTIN, Invoices, Bank Statements, and Director KYC details.</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <h4 className="font-semibold text-blue-600 mb-1">Lender Data</h4>
                  <p className="text-sm">Institutional registration, funding limits, and authorized signatory info.</p>
                </div>
              </div>
            </section>

            <section id="usage" className="mb-10">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="w-2 h-6 bg-blue-500 rounded mr-3"></span>
                2. How We Use Your Data
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li><strong>Verification:</strong> Cross-referencing GST data to ensure invoice authenticity.</li>
                <li><strong>Credit Assessment:</strong> Enabling Lenders to perform risk analysis on uploaded invoices.</li>
                <li><strong>Disbursement:</strong> Processing secure payments via linked bank accounts.</li>
              </ul>
            </section>

            <section id="security" className="mb-10">
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                <h2 className="text-xl font-bold text-blue-900 mb-3">Security & Encryption</h2>
                <p className="text-blue-800 text-sm">
                  We use bank-grade encryption ($AES-256$) for all stored invoices. Data in transit is protected using TLS 1.3 protocols to ensure no unauthorized interception during the KYC process.
                </p>
              </div>
            </section>

            <section id="contact" className="mt-12 pt-8 border-t border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Questions?</h2>
              <p className="text-gray-600 mb-4">If you have concerns regarding your financial data, our compliance team is available.</p>
              <div className="flex items-center space-x-4">
                <a href="mailto:privacy@paynidhi.com" className="text-blue-600 font-semibold hover:underline">privacy@paynidhi.com</a>
                <span className="text-gray-300">|</span>
                <span className="text-gray-500">Grievance Officer: +91 000-000-0000</span>
              </div>
            </section>
          </main>
        </div>
      </div>
      
      {/* Footer Branding */}
      <div className="text-center mt-8 text-gray-400 text-sm">
        &copy; 2026 PayNidhi Solutions Pvt. Ltd. All rights reserved.
      </div>
    </div>
  );
};

export default PrivacyPolicy;