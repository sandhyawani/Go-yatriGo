import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Loader2, Check } from "lucide-react";
import axios from "../../api/axios";
import { useAuth } from "../../context/authContext";
import { showToast } from "../../utils/showToast";
import { INDIAN_STATES_AND_CITIES } from "../../constants/locationData";
import CustomSelect from "../ui/CustomSelect";

export const LocationSelectModal = ({
  isOpen,
  onClose,
  onSuccess,
  initialState = "",
  initialCity = ""
}) => {
  const { updateUser } = useAuth();
  const [selectedState, setSelectedState] = useState(initialState);
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const states = Object.keys(INDIAN_STATES_AND_CITIES || {});
  const cities = selectedState ? INDIAN_STATES_AND_CITIES[selectedState] || [] : [];

  useEffect(() => {
    if (isOpen) {
      setSelectedState(initialState || "");
      setSelectedCity(initialCity || "");
      setError("");
    }
  }, [isOpen, initialState, initialCity]);

  if (!isOpen) return null;

  const handleStateChange = (e) => {
    const nextState = e.target.value;
    setSelectedState(nextState);
    setSelectedCity("");
    if (error) setError("");
  };

  const handleCityChange = (e) => {
    setSelectedCity(e.target.value);
    if (error) setError("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedState) {
      setError("Please select a state.");
      return;
    }
    if (!selectedCity) {
      setError("Please select a city.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const response = await axios.patch(
        "/users/profile/location",
        { state: selectedState, city: selectedCity },
        { withCredentials: true }
      );

      const updatedUser = response.data?.user || { state: selectedState, city: selectedCity };
      updateUser(updatedUser);

      showToast.success(
        "Location updated",
        `Location set to ${selectedCity}, ${selectedState}`
      );

      if (onSuccess) {
        onSuccess(updatedUser);
      }
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to update location.";
      setError(msg);
      showToast.error("Update failed", msg);
    } finally {
      setIsSaving(false);
    }
  };

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1100] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !isSaving && onClose()}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
        />

        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative z-10 w-full sm:max-w-md bg-white rounded-t-[1.75rem] sm:rounded-2xl border border-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[88dvh]"
        >
          <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary font-heading">
                  Choose Location
                </h3>
                <p className="text-[11px] text-text-muted">
                  Discover travelers and journeys in your area
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSaving}
              className="p-1.5 text-text-muted hover:text-text-primary hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 overscroll-contain">
              {error && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200/60 text-red-600 text-xs font-semibold">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="modal-state-select" className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
                  State
                </label>
                <CustomSelect
                  id="modal-state-select"
                  name="state"
                  label="Select State"
                  value={selectedState}
                  onChange={(e) => {
                    setSelectedState(e.target.value);
                    setSelectedCity("");
                    if (error) setError("");
                  }}
                  searchable={true}
                  disabled={isSaving}
                  placeholder="Select State"
                  options={states.map((st) => ({ label: st, value: st }))}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="modal-city-select" className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
                  City
                </label>
                <CustomSelect
                  id="modal-city-select"
                  name="city"
                  label="Select City"
                  value={selectedCity}
                  onChange={(e) => {
                    setSelectedCity(e.target.value);
                    if (error) setError("");
                  }}
                  searchable={true}
                  disabled={!selectedState || isSaving}
                  placeholder={selectedState ? "Select City" : "Select State first"}
                  options={cities.map((ct) => ({ label: ct, value: ct }))}
                />
              </div>

              {/* Quick Select Popular Cities */}
              <div className="pt-2">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-2">
                  Popular Hubs
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { state: "Maharashtra", city: "Mumbai" },
                    { state: "Delhi", city: "New Delhi" },
                    { state: "Karnataka", city: "Bengaluru" },
                    { state: "Goa", city: "Panaji" },
                    { state: "Rajasthan", city: "Jaipur" },
                    { state: "Himachal Pradesh", city: "Manali" },
                  ].map((loc) => (
                    <button
                      key={loc.city}
                      type="button"
                      onClick={() => {
                        setSelectedState(loc.state);
                        setSelectedCity(loc.city);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                        selectedCity === loc.city
                          ? "bg-brand/10 border-brand/30 text-brand font-semibold"
                          : "bg-slate-50 border-slate-200/60 text-text-muted hover:border-slate-300 hover:text-text-primary"
                      }`}
                    >
                      {loc.city}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 pb-4 px-4 sm:px-5 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/50 shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2.5 text-xs font-bold text-text-muted hover:text-text-primary hover:bg-slate-100 rounded-xl transition-colors min-h-[38px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || !selectedState || !selectedCity}
                className="px-5 py-2.5 text-xs font-bold bg-brand hover:bg-brand-dark text-white rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed min-h-[38px]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Location</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default LocationSelectModal;
