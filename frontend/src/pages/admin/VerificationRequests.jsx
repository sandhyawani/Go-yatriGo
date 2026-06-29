/* eslint-disable no-unused-vars, react-hooks/exhaustive-deps, jsx-a11y/alt-text, jsx-a11y/img-redundant-alt */
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import axios from "../../api/axios";
import Swal from "sweetalert2";
import {
  CheckCircle,
  XCircle,
  FileText,
  AlertCircle,
  Download,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Maximize,
  User,
  RefreshCw,
  Loader2,
  Calendar,
  Mail,
  Phone,
  Fingerprint,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment";

const VerificationRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/admin/verifications", {
        withCredentials: true,
      });
      setRequests(res.data);
    } catch (err) {
      console.error(err);
      Swal.fire({
        background: "#ffffff",
        color: "#0f172a",
        title: "Error",
        text: "Could not fetch verification requests.",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (isRejecting) setIsRejecting(false);
        else closeReviewModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRejecting]);

  const closeReviewModal = () => {
    setSelectedUser(null);
    setZoom(1);
    setRotation(0);
    setImageLoaded(false);
    setIsFullscreen(false);
    setIsRejecting(false);
    setRejectReason("");
    setCustomReason("");
  };

  const handleApprove = async (id) => {
    setActionLoading(true);
    try {
      await axios.put(
        `/admin/user/${id}/verify/approve`,
        {},
        { withCredentials: true },
      );
      Swal.fire({
        background: "#ffffff",
        color: "#0f172a",
        title: "Approved",
        text: "User has been verified successfully.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
      closeReviewModal();
      fetchRequests();
    } catch (err) {
      console.error(err);
      Swal.fire({
        background: "#ffffff",
        color: "#0f172a",
        title: "Error",
        text: "Could not approve user.",
        icon: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id) => {
    const finalReason = rejectReason === "Custom" ? customReason : rejectReason;
    if (!finalReason) {
      Swal.fire({
        background: "#ffffff",
        color: "#0f172a",
        title: "Error",
        text: "Please select or enter a rejection reason",
        icon: "warning",
      });
      return;
    }

    setActionLoading(true);
    try {
      await axios.put(
        `/admin/user/${id}/verify/reject`,
        { reason: finalReason },
        { withCredentials: true },
      );
      Swal.fire({
        background: "#ffffff",
        color: "#0f172a",
        title: "Rejected",
        text: "User verification rejected.",
        icon: "info",
        timer: 1500,
        showConfirmButton: false,
      });
      closeReviewModal();
      fetchRequests();
    } catch (err) {
      console.error(err);
      Swal.fire({
        background: "#ffffff",
        color: "#0f172a",
        title: "Error",
        text: "Could not reject user.",
        icon: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const predefinedReasons = [
    "Blurry document",
    "Invalid document",
    "Expired document",
    "Information mismatch",
    "Unsupported document",
    "Custom",
  ];

  const handleDownload = (url, name) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `${name.replace(/\s+/g, "_")}_GovID`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
    setZoom(1);
    setRotation(0);
  };

  return (
    <div className="min-h-screen pt-4 pb-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Verification Requests
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Review and process pending Government IDs uploaded by users.
            </p>
          </div>
          <button
            onClick={fetchRequests}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition text-sm font-medium text-slate-700 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
              <p className="text-slate-500 font-medium">Loading requests...</p>
            </div>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-lg shadow-slate-200/50 max-w-2xl mx-auto mt-10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-cyan-50 text-purple-600 mb-6 border-8 border-cyan-50/50">
              <CheckCircle className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              All caught up!
            </h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-8">
              There are no pending verification requests at this time. Great job
              keeping the platform safe.
            </p>
            <button
              onClick={fetchRequests}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-bold shadow-lg shadow-purple-600/20"
            >
              <RefreshCw className="w-4 h-4 text-slate-900" /> Check Again
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {requests.map((user) => (
              <div
                key={user._id}
                className="bg-white rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/50 overflow-hidden flex flex-col hover:border-purple-600/30 hover:shadow-purple-600/10 transition-all group"
              >
                <div className="p-5 flex items-start gap-4">
                  <img
                    src={
                      user.pic ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "User")}&background=f8fafc&color=0891b2`
                    }
                    alt={user.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "User")}&background=f8fafc&color=0891b2`;
                    }}
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shrink-0 shadow-sm"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-slate-900 truncate group-hover:text-purple-600 transition-colors">
                      {user.name}
                    </h3>
                    <p className="text-xs text-slate-500 truncate mb-2">
                      @{user.username || user.name.split(" ")[0].toLowerCase()}
                    </p>
                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 border border-amber-200">
                      <AlertCircle className="h-3 w-3" />
                      Pending Review
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-5 mt-auto">
                  <div className="flex justify-between items-center mb-4 text-xs font-medium text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                        Document Type
                      </span>
                      <span className="text-slate-700">
                        {user.govIdType || "Not Specified"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 text-right">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                        Submitted
                      </span>
                      <span className="text-slate-700">
                        {moment(user.updatedAt).fromNow()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedUser(user)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-50 hover:bg-cyan-50 border border-slate-200 hover:border-cyan-200 hover:text-cyan-700 text-slate-700 text-sm font-semibold transition-all shadow-sm"
                  >
                    <FileText className="w-4 h-4" />
                    Quick View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review modal */}
      {createPortal(
        <AnimatePresence>
          {selectedUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
            >
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-white/60 backdrop-blur-sm"
                onClick={closeReviewModal}
              ></div>

              {/* Modal Container */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className={`relative ${isFullscreen ? "w-screen h-screen rounded-none" : "w-[90vw] h-[90vh] rounded-[24px] border border-slate-200"} bg-white shadow-2xl flex flex-col overflow-hidden transition-all duration-300`}
              >
                {/* Header */}
                <div className="h-20 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-4">
                    <img
                      src={
                        selectedUser.pic ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name || "User")}&background=f8fafc&color=0891b2`
                      }
                      alt="Avatar"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name || "User")}&background=f8fafc&color=0891b2`;
                      }}
                      className="w-12 h-12 rounded-full border border-slate-200 object-cover"
                    />
                    <div>
                      <h2 className="text-slate-900 font-bold text-lg flex items-center gap-3">
                        {selectedUser.name}
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-600 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>{" "}
                          Pending
                        </span>
                      </h2>
                      <p className="text-slate-500 text-sm">
                        @{selectedUser.username} • Submitted{" "}
                        {moment(selectedUser.updatedAt).format("MMM DD, YYYY")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        handleDownload(selectedUser.govId, selectedUser.name)
                      }
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-200 transition group tooltip-trigger"
                    >
                      <Download className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                    <button
                      onClick={toggleFullscreen}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300 transition"
                    >
                      <Maximize className="w-5 h-5" />
                    </button>
                    <div className="w-px h-8 bg-slate-200 mx-1"></div>
                    <button
                      onClick={closeReviewModal}
                      className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition border border-red-100 hover:border-red-200"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col lg:flex-row min-h-0 bg-slate-50">
                  {/* Document Viewer */}
                  <div className="flex-1 relative flex flex-col min-h-0 border-r border-slate-200 overflow-hidden">
                    {/* Toolbar */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-white/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-lg">
                      <button
                        onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}
                        className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
                        className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <div className="w-px h-4 bg-slate-200 mx-1"></div>
                      <button
                        onClick={() => setRotation((r) => r - 90)}
                        className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setRotation((r) => r + 90)}
                        className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>
                      <div className="w-px h-4 bg-slate-200 mx-1"></div>
                      <button
                        onClick={() => {
                          setZoom(1);
                          setRotation(0);
                        }}
                        className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 text-xs font-bold tracking-wider px-3 transition"
                      >
                        RESET
                      </button>
                    </div>

                    {/* Image Area */}
                    <div className="flex-1 overflow-hidden flex items-center justify-center p-8 relative">
                      {!imageLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                        </div>
                      )}
                      {selectedUser.govId.toLowerCase().endsWith(".pdf") ? (
                        <iframe
                          src={selectedUser.govId}
                          className="w-full h-full max-h-[75vh] rounded-xl border border-slate-200 bg-white shadow-xl"
                          title="Document Preview"
                          onLoad={() => setImageLoaded(true)}
                        ></iframe>
                      ) : (
                        <motion.img
                          src={selectedUser.govId}
                          alt="Government ID"
                          className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-xl transition-opacity duration-300 bg-white"
                          style={{
                            scale: zoom,
                            rotate: rotation,
                            opacity: imageLoaded ? 1 : 0,
                          }}
                          onLoad={() => setImageLoaded(true)}
                          drag
                          dragConstraints={{
                            top: -200,
                            left: -200,
                            right: 200,
                            bottom: 200,
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Side Panel */}
                  <div className="w-full lg:w-96 bg-white flex flex-col shrink-0 overflow-y-auto hidden lg:flex">
                    <div className="p-6 space-y-6 flex-1">
                      <h3 className="text-slate-500 font-bold text-sm uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                        User Details
                      </h3>

                      <div className="space-y-5">
                        <div className="flex items-start gap-4">
                          <div className="p-2.5 rounded-xl bg-slate-50 text-purple-600 border border-slate-100">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">
                              Full Name
                            </p>
                            <p className="text-slate-800 text-sm font-medium">
                              {selectedUser.name}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <div className="p-2.5 rounded-xl bg-slate-50 text-purple-600 border border-slate-100">
                            <Mail className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">
                              Email Address
                            </p>
                            <p className="text-slate-800 text-sm font-medium break-all">
                              {selectedUser.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <div className="p-2.5 rounded-xl bg-slate-50 text-purple-600 border border-slate-100">
                            <Phone className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">
                              Phone Number
                            </p>
                            <p className="text-slate-800 text-sm font-medium">
                              {selectedUser.mobile || "Not provided"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <h3 className="text-slate-500 font-bold text-sm uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 pt-6">
                        Verification Info
                      </h3>

                      <div className="space-y-5">
                        <div className="flex items-start gap-4">
                          <div className="p-2.5 rounded-xl bg-slate-50 text-purple-600 border border-slate-100">
                            <Fingerprint className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">
                              Document Type
                            </p>
                            <p className="text-slate-800 text-sm font-medium">
                              {selectedUser.govIdType || "Not Specified"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <div className="p-2.5 rounded-xl bg-slate-50 text-purple-600 border border-slate-100">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">
                              Submission Date
                            </p>
                            <p className="text-slate-800 text-sm font-medium">
                              {moment(selectedUser.updatedAt).format(
                                "MMMM Do YYYY, h:mm a",
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <div className="p-2.5 rounded-xl bg-slate-50 text-purple-600 border border-slate-100">
                            <AlertCircle className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">
                              Request ID
                            </p>
                            <p className="text-slate-500 text-xs font-mono">
                              {selectedUser._id}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sidebar Footer Actions */}
                    <div className="p-6 border-t border-slate-100 bg-white/80 backdrop-blur-md sticky bottom-0">
                      <div className="flex flex-col gap-3">
                        <button
                          disabled={actionLoading}
                          onClick={() => handleApprove(selectedUser._id)}
                          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-purple-600 hover:bg-cyan-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50"
                        >
                          {actionLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <CheckCircle className="w-5 h-5" />
                          )}
                          Approve
                        </button>
                        <button
                          disabled={actionLoading}
                          onClick={() => setIsRejecting(true)}
                          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-white hover:bg-red-50 text-red-600 rounded-xl font-bold transition-all border border-red-200 hover:border-red-300 disabled:opacity-50 shadow-sm"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rejection Overlay Dialog */}
                <AnimatePresence>
                  {isRejecting && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-md p-6"
                    >
                      <div className="w-full max-w-lg bg-white border border-slate-200 shadow-2xl rounded-[24px] flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <XCircle className="text-red-500 w-6 h-6" /> Reject
                            Verification
                          </h3>
                          <button
                            onClick={() => setIsRejecting(false)}
                            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200 bg-slate-100 rounded-xl transition"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                          <p className="text-slate-600 text-sm mb-5">
                            Select a predefined reason or enter a custom one.
                            The user will receive this exact reason.
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                            {predefinedReasons.map((reason) => (
                              <button
                                key={reason}
                                onClick={() => setRejectReason(reason)}
                                className={`p-4 rounded-xl border text-left transition-all ${rejectReason === reason ? "bg-red-50 border-red-300 text-red-700 font-bold shadow-sm" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"}`}
                              >
                                {reason}
                              </button>
                            ))}
                          </div>

                          <AnimatePresence>
                            {rejectReason === "Custom" && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <textarea
                                  value={customReason}
                                  onChange={(e) =>
                                    setCustomReason(e.target.value)
                                  }
                                  placeholder="Type detailed rejection reason here..."
                                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-4 text-slate-900 placeholder:text-slate-500 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 outline-none transition-all shadow-inner"
                                  rows={3}
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-end gap-3">
                          <button
                            onClick={() => setIsRejecting(false)}
                            className="px-6 py-3.5 text-slate-700 hover:text-slate-900 font-bold bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition shadow-sm"
                          >
                            Cancel
                          </button>
                          <button
                            disabled={
                              actionLoading ||
                              !rejectReason ||
                              (rejectReason === "Custom" && !customReason)
                            }
                            onClick={() => handleReject(selectedUser._id)}
                            className="flex items-center justify-center gap-2 px-8 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-600/20 disabled:opacity-50"
                          >
                            {actionLoading ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              "Confirm Rejection"
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
};

export default VerificationRequests;
