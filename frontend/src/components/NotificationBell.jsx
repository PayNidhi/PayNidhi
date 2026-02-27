import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCircle2, AlertCircle, Lightbulb, X } from "lucide-react";

// For the hackathon demo, you can use this dummy data, or fetch it from your backend!
const DUMMY_NOTIFICATIONS = [
  {
    id: 1,
    type: "success", // Green
    title: "Invoice Verified",
    message: "Tata Motors has successfully verified Invoice #123.",
    time: "2 mins ago",
    isRead: false,
  },
  {
    id: 2,
    type: "suggestion", // Yellow
    title: "New Bids Available",
    message: "You have 3 new institutional offers pending review.",
    time: "1 hour ago",
    isRead: false,
  },
  {
    id: 3,
    type: "alert", // Red
    title: "Action Required: NOA Missing",
    message: "Please upload the signed Notice of Assignment to unlock funds.",
    time: "3 hours ago",
    isRead: true,
  }
];

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(DUMMY_NOTIFICATIONS);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  // Helper function to dynamically map colors and icons based on your 3 types
  const getNotificationStyle = (type) => {
    switch (type) {
      case "success": // GREEN
        return {
          bg: "bg-emerald-50",
          border: "border-emerald-100",
          iconBg: "bg-emerald-100",
          iconColor: "text-emerald-600",
          Icon: CheckCircle2,
        };
      case "alert": // RED
        return {
          bg: "bg-red-50",
          border: "border-red-100",
          iconBg: "bg-red-100",
          iconColor: "text-red-600",
          Icon: AlertCircle,
        };
      case "suggestion": // YELLOW
      default:
        return {
          bg: "bg-amber-50",
          border: "border-amber-100",
          iconBg: "bg-amber-100",
          iconColor: "text-amber-600",
          Icon: Lightbulb,
        };
    }
  };

  return (
    <div className="relative z-50">
      {/* 🔔 The Bell Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* 📋 The Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700">
                    Mark all as read
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-3 space-y-2">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">No new notifications</div>
                ) : (
                  notifications.map((notif) => {
                    const { bg, border, iconBg, iconColor, Icon } = getNotificationStyle(notif.type);
                    
                    return (
                      <div 
                        key={notif.id}
                        className={`relative p-4 rounded-xl border transition-all ${notif.isRead ? 'bg-white border-slate-100 opacity-70' : `${bg} ${border}`}`}
                      >
                        {/* Unread dot */}
                        {!notif.isRead && <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-indigo-500" />}
                        
                        <div className="flex gap-3 items-start">
                          <div className={`p-2 rounded-full shrink-0 ${iconBg}`}>
                            <Icon size={16} className={iconColor} />
                          </div>
                          <div>
                            <h4 className={`text-xs font-bold mb-0.5 ${notif.isRead ? 'text-slate-600' : 'text-slate-900'}`}>
                              {notif.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 leading-relaxed mb-1.5 pr-4">
                              {notif.message}
                            </p>
                            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                              {notif.time}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;