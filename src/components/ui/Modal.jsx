import { X } from 'lucide-react'
import { Button } from './Button'

export function Modal({ open, title, children, onClose, footer, className = '', size }) {
  if (!open) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-5xl',
    '3xl': 'max-w-6xl',
    full: 'max-w-[92vw]',
  };

  const maxWidthClass = size ? sizeClasses[size] || size : className.includes('max-w-') ? '' : 'max-w-lg';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <button
        type="button"
        aria-label="Close overlay"
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div
        className={`relative z-10 w-full ${maxWidthClass} ${className} rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl overflow-hidden animate-fadeIn my-auto`}
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/60">
          <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[78vh] overflow-y-auto p-6">{children}</div>
        {footer && <div className="flex justify-end gap-3 border-t border-slate-800 p-4 bg-slate-950/60">{footer}</div>}
      </div>
    </div>
  );
}

export function ModalActions({ onCancel, onConfirm, confirmLabel = 'Save', loading }) {
  return (
    <>
      <Button type="button" variant="ghost" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="button" onClick={onConfirm} disabled={loading}>
        {loading ? 'Please wait…' : confirmLabel}
      </Button>
    </>
  )
}
