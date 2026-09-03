import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import moment from "moment";
import Swal from "sweetalert2";
import axios from "../api/axios";
import { showToast } from "../utils/showToast";

const AdminUserDetails = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  const createdAt = state?.createdAt;
  const updatedAt = state?.updatedAt;

  const joinedFormatted = createdAt ? moment(createdAt).fromNow() : "N/A";
  const updatedFormatted = updatedAt ? moment(updatedAt).fromNow() : "N/A";

  const handleDelete = async () => {
    const confirmResult = await Swal.fire({
      title: "Are you sure you want to delete this user?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete user",
      cancelButtonText: "Cancel",
      reverseButtons: true
    });

    if (confirmResult.isConfirmed) {
      try {
        await axios.delete(`/users/${state._id}`);
        showToast.success("User Deleted", "The account has been removed.");
        navigate("/users");
      } catch (error) {
        console.error("Failed to delete user:", error);
        showToast.error("Error", "Could not delete user.");
      }
    }
  };

  const handleEdit = () => {
    navigate("/update", { state: state });
  };

  if (!state?._id) {
    return (
      <div className="min-h-screen bg-slate-50/50 pb-12 pt-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm font-semibold text-text-secondary">No user selected</p>
          <button
            onClick={() => navigate("/users")}
            className="mt-4 px-4 py-2 bg-brand text-white rounded-xl text-xs font-bold"
          >
            Back to User Directory
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 pt-6">
      <div className="max-w-5xl mx-auto px-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-text-muted font-bold text-xs uppercase tracking-wider mb-6 hover:text-brand transition-colors"
        >
          &larr; Back to Directory
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* User Profile Card */}
          <div className="lg:col-span-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center">
              <div className="relative inline-block mb-4">
                <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-slate-50 shadow-md">
                  <img
                    className="w-full h-full object-cover"
                    src={
                      state.img ||
                      state.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        state.name || "User"
                      )}&background=0284c7&color=fff`
                    }
                    alt={state.name || "User Avatar"}
                  />
                </div>
              </div>
              <h1 className="text-xl font-bold text-text-primary tracking-tight">
                {state.name}
              </h1>
              <span className="inline-flex px-3 py-1 bg-brand-50 text-brand rounded-full text-[10px] font-bold uppercase tracking-wider mt-1 border border-brand-100">
                {state.type || "Traveler"}
              </span>

              <div className="mt-6 flex flex-col gap-2">
                <button
                  className="w-full bg-brand text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-brand-dark transition-all active:scale-95 shadow-md"
                  onClick={handleEdit}
                >
                  Edit Profile
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full bg-rose-50 text-rose-600 py-3 rounded-xl font-bold text-xs uppercase tracking-wider border border-rose-100 hover:bg-rose-600 hover:text-white transition-all active:scale-95"
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>

          {/* User Profile Details */}
          <div className="lg:col-span-8">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-full">
              <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-6 border-b border-slate-50 pb-4">
                User Profile Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">
                    User ID
                  </p>
                  <p className="text-xs font-semibold text-text-primary break-all">
                    {state._id}
                  </p>
                </div>
                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">
                    Access Level
                  </p>
                  <p className="text-xs font-semibold text-text-primary">
                    {state.isAdmin ? "Administrator" : "Standard Access"}
                  </p>
                </div>
                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">
                    Email
                  </p>
                  <p className="text-xs font-semibold text-text-primary">
                    {state.email || "N/A"}
                  </p>
                </div>
                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">
                    Mobile Contact
                  </p>
                  <p className="text-xs font-semibold text-text-primary">
                    {state.mobile || "N/A"}
                  </p>
                </div>
                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">
                    Location
                  </p>
                  <p className="text-xs font-semibold text-text-primary">
                    {[state.city, state.state, state.country].filter(Boolean).join(", ") ||
                      "Unspecified"}
                  </p>
                </div>
                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">
                    Joined
                  </p>
                  <p className="text-xs font-semibold text-text-primary uppercase">
                    {joinedFormatted}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUserDetails;
