
import React from 'react';
import { Notification as NotificationType } from '../types';

interface NotificationProps {
  notification: NotificationType;
  onClose: () => void;
}

export const Notification: React.FC<NotificationProps> = ({ notification, onClose }) => {
  const DURATION = 20000; // 20 Seconds

  const styles = notification.type === 'error'
    ? {
      bg: 'bg-[#FFF5F5]/90',
      border: 'border-rose-200',
      iconBg: 'bg-rose-500',
      icon: 'fa-circle-xmark',
      text: 'text-rose-900',
      progress: 'bg-rose-500'
    }
    : notification.type === 'success'
      ? {
        bg: 'bg-[#F0FFF4]/90',
        border: 'border-emerald-200',
        iconBg: 'bg-emerald-500',
        icon: 'fa-circle-check',
        text: 'text-emerald-900',
        progress: 'bg-emerald-500'
      }
      : {
        bg: 'bg-[#EEF2FF]/90',
        border: 'border-indigo-200',
        iconBg: 'bg-indigo-500',
        icon: 'fa-circle-info',
        text: 'text-indigo-900',
        progress: 'bg-indigo-500'
      };

  React.useEffect(() => {
    const timer = setTimeout(onClose, DURATION);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[1000] w-[calc(100%-3rem)] max-w-md animate-in fade-in slide-in-from-top-6 zoom-in-95 duration-500">
      <div className={`relative overflow-hidden backdrop-blur-xl ${styles.bg} ${styles.border} border-2 p-6 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-start space-x-5`}>

        {/* Progress Bar Background */}
        <div className="absolute bottom-0 left-0 w-full h-1.5 bg-slate-200/30">
          <div
            className={`h-full ${styles.progress} transition-all ease-linear`}
            style={{
              width: '100%',
              animation: `shrinkWidth ${DURATION}ms linear forwards`
            }}
          />
        </div>

        <div className={`w-12 h-12 ${styles.iconBg} text-white rounded-[1.25rem] flex items-center justify-center shrink-0 shadow-lg shadow-current/20`}>
          <i className={`fas ${styles.icon} text-xl`}></i>
        </div>

        <div className="flex-1 pt-1">
          <h5 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1.5 opacity-40 ${styles.text}`}>
            {notification.type === 'error' ? 'Peringatan' : notification.type === 'success' ? 'Sukses' : 'Pemberitahuan'}
          </h5>
          <p className={`text-sm font-bold leading-relaxed ${styles.text}`}>
            {notification.message}
          </p>
        </div>

        <button
          onClick={onClose}
          className="mt-1 w-8 h-8 rounded-full hover:bg-slate-200/50 flex items-center justify-center text-slate-400 transition-all active:scale-90"
        >
          <i className="fas fa-times text-sm"></i>
        </button>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes shrinkWidth {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}} />
    </div>
  );
};
