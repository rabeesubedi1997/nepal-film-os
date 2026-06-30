import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (open) { document.body.style.overflow = 'hidden'; }
    else { document.body.style.overflow = ''; }
    return () => { document.body.style.overflow = ''; };
  }, [open]);
  if (!open) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl', full: 'max-w-5xl' };
  return (
    <div className="fixed inset-0 z-50 bg-black/70 overflow-y-auto" onClick={onClose}>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className={`bg-slate-900 border border-slate-700 rounded-xl w-full ${sizes[size] || sizes.md} ${size === 'xl' || size === 'full' ? '' : 'max-h-[85vh] overflow-y-auto'}`} onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
            <button onClick={onClose} className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function Card({ children, className = '' }) {
  return <div className={`bg-slate-900 border border-slate-800 rounded-xl p-5 ${className}`}>{children}</div>;
}

export function StatCard({ label, value, sub, color = 'text-amber-400' }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <p className="text-xs text-slate-500 font-medium">{label}</p>
      <p className={`text-lg font-bold mt-0.5 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}
    </div>
  );
}

export function Input({ label, type = 'text', value, onChange, required, options, step, placeholder, name }) {
  const id = label?.toLowerCase().replace(/\s+/g, '_');
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-slate-400">
          {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}
      {options ? (
        <select id={id} value={value} onChange={onChange} name={name} required={required}
          className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 transition-colors">
          <option value="">Select...</option>
          {options.map(o => typeof o === 'string'
            ? <option key={o} value={o}>{o}</option>
            : <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input type={type} id={id} value={value} onChange={onChange} name={name} required={required} step={step} placeholder={placeholder}
          className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors" />
      )}
    </div>
  );
}

const badgeStyles = {
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
  green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  red: 'bg-red-500/10 text-red-400 border-red-500/25',
  blue: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
  slate: 'bg-slate-800 text-slate-400 border-slate-700',
};

export function Badge({ children, color = 'slate' }) {
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${badgeStyles[color] || badgeStyles.slate}`}>
      {children}
    </span>
  );
}

export function Button({ children, variant = 'secondary', size = 'default', onClick, type, className = '', ...props }) {
  const variants = {
    primary: 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold border-amber-500',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700',
    ghost: 'bg-transparent hover:bg-slate-800/60 text-slate-400 border-transparent',
    danger: 'bg-transparent hover:bg-red-500/10 text-red-400 border-transparent',
  };
  const sizes = {
    default: 'px-4 py-2 text-sm',
    sm: 'px-3 py-1.5 text-xs',
    icon: 'p-2',
  };
  return (
    <button type={type || 'button'} onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg border font-medium transition-all ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}
