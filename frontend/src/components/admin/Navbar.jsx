import React from 'react';
import { Search, Bell, Menu } from 'lucide-react';

const Navbar = ({ onToggleSidebar }) => {
    return (
        <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-40 transition-all shrink-0">
            <div className="flex items-center gap-3 sm:gap-6 flex-1">
                {/* Mobile Menu Toggle */}
                <button 
                    onClick={onToggleSidebar}
                    className="lg:hidden p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:bg-[#E0F6F2] hover:text-[#0f8f79] active:scale-95 transition-all"
                >
                    <Menu className="w-6 h-6" />
                </button>

                {/* Responsive Search */}
                <div className="relative max-w-md w-full hidden sm:block group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-[#0f8f79] transition-colors" />
                    <input
                        type="text"
                        placeholder="Search invoices, lenders, sellers..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-[10px] text-[12px] font-medium text-slate-800 focus:bg-white focus:border-[#47C4B7] focus:ring-4 focus:ring-[#47C4B7]/10 transition-all outline-none placeholder:text-slate-400"
                    />
                </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-5">
                <button className="relative p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-[10px] transition-all shadow-sm">
                    <Bell className="w-4 h-4 text-slate-600" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>
                </button>
                
                <div className="h-6 w-[1px] bg-slate-200 hidden sm:block"></div>
                
                <div className="flex items-center gap-2.5 cursor-pointer p-1 pr-2.5 hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded-xl transition-all">
                    <div className="w-8 h-8 rounded-[10px] bg-[#F3FBF9] border border-[#7FE0CC]/50 p-0.5 shadow-sm">
                        <img
                            src="https://ui-avatars.com/api/?name=Sanket+B&background=0d9488&color=fff"
                            className="rounded-lg w-full h-full object-cover"
                            alt="Admin"
                        />
                    </div>
                    <div className="text-left hidden sm:block">
                        <p className="text-[12px] font-bold text-slate-800 leading-tight">Sanket B.</p>
                        <p className="text-[9px] text-[#0f8f79] font-bold uppercase tracking-widest">SuperAdmin</p>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;