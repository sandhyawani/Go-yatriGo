import { showToast } from "../utils/showToast";
// src/pages/AdminContactRequests.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "../api/axios";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Clock,
  FileText,
  Filter,
  Mail,
  MessageCircle,
  RefreshCw,
  RotateCcw,
  Search,
  User,
} from "lucide-react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";

const STATUS = {
  ALL: "ALL",
  PENDING: "PENDING",
  RESOLVED: "RESOLVED",
};

const ViewState = {
  LOADING: "loading",
  ERROR: "error",
  EMPTY: "empty",
  SUCCESS: "success",
};

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm animate-pulse">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
        <div className="w-full lg:w-40 space-y-3">
          <div className="h-6 w-24 rounded-full bg-slate-200" />
          <div className="h-4 w-28 rounded bg-slate-100" />
        </div>
        <div className="flex-1 space-y-3">
          <div className="h-5 w-48 rounded bg-slate-200" />
          <div className="h-4 w-64 rounded bg-slate-100" />
          <div className="h-24 rounded-2xl bg-slate-100" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 rounded-xl bg-brand-50" />
          <div className="h-9 w-9 rounded-xl bg-brand-50" />
        </div>
      </div>
    </div>
  );
}

function StatPill({ label, value, tone }) {
  const toneClass =
    tone === "warning"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-emerald-50 text-emerald-700 border-emerald-200";

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${toneClass}`}>
      <span>{value}</span>
      <span>{label}</span>
    </div>
  );
}

function SearchBox({ value, onChange }) {
  return (
    <div className="relative w-full sm:w-72">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder="Search inquiries..."
        aria-label="Search inquiries"
        className="w-full rounded-xl border border-slate-100 bg-slate-50 py-2.5 pl-10 pr-3 text-xs font-medium text-slate-700 outline-none transition focus:border-brand-300 focus:bg-white focus:ring-4 focus:ring-brand-100"
      />
    </div>
  );
}

function StatusFilter({ value, onChange }) {
  return (
    <div className="relative w-full sm:w-48">
      <Filter className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <select
        value={value}
        onChange={onChange}
        aria-label="Filter by status"
        className="w-full appearance-none rounded-xl border border-slate-100 bg-slate-50 py-2.5 pl-10 pr-3 text-xs font-bold text-slate-700 outline-none transition focus:border-brand-300 focus:bg-white focus:ring-4 focus:ring-brand-100"
      >
        <option value={STATUS.ALL}>All Status</option>
        <option value={STATUS.PENDING}>Pending</option>
        <option value={STATUS.RESOLVED}>Resolved</option>
      </select>
    </div>
  );
}

function ErrorState({ message, onRetry, retrying }) {
  return (
    <div className="rounded-3xl border border-red-100 bg-red-50 p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-red-500 shadow-sm">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-red-800">Failed to load contact requests</h3>
          <p className="mt-1 text-sm text-red-700">{message}</p>
        </div>
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${retrying ? "animate-spin" : ""}`} />
          Retry
        </button>
      </div>
    </div>
  );
}

function EmptyState({ hasFilters }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white px-4 py-12 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400">
        <Mail className="h-8 w-8" />
      </div>
      <h3 className="text-xl font-bold text-slate-900">No Inquiries Found</h3>
      <p className="mx-auto mt-2 max-w-md text-sm font-medium text-slate-500">
        {hasFilters
          ? "No contact requests match your current search or status filter."
          : "There are no contact requests yet."}
      </p>
    </div>
  );
}

function ContactCard({ contact, index, onRespond, onToggleStatus, isUpdating }) {
  const isPending = contact.status === STATUS.PENDING;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.24) }}
      className="group rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition hover:border-brand-200 hover:shadow-md"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
        <div className="w-full shrink-0 lg:w-44">
          <div
            className={`mb-3 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
              isPending ? "bg-amber-50 text-amber-700 border border-amber-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isPending ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
              }`}
            />
            {contact.status}
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Clock className="h-3.5 w-3.5" />
            {new Date(contact.createdAt).toLocaleDateString()}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 shrink-0 text-brand-600" />
            <h3 className="truncate text-base font-bold text-slate-900">{contact.name}</h3>
          </div>

          <div className="mb-3 flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <a
              href={`mailto:${contact.email}`}
              className="truncate transition hover:text-brand-600"
            >
              {contact.email}
            </a>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 transition group-hover:bg-brand-50/30">
            <div className="mb-1.5 flex items-center gap-1.5">
              <FileText className="h-3 w-3 shrink-0 text-slate-400" />
              <span className="truncate text-xs font-bold uppercase tracking-wider text-brand-600">
                {contact.subject || "No Subject"}
              </span>
            </div>
            <p className="line-clamp-3 text-xs font-medium leading-relaxed text-slate-600">
              {contact.message}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => onRespond(contact)}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand-600 px-4 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-brand-700 shadow-sm"
          >
            Respond
            <ChevronRight className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onToggleStatus(contact)}
            disabled={isUpdating}
            title={isPending ? "Mark as Resolved" : "Mark as Pending"}
            aria-label={isPending ? "Mark as Resolved" : "Mark as Pending"}
            className={`flex h-10 w-10 items-center justify-center rounded-xl transition border disabled:cursor-not-allowed disabled:opacity-50 ${
              isPending
                ? "bg-brand-50 border-brand-100 text-brand-600 hover:bg-brand-600 hover:text-white hover:border-brand-600"
                : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-500 hover:text-white hover:border-slate-500"
            }`}
          >
            {isPending ? <CheckCircle className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </motion.article>
  );
}

