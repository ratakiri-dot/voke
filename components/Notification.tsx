
import React from 'react';
import { Notification as NotificationType } from '../types';

interface NotificationProps {
  notification: NotificationType;
  onClose: () => void;
}

export const Notification: React.FC<NotificationProps> = ({ notification, onClose }) => {
  const gradient = notification.type === 'error' 
    ? 'from-red-500 to-rose-600' 
    : notification.type === 'success' 
    ? 'from-emerald-500 to-teal-600' 
    : 'from-indigo-500 to-purple-600';

  const icon = notification.type === 'error' 
    ? 'fa-circle-xmark' 
    : notification.type === 'success' 
    ? 'fa-circle-check' 
    : 'fa-circle-info';

  React.useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className={`bg-gradient-to-r ${gradient} text-white px-6 py-4 rounded-[1.25rem] shadow-2xl flex items-center space-x-4 border border-white/20 backdrop-blur-md`}>
        <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
          <i className={`fas ${icon} text-lg`}></i>
        </div>
        <p className="text-xs font-black leading-tight flex-1">{notification.message}</p>
        <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
          <i className="fas fa-times text-sm"></i>
        </button>
      </div>
    </div>
  );
};
