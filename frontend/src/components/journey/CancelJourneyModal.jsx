import React, { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

const CancelJourneyModal = ({ isOpen, onClose, onConfirm, journeyTitle }) => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(reason);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transform transition-all animate-scale-in">
        <div className="absolute top-4 right-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-full bg-background hover text-text-muted hover:text-text-secondary transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 pt-8 pb-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          
          <h3 className="text-xl font-black text-text-primary mb-2">
            Cancel Journey?
          </h3>
          <p className="text-sm text-text-muted mb-6 px-4">
            Are you sure you want to cancel <strong className="text-text-primary font-bold">"{journeyTitle}"</strong>? All members will be notified and this action cannot be undone.
          </p>

          <div className="w-full text-left mb-6">
            <label className="block text-xs font-bold text-text-primary mb-2">
              Optional Reason
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are you cancelling this journey?"
              className="input-field"
              maxLength={200}
              disabled={loading}
            />
          </div>

          <div className="w-full flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl font-bold text-sm bg-background hover text-text-primary transition-colors disabled:opacity-50"
            >
              Keep Journey
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl font-black text-sm bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? "Cancelling..." : "Yes, Cancel It"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelJourneyModal;