const AdminContactRequests = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState(STATUS.ALL);
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingIds, setPendingIds] = useState(new Set());

  useEffect(() => {
    if (user && !user.isAdmin) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const fetchContacts = useCallback(async ({ isRetry = false } = {}) => {
    if (isRetry) {
      setRetrying(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await axios.get("/contact");
      setContacts(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Please try again in a moment.");
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const filteredContacts = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();

    return contacts.filter((contact) => {
      const matchesFilter = filter === STATUS.ALL || contact.status === filter;

      if (!normalizedTerm) {
        return matchesFilter;
      }

      const haystack = [
        contact.name,
        contact.email,
        contact.subject,
        contact.message,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesFilter && haystack.includes(normalizedTerm);
    });
  }, [contacts, filter, searchTerm]);

  const stats = useMemo(() => {
    let pending = 0;
    let resolved = 0;

    for (const contact of contacts) {
      if (contact.status === STATUS.PENDING) pending += 1;
      if (contact.status === STATUS.RESOLVED) resolved += 1;
    }

    return { pending, resolved };
  }, [contacts]);

  const viewState = useMemo(() => {
    if (loading) return ViewState.LOADING;
    if (error) return ViewState.ERROR;
    if (filteredContacts.length === 0) return ViewState.EMPTY;
    return ViewState.SUCCESS;
  }, [loading, error, filteredContacts.length]);

  const updateStatus = async (contact) => {
    const id = contact._id;
    const nextStatus =
      contact.status === STATUS.PENDING ? STATUS.RESOLVED : STATUS.PENDING;

    if (pendingIds.has(id)) return;

    setPendingIds((prev) => new Set(prev).add(id));
    setContacts((prev) =>
      prev.map((item) =>
        item._id === id ? { ...item, status: nextStatus } : item
      )
    );

    try {
      await axios.put(`/contact/${id}`, { status: nextStatus });

      await Swal.fire({
        icon: nextStatus === STATUS.RESOLVED ? "success" : "info",
        title:
          nextStatus === STATUS.RESOLVED
            ? "Inquiry Resolved"
            : "Inquiry Reopened",
        text:
          nextStatus === STATUS.RESOLVED
            ? "The request has been marked as completed."
            : "The request has been marked as pending again.",
        confirmButtonColor:
          nextStatus === STATUS.RESOLVED ? "#10b981" : "#7c3aed",
        customClass: { popup: "rounded-3xl" },
      });
    } catch (err) {
      setContacts((prev) =>
        prev.map((item) =>
          item._id === id ? { ...item, status: contact.status } : item
        )
      );

      await showToast.error("Update Failed");
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleRespond = async (contact) => {
    const { value: replyText } = await Swal.fire({
      title: `Reply to ${contact.name}`,
      html: `<p class="text-sm text-slate-500 mb-2">${contact.email}</p>`,
      input: "textarea",
      inputPlaceholder: "Type your reply here...",
      inputAttributes: { rows: 5 },
      showCancelButton: true,
      confirmButtonText: "Send Reply",
      buttonsStyling: false,
      customClass: {
        popup: "rounded-3xl border border-slate-100 shadow-xl bg-white",
        title: "text-xl font-bold text-slate-800",
        confirmButton: "bg-brand-600 hover:bg-brand-700 text-white rounded-xl px-6 py-2.5 font-bold text-sm transition-colors mx-2",
        cancelButton: "bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl px-6 py-2.5 font-bold text-sm transition-colors mx-2",
        input: "rounded-xl border border-slate-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 text-sm p-3 w-[90%] mx-auto mt-4 transition-all outline-none"
      },
      inputValidator: (value) => {
        if (!value?.trim()) return "Reply cannot be empty.";
        return undefined;
      },
    });

    if (!replyText?.trim()) return;

    try {
      await axios.post(`/contact/${contact._id}/reply`, {
        message: replyText.trim(),
      });

      await showToast.success("Reply Sent");
    } catch (err) {
      await showToast.error("Send Failed");
    }
  };

  if (!user) return null;

  const hasActiveFilters = Boolean(searchTerm.trim()) || filter !== STATUS.ALL;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      <div className="mx-auto max-w-7xl px-6 pt-10">
        <div className="mb-10 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="rounded-xl bg-brand-600 p-2 text-white shadow-md shadow-brand-500/20">
                <MessageCircle className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
                Concierge Services
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 mt-1">
              Contact Requests
            </h1>

            {!loading && !error && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatPill label="Pending" value={stats.pending} tone="warning" />
                <StatPill label="Resolved" value={stats.resolved} tone="success" />
              </div>
            )}
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
            <SearchBox
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <StatusFilter
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-4">
          {viewState === ViewState.LOADING && (
            <>
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </>
          )}

          {viewState === ViewState.ERROR && (
            <ErrorState
              message={error}
              onRetry={() => fetchContacts({ isRetry: true })}
              retrying={retrying}
            />
          )}

          {viewState === ViewState.EMPTY && (
            <EmptyState hasFilters={hasActiveFilters} />
          )}

          {viewState === ViewState.SUCCESS &&
            filteredContacts.map((contact, index) => (
              <ContactCard
                key={contact._id}
                contact={contact}
                index={index}
                onRespond={handleRespond}
                onToggleStatus={updateStatus}
                isUpdating={pendingIds.has(contact._id)}
              />
            ))}
        </div>
      </div>
    </div>
  );
};

export default AdminContactRequests;