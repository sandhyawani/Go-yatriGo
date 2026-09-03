import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Upload } from "lucide-react";
import moment from "moment";
import Swal from "sweetalert2";
import axios from "../api/axios";
import { showToast } from "../utils/showToast";
import { getAvatarUrl } from "../utils/avatar";
import Spinner from "../components/spinner/LoadingSpinner";
import { INDIAN_STATES_AND_CITIES } from "../constants/locationData";
import CustomSelect from "../components/ui/CustomSelect";

const CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD || "dpgelkpd4";
const UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_PRESET || "upload";
const MAX_FILE_SIZE_MB = 2;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const AdminEditUser = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [isSaving, setIsSaving] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");

  const [name, setName] = useState(state?.name ?? "");
  const [city, setCity] = useState(state?.city ?? "");
  const [stateVal, setStateVal] = useState(state?.state ?? "");
  const [isAdmin, setIsAdmin] = useState(state?.isAdmin ?? false);
  const [mobile, setMobile] = useState(state?.mobile ?? "");
  const [type, setType] = useState(state?.type ?? "traveler");

  const isMounted = useRef(true);
  const previewUrlRef = useRef(null);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  useEffect(() => {
    if (!state?._id) navigate("/users", { replace: true });
  }, [state, navigate]);

  const joinedFormatted = state?.createdAt ? moment(state.createdAt).fromNow() : "";
  const updatedFormatted = state?.updatedAt ? moment(state.updatedAt).fromNow() : "";

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
    if (isSaving) return;

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
      text: "Save changes to this user account?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Save Changes",
      cancelButtonText: "Cancel",
      reverseButtons: true
    });

    if (!confirmResult.isConfirmed) return;

    setIsSaving(true);
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
        avatar: imgUrl
      });

      if (!isMounted.current) return;

      showToast.success("Updated!", "User details saved successfully.");
      navigate("/users", { replace: true });
    } catch (error) {
      if (!isMounted.current) return;
      console.error("Failed to update user:", error);
      Swal.fire("Error", error.message || "Something went wrong.", "error");
    } finally {
      if (isMounted.current) setIsSaving(false);
    }
  };

  if (!state?._id) return null;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 pt-6">
      <div className="max-w-4xl mx-auto px-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-text-muted font-bold text-xs uppercase tracking-wider mb-6 hover:text-brand transition-colors"
        >
          &larr; Cancel Changes
        </button>

        <div className="bg-surface rounded-2xl border border-slate-100 shadow-sm overflow-hidden bg-white">
          <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row">
            {/* User Profile Avatar Section */}
            <div className="lg:w-1/3 bg-brand-50/50 border-r border-brand-100 p-8 text-text-primary flex flex-col items-center justify-center text-center relative overflow-hidden">
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
                    className="absolute -bottom-2 -right-2 p-3 bg-brand text-white rounded-xl shadow-lg cursor-pointer hover:bg-brand-dark transition-all active:scale-90"
                    aria-label="Upload new photo"
                  >
                    <Upload className="w-4 h-4" />
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
                <h1 className="text-lg font-bold tracking-tight text-text-primary">
                  Edit User Profile
                </h1>
                <p className="text-xs text-text-muted font-medium leading-relaxed">
                  Update profile information and access roles.
                </p>
                {joinedFormatted && (
                  <p className="text-[11px] text-brand font-medium mt-3">
                    Joined {joinedFormatted}
                  </p>
                )}
                {updatedFormatted && (
                  <p className="text-[11px] text-brand font-medium">
                    Updated {updatedFormatted}
                  </p>
                )}
              </div>

              {isSaving && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center z-50">
                  <Spinner />
                  <p className="text-xs font-bold uppercase tracking-wider mt-4 animate-pulse text-brand-dark">
                    Saving changes...
                  </p>
                </div>
              )}
            </div>

            {/* Profile Form Details */}
            <div className="lg:w-2/3 p-8">
              <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-4">
                <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider">
                  User Information
                </h2>
                <span className="px-2 py-0.5 bg-background text-text-muted rounded-md text-[10px] font-bold uppercase tracking-wider">
                  ID: {state._id.substring(0, 8)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="md:col-span-2">
                  <label
                    htmlFor="u-name"
                    className="text-[11px] font-bold text-text-muted uppercase tracking-wider block mb-1.5"
                  >
                    Full Name
                  </label>
                  <input
                    id="u-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    required
                    className="w-full px-3 py-2.5 bg-slate-50 border border-brand-100 rounded-xl text-xs font-medium text-text-primary outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label
                    htmlFor="u-mobile"
                    className="text-[11px] font-bold text-text-muted uppercase tracking-wider block mb-1.5"
                  >
                    Mobile Contact
                  </label>
                  <input
                    id="u-mobile"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-brand-100 rounded-xl text-xs font-medium text-text-primary outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all"
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>

                <div>
                  <label
                    htmlFor="u-state"
                    className="text-[11px] font-bold text-text-muted uppercase tracking-wider block mb-1.5"
                  >
                    State
                  </label>
                  <CustomSelect
                    id="u-state"
                    value={stateVal}
                    onChange={(e) => {
                      setStateVal(e.target.value);
                      setCity("");
                    }}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-brand-100 rounded-xl text-xs font-medium text-text-primary outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all"
                    placeholder="Select State"
                    options={Object.keys(INDIAN_STATES_AND_CITIES).map((s) => ({
                      label: s,
                      value: s
                    }))}
                  />
                </div>

                <div>
                  <label
                    htmlFor="u-city"
                    className="text-[11px] font-bold text-text-muted uppercase tracking-wider block mb-1.5"
                  >
                    City
                  </label>
                  <CustomSelect
                    id="u-city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={!stateVal}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-brand-100 rounded-xl text-xs font-medium text-text-primary outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all"
                    placeholder={stateVal ? "Select City" : "Select State first"}
                    options={
                      stateVal
                        ? INDIAN_STATES_AND_CITIES[stateVal].map((c) => ({
                            label: c,
                            value: c
                          }))
                        : []
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor="u-admin"
                    className="text-[11px] font-bold text-text-muted uppercase tracking-wider block mb-1.5"
                  >
                    Admin Access
                  </label>
                  <CustomSelect
                    id="u-admin"
                    value={String(isAdmin)}
                    onChange={(e) => setIsAdmin(e.target.value === "true")}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-brand-100 rounded-xl text-xs font-medium text-text-primary outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all cursor-pointer"
                    options={[
                      { label: "Standard Access", value: "false" },
                      { label: "Administrator", value: "true" }
                    ]}
                  />
                </div>

                <div>
                  <label
                    htmlFor="u-type"
                    className="text-[11px] font-bold text-text-muted uppercase tracking-wider block mb-1.5"
                  >
                    Account Role
                  </label>
                  <CustomSelect
                    id="u-type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-brand-100 rounded-xl text-xs font-medium text-text-primary outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all cursor-pointer"
                    options={[
                      { label: "Traveler", value: "traveler" },
                      { label: "Finance Manager", value: "financeManager" },
                      { label: "Admin", value: "admin" }
                    ]}
                  />
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-slate-50">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-brand text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-brand-dark transition-all active:scale-[0.98] shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminEditUser;
