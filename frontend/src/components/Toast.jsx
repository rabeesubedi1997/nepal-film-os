import React from 'react';
import { useToastStore } from '../toastStore';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
};

const styles = {
  success: 'bg-emerald-600 border-emerald-500 text-white',
  error: 'bg-red-600 border-red-500 text-white',
  info: 'bg-blue-600 border-blue-500 text-white',
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map(t => {
        const Icon = icons[t.type] || icons.info;
        return (
          <div key={t.id}
            className={`flex items-start gap-2.5 px-4 py-3 rounded-lg border shadow-lg animate-fade-in ${styles[t.type] || styles.info}`}>
            <Icon className="h-4 w-4 mt-0.5 shrink-0" />
            <p className="text-sm font-medium flex-1">{t.message}</p>
            <button onClick={() => removeToast(t.id)} className="p-0.5 rounded hover:bg-black/20 transition-colors shrink-0">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
