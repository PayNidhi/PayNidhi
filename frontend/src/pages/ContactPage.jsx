import React, { useState } from 'react';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    query: '',
    customerType: 'MSME'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form Submitted:', formData);
    // Add your submission logic here
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side: Contact Info */}
        <div className="bg-blue-600 p-10 text-white md:w-1/3">
          <h2 className="text-2xl font-bold mb-6">Contact Us</h2>
          <p className="text-blue-100 mb-8">
            Have questions about our platform? Our team is here to help you scale.
          </p>
          <div className="space-y-4">
            <p className="flex items-center">
              <span className="mr-3">📍</span> 123 Business Way, NY
            </p>
            <p className="flex items-center">
              <span className="mr-3">📞</span> +1 (555) 000-0000
            </p>
          </div>
        </div>

        {/* Right Side: Form */}
        <form onSubmit={handleSubmit} className="p-10 md:w-2/3space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
              <input 
                type="text" 
                placeholder="John Doe"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
              <input 
                type="email" 
                placeholder="john@company.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
              <input 
                type="tel" 
                placeholder="+1 234 567 890"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>

            {/* Customer Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Customer Type</label>
              <select 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition bg-white"
                onChange={(e) => setFormData({...formData, customerType: e.target.value})}
              >
                <option value="MSME">MSME</option>
                <option value="Lender">Lender</option>
              </select>
            </div>
          </div>

          {/* Query */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Your Message</label>
            <textarea 
              rows="4"
              placeholder="How can we help you?"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              onChange={(e) => setFormData({...formData, query: e.target.value})}
              required
            ></textarea>
          </div>

          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg transition duration-300"
          >
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
};

export default ContactPage;