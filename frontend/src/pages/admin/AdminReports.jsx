import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  ShieldAlert,
  Trash2,
  Unlock,
  X,
  XCircle,
} from "lucide-react";
import { showToast } from "../../utils/showToast";
import axios from "../../api/axios";

const blankConfirm = { isOpen: false, action: null, title: "", desc: "", payload: null };
const blankWarning = { isOpen: false, userId: null, message: "" };

const getStatus = (report) => (report.status || "pending").toLowerCase();
const getName = (user) => user?.username || user?.name || "Unknown user";

const statusClasses = {
  pending: "border-brand-300 bg-brand-50 text-brand-700",
  resolved: "border-brand-500 bg-brand-100 text-brand-800",
  dismissed: "border-brand-200 bg-white text-brand-600",
};

const ActionIconButton = ({ icon: Icon, title, onClick, toneClass }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-45 ${toneClass}`}
  >
    <Icon className="h-3.5 w-3.5" />
  </button>
);

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [warnModal, setWarnModal] = useState(blankWarning);
  const [confirmModal, setConfirmModal] = useState(blankConfirm);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await axios.get("/admin/reports");
      setReports(data.reports || []);
    } catch (requestError) {
      const message = requestError.response?.data?.message || "Failed to fetch reports.";
      setError(message);
      showToast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const executeAction = async () => {
    const { action, payload } = confirmModal;
    try {
      setActionLoading(true);
      if (action === "resolve") {
        await axios.put(`/admin/report/${payload.id}/resolve`, { status: payload.status });
        showToast.success(`Report marked as ${payload.status}`);
      } else if (action === "suspend") {
        await axios.put(`/admin/users/${payload.id}/suspend`);
        showToast.success("User suspended");
      } else if (action === "unsuspend") {
        await axios.put(`/admin/users/${payload.id}/unsuspend`);
        showToast.success("User unsuspended");
      } else if (action === "delete_post") {
        await axios.delete(`/admin/post/${payload.id}`);
        showToast.success("Post deleted");
      } else if (action === "delete_group") {
        await axios.delete(`/admin/group/${payload.id}`);
        showToast.success("Group deleted");
      }
      await fetchReports();
    } catch (requestError) {
      showToast.error(requestError.response?.data?.message || "Action failed");
    } finally {
      setActionLoading(false);
      setConfirmModal(blankConfirm);
    }
  };

  const handleWarnUser = async (event) => {
    event.preventDefault();
    if (!warnModal.message.trim()) return showToast.error("Message is required");

    try {
      setActionLoading(true);
      await axios.post(`/admin/users/${warnModal.userId}/warn`, { message: warnModal.message });
      showToast.success("Warning sent to user");
      setWarnModal(blankWarning);
    } catch (requestError) {
      showToast.error(requestError.response?.data?.message || "Failed to send warning");
    } finally {
      setActionLoading(false);
    }
  };

  const summary = useMemo(
    () =>
      reports.reduce(
        (counts, report) => {
          const status = getStatus(report);
          counts[status] = (counts[status] || 0) + 1;
          return counts;
        },
        { pending: 0, resolved: 0, dismissed: 0 }
      ),
    [reports]
  );

  const filteredReports = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return reports.filter((report) => {
      const status = getStatus(report);
      const matchesStatus = filter === "all" || status === filter;
      const text = [
        getName(report.reporter),
        getName(report.reportedUser),
        report.targetType,
        report.reason,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return matchesStatus && (!normalizedSearch || text.includes(normalizedSearch));
    });
  }, [filter, reports, search]);

  return (
    <main className="min-h-[calc(100vh-72px)] bg-slate-50 px-3 pb-6 pt-4 text-slate-900 sm:px-4 lg:px-6">
      <div className="mx-auto max-w-[1450px]">
        <motion.header
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-end"
        >
          <div>
            <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-600">
              <ShieldAlert className="h-4 w-4" />
              Priority workspace
            </p>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Reports & Moderation</h1>
            <p className="mt-1 text-xs text-slate-600">
              Triage safety flags, remove harmful content, and enforce account restrictions.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Pending", value: summary.pending, tone: "text-brand-700 bg-brand-100" },
              { label: "Resolved", value: summary.resolved, tone: "text-brand-800 bg-brand-200" },
              { label: "Dismissed", value: summary.dismissed, tone: "text-brand-600 bg-brand-50" },
            ].map((item) => (
              <div key={item.label} className={`rounded-lg px-3 py-1.5 ${item.tone}`}>
                <p className="text-base font-semibold">{item.value}</p>
                <p className="text-[9px] uppercase tracking-widest opacity-80">{item.label}</p>
              </div>
            ))}
          </div>
        </motion.header>

        <div
          role="region"
          aria-label="Filter reports"
          className="mb-4 flex flex-col gap-2 rounded-xl border border-brand-200 bg-brand-50 p-2 sm:flex-row"
        >
          <label className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search reporter, user, reason..."
              className="h-9 w-full rounded-lg border border-brand-200 bg-white pl-9 pr-3 text-xs text-slate-900 outline-none placeholder:text-slate-500 focus:border-brand-400/35"
            />
          </label>
          <label className="relative sm:w-48">
            <Filter className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="h-9 w-full appearance-none rounded-lg border border-brand-200 bg-white pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-brand-400/35"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </label>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-brand-300 bg-brand-50 px-3 py-2 text-xs text-brand-800">
            <AlertTriangle className="h-4 w-4 shrink-0 text-brand-600" />
            <span className="flex-1">{error}</span>
            <button type="button" onClick={fetchReports} className="font-medium text-brand-900 hover:underline">
              Retry
            </button>
          </div>
        )}

        <div
          role="region"
          aria-label="Moderation report queue"
          className="overflow-hidden rounded-xl border border-brand-200 bg-brand-50 shadow-sm"
        >
          {loading ? (
            <div className="flex h-48 items-center justify-center gap-2 text-xs text-slate-600">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-300/25 border-t-brand-300" />
              Loading reports...
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-slate-600">
              <CheckCircle2 className="mb-2 h-6 w-6 text-brand-500" />
              <p className="text-xs font-medium text-slate-800">No reports match this view</p>
              <p className="mt-1 text-[10px] text-slate-500">Try adjusting your search or status filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1020px] text-left text-sm">
                <thead className="border-b border-brand-200 bg-brand-50 text-[9px] uppercase tracking-[0.18em] text-slate-500">
                  <tr>
                    <th className="px-3 py-2.5 font-medium">Received</th>
                    <th className="px-3 py-2.5 font-medium">Reporter</th>
                    <th className="px-3 py-2.5 font-medium">Reported user</th>
                    <th className="px-3 py-2.5 font-medium">Target</th>
                    <th className="px-3 py-2.5 font-medium">Reason</th>
                    <th className="px-3 py-2.5 font-medium">Status</th>
                    <th className="px-3 py-2.5 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report) => {
                    const status = getStatus(report);
                    const reportedName = getName(report.reportedUser);
                    return (
                      <tr
                        key={report._id}
                        className="border-b border-brand-200 text-slate-700 transition last:border-0 hover:bg-brand-50"
                      >
                        <td className="whitespace-nowrap px-3 py-2 text-[11px] text-slate-600">
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            {new Date(report.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-[11px]">{getName(report.reporter)}</td>
                        <td className="px-3 py-2 text-[11px] font-medium text-slate-900">
                          {reportedName}
                          {report.reportedUser?.isSuspended && (
                            <span className="ml-1.5 rounded bg-rose-100 px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-rose-700">
                              SUSPENDED
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-[11px] capitalize text-slate-600">{report.targetType}</td>
                        <td className="max-w-[200px] truncate px-3 py-2 text-[11px]" title={report.reason}>
                          {report.reason}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`rounded-md border px-2 py-0.5 text-[9px] font-semibold capitalize ${
                              statusClasses[status] || statusClasses.pending
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            {status === "pending" && (
                              <>
                                <ActionIconButton
                                  icon={CheckCircle2}
                                  title="Resolve report"
                                  onClick={() =>
                                    setConfirmModal({
                                      isOpen: true,
                                      action: "resolve",
                                      title: "Resolve report",
                                      desc: "Mark this report as resolved?",
                                      payload: { id: report._id, status: "resolved" },
                                    })
                                  }
                                  toneClass="border-brand-300 bg-brand-100 text-brand-700 hover:bg-brand-200"
                                />
                                <ActionIconButton
                                  icon={XCircle}
                                  title="Dismiss report"
                                  onClick={() =>
                                    setConfirmModal({
                                      isOpen: true,
                                      action: "resolve",
                                      title: "Dismiss report",
                                      desc: "Mark this report as dismissed?",
                                      payload: { id: report._id, status: "dismissed" },
                                    })
                                  }
                                  toneClass="border-brand-200 bg-white text-slate-600 hover:bg-brand-50 hover:text-brand-600"
                                />
                              </>
                            )}
                            {report.targetType === "post" && (
                              <ActionIconButton
                                icon={Trash2}
                                title="Delete post"
                                onClick={() =>
                                  setConfirmModal({
                                    isOpen: true,
                                    action: "delete_post",
                                    title: "Delete post",
                                    desc: "Permanently delete this reported post?",
                                    payload: { id: report.targetId },
                                  })
                                }
                                toneClass="border-brand-300 bg-brand-50 text-brand-700 hover:bg-brand-100"
                              />
                            )}
                            {report.targetType === "group" && (
                              <ActionIconButton
                                icon={Trash2}
                                title="Delete group"
                                onClick={() =>
                                  setConfirmModal({
                                    isOpen: true,
                                    action: "delete_group",
                                    title: "Delete group",
                                    desc: "Permanently delete this reported travel group?",
                                    payload: { id: report.targetId },
                                  })
                                }
                                toneClass="border-brand-300 bg-brand-50 text-brand-700 hover:bg-brand-100"
                              />
                            )}
                            {report.reportedUser?._id && (
                              <>
                                <ActionIconButton
                                  icon={AlertTriangle}
                                  title="Warn user"
                                  onClick={() =>
                                    setWarnModal({ isOpen: true, userId: report.reportedUser._id, message: "" })
                                  }
                                  toneClass="border-brand-300 bg-brand-50 text-brand-700 hover:bg-brand-100"
                                />
                                {report.reportedUser.isSuspended ? (
                                  <ActionIconButton
                                    icon={Unlock}
                                    title="Unsuspend user"
                                    onClick={() =>
                                      setConfirmModal({
                                        isOpen: true,
                                        action: "unsuspend",
                                        title: "Unsuspend user",
                                        desc: `Restore access for ${reportedName}?`,
                                        payload: { id: report.reportedUser._id },
                                      })
                                    }
                                    toneClass="border-brand-200 bg-white text-brand-600 hover:bg-brand-50"
                                  />
                                ) : (
                                  <ActionIconButton
                                    icon={Ban}
                                    title="Suspend user"
                                    onClick={() =>
                                      setConfirmModal({
                                        isOpen: true,
                                        action: "suspend",
                                        title: "Suspend user",
                                        desc: `Suspend ${reportedName}? They will not be able to post or message.`,
                                        payload: { id: report.reportedUser._id },
                                      })
                                    }
                                    toneClass="border-brand-400 bg-brand-100 text-brand-800 hover:bg-brand-200"
                                  />
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {confirmModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="w-full max-w-sm rounded-3xl border border-brand-200 bg-white p-6 shadow-2xl"
            >
              <div className="mb-2 flex items-start justify-between">
                <h3 className="text-base font-semibold text-slate-900">{confirmModal.title}</h3>
                <button type="button" onClick={() => setConfirmModal(blankConfirm)} className="text-slate-500 hover:text-slate-900">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mb-4 text-xs leading-5 text-slate-600">{confirmModal.desc}</p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmModal(blankConfirm)}
                  className="rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-brand-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={executeAction}
                  className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-slate-900 transition hover:bg-brand-500 disabled:opacity-50"
                >
                  {actionLoading ? "Working..." : "Confirm"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {warnModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="w-full max-w-md rounded-3xl border border-brand-200 bg-white p-6 shadow-2xl"
            >
              <div className="mb-2 flex items-start justify-between">
                <h3 className="text-base font-semibold text-slate-900">Send warning</h3>
                <button type="button" onClick={() => setWarnModal(blankWarning)} className="text-slate-500 hover:text-slate-900">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mb-3 text-xs text-slate-600">This sends an in-app moderation notice to the user.</p>
              <form onSubmit={handleWarnUser}>
                <textarea
                  value={warnModal.message}
                  onChange={(event) => setWarnModal({ ...warnModal, message: event.target.value })}
                  className="h-20 w-full resize-none rounded-lg border border-brand-200 bg-brand-50 p-2 text-xs text-slate-900 outline-none placeholder:text-slate-500 focus:border-amber-300/40"
                  placeholder="Enter warning message..."
                  required
                />
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setWarnModal(blankWarning)}
                    className="rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-brand-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-500 disabled:opacity-50"
                  >
                    {actionLoading ? "Sending..." : "Send warning"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default AdminReports;

