import { showToast } from "../utils/showToast";
import axios from "../api/axios";
import { getAvatarUrl } from "../utils/avatar";
import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DriveFolderUploadOutlinedIcon from "@mui/icons-material/DriveFolderUploadOutlined";
import moment from "moment";
import Swal from "sweetalert2";
import Spinner from "../components/spinner/LoadingSpinner";
import { INDIAN_STATES_AND_CITIES } from "../constants/locationData";

const CLOUD_NAME   = process.env.REACT_APP_CLOUDINARY_CLOUD || "dpgelkpd4";
const UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_PRESET || "upload";
const MAX_FILE_SIZE_MB = 2;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const UpdateuserA = () => {
  const { state } = useLocation();
  const navigate   = useNavigate();

  const [loading2, setLoading2] = useState(false);
  const [file, setFile]         = useState(null);
  const [preview, setPreview]   = useState("");

  const [name,    setName]    = useState(state?.name    ?? "");
  const [city,    setCity]    = useState(state?.city    ?? "");
  const [stateVal, setStateVal] = useState(state?.state ?? "");
  const [isAdmin, setIsAdmin] = useState(state?.isAdmin ?? false);
  const [mobile,  setMobile]  = useState(state?.mobile  ?? "");
  const [type,    setType]    = useState(state?.type    ?? "traveler");

  const isMounted    = useRef(true);
  const previewUrlRef = useRef(null);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  // Guard: no state = navigated here directly
  useEffect(() => {
    if (!state?._id) navigate("/users", { replace: true });
  }, [state, navigate]);

  const createdatnew = state?.createdAt ? moment(state.createdAt).fromNow() : "";
  const updatedatnew = state?.updatedAt ? moment(state.updatedAt).fromNow() : "";

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    if (!ALLOWED_MIME_TYPES.includes(selected.type)) {
      showToast.error("Invalid File", "Please upload a JPG, PNG, WebP, or GIF.");
      return;
    }
    if (selected.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      Swal.fire("File Too Large", `Max size is ${MAX_FILE_SIZE_MB}MB.`, "error");
      return;
    }

    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const url = URL.createObjectURL(selected);
    previewUrlRef.current = url;
    setFile(selected);
    setPreview(url);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading2) return;

    if (!stateVal) {
      showToast.error("State is required.");
      return;
    }
    if (!city) {
      showToast.error("City is required.");
      return;
    }
    const validCities = INDIAN_STATES_AND_CITIES[stateVal];
    if (!validCities || !validCities.includes(city)) {
      showToast.error("Invalid city/state combination.");
      return;
    }

    const confirmResult = await Swal.fire({
      title: "Confirm Update",
      text: "Save these changes to the user profile?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, update",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (!confirmResult.isConfirmed) return;

    setLoading2(true);
    try {
      let imgUrl = state.img ?? "";

      if (file) {
        if (!CLOUD_NAME || !UPLOAD_PRESET) {
          throw new Error("Image upload is not configured.");
        }
        const data = new FormData();
        data.append("file", file);
        data.append("upload_preset", UPLOAD_PRESET);

        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
          { method: "POST", body: data }
        ).then((r) => r.json());

        if (!uploadRes.secure_url) {
          throw new Error(uploadRes.error?.message || "Image upload failed.");
        }
        imgUrl = uploadRes.secure_url;
      }

      await axios.put(`/users/${state._id}`, {
        name,
        city,
        state: stateVal,
        country: "India",
        isAdmin,
        type,
        mobile,
        img: imgUrl,
        pic: imgUrl,
        avatar: imgUrl,
      });

      if (!isMounted.current) return;

      showToast.success("Updated!", "Profile saved successfully.");
      navigate("/users", { replace: true });
    } catch (error) {
      if (!isMounted.current) return;
      console.error(error);
      Swal.fire("Error!", error.message || "Something went wrong.", "error");
    } finally {
      if (isMounted.current) setLoading2(false);
    }
  };

  if (!state?._id) return null;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 pt-6">
      <div className="max-w-4xl mx-auto px-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest mb-6 hover:text-brand-600 transition-colors"
        >
          Cancel Changes
        </button>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row">

            {/* Left: avatar */}
            <div className="lg:w-1/3 bg-brand-50/50 border-r border-brand-100 p-8 text-slate-800 flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-100/40 to-transparent pointer-events-none" />

              <div className="relative z-10 mb-6">
                <div className="relative inline-block group">
                  <div className="w-28 h-28 rounded-2xl overflow-hidden border-4 border-white shadow-xl group-hover:border-brand-200 transition-all duration-300">
                    <img
                      className="w-full h-full object-cover"
                      src={
                        preview ||
                        getAvatarUrl(state.pic, state.img, state.avatar, state.name)
                      }
                      alt={state.name}
                    />
                  </div>
                  <label
                    htmlFor="file"
                    className="absolute -bottom-2 -right-2 p-3 bg-brand-600 text-white rounded-xl shadow-lg cursor-pointer hover:bg-brand-700 transition-all active:scale-90"
                    aria-label="Upload new photo"
                  >
                    <DriveFolderUploadOutlinedIcon className="w-4 h-4" />
                  </label>
                  <input
                    type="file"
                    id="file"
                    name="file"
                    className="hidden"
                    accept="image/*,.heic,.heif"
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              <div className="relative z-10 space-y-1">
                <h1 className="text-lg font-black tracking-tight text-slate-900">Refine Identity</h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                  Update profile and system access levels.
                </p>
                {createdatnew && (
                  <p className="text-[9px] text-brand-600/80 font-bold mt-3">
                    Created {createdatnew}
                  </p>
                )}
                {updatedatnew && (
                  <p className="text-[9px] text-brand-600/80 font-bold">
                    Updated {updatedatnew}
                  </p>
                )}
              </div>

              {loading2 && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center z-50">
                  <Spinner />
                  <p className="text-[10px] font-black uppercase tracking-widest mt-4 animate-pulse text-brand-700">Saving…</p>
                </div>
              )}
            </div>

            {/* Right: fields */}
            <div className="lg:w-2/3 p-8">
              <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-4">
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Profile Parameters</h2>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[8px] font-black uppercase tracking-widest">
                  ID: {state._id.substring(0, 8)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="md:col-span-2">
                  <label htmlFor="u-name" className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                    Full Legal Name
                  </label>
                  <input
                    id="u-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    required
                    className="w-full px-3 py-2.5 bg-slate-50 border border-brand-100 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label htmlFor="u-mobile" className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                    Primary Contact
                  </label>
                  <input
                    id="u-mobile"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-brand-100 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all"
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>

                <div>
                  <label htmlFor="u-state" className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                    State 
                  </label>
                  <select
                    id="u-state"
                    value={stateVal}
                    onChange={(e) => {
                      setStateVal(e.target.value);
                      setCity("");
                    }}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-brand-100 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all"
                  >
                    <option value="" disabled>
                      Select State
                    </option>
                    {Object.keys(INDIAN_STATES_AND_CITIES).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="u-city" className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                    City
                  </label>
                  <select
                    id="u-city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={!stateVal}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-brand-100 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all"
                  >
                    <option value="" disabled>
                      {stateVal ? "Select City" : "Select State first"}
                    </option>
                    {stateVal &&
                      INDIAN_STATES_AND_CITIES[stateVal].map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="u-admin" className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                    Access Authorization
                  </label>
                  <select
                    id="u-admin"
                    value={String(isAdmin)}
                    onChange={(e) => setIsAdmin(e.target.value === "true")}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-brand-100 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all cursor-pointer"
                  >
                    <option value="false">Standard Access</option>
                    <option value="true">Super Administrator</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="u-type" className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                    Account Classification
                  </label>
                  <select
                    id="u-type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-brand-100 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all cursor-pointer"
                  >
                    <option value="traveler">Traveler</option>
                    <option value="financeManager">Finance Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-slate-50">
                <button
                  type="submit"
                  disabled={loading2}
                  className="w-full bg-brand-600 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-brand-700 transition-all active:scale-[0.98] shadow-xl shadow-brand-600/20 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading2 ? "Saving…" : "Commit Changes"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdateuserA;

