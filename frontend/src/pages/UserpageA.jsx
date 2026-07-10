import { showToast } from "../utils/showToast";
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import moment from "moment";
import axios from "../api/axios";
import Swal from "sweetalert2";

const UserpageA = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  const createdat = state.createdAt;
  const updatedat = state.updatedAt;

  const createdatnew = moment(createdat).fromNow();
  const updatedatnew = moment(updatedat).fromNow();

  const handleDelete = async () => {
    const confirmResult = await Swal.fire({
      title: "Are you sure you want to delete this user?",
      text: "This action cannot be undone",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "No, cancel",
      reverseButtons: true,
    });

    if (confirmResult.isConfirmed) {
      try {
        await axios.delete(`/users/${state._id}`);
        showToast.success("User Deleted!", "");
        navigate("/users");
      } catch (error) {
        console.error(error);
        showToast.error("Something went wrong!", "");
      }
    }
  };

  const getUser = async () => {
    navigate("/update", { state: state });
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 pt-6">
      <div className="max-w-5xl mx-auto px-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest mb-6 hover:text-brand-600 transition-colors"
        >
          Back to Directory
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Identity Card */}
          <div className="lg:col-span-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center">
              <div className="relative inline-block mb-4">
                <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-slate-50 shadow-md">
                  <img
                    className="w-full h-full object-cover"
                    src={
                      state.img ||
                      `https://ui-avatars.com/api/?name=${state.name}&background=7c3aed&color=fff`
                    }
                    alt={state.name}
                  />
                </div>
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                {state.name}
              </h1>
              <span className="inline-flex px-3 py-1 bg-brand-50 text-brand-600 rounded-full text-[8px] font-black uppercase tracking-widest mt-1 border border-brand-100">
                {state.type}
              </span>

              <div className="mt-6 flex flex-col gap-2">
                <button
                  className="w-full bg-slate-900 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-600 transition-all active:scale-95 shadow-lg"
                  onClick={getUser}
                >
                  Update Details
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full bg-rose-50 text-rose-600 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border border-rose-100 hover:bg-rose-600 hover:text-white transition-all active:scale-95"
                >
                  Terminate User
                </button>
              </div>
            </div>
          </div>

          {/* Right: Technical Details */}
          <div className="lg:col-span-8">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-full">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 border-b border-slate-50 pb-4">
                Technical Dossier
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    System Identifier
                  </p>
                  <p className="text-xs font-bold text-slate-700 break-all">
                    {state._id}
                  </p>
                </div>
                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Access Level
                  </p>
                  <p className="text-xs font-bold text-slate-700">
                    {state.isAdmin ? "Administrator" : "Standard Access"}
                  </p>
                </div>
                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Email Communication
                  </p>
                  <p className="text-xs font-bold text-slate-700">
                    {state.email}
                  </p>
                </div>
                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Mobile Contact
                  </p>
                  <p className="text-xs font-bold text-slate-700">
                    {state.mobile || "N/A"}
                  </p>
                </div>
                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Regional Origin
                  </p>
                  <p className="text-xs font-bold text-slate-700">
                    {state.country || "Unspecified"}
                  </p>
                </div>
                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    First Interaction
                  </p>
                  <p className="text-xs font-bold text-slate-700 uppercase">
                    {createdatnew}
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

export default UserpageA;

