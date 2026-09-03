import React, { useState, useEffect } from "react";
import { X, Phone, MessageSquare, Shield, Plus, ArrowRight, Users } from "lucide-react";
import { Link } from "react-router-dom";
import axiosInstance from "../../../api/axios";
import { showToast } from "../../../utils/showToast";

const TrustedContactsQuickModal = ({ isOpen, onClose }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      axiosInstance
        .get("/emergency/contacts", { withCredentials: true })
        .then((res) => {
          if (res.data?.success) {
            setContacts(res.data.contacts || []);
          }
        })
        .catch((err) => {
          console.error("Error loading emergency contacts:", err);
          showToast.error("Could not load trusted contacts.");
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-brand/60 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full sm:max-w-md bg-surface rounded-t-[20px] sm:rounded-[20px] shadow-lg border border-border-default overflow-hidden flex flex-col max-h-[85vh] animate-scale-up"
      >
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-[var(--radius-card)] bg-primary-50 text-brand border border-brand-200/60 ">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-text-primary m-0">
                Contact Trusted Person
              </h3>
              <p className="text-xs text-text-muted font-medium m-0 mt-0.5">
                Call or message someone you trust directly
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-text-muted hover:text-text-secondary hover:bg-background transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto space-y-3 flex-1">
          {loading ? (
            <div className="py-10 text-center text-text-muted">
              <div className="w-8 h-8 mx-auto border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-xs font-bold">Loading trusted contacts...</p>
            </div>
          ) : contacts.length === 0 ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-[var(--radius-card)] bg-background text-text-muted mx-auto flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-text-primary m-0">
                  No Trusted Contacts Registered
                </h4>
                <p className="text-xs text-text-muted font-medium max-w-xs mx-auto mt-1 m-0">
                  Add family members, friends, or trusted guardians to quickly call them during your travels.
                </p>
              </div>
              <Link to="/emergency-contacts" onClick={onClose} className="btn-primary">
                <Plus className="w-4 h-4" />
                <span>Add a Trusted Contact</span>
              </Link>
            </div>
          ) : (
            contacts.map((c) => (
              <div
                key={c._id}
                className="p-4 rounded-[var(--radius-card)] bg-slate-50 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-text-primary truncate m-0">
                      {c.name}
                    </h4>
                    {c.isPrimary && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                        Primary
                      </span>
                    )}
                    {c.relation && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-200 text-text-secondary text-[10px] font-bold">
                        {c.relation}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted font-medium mt-1 m-0">
                    {c.phone}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {c.phone && (
                    <>
                      <a
                        href={`tel:${c.phone}`}
                        className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </a>
                      <a
                        href={`sms:${c.phone}`}
                        className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-white hover:bg-background text-text-primary border border-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                        title="Opens your messaging app"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-text-muted" />
                        <span>Message</span>
                      </a>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
          <Link
            to="/emergency-contacts"
            onClick={onClose}
            className="text-xs font-bold text-brand hover:underline flex items-center gap-1"
          >
            <span>Manage all contacts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 text-text-primary font-bold hover transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrustedContactsQuickModal;
